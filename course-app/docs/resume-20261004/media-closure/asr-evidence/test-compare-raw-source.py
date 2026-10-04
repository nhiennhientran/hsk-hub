#!/usr/bin/env python3
"""Necessary regression guards against false ASR clip evidence."""
import copy
import importlib.util
import unittest
from pathlib import Path

spec = importlib.util.spec_from_file_location("compare_raw_source", Path(__file__).with_name("compare-raw-source.py"))
compare = importlib.util.module_from_spec(spec)
spec.loader.exec_module(compare)


def observed(words):
    return compare.observations({"rawSegments": [{"words": words}]})


def word(text, start=0.5, end=1.2):
    return {"word": text, "start": start, "end": end, "probability": 0.9}


class EvidenceGuards(unittest.TestCase):
    def test_subword_match_cannot_invent_character_times(self):
        words, text, owners = observed([word("我们")])
        found = compare.exact_occurrences({"zh": "我"}, words, text, owners)
        self.assertFalse(found["uniqueWholeWordOccurrence"])
        self.assertEqual(found["exactOccurrences"][0]["status"], "blocked-partial-ASR-word-no-character-timestamp")

    def test_repeated_word_is_explicitly_ambiguous(self):
        words, text, owners = observed([word("谢谢"), word("谢谢", 1.5, 2.1)])
        found = compare.exact_occurrences({"zh": "谢谢"}, words, text, owners)
        # A third textual overlap crosses the ASR words and is explicitly held.
        self.assertEqual(sum(match["status"] == "unreviewed-exact-ASR-candidate"
                             for match in found["exactOccurrences"]), 2)
        self.assertFalse(found["uniqueWholeWordOccurrence"])

    def test_exact_phrase_uses_original_word_endpoints_without_certification(self):
        words, text, owners = observed([word("妈妈，", .42, 1.04), word("你好。", 1.18, 2.33)])
        found = compare.exact_occurrences({"zh": "妈妈，你好。"}, words, text, owners)
        match = found["exactOccurrences"][0]
        self.assertTrue(found["uniqueWholeWordOccurrence"])
        self.assertEqual((match["rawStart"], match["rawEnd"]), (.42, 2.33))
        self.assertFalse(match["productionApproved"])
        self.assertFalse(match["acousticBoundaryApproved"])

    def test_script_difference_is_not_silently_repaired(self):
        words, text, owners = observed([word("媽媽")])
        found = compare.exact_occurrences({"zh": "妈妈"}, words, text, owners)
        self.assertEqual(found["exactOccurrences"], [])

    def test_zero_duration_word_does_not_become_clip(self):
        words, text, owners = observed([word("好", 1.2, 1.2)])
        found = compare.exact_occurrences({"zh": "好"}, words, text, owners)
        self.assertFalse(found["uniqueWholeWordOccurrence"])
        self.assertEqual(found["exactOccurrences"][0]["status"], "blocked-invalid-ASR-word-times")

    def test_out_of_track_and_non_cjk_source_are_not_certified(self):
        words, text, owners = compare.observations({"track": {"pcm": {"durationSeconds": 1.0}},
                                                   "rawSegments": [{"words": [word("好", 0.5, 1.2)]}]})
        found = compare.exact_occurrences({"zh": "好"}, words, text, owners)
        self.assertFalse(found["uniqueWholeWordOccurrence"])
        words, text, owners = observed([word("恤")])
        found = compare.exact_occurrences({"zh": "T恤"}, words, text, owners)
        self.assertFalse(found["uniqueWholeWordOccurrence"])
        self.assertEqual(found["exactOccurrences"][0]["status"], "blocked-source-has-non-CJK-letters-or-digits")

    def test_wrong_source_and_prompt_contamination_are_rejected(self):
        track = {"id": "hsk2:l04:audio2", "sha256": "a" * 64, "file": "4-2.mp3",
                 "level": 2, "lesson": 4, "track": 2, "kind": "vocab"}
        raw = {"track": track.copy(), "modelRevision": "b" * 40,
               "options": {"language": "zh", "task": "transcribe", "word_timestamps": True,
                           "condition_on_previous_text": False, "initial_prompt": None,
                           "prefix": None, "hotwords": None}}
        compare.validate_raw_track(raw, track)
        wrong = copy.deepcopy(raw)
        wrong["track"]["level"] = 1
        with self.assertRaisesRegex(ValueError, "original-track mismatch"):
            compare.validate_raw_track(wrong, track)
        contaminated = copy.deepcopy(raw)
        contaminated["options"]["initial_prompt"] = "教材目标词"
        with self.assertRaisesRegex(ValueError, "unprompted"):
            compare.validate_raw_track(contaminated, track)


if __name__ == "__main__":
    unittest.main()
