"""Independent energy/pause evidence for tracks without reviewed precision clips.

These intervals are deliberately NOT words/sentences and NOT runtime candidates.
Energy below a threshold can contain weak consonants or tails. Semantic alignment,
acoustic review and independent acceptance are required before any clip exposure.
"""
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from pathlib import Path
import hashlib
import json
import subprocess
import numpy as np

ROOT = Path(__file__).resolve().parents[4]
OUT = Path(__file__).resolve().parent
inventory_bytes = (OUT / "inventory.json").read_bytes()
(OUT / "acoustic-input-inventory.json").write_bytes(inventory_bytes)
inventory = json.loads(inventory_bytes)


def intervals(mask, step, minimum):
    changes = np.diff(np.r_[False, mask, False].astype(np.int8))
    return [[round(a * step, 4), round(b * step, 4)] for a, b in zip(np.where(changes == 1)[0], np.where(changes == -1)[0]) if (b - a) * step >= minimum]


def examine(track):
    file = ROOT / "course-app/public" / track["file"]
    data = file.read_bytes()
    sha = hashlib.sha256(data).hexdigest()
    decoded = subprocess.run(["ffmpeg", "-v", "error", "-i", str(file), "-map", "0:a:0", "-ac", "1", "-ar", "16000", "-f", "f32le", "pipe:1"], capture_output=True)
    result = {"file": track["file"], "level": track["level"], "lesson": track["lesson"], "track": track["track"], "kind": track["kind"], "sha256": sha, "sourceHashMatchesManifest": sha == track["sha256"], "fullDecodeExitCode": decoded.returncode, "semanticAlignment": False, "humanListening": False, "runtimeApproved": False}
    if decoded.returncode:
        result["error"] = decoded.stderr.decode(errors="replace")[:2000]
        return result
    pcm = np.frombuffer(decoded.stdout, dtype="<f4")
    samples = len(pcm)
    pad = (-samples) % 320
    windows = np.pad(pcm, (0, pad)).reshape(-1, 320)
    rms = np.sqrt(np.mean(windows.astype(np.float64) ** 2, axis=1))
    db = 20 * np.log10(np.maximum(rms, 1e-12))
    result.update({"decodedDuration16k": round(samples / 16000, 6), "containerDuration": track["duration"], "windowSeconds": 0.02, "peakAbsoluteSample": float(np.max(np.abs(pcm))), "rmsDbPercentiles": {str(p): round(float(np.percentile(db, p)), 3) for p in [0, 10, 50, 90, 100]}, "thresholds": []})
    for threshold in [-45, -35]:
        quiet = db < threshold
        result["thresholds"].append({"rmsThresholdDbFS": threshold, "quietIntervalsAtLeast100ms": intervals(quiet, 0.02, 0.1), "aboveThresholdIntervalsAtLeast60ms": intervals(~quiet, 0.02, 0.06), "warning": "Neither silence nor complete speech is certified by this energy threshold. No interval is assigned to a source word/line."})
    return result


with ThreadPoolExecutor(max_workers=4) as pool:
    rows = list(pool.map(examine, inventory["pendingPrecisionTracks"]))
result = {"generatedAt": datetime.now(timezone.utc).isoformat(), "inventoryFile": "acoustic-input-inventory.json", "inventorySHA256": hashlib.sha256(inventory_bytes).hexdigest(), "scope": "All original HSK2/3 tracks that currently have no reviewed precise-clip manifest; observational energy/pause audit only", "sourceWordsOrLinesAssigned": 0, "runtimeManifestModified": False, "humanListening": False, "pronunciationToneCertified": False, "devicePlaybackCertified": False, "tracks": rows, "summary": {"tracks": len(rows), "hashesMatched": sum(x["sourceHashMatchesManifest"] for x in rows), "fullDecodesPassed": sum(x["fullDecodeExitCode"] == 0 for x in rows), "decodedDurationSeconds": round(sum(x.get("decodedDuration16k", 0) for x in rows), 3)}}
(OUT / "acoustic-boundary-observations.json").write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n")
print(json.dumps(result["summary"], indent=2))
