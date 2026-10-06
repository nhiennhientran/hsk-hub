var e=`{
  "schemaVersion": 1,
  "revisionId": "hsk1-official-vi-l01-core-20261005",
  "engine": "hsk1",
  "courseId": "hsk1",
  "baselineFiles": [
    {
      "file": "content/textbook.json",
      "sha256": "5079b381a30d5d7785db5ee93d17b1ad71380a53633146001150c874f27558d7"
    },
    {
      "file": "content/textbook-display-revisions.json",
      "sha256": "3d3e325b587fd3b41fb11a908db6e74a37f2c9d95cac247a663112e71f8f9e55"
    },
    {
      "file": "content/stage3-catalog.json",
      "sha256": "35a15efbf9cc80c8e4ccb51d154ca8d906b970b13acabb0cc179a64423162913"
    }
  ],
  "parentDisplayRevision": "hsk1-display-20261004-01",
  "sources": [
    {
      "sourceId": "hsk1-official-vietnamese-20261004",
      "title": "新HSK教程1 · Official Vietnamese edition",
      "pdfSHA256": "99ca3e635bbf99bcbbe003e32a0dbdf7ad0af2300b7380959d647e1028cf2764",
      "pdfPageCount": 148,
      "sourceEvidence": {
        "transcription": {
          "path": "/workspace/scratch/28b55072841a/project-recovery-20261005/continue-phase4/review/l1-prep/source-evidence/author-input/source-transcription.json",
          "bytes": 43515,
          "sha256": "b05f99aee6c6b6ea1c345d5c80e351306918f5b72c664e996486d3251721afb6"
        },
        "acceptedReview": {
          "path": "/workspace/scratch/28b55072841a/project-recovery-20261005/continue-phase4/review/l1-prep/source-evidence/review.json",
          "bytes": 63713,
          "sha256": "725c10e63653ddf2ef6b0898d22bc7237edda51c5ab7478de8864e6b20b983c1"
        }
      }
    }
  ],
  "changes": [
    {
      "changeId": "hsk1-l01-core-20261005:book:textbook-l01-v006:vn",
      "baselineFile": "content/textbook.json",
      "field": "/lessons/0/vocab/5/vn",
      "ownerId": "textbook-l01-v006",
      "component": "textbook",
      "lesson": 1,
      "expectedEffectiveValue": "xin chào (một người)",
      "newValue": "xin chào, chào bạn",
      "classification": "official-wording-variant",
      "sourceAnchor": {
        "sourceId": "hsk1-official-vi-l01-pdf017-word-01-gloss",
        "kind": "directOfficial",
        "documentSourceId": "hsk1-official-vietnamese-20261004",
        "pdfSHA256": "99ca3e635bbf99bcbbe003e32a0dbdf7ad0af2300b7380959d647e1028cf2764",
        "pdfPages": [
          17
        ],
        "printedPages": [
          "001"
        ],
        "section": "生词 · Từ mới",
        "zhContext": "你好",
        "officialViText": "xin chào, chào bạn",
        "printedViText": "xin chào, chào bạn",
        "fragments": [
          {
            "pdfPage": 17,
            "printedPage": "001",
            "lineTexts": [
              "xin chào,",
              "chào bạn"
            ]
          }
        ],
        "evidenceRef": {
          "sourceTranscription": {
            "path": "/workspace/scratch/28b55072841a/project-recovery-20261005/continue-phase4/review/l1-prep/source-evidence/author-input/source-transcription.json",
            "sha256": "b05f99aee6c6b6ea1c345d5c80e351306918f5b72c664e996486d3251721afb6",
            "occurrenceId": "hsk1-official-vi-l01-pdf017-word-01-gloss"
          },
          "acceptedSourceReview": {
            "path": "/workspace/scratch/28b55072841a/project-recovery-20261005/continue-phase4/review/l1-prep/source-evidence/review.json",
            "sha256": "725c10e63653ddf2ef6b0898d22bc7237edda51c5ab7478de8864e6b20b983c1",
            "occurrenceId": "hsk1-official-vi-l01-pdf017-word-01-gloss"
          },
          "independentComparison": {
            "path": "/workspace/scratch/28b55072841a/project-recovery-20261005/continue-phase4/review/l1-independent-prepare/l1-title-words-dialogue-comparison.json",
            "sha256": "e03d0039e5a32299fa001494fe33f0db747e8fe937c7a791725f3c6f22d11c9f",
            "mappingId": "l01-independent-02"
          }
        }
      },
      "consumers": [
        {
          "baselineFile": "content/textbook.json",
          "field": "/lessons/0/vocab/5/vn",
          "ownerId": "textbook-l01-v006",
          "component": "textbook"
        }
      ],
      "authorReview": {
        "reviewer": "/root/continue_inventory",
        "status": "accepted",
        "evidenceRef": "/workspace/scratch/28b55072841a/project-recovery-20261005/continue-phase4/review/l1-independent-prepare/l1-title-words-dialogue-comparison.json",
        "reason": "教材给出两项词义；网站附加“một người”，与教材字面不同。"
      },
      "candidateScope": {
        "mappingId": "l01-independent-02",
        "kind": "book",
        "officialComparableBodyEqualsNewValue": true,
        "confirmedMistranslation": false
      },
      "independentReview": {
        "reviewer": "/root/continue_flow",
        "status": "accepted",
        "evidenceRef": "content/official-vi-revisions/hsk1-l01-core-20261005.review.json"
      }
    },
    {
      "changeId": "hsk1-l01-core-20261005:vocabulary-copy:v-l01-lex-440ee0853a-s1:vi",
      "baselineFile": "content/stage3-catalog.json",
      "field": "/vocabulary/5/vi",
      "ownerId": "v-l01-lex-440ee0853a-s1",
      "component": "vocabulary",
      "lesson": 1,
      "expectedEffectiveValue": "xin chào (một người)",
      "newValue": "xin chào, chào bạn",
      "classification": "official-wording-variant",
      "sourceAnchor": {
        "sourceId": "hsk1-official-vi-l01-pdf017-word-01-gloss",
        "kind": "directOfficial",
        "documentSourceId": "hsk1-official-vietnamese-20261004",
        "pdfSHA256": "99ca3e635bbf99bcbbe003e32a0dbdf7ad0af2300b7380959d647e1028cf2764",
        "pdfPages": [
          17
        ],
        "printedPages": [
          "001"
        ],
        "section": "生词 · Từ mới",
        "zhContext": "你好",
        "officialViText": "xin chào, chào bạn",
        "printedViText": "xin chào, chào bạn",
        "fragments": [
          {
            "pdfPage": 17,
            "printedPage": "001",
            "lineTexts": [
              "xin chào,",
              "chào bạn"
            ]
          }
        ],
        "evidenceRef": {
          "sourceTranscription": {
            "path": "/workspace/scratch/28b55072841a/project-recovery-20261005/continue-phase4/review/l1-prep/source-evidence/author-input/source-transcription.json",
            "sha256": "b05f99aee6c6b6ea1c345d5c80e351306918f5b72c664e996486d3251721afb6",
            "occurrenceId": "hsk1-official-vi-l01-pdf017-word-01-gloss"
          },
          "acceptedSourceReview": {
            "path": "/workspace/scratch/28b55072841a/project-recovery-20261005/continue-phase4/review/l1-prep/source-evidence/review.json",
            "sha256": "725c10e63653ddf2ef6b0898d22bc7237edda51c5ab7478de8864e6b20b983c1",
            "occurrenceId": "hsk1-official-vi-l01-pdf017-word-01-gloss"
          },
          "independentComparison": {
            "path": "/workspace/scratch/28b55072841a/project-recovery-20261005/continue-phase4/review/l1-independent-prepare/l1-title-words-dialogue-comparison.json",
            "sha256": "e03d0039e5a32299fa001494fe33f0db747e8fe937c7a791725f3c6f22d11c9f",
            "mappingId": "l01-independent-02"
          }
        }
      },
      "consumers": [
        {
          "baselineFile": "content/stage3-catalog.json",
          "field": "/vocabulary/5/vi",
          "ownerId": "v-l01-lex-440ee0853a-s1",
          "component": "vocabulary"
        }
      ],
      "authorReview": {
        "reviewer": "/root/continue_inventory",
        "status": "accepted",
        "evidenceRef": "/workspace/scratch/28b55072841a/project-recovery-20261005/continue-phase4/review/l1-independent-prepare/l1-title-words-dialogue-comparison.json",
        "reason": "教材给出两项词义；网站附加“một người”，与教材字面不同。"
      },
      "candidateScope": {
        "mappingId": "l01-independent-02",
        "kind": "vocabulary-copy",
        "officialComparableBodyEqualsNewValue": true,
        "confirmedMistranslation": false
      },
      "independentReview": {
        "reviewer": "/root/continue_flow",
        "status": "accepted",
        "evidenceRef": "content/official-vi-revisions/hsk1-l01-core-20261005.review.json"
      }
    },
    {
      "changeId": "hsk1-l01-core-20261005:book:textbook-l01-text-1-line-01:vn",
      "baselineFile": "content/textbook.json",
      "field": "/lessons/0/scenes/0/lines/0/vn",
      "ownerId": "textbook-l01-text-1-line-01",
      "component": "textbook",
      "lesson": 1,
      "expectedEffectiveValue": "AI Tiểu Ngữ, xin chào!",
      "newValue": "Xin chào AI Tiểu Ngữ!",
      "classification": "official-wording-variant",
      "sourceAnchor": {
        "sourceId": "hsk1-official-vi-l01-pdf017-text-1-line-01",
        "kind": "directOfficial",
        "documentSourceId": "hsk1-official-vietnamese-20261004",
        "pdfSHA256": "99ca3e635bbf99bcbbe003e32a0dbdf7ad0af2300b7380959d647e1028cf2764",
        "pdfPages": [
          17
        ],
        "printedPages": [
          "001"
        ],
        "section": "课文译文 · textbook-l01-text-1",
        "zhContext": "AI小语，你好！",
        "officialViText": "Xin chào AI Tiểu Ngữ!",
        "printedViText": "Vương Nhất Phi: Xin chào AI Tiểu Ngữ!",
        "fragments": [
          {
            "pdfPage": 17,
            "printedPage": "001",
            "lineTexts": [
              "Vương Nhất Phi: Xin chào AI Tiểu Ngữ!"
            ]
          }
        ],
        "evidenceRef": {
          "sourceTranscription": {
            "path": "/workspace/scratch/28b55072841a/project-recovery-20261005/continue-phase4/review/l1-prep/source-evidence/author-input/source-transcription.json",
            "sha256": "b05f99aee6c6b6ea1c345d5c80e351306918f5b72c664e996486d3251721afb6",
            "occurrenceId": "hsk1-official-vi-l01-pdf017-text-1-line-01"
          },
          "acceptedSourceReview": {
            "path": "/workspace/scratch/28b55072841a/project-recovery-20261005/continue-phase4/review/l1-prep/source-evidence/review.json",
            "sha256": "725c10e63653ddf2ef6b0898d22bc7237edda51c5ab7478de8864e6b20b983c1",
            "occurrenceId": "hsk1-official-vi-l01-pdf017-text-1-line-01"
          },
          "independentComparison": {
            "path": "/workspace/scratch/28b55072841a/project-recovery-20261005/continue-phase4/review/l1-independent-prepare/l1-title-words-dialogue-comparison.json",
            "sha256": "e03d0039e5a32299fa001494fe33f0db747e8fe937c7a791725f3c6f22d11c9f",
            "mappingId": "l01-independent-03"
          }
        },
        "printedSpeakerVi": "Vương Nhất Phi",
        "speakerZh": "王一飞",
        "bodyDerivation": {
          "operation": "remove-exact-printed-speaker-prefix",
          "prefix": "Vương Nhất Phi: ",
          "body": "Xin chào AI Tiểu Ngữ!",
          "preservesPrintedRoleEvidence": true,
          "runtimeRoleField": "s",
          "runtimeRoleValue": "王一飞"
        }
      },
      "consumers": [
        {
          "baselineFile": "content/textbook.json",
          "field": "/lessons/0/scenes/0/lines/0/vn",
          "ownerId": "textbook-l01-text-1-line-01",
          "component": "textbook"
        }
      ],
      "authorReview": {
        "reviewer": "/root/continue_inventory",
        "status": "accepted",
        "evidenceRef": "/workspace/scratch/28b55072841a/project-recovery-20261005/continue-phase4/review/l1-independent-prepare/l1-title-words-dialogue-comparison.json",
        "reason": "网站问候语顺序不同；教材正文与课标题一致。"
      },
      "candidateScope": {
        "mappingId": "l01-independent-03",
        "kind": "book",
        "officialComparableBodyEqualsNewValue": true,
        "confirmedMistranslation": false
      },
      "independentReview": {
        "reviewer": "/root/continue_flow",
        "status": "accepted",
        "evidenceRef": "content/official-vi-revisions/hsk1-l01-core-20261005.review.json"
      }
    },
    {
      "changeId": "hsk1-l01-core-20261005:book:textbook-l01-text-1-line-02:vn",
      "baselineFile": "content/textbook.json",
      "field": "/lessons/0/scenes/0/lines/1/vn",
      "ownerId": "textbook-l01-text-1-line-02",
      "component": "textbook",
      "lesson": 1,
      "expectedEffectiveValue": "Cô Vương, xin chào!",
      "newValue": "Chào cô Vương!",
      "classification": "official-wording-variant",
      "sourceAnchor": {
        "sourceId": "hsk1-official-vi-l01-pdf017-text-1-line-02",
        "kind": "directOfficial",
        "documentSourceId": "hsk1-official-vietnamese-20261004",
        "pdfSHA256": "99ca3e635bbf99bcbbe003e32a0dbdf7ad0af2300b7380959d647e1028cf2764",
        "pdfPages": [
          17
        ],
        "printedPages": [
          "001"
        ],
        "section": "课文译文 · textbook-l01-text-1",
        "zhContext": "王老师，你好！",
        "officialViText": "Chào cô Vương!",
        "printedViText": "Tiểu Ngữ: Chào cô Vương!",
        "fragments": [
          {
            "pdfPage": 17,
            "printedPage": "001",
            "lineTexts": [
              "Tiểu Ngữ: Chào cô Vương!"
            ]
          }
        ],
        "evidenceRef": {
          "sourceTranscription": {
            "path": "/workspace/scratch/28b55072841a/project-recovery-20261005/continue-phase4/review/l1-prep/source-evidence/author-input/source-transcription.json",
            "sha256": "b05f99aee6c6b6ea1c345d5c80e351306918f5b72c664e996486d3251721afb6",
            "occurrenceId": "hsk1-official-vi-l01-pdf017-text-1-line-02"
          },
          "acceptedSourceReview": {
            "path": "/workspace/scratch/28b55072841a/project-recovery-20261005/continue-phase4/review/l1-prep/source-evidence/review.json",
            "sha256": "725c10e63653ddf2ef6b0898d22bc7237edda51c5ab7478de8864e6b20b983c1",
            "occurrenceId": "hsk1-official-vi-l01-pdf017-text-1-line-02"
          },
          "independentComparison": {
            "path": "/workspace/scratch/28b55072841a/project-recovery-20261005/continue-phase4/review/l1-independent-prepare/l1-title-words-dialogue-comparison.json",
            "sha256": "e03d0039e5a32299fa001494fe33f0db747e8fe937c7a791725f3c6f22d11c9f",
            "mappingId": "l01-independent-04"
          }
        },
        "printedSpeakerVi": "Tiểu Ngữ",
        "speakerZh": "小语",
        "bodyDerivation": {
          "operation": "remove-exact-printed-speaker-prefix",
          "prefix": "Tiểu Ngữ: ",
          "body": "Chào cô Vương!",
          "preservesPrintedRoleEvidence": true,
          "runtimeRoleField": "s",
          "runtimeRoleValue": "小语"
        }
      },
      "consumers": [
        {
          "baselineFile": "content/textbook.json",
          "field": "/lessons/0/scenes/0/lines/1/vn",
          "ownerId": "textbook-l01-text-1-line-02",
          "component": "textbook"
        }
      ],
      "authorReview": {
        "reviewer": "/root/continue_inventory",
        "status": "accepted",
        "evidenceRef": "/workspace/scratch/28b55072841a/project-recovery-20261005/continue-phase4/review/l1-independent-prepare/l1-title-words-dialogue-comparison.json",
        "reason": "网站是“Cô Vương, xin chào!”；教材正文“Chào cô Vương!”。"
      },
      "candidateScope": {
        "mappingId": "l01-independent-04",
        "kind": "book",
        "officialComparableBodyEqualsNewValue": true,
        "confirmedMistranslation": false
      },
      "independentReview": {
        "reviewer": "/root/continue_flow",
        "status": "accepted",
        "evidenceRef": "content/official-vi-revisions/hsk1-l01-core-20261005.review.json"
      }
    },
    {
      "changeId": "hsk1-l01-core-20261005:book:textbook-l01-v003:vn",
      "baselineFile": "content/textbook.json",
      "field": "/lessons/0/vocab/2/vn",
      "ownerId": "textbook-l01-v003",
      "component": "textbook",
      "lesson": 1,
      "expectedEffectiveValue": "tốt; khỏe (trong lời chào)",
      "newValue": "tốt, khoẻ",
      "classification": "official-wording-variant",
      "sourceAnchor": {
        "sourceId": "hsk1-official-vi-l01-pdf018-word-03-gloss",
        "kind": "directOfficial",
        "documentSourceId": "hsk1-official-vietnamese-20261004",
        "pdfSHA256": "99ca3e635bbf99bcbbe003e32a0dbdf7ad0af2300b7380959d647e1028cf2764",
        "pdfPages": [
          18
        ],
        "printedPages": [
          "002"
        ],
        "section": "生词 · Từ mới",
        "zhContext": "好",
        "officialViText": "tốt, khoẻ",
        "printedViText": "tốt, khoẻ",
        "fragments": [
          {
            "pdfPage": 18,
            "printedPage": "002",
            "lineTexts": [
              "tốt, khoẻ"
            ]
          }
        ],
        "evidenceRef": {
          "sourceTranscription": {
            "path": "/workspace/scratch/28b55072841a/project-recovery-20261005/continue-phase4/review/l1-prep/source-evidence/author-input/source-transcription.json",
            "sha256": "b05f99aee6c6b6ea1c345d5c80e351306918f5b72c664e996486d3251721afb6",
            "occurrenceId": "hsk1-official-vi-l01-pdf018-word-03-gloss"
          },
          "acceptedSourceReview": {
            "path": "/workspace/scratch/28b55072841a/project-recovery-20261005/continue-phase4/review/l1-prep/source-evidence/review.json",
            "sha256": "725c10e63653ddf2ef6b0898d22bc7237edda51c5ab7478de8864e6b20b983c1",
            "occurrenceId": "hsk1-official-vi-l01-pdf018-word-03-gloss"
          },
          "independentComparison": {
            "path": "/workspace/scratch/28b55072841a/project-recovery-20261005/continue-phase4/review/l1-independent-prepare/l1-title-words-dialogue-comparison.json",
            "sha256": "e03d0039e5a32299fa001494fe33f0db747e8fe937c7a791725f3c6f22d11c9f",
            "mappingId": "l01-independent-06"
          }
        }
      },
      "consumers": [
        {
          "baselineFile": "content/textbook.json",
          "field": "/lessons/0/vocab/2/vn",
          "ownerId": "textbook-l01-v003",
          "component": "textbook"
        }
      ],
      "authorReview": {
        "reviewer": "/root/continue_inventory",
        "status": "accepted",
        "evidenceRef": "/workspace/scratch/28b55072841a/project-recovery-20261005/continue-phase4/review/l1-independent-prepare/l1-title-words-dialogue-comparison.json",
        "reason": "网站使用分号、现代音调位置“khỏe”和额外说明；教材字面为“tốt, khoẻ”。"
      },
      "candidateScope": {
        "mappingId": "l01-independent-06",
        "kind": "book",
        "officialComparableBodyEqualsNewValue": true,
        "confirmedMistranslation": false
      },
      "independentReview": {
        "reviewer": "/root/continue_flow",
        "status": "accepted",
        "evidenceRef": "content/official-vi-revisions/hsk1-l01-core-20261005.review.json"
      }
    },
    {
      "changeId": "hsk1-l01-core-20261005:vocabulary-copy:v-l01-lex-27e4fe4c3f-s1:vi",
      "baselineFile": "content/stage3-catalog.json",
      "field": "/vocabulary/2/vi",
      "ownerId": "v-l01-lex-27e4fe4c3f-s1",
      "component": "vocabulary",
      "lesson": 1,
      "expectedEffectiveValue": "tốt; khỏe (trong lời chào)",
      "newValue": "tốt, khoẻ",
      "classification": "official-wording-variant",
      "sourceAnchor": {
        "sourceId": "hsk1-official-vi-l01-pdf018-word-03-gloss",
        "kind": "directOfficial",
        "documentSourceId": "hsk1-official-vietnamese-20261004",
        "pdfSHA256": "99ca3e635bbf99bcbbe003e32a0dbdf7ad0af2300b7380959d647e1028cf2764",
        "pdfPages": [
          18
        ],
        "printedPages": [
          "002"
        ],
        "section": "生词 · Từ mới",
        "zhContext": "好",
        "officialViText": "tốt, khoẻ",
        "printedViText": "tốt, khoẻ",
        "fragments": [
          {
            "pdfPage": 18,
            "printedPage": "002",
            "lineTexts": [
              "tốt, khoẻ"
            ]
          }
        ],
        "evidenceRef": {
          "sourceTranscription": {
            "path": "/workspace/scratch/28b55072841a/project-recovery-20261005/continue-phase4/review/l1-prep/source-evidence/author-input/source-transcription.json",
            "sha256": "b05f99aee6c6b6ea1c345d5c80e351306918f5b72c664e996486d3251721afb6",
            "occurrenceId": "hsk1-official-vi-l01-pdf018-word-03-gloss"
          },
          "acceptedSourceReview": {
            "path": "/workspace/scratch/28b55072841a/project-recovery-20261005/continue-phase4/review/l1-prep/source-evidence/review.json",
            "sha256": "725c10e63653ddf2ef6b0898d22bc7237edda51c5ab7478de8864e6b20b983c1",
            "occurrenceId": "hsk1-official-vi-l01-pdf018-word-03-gloss"
          },
          "independentComparison": {
            "path": "/workspace/scratch/28b55072841a/project-recovery-20261005/continue-phase4/review/l1-independent-prepare/l1-title-words-dialogue-comparison.json",
            "sha256": "e03d0039e5a32299fa001494fe33f0db747e8fe937c7a791725f3c6f22d11c9f",
            "mappingId": "l01-independent-06"
          }
        }
      },
      "consumers": [
        {
          "baselineFile": "content/stage3-catalog.json",
          "field": "/vocabulary/2/vi",
          "ownerId": "v-l01-lex-27e4fe4c3f-s1",
          "component": "vocabulary"
        }
      ],
      "authorReview": {
        "reviewer": "/root/continue_inventory",
        "status": "accepted",
        "evidenceRef": "/workspace/scratch/28b55072841a/project-recovery-20261005/continue-phase4/review/l1-independent-prepare/l1-title-words-dialogue-comparison.json",
        "reason": "网站使用分号、现代音调位置“khỏe”和额外说明；教材字面为“tốt, khoẻ”。"
      },
      "candidateScope": {
        "mappingId": "l01-independent-06",
        "kind": "vocabulary-copy",
        "officialComparableBodyEqualsNewValue": true,
        "confirmedMistranslation": false
      },
      "independentReview": {
        "reviewer": "/root/continue_flow",
        "status": "accepted",
        "evidenceRef": "content/official-vi-revisions/hsk1-l01-core-20261005.review.json"
      }
    },
    {
      "changeId": "hsk1-l01-core-20261005:book:textbook-l01-v011:vn",
      "baselineFile": "content/textbook.json",
      "field": "/lessons/0/vocab/10/vn",
      "ownerId": "textbook-l01-v011",
      "component": "textbook",
      "lesson": 1,
      "expectedEffectiveValue": "học sinh; sinh viên",
      "newValue": "học sinh, sinh viên",
      "classification": "official-wording-variant",
      "sourceAnchor": {
        "sourceId": "hsk1-official-vi-l01-pdf018-word-04-gloss",
        "kind": "directOfficial",
        "documentSourceId": "hsk1-official-vietnamese-20261004",
        "pdfSHA256": "99ca3e635bbf99bcbbe003e32a0dbdf7ad0af2300b7380959d647e1028cf2764",
        "pdfPages": [
          18
        ],
        "printedPages": [
          "002"
        ],
        "section": "生词 · Từ mới",
        "zhContext": "学生",
        "officialViText": "học sinh, sinh viên",
        "printedViText": "học sinh, sinh viên",
        "fragments": [
          {
            "pdfPage": 18,
            "printedPage": "002",
            "lineTexts": [
              "học sinh, sinh viên"
            ]
          }
        ],
        "evidenceRef": {
          "sourceTranscription": {
            "path": "/workspace/scratch/28b55072841a/project-recovery-20261005/continue-phase4/review/l1-prep/source-evidence/author-input/source-transcription.json",
            "sha256": "b05f99aee6c6b6ea1c345d5c80e351306918f5b72c664e996486d3251721afb6",
            "occurrenceId": "hsk1-official-vi-l01-pdf018-word-04-gloss"
          },
          "acceptedSourceReview": {
            "path": "/workspace/scratch/28b55072841a/project-recovery-20261005/continue-phase4/review/l1-prep/source-evidence/review.json",
            "sha256": "725c10e63653ddf2ef6b0898d22bc7237edda51c5ab7478de8864e6b20b983c1",
            "occurrenceId": "hsk1-official-vi-l01-pdf018-word-04-gloss"
          },
          "independentComparison": {
            "path": "/workspace/scratch/28b55072841a/project-recovery-20261005/continue-phase4/review/l1-independent-prepare/l1-title-words-dialogue-comparison.json",
            "sha256": "e03d0039e5a32299fa001494fe33f0db747e8fe937c7a791725f3c6f22d11c9f",
            "mappingId": "l01-independent-07"
          }
        }
      },
      "consumers": [
        {
          "baselineFile": "content/textbook.json",
          "field": "/lessons/0/vocab/10/vn",
          "ownerId": "textbook-l01-v011",
          "component": "textbook"
        }
      ],
      "authorReview": {
        "reviewer": "/root/continue_inventory",
        "status": "accepted",
        "evidenceRef": "/workspace/scratch/28b55072841a/project-recovery-20261005/continue-phase4/review/l1-independent-prepare/l1-title-words-dialogue-comparison.json",
        "reason": "仅词义分隔标点不同：网站分号，教材逗号。"
      },
      "candidateScope": {
        "mappingId": "l01-independent-07",
        "kind": "book",
        "officialComparableBodyEqualsNewValue": true,
        "confirmedMistranslation": false
      },
      "independentReview": {
        "reviewer": "/root/continue_flow",
        "status": "accepted",
        "evidenceRef": "content/official-vi-revisions/hsk1-l01-core-20261005.review.json"
      }
    },
    {
      "changeId": "hsk1-l01-core-20261005:vocabulary-copy:v-l01-lex-b76783d38c-s1:vi",
      "baselineFile": "content/stage3-catalog.json",
      "field": "/vocabulary/10/vi",
      "ownerId": "v-l01-lex-b76783d38c-s1",
      "component": "vocabulary",
      "lesson": 1,
      "expectedEffectiveValue": "học sinh; sinh viên",
      "newValue": "học sinh, sinh viên",
      "classification": "official-wording-variant",
      "sourceAnchor": {
        "sourceId": "hsk1-official-vi-l01-pdf018-word-04-gloss",
        "kind": "directOfficial",
        "documentSourceId": "hsk1-official-vietnamese-20261004",
        "pdfSHA256": "99ca3e635bbf99bcbbe003e32a0dbdf7ad0af2300b7380959d647e1028cf2764",
        "pdfPages": [
          18
        ],
        "printedPages": [
          "002"
        ],
        "section": "生词 · Từ mới",
        "zhContext": "学生",
        "officialViText": "học sinh, sinh viên",
        "printedViText": "học sinh, sinh viên",
        "fragments": [
          {
            "pdfPage": 18,
            "printedPage": "002",
            "lineTexts": [
              "học sinh, sinh viên"
            ]
          }
        ],
        "evidenceRef": {
          "sourceTranscription": {
            "path": "/workspace/scratch/28b55072841a/project-recovery-20261005/continue-phase4/review/l1-prep/source-evidence/author-input/source-transcription.json",
            "sha256": "b05f99aee6c6b6ea1c345d5c80e351306918f5b72c664e996486d3251721afb6",
            "occurrenceId": "hsk1-official-vi-l01-pdf018-word-04-gloss"
          },
          "acceptedSourceReview": {
            "path": "/workspace/scratch/28b55072841a/project-recovery-20261005/continue-phase4/review/l1-prep/source-evidence/review.json",
            "sha256": "725c10e63653ddf2ef6b0898d22bc7237edda51c5ab7478de8864e6b20b983c1",
            "occurrenceId": "hsk1-official-vi-l01-pdf018-word-04-gloss"
          },
          "independentComparison": {
            "path": "/workspace/scratch/28b55072841a/project-recovery-20261005/continue-phase4/review/l1-independent-prepare/l1-title-words-dialogue-comparison.json",
            "sha256": "e03d0039e5a32299fa001494fe33f0db747e8fe937c7a791725f3c6f22d11c9f",
            "mappingId": "l01-independent-07"
          }
        }
      },
      "consumers": [
        {
          "baselineFile": "content/stage3-catalog.json",
          "field": "/vocabulary/10/vi",
          "ownerId": "v-l01-lex-b76783d38c-s1",
          "component": "vocabulary"
        }
      ],
      "authorReview": {
        "reviewer": "/root/continue_inventory",
        "status": "accepted",
        "evidenceRef": "/workspace/scratch/28b55072841a/project-recovery-20261005/continue-phase4/review/l1-independent-prepare/l1-title-words-dialogue-comparison.json",
        "reason": "仅词义分隔标点不同：网站分号，教材逗号。"
      },
      "candidateScope": {
        "mappingId": "l01-independent-07",
        "kind": "vocabulary-copy",
        "officialComparableBodyEqualsNewValue": true,
        "confirmedMistranslation": false
      },
      "independentReview": {
        "reviewer": "/root/continue_flow",
        "status": "accepted",
        "evidenceRef": "content/official-vi-revisions/hsk1-l01-core-20261005.review.json"
      }
    },
    {
      "changeId": "hsk1-l01-core-20261005:book:textbook-l01-v005:vn",
      "baselineFile": "content/textbook.json",
      "field": "/lessons/0/vocab/4/vn",
      "ownerId": "textbook-l01-v005",
      "component": "textbook",
      "lesson": 1,
      "expectedEffectiveValue": "hậu tố chỉ số nhiều của người",
      "newValue": "dùng sau đại từ nhân xưng hoặc danh từ để chỉ số nhiều",
      "classification": "official-wording-variant",
      "sourceAnchor": {
        "sourceId": "hsk1-official-vi-l01-pdf018-word-05-gloss",
        "kind": "directOfficial",
        "documentSourceId": "hsk1-official-vietnamese-20261004",
        "pdfSHA256": "99ca3e635bbf99bcbbe003e32a0dbdf7ad0af2300b7380959d647e1028cf2764",
        "pdfPages": [
          18
        ],
        "printedPages": [
          "002"
        ],
        "section": "生词 · Từ mới",
        "zhContext": "们",
        "officialViText": "dùng sau đại từ nhân xưng hoặc danh từ để chỉ số nhiều",
        "printedViText": "dùng sau đại từ nhân xưng hoặc danh từ để chỉ số nhiều",
        "fragments": [
          {
            "pdfPage": 18,
            "printedPage": "002",
            "lineTexts": [
              "dùng sau đại từ nhân",
              "xưng hoặc danh từ để",
              "chỉ số nhiều"
            ]
          }
        ],
        "evidenceRef": {
          "sourceTranscription": {
            "path": "/workspace/scratch/28b55072841a/project-recovery-20261005/continue-phase4/review/l1-prep/source-evidence/author-input/source-transcription.json",
            "sha256": "b05f99aee6c6b6ea1c345d5c80e351306918f5b72c664e996486d3251721afb6",
            "occurrenceId": "hsk1-official-vi-l01-pdf018-word-05-gloss"
          },
          "acceptedSourceReview": {
            "path": "/workspace/scratch/28b55072841a/project-recovery-20261005/continue-phase4/review/l1-prep/source-evidence/review.json",
            "sha256": "725c10e63653ddf2ef6b0898d22bc7237edda51c5ab7478de8864e6b20b983c1",
            "occurrenceId": "hsk1-official-vi-l01-pdf018-word-05-gloss"
          },
          "independentComparison": {
            "path": "/workspace/scratch/28b55072841a/project-recovery-20261005/continue-phase4/review/l1-independent-prepare/l1-title-words-dialogue-comparison.json",
            "sha256": "e03d0039e5a32299fa001494fe33f0db747e8fe937c7a791725f3c6f22d11c9f",
            "mappingId": "l01-independent-08"
          }
        }
      },
      "consumers": [
        {
          "baselineFile": "content/textbook.json",
          "field": "/lessons/0/vocab/4/vn",
          "ownerId": "textbook-l01-v005",
          "component": "textbook"
        }
      ],
      "authorReview": {
        "reviewer": "/root/continue_inventory",
        "status": "accepted",
        "evidenceRef": "/workspace/scratch/28b55072841a/project-recovery-20261005/continue-phase4/review/l1-independent-prepare/l1-title-words-dialogue-comparison.json",
        "reason": "网站是简短后缀概述；教材明确放在代词或名词之后表示复数。"
      },
      "candidateScope": {
        "mappingId": "l01-independent-08",
        "kind": "book",
        "officialComparableBodyEqualsNewValue": true,
        "confirmedMistranslation": false
      },
      "independentReview": {
        "reviewer": "/root/continue_flow",
        "status": "accepted",
        "evidenceRef": "content/official-vi-revisions/hsk1-l01-core-20261005.review.json"
      }
    },
    {
      "changeId": "hsk1-l01-core-20261005:vocabulary-copy:v-l01-lex-91c76e0b5a-s1:vi",
      "baselineFile": "content/stage3-catalog.json",
      "field": "/vocabulary/4/vi",
      "ownerId": "v-l01-lex-91c76e0b5a-s1",
      "component": "vocabulary",
      "lesson": 1,
      "expectedEffectiveValue": "hậu tố chỉ số nhiều của người",
      "newValue": "dùng sau đại từ nhân xưng hoặc danh từ để chỉ số nhiều",
      "classification": "official-wording-variant",
      "sourceAnchor": {
        "sourceId": "hsk1-official-vi-l01-pdf018-word-05-gloss",
        "kind": "directOfficial",
        "documentSourceId": "hsk1-official-vietnamese-20261004",
        "pdfSHA256": "99ca3e635bbf99bcbbe003e32a0dbdf7ad0af2300b7380959d647e1028cf2764",
        "pdfPages": [
          18
        ],
        "printedPages": [
          "002"
        ],
        "section": "生词 · Từ mới",
        "zhContext": "们",
        "officialViText": "dùng sau đại từ nhân xưng hoặc danh từ để chỉ số nhiều",
        "printedViText": "dùng sau đại từ nhân xưng hoặc danh từ để chỉ số nhiều",
        "fragments": [
          {
            "pdfPage": 18,
            "printedPage": "002",
            "lineTexts": [
              "dùng sau đại từ nhân",
              "xưng hoặc danh từ để",
              "chỉ số nhiều"
            ]
          }
        ],
        "evidenceRef": {
          "sourceTranscription": {
            "path": "/workspace/scratch/28b55072841a/project-recovery-20261005/continue-phase4/review/l1-prep/source-evidence/author-input/source-transcription.json",
            "sha256": "b05f99aee6c6b6ea1c345d5c80e351306918f5b72c664e996486d3251721afb6",
            "occurrenceId": "hsk1-official-vi-l01-pdf018-word-05-gloss"
          },
          "acceptedSourceReview": {
            "path": "/workspace/scratch/28b55072841a/project-recovery-20261005/continue-phase4/review/l1-prep/source-evidence/review.json",
            "sha256": "725c10e63653ddf2ef6b0898d22bc7237edda51c5ab7478de8864e6b20b983c1",
            "occurrenceId": "hsk1-official-vi-l01-pdf018-word-05-gloss"
          },
          "independentComparison": {
            "path": "/workspace/scratch/28b55072841a/project-recovery-20261005/continue-phase4/review/l1-independent-prepare/l1-title-words-dialogue-comparison.json",
            "sha256": "e03d0039e5a32299fa001494fe33f0db747e8fe937c7a791725f3c6f22d11c9f",
            "mappingId": "l01-independent-08"
          }
        }
      },
      "consumers": [
        {
          "baselineFile": "content/stage3-catalog.json",
          "field": "/vocabulary/4/vi",
          "ownerId": "v-l01-lex-91c76e0b5a-s1",
          "component": "vocabulary"
        }
      ],
      "authorReview": {
        "reviewer": "/root/continue_inventory",
        "status": "accepted",
        "evidenceRef": "/workspace/scratch/28b55072841a/project-recovery-20261005/continue-phase4/review/l1-independent-prepare/l1-title-words-dialogue-comparison.json",
        "reason": "网站是简短后缀概述；教材明确放在代词或名词之后表示复数。"
      },
      "candidateScope": {
        "mappingId": "l01-independent-08",
        "kind": "vocabulary-copy",
        "officialComparableBodyEqualsNewValue": true,
        "confirmedMistranslation": false
      },
      "independentReview": {
        "reviewer": "/root/continue_flow",
        "status": "accepted",
        "evidenceRef": "content/official-vi-revisions/hsk1-l01-core-20261005.review.json"
      }
    },
    {
      "changeId": "hsk1-l01-core-20261005:book:textbook-l01-v004:vn",
      "baselineFile": "content/textbook.json",
      "field": "/lessons/0/vocab/3/vn",
      "ownerId": "textbook-l01-v004",
      "component": "textbook",
      "lesson": 1,
      "expectedEffectiveValue": "giáo viên; thầy/cô",
      "newValue": "thầy giáo, cô giáo, giáo viên",
      "classification": "official-wording-variant",
      "sourceAnchor": {
        "sourceId": "hsk1-official-vi-l01-pdf018-word-06-gloss",
        "kind": "directOfficial",
        "documentSourceId": "hsk1-official-vietnamese-20261004",
        "pdfSHA256": "99ca3e635bbf99bcbbe003e32a0dbdf7ad0af2300b7380959d647e1028cf2764",
        "pdfPages": [
          18
        ],
        "printedPages": [
          "002"
        ],
        "section": "生词 · Từ mới",
        "zhContext": "老师",
        "officialViText": "thầy giáo, cô giáo, giáo viên",
        "printedViText": "thầy giáo, cô giáo, giáo viên",
        "fragments": [
          {
            "pdfPage": 18,
            "printedPage": "002",
            "lineTexts": [
              "thầy giáo, cô giáo,",
              "giáo viên"
            ]
          }
        ],
        "evidenceRef": {
          "sourceTranscription": {
            "path": "/workspace/scratch/28b55072841a/project-recovery-20261005/continue-phase4/review/l1-prep/source-evidence/author-input/source-transcription.json",
            "sha256": "b05f99aee6c6b6ea1c345d5c80e351306918f5b72c664e996486d3251721afb6",
            "occurrenceId": "hsk1-official-vi-l01-pdf018-word-06-gloss"
          },
          "acceptedSourceReview": {
            "path": "/workspace/scratch/28b55072841a/project-recovery-20261005/continue-phase4/review/l1-prep/source-evidence/review.json",
            "sha256": "725c10e63653ddf2ef6b0898d22bc7237edda51c5ab7478de8864e6b20b983c1",
            "occurrenceId": "hsk1-official-vi-l01-pdf018-word-06-gloss"
          },
          "independentComparison": {
            "path": "/workspace/scratch/28b55072841a/project-recovery-20261005/continue-phase4/review/l1-independent-prepare/l1-title-words-dialogue-comparison.json",
            "sha256": "e03d0039e5a32299fa001494fe33f0db747e8fe937c7a791725f3c6f22d11c9f",
            "mappingId": "l01-independent-09"
          }
        }
      },
      "consumers": [
        {
          "baselineFile": "content/textbook.json",
          "field": "/lessons/0/vocab/3/vn",
          "ownerId": "textbook-l01-v004",
          "component": "textbook"
        }
      ],
      "authorReview": {
        "reviewer": "/root/continue_inventory",
        "status": "accepted",
        "evidenceRef": "/workspace/scratch/28b55072841a/project-recovery-20261005/continue-phase4/review/l1-independent-prepare/l1-title-words-dialogue-comparison.json",
        "reason": "网站调整顺序并使用斜线简写；教材列出三项原词义。"
      },
      "candidateScope": {
        "mappingId": "l01-independent-09",
        "kind": "book",
        "officialComparableBodyEqualsNewValue": true,
        "confirmedMistranslation": false
      },
      "independentReview": {
        "reviewer": "/root/continue_flow",
        "status": "accepted",
        "evidenceRef": "content/official-vi-revisions/hsk1-l01-core-20261005.review.json"
      }
    },
    {
      "changeId": "hsk1-l01-core-20261005:vocabulary-copy:v-l01-lex-494f23d624-s1:vi",
      "baselineFile": "content/stage3-catalog.json",
      "field": "/vocabulary/3/vi",
      "ownerId": "v-l01-lex-494f23d624-s1",
      "component": "vocabulary",
      "lesson": 1,
      "expectedEffectiveValue": "giáo viên; thầy/cô",
      "newValue": "thầy giáo, cô giáo, giáo viên",
      "classification": "official-wording-variant",
      "sourceAnchor": {
        "sourceId": "hsk1-official-vi-l01-pdf018-word-06-gloss",
        "kind": "directOfficial",
        "documentSourceId": "hsk1-official-vietnamese-20261004",
        "pdfSHA256": "99ca3e635bbf99bcbbe003e32a0dbdf7ad0af2300b7380959d647e1028cf2764",
        "pdfPages": [
          18
        ],
        "printedPages": [
          "002"
        ],
        "section": "生词 · Từ mới",
        "zhContext": "老师",
        "officialViText": "thầy giáo, cô giáo, giáo viên",
        "printedViText": "thầy giáo, cô giáo, giáo viên",
        "fragments": [
          {
            "pdfPage": 18,
            "printedPage": "002",
            "lineTexts": [
              "thầy giáo, cô giáo,",
              "giáo viên"
            ]
          }
        ],
        "evidenceRef": {
          "sourceTranscription": {
            "path": "/workspace/scratch/28b55072841a/project-recovery-20261005/continue-phase4/review/l1-prep/source-evidence/author-input/source-transcription.json",
            "sha256": "b05f99aee6c6b6ea1c345d5c80e351306918f5b72c664e996486d3251721afb6",
            "occurrenceId": "hsk1-official-vi-l01-pdf018-word-06-gloss"
          },
          "acceptedSourceReview": {
            "path": "/workspace/scratch/28b55072841a/project-recovery-20261005/continue-phase4/review/l1-prep/source-evidence/review.json",
            "sha256": "725c10e63653ddf2ef6b0898d22bc7237edda51c5ab7478de8864e6b20b983c1",
            "occurrenceId": "hsk1-official-vi-l01-pdf018-word-06-gloss"
          },
          "independentComparison": {
            "path": "/workspace/scratch/28b55072841a/project-recovery-20261005/continue-phase4/review/l1-independent-prepare/l1-title-words-dialogue-comparison.json",
            "sha256": "e03d0039e5a32299fa001494fe33f0db747e8fe937c7a791725f3c6f22d11c9f",
            "mappingId": "l01-independent-09"
          }
        }
      },
      "consumers": [
        {
          "baselineFile": "content/stage3-catalog.json",
          "field": "/vocabulary/3/vi",
          "ownerId": "v-l01-lex-494f23d624-s1",
          "component": "vocabulary"
        }
      ],
      "authorReview": {
        "reviewer": "/root/continue_inventory",
        "status": "accepted",
        "evidenceRef": "/workspace/scratch/28b55072841a/project-recovery-20261005/continue-phase4/review/l1-independent-prepare/l1-title-words-dialogue-comparison.json",
        "reason": "网站调整顺序并使用斜线简写；教材列出三项原词义。"
      },
      "candidateScope": {
        "mappingId": "l01-independent-09",
        "kind": "vocabulary-copy",
        "officialComparableBodyEqualsNewValue": true,
        "confirmedMistranslation": false
      },
      "independentReview": {
        "reviewer": "/root/continue_flow",
        "status": "accepted",
        "evidenceRef": "content/official-vi-revisions/hsk1-l01-core-20261005.review.json"
      }
    },
    {
      "changeId": "hsk1-l01-core-20261005:book:textbook-l01-v008:vn",
      "baselineFile": "content/textbook.json",
      "field": "/lessons/0/vocab/7/vn",
      "ownerId": "textbook-l01-v008",
      "component": "textbook",
      "lesson": 1,
      "expectedEffectiveValue": "anh/chị/ông/bà… (cách xưng hô kính trọng)",
      "newValue": "ngài, ông, bà... (đại từ nhân xưng ngôi thứ hai thể hiện sự trang trọng)",
      "classification": "official-wording-variant",
      "sourceAnchor": {
        "sourceId": "hsk1-official-vi-l01-pdf018-word-07-gloss",
        "kind": "directOfficial",
        "documentSourceId": "hsk1-official-vietnamese-20261004",
        "pdfSHA256": "99ca3e635bbf99bcbbe003e32a0dbdf7ad0af2300b7380959d647e1028cf2764",
        "pdfPages": [
          18
        ],
        "printedPages": [
          "002"
        ],
        "section": "生词 · Từ mới",
        "zhContext": "您",
        "officialViText": "ngài, ông, bà... (đại từ nhân xưng ngôi thứ hai thể hiện sự trang trọng)",
        "printedViText": "ngài, ông, bà... (đại từ nhân xưng ngôi thứ hai thể hiện sự trang trọng)",
        "fragments": [
          {
            "pdfPage": 18,
            "printedPage": "002",
            "lineTexts": [
              "ngài, ông, bà... (đại từ",
              "nhân xưng ngôi thứ hai",
              "thể hiện sự trang trọng)"
            ]
          }
        ],
        "evidenceRef": {
          "sourceTranscription": {
            "path": "/workspace/scratch/28b55072841a/project-recovery-20261005/continue-phase4/review/l1-prep/source-evidence/author-input/source-transcription.json",
            "sha256": "b05f99aee6c6b6ea1c345d5c80e351306918f5b72c664e996486d3251721afb6",
            "occurrenceId": "hsk1-official-vi-l01-pdf018-word-07-gloss"
          },
          "acceptedSourceReview": {
            "path": "/workspace/scratch/28b55072841a/project-recovery-20261005/continue-phase4/review/l1-prep/source-evidence/review.json",
            "sha256": "725c10e63653ddf2ef6b0898d22bc7237edda51c5ab7478de8864e6b20b983c1",
            "occurrenceId": "hsk1-official-vi-l01-pdf018-word-07-gloss"
          },
          "independentComparison": {
            "path": "/workspace/scratch/28b55072841a/project-recovery-20261005/continue-phase4/review/l1-independent-prepare/l1-title-words-dialogue-comparison.json",
            "sha256": "e03d0039e5a32299fa001494fe33f0db747e8fe937c7a791725f3c6f22d11c9f",
            "mappingId": "l01-independent-10"
          }
        }
      },
      "consumers": [
        {
          "baselineFile": "content/textbook.json",
          "field": "/lessons/0/vocab/7/vn",
          "ownerId": "textbook-l01-v008",
          "component": "textbook"
        }
      ],
      "authorReview": {
        "reviewer": "/root/continue_inventory",
        "status": "accepted",
        "evidenceRef": "/workspace/scratch/28b55072841a/project-recovery-20261005/continue-phase4/review/l1-independent-prepare/l1-title-words-dialogue-comparison.json",
        "reason": "网站称呼列表和解释与教材不同；按教材保留ngài及括号完整说明。"
      },
      "candidateScope": {
        "mappingId": "l01-independent-10",
        "kind": "book",
        "officialComparableBodyEqualsNewValue": true,
        "confirmedMistranslation": false
      },
      "independentReview": {
        "reviewer": "/root/continue_flow",
        "status": "accepted",
        "evidenceRef": "content/official-vi-revisions/hsk1-l01-core-20261005.review.json"
      }
    },
    {
      "changeId": "hsk1-l01-core-20261005:vocabulary-copy:v-l01-lex-7a424449a3-s1:vi",
      "baselineFile": "content/stage3-catalog.json",
      "field": "/vocabulary/7/vi",
      "ownerId": "v-l01-lex-7a424449a3-s1",
      "component": "vocabulary",
      "lesson": 1,
      "expectedEffectiveValue": "anh/chị/ông/bà… (cách xưng hô kính trọng)",
      "newValue": "ngài, ông, bà... (đại từ nhân xưng ngôi thứ hai thể hiện sự trang trọng)",
      "classification": "official-wording-variant",
      "sourceAnchor": {
        "sourceId": "hsk1-official-vi-l01-pdf018-word-07-gloss",
        "kind": "directOfficial",
        "documentSourceId": "hsk1-official-vietnamese-20261004",
        "pdfSHA256": "99ca3e635bbf99bcbbe003e32a0dbdf7ad0af2300b7380959d647e1028cf2764",
        "pdfPages": [
          18
        ],
        "printedPages": [
          "002"
        ],
        "section": "生词 · Từ mới",
        "zhContext": "您",
        "officialViText": "ngài, ông, bà... (đại từ nhân xưng ngôi thứ hai thể hiện sự trang trọng)",
        "printedViText": "ngài, ông, bà... (đại từ nhân xưng ngôi thứ hai thể hiện sự trang trọng)",
        "fragments": [
          {
            "pdfPage": 18,
            "printedPage": "002",
            "lineTexts": [
              "ngài, ông, bà... (đại từ",
              "nhân xưng ngôi thứ hai",
              "thể hiện sự trang trọng)"
            ]
          }
        ],
        "evidenceRef": {
          "sourceTranscription": {
            "path": "/workspace/scratch/28b55072841a/project-recovery-20261005/continue-phase4/review/l1-prep/source-evidence/author-input/source-transcription.json",
            "sha256": "b05f99aee6c6b6ea1c345d5c80e351306918f5b72c664e996486d3251721afb6",
            "occurrenceId": "hsk1-official-vi-l01-pdf018-word-07-gloss"
          },
          "acceptedSourceReview": {
            "path": "/workspace/scratch/28b55072841a/project-recovery-20261005/continue-phase4/review/l1-prep/source-evidence/review.json",
            "sha256": "725c10e63653ddf2ef6b0898d22bc7237edda51c5ab7478de8864e6b20b983c1",
            "occurrenceId": "hsk1-official-vi-l01-pdf018-word-07-gloss"
          },
          "independentComparison": {
            "path": "/workspace/scratch/28b55072841a/project-recovery-20261005/continue-phase4/review/l1-independent-prepare/l1-title-words-dialogue-comparison.json",
            "sha256": "e03d0039e5a32299fa001494fe33f0db747e8fe937c7a791725f3c6f22d11c9f",
            "mappingId": "l01-independent-10"
          }
        }
      },
      "consumers": [
        {
          "baselineFile": "content/stage3-catalog.json",
          "field": "/vocabulary/7/vi",
          "ownerId": "v-l01-lex-7a424449a3-s1",
          "component": "vocabulary"
        }
      ],
      "authorReview": {
        "reviewer": "/root/continue_inventory",
        "status": "accepted",
        "evidenceRef": "/workspace/scratch/28b55072841a/project-recovery-20261005/continue-phase4/review/l1-independent-prepare/l1-title-words-dialogue-comparison.json",
        "reason": "网站称呼列表和解释与教材不同；按教材保留ngài及括号完整说明。"
      },
      "candidateScope": {
        "mappingId": "l01-independent-10",
        "kind": "vocabulary-copy",
        "officialComparableBodyEqualsNewValue": true,
        "confirmedMistranslation": false
      },
      "independentReview": {
        "reviewer": "/root/continue_flow",
        "status": "accepted",
        "evidenceRef": "content/official-vi-revisions/hsk1-l01-core-20261005.review.json"
      }
    },
    {
      "changeId": "hsk1-l01-core-20261005:book:textbook-l01-v007:vn",
      "baselineFile": "content/textbook.json",
      "field": "/lessons/0/vocab/6/vn",
      "ownerId": "textbook-l01-v007",
      "component": "textbook",
      "lesson": 1,
      "expectedEffectiveValue": "các bạn; các anh/chị (người nghe số nhiều)",
      "newValue": "các bạn, các anh, các chị... (đại từ nhân xưng ngôi thứ hai số nhiều)",
      "classification": "official-wording-variant",
      "sourceAnchor": {
        "sourceId": "hsk1-official-vi-l01-pdf018-word-08-gloss",
        "kind": "directOfficial",
        "documentSourceId": "hsk1-official-vietnamese-20261004",
        "pdfSHA256": "99ca3e635bbf99bcbbe003e32a0dbdf7ad0af2300b7380959d647e1028cf2764",
        "pdfPages": [
          18
        ],
        "printedPages": [
          "002"
        ],
        "section": "生词 · Từ mới",
        "zhContext": "你们",
        "officialViText": "các bạn, các anh, các chị... (đại từ nhân xưng ngôi thứ hai số nhiều)",
        "printedViText": "các bạn, các anh, các chị... (đại từ nhân xưng ngôi thứ hai số nhiều)",
        "fragments": [
          {
            "pdfPage": 18,
            "printedPage": "002",
            "lineTexts": [
              "các bạn, các anh, các chị...",
              "(đại từ nhân xưng ngôi",
              "thứ hai số nhiều)"
            ]
          }
        ],
        "evidenceRef": {
          "sourceTranscription": {
            "path": "/workspace/scratch/28b55072841a/project-recovery-20261005/continue-phase4/review/l1-prep/source-evidence/author-input/source-transcription.json",
            "sha256": "b05f99aee6c6b6ea1c345d5c80e351306918f5b72c664e996486d3251721afb6",
            "occurrenceId": "hsk1-official-vi-l01-pdf018-word-08-gloss"
          },
          "acceptedSourceReview": {
            "path": "/workspace/scratch/28b55072841a/project-recovery-20261005/continue-phase4/review/l1-prep/source-evidence/review.json",
            "sha256": "725c10e63653ddf2ef6b0898d22bc7237edda51c5ab7478de8864e6b20b983c1",
            "occurrenceId": "hsk1-official-vi-l01-pdf018-word-08-gloss"
          },
          "independentComparison": {
            "path": "/workspace/scratch/28b55072841a/project-recovery-20261005/continue-phase4/review/l1-independent-prepare/l1-title-words-dialogue-comparison.json",
            "sha256": "e03d0039e5a32299fa001494fe33f0db747e8fe937c7a791725f3c6f22d11c9f",
            "mappingId": "l01-independent-11"
          }
        }
      },
      "consumers": [
        {
          "baselineFile": "content/textbook.json",
          "field": "/lessons/0/vocab/6/vn",
          "ownerId": "textbook-l01-v007",
          "component": "textbook"
        }
      ],
      "authorReview": {
        "reviewer": "/root/continue_inventory",
        "status": "accepted",
        "evidenceRef": "/workspace/scratch/28b55072841a/project-recovery-20261005/continue-phase4/review/l1-independent-prepare/l1-title-words-dialogue-comparison.json",
        "reason": "网站使用斜线/分号并简述听者复数；教材完整列出称呼及代词说明。"
      },
      "candidateScope": {
        "mappingId": "l01-independent-11",
        "kind": "book",
        "officialComparableBodyEqualsNewValue": true,
        "confirmedMistranslation": false
      },
      "independentReview": {
        "reviewer": "/root/continue_flow",
        "status": "accepted",
        "evidenceRef": "content/official-vi-revisions/hsk1-l01-core-20261005.review.json"
      }
    },
    {
      "changeId": "hsk1-l01-core-20261005:vocabulary-copy:v-l01-lex-2fda3d6ec6-s1:vi",
      "baselineFile": "content/stage3-catalog.json",
      "field": "/vocabulary/6/vi",
      "ownerId": "v-l01-lex-2fda3d6ec6-s1",
      "component": "vocabulary",
      "lesson": 1,
      "expectedEffectiveValue": "các bạn; các anh/chị (người nghe số nhiều)",
      "newValue": "các bạn, các anh, các chị... (đại từ nhân xưng ngôi thứ hai số nhiều)",
      "classification": "official-wording-variant",
      "sourceAnchor": {
        "sourceId": "hsk1-official-vi-l01-pdf018-word-08-gloss",
        "kind": "directOfficial",
        "documentSourceId": "hsk1-official-vietnamese-20261004",
        "pdfSHA256": "99ca3e635bbf99bcbbe003e32a0dbdf7ad0af2300b7380959d647e1028cf2764",
        "pdfPages": [
          18
        ],
        "printedPages": [
          "002"
        ],
        "section": "生词 · Từ mới",
        "zhContext": "你们",
        "officialViText": "các bạn, các anh, các chị... (đại từ nhân xưng ngôi thứ hai số nhiều)",
        "printedViText": "các bạn, các anh, các chị... (đại từ nhân xưng ngôi thứ hai số nhiều)",
        "fragments": [
          {
            "pdfPage": 18,
            "printedPage": "002",
            "lineTexts": [
              "các bạn, các anh, các chị...",
              "(đại từ nhân xưng ngôi",
              "thứ hai số nhiều)"
            ]
          }
        ],
        "evidenceRef": {
          "sourceTranscription": {
            "path": "/workspace/scratch/28b55072841a/project-recovery-20261005/continue-phase4/review/l1-prep/source-evidence/author-input/source-transcription.json",
            "sha256": "b05f99aee6c6b6ea1c345d5c80e351306918f5b72c664e996486d3251721afb6",
            "occurrenceId": "hsk1-official-vi-l01-pdf018-word-08-gloss"
          },
          "acceptedSourceReview": {
            "path": "/workspace/scratch/28b55072841a/project-recovery-20261005/continue-phase4/review/l1-prep/source-evidence/review.json",
            "sha256": "725c10e63653ddf2ef6b0898d22bc7237edda51c5ab7478de8864e6b20b983c1",
            "occurrenceId": "hsk1-official-vi-l01-pdf018-word-08-gloss"
          },
          "independentComparison": {
            "path": "/workspace/scratch/28b55072841a/project-recovery-20261005/continue-phase4/review/l1-independent-prepare/l1-title-words-dialogue-comparison.json",
            "sha256": "e03d0039e5a32299fa001494fe33f0db747e8fe937c7a791725f3c6f22d11c9f",
            "mappingId": "l01-independent-11"
          }
        }
      },
      "consumers": [
        {
          "baselineFile": "content/stage3-catalog.json",
          "field": "/vocabulary/6/vi",
          "ownerId": "v-l01-lex-2fda3d6ec6-s1",
          "component": "vocabulary"
        }
      ],
      "authorReview": {
        "reviewer": "/root/continue_inventory",
        "status": "accepted",
        "evidenceRef": "/workspace/scratch/28b55072841a/project-recovery-20261005/continue-phase4/review/l1-independent-prepare/l1-title-words-dialogue-comparison.json",
        "reason": "网站使用斜线/分号并简述听者复数；教材完整列出称呼及代词说明。"
      },
      "candidateScope": {
        "mappingId": "l01-independent-11",
        "kind": "vocabulary-copy",
        "officialComparableBodyEqualsNewValue": true,
        "confirmedMistranslation": false
      },
      "independentReview": {
        "reviewer": "/root/continue_flow",
        "status": "accepted",
        "evidenceRef": "content/official-vi-revisions/hsk1-l01-core-20261005.review.json"
      }
    },
    {
      "changeId": "hsk1-l01-core-20261005:book:textbook-l01-text-2-line-02:vn",
      "baselineFile": "content/textbook.json",
      "field": "/lessons/0/scenes/1/lines/1/vn",
      "ownerId": "textbook-l01-text-2-line-02",
      "component": "textbook",
      "lesson": 1,
      "expectedEffectiveValue": "Em chào cô ạ!",
      "newValue": "Chào cô ạ!",
      "classification": "official-wording-variant",
      "sourceAnchor": {
        "sourceId": "hsk1-official-vi-l01-pdf018-text-2-line-02",
        "kind": "directOfficial",
        "documentSourceId": "hsk1-official-vietnamese-20261004",
        "pdfSHA256": "99ca3e635bbf99bcbbe003e32a0dbdf7ad0af2300b7380959d647e1028cf2764",
        "pdfPages": [
          18
        ],
        "printedPages": [
          "002"
        ],
        "section": "课文译文 · textbook-l01-text-2",
        "zhContext": "老师，您好！",
        "officialViText": "Chào cô ạ!",
        "printedViText": "Học sinh: Chào cô ạ!",
        "fragments": [
          {
            "pdfPage": 18,
            "printedPage": "002",
            "lineTexts": [
              "Học sinh: Chào cô ạ!"
            ]
          }
        ],
        "evidenceRef": {
          "sourceTranscription": {
            "path": "/workspace/scratch/28b55072841a/project-recovery-20261005/continue-phase4/review/l1-prep/source-evidence/author-input/source-transcription.json",
            "sha256": "b05f99aee6c6b6ea1c345d5c80e351306918f5b72c664e996486d3251721afb6",
            "occurrenceId": "hsk1-official-vi-l01-pdf018-text-2-line-02"
          },
          "acceptedSourceReview": {
            "path": "/workspace/scratch/28b55072841a/project-recovery-20261005/continue-phase4/review/l1-prep/source-evidence/review.json",
            "sha256": "725c10e63653ddf2ef6b0898d22bc7237edda51c5ab7478de8864e6b20b983c1",
            "occurrenceId": "hsk1-official-vi-l01-pdf018-text-2-line-02"
          },
          "independentComparison": {
            "path": "/workspace/scratch/28b55072841a/project-recovery-20261005/continue-phase4/review/l1-independent-prepare/l1-title-words-dialogue-comparison.json",
            "sha256": "e03d0039e5a32299fa001494fe33f0db747e8fe937c7a791725f3c6f22d11c9f",
            "mappingId": "l01-independent-13"
          }
        },
        "printedSpeakerVi": "Học sinh",
        "speakerZh": "学生们",
        "bodyDerivation": {
          "operation": "remove-exact-printed-speaker-prefix",
          "prefix": "Học sinh: ",
          "body": "Chào cô ạ!",
          "preservesPrintedRoleEvidence": true,
          "runtimeRoleField": "s",
          "runtimeRoleValue": "学生们"
        }
      },
      "consumers": [
        {
          "baselineFile": "content/textbook.json",
          "field": "/lessons/0/scenes/1/lines/1/vn",
          "ownerId": "textbook-l01-text-2-line-02",
          "component": "textbook"
        }
      ],
      "authorReview": {
        "reviewer": "/root/continue_inventory",
        "status": "accepted",
        "evidenceRef": "/workspace/scratch/28b55072841a/project-recovery-20261005/continue-phase4/review/l1-independent-prepare/l1-title-words-dialogue-comparison.json",
        "reason": "网站增加主语Em；教材正文“Chào cô ạ!”。"
      },
      "candidateScope": {
        "mappingId": "l01-independent-13",
        "kind": "book",
        "officialComparableBodyEqualsNewValue": true,
        "confirmedMistranslation": false
      },
      "independentReview": {
        "reviewer": "/root/continue_flow",
        "status": "accepted",
        "evidenceRef": "content/official-vi-revisions/hsk1-l01-core-20261005.review.json"
      }
    },
    {
      "changeId": "hsk1-l01-core-20261005:book:textbook-l01-v001:vn",
      "baselineFile": "content/textbook.json",
      "field": "/lessons/0/vocab/0/vn",
      "ownerId": "textbook-l01-v001",
      "component": "textbook",
      "lesson": 1,
      "expectedEffectiveValue": "không có gì; đáp lại lời cảm ơn",
      "newValue": "đừng khách sáo, không cần khách khí",
      "classification": "official-wording-variant",
      "sourceAnchor": {
        "sourceId": "hsk1-official-vi-l01-pdf019-word-10-gloss",
        "kind": "directOfficial",
        "documentSourceId": "hsk1-official-vietnamese-20261004",
        "pdfSHA256": "99ca3e635bbf99bcbbe003e32a0dbdf7ad0af2300b7380959d647e1028cf2764",
        "pdfPages": [
          19
        ],
        "printedPages": [
          "003"
        ],
        "section": "生词 · Từ mới",
        "zhContext": "不客气",
        "officialViText": "đừng khách sáo, không cần khách khí",
        "printedViText": "đừng khách sáo, không cần khách khí",
        "fragments": [
          {
            "pdfPage": 19,
            "printedPage": "003",
            "lineTexts": [
              "đừng khách sáo,",
              "không cần khách khí"
            ]
          }
        ],
        "evidenceRef": {
          "sourceTranscription": {
            "path": "/workspace/scratch/28b55072841a/project-recovery-20261005/continue-phase4/review/l1-prep/source-evidence/author-input/source-transcription.json",
            "sha256": "b05f99aee6c6b6ea1c345d5c80e351306918f5b72c664e996486d3251721afb6",
            "occurrenceId": "hsk1-official-vi-l01-pdf019-word-10-gloss"
          },
          "acceptedSourceReview": {
            "path": "/workspace/scratch/28b55072841a/project-recovery-20261005/continue-phase4/review/l1-prep/source-evidence/review.json",
            "sha256": "725c10e63653ddf2ef6b0898d22bc7237edda51c5ab7478de8864e6b20b983c1",
            "occurrenceId": "hsk1-official-vi-l01-pdf019-word-10-gloss"
          },
          "independentComparison": {
            "path": "/workspace/scratch/28b55072841a/project-recovery-20261005/continue-phase4/review/l1-independent-prepare/l1-title-words-dialogue-comparison.json",
            "sha256": "e03d0039e5a32299fa001494fe33f0db747e8fe937c7a791725f3c6f22d11c9f",
            "mappingId": "l01-independent-17"
          }
        }
      },
      "consumers": [
        {
          "baselineFile": "content/textbook.json",
          "field": "/lessons/0/vocab/0/vn",
          "ownerId": "textbook-l01-v001",
          "component": "textbook"
        }
      ],
      "authorReview": {
        "reviewer": "/root/continue_inventory",
        "status": "accepted",
        "evidenceRef": "/workspace/scratch/28b55072841a/project-recovery-20261005/continue-phase4/review/l1-independent-prepare/l1-title-words-dialogue-comparison.json",
        "reason": "网站使用回应感谢的同义表达及解释；教材为两项固定词义。"
      },
      "candidateScope": {
        "mappingId": "l01-independent-17",
        "kind": "book",
        "officialComparableBodyEqualsNewValue": true,
        "confirmedMistranslation": false
      },
      "independentReview": {
        "reviewer": "/root/continue_flow",
        "status": "accepted",
        "evidenceRef": "content/official-vi-revisions/hsk1-l01-core-20261005.review.json"
      }
    },
    {
      "changeId": "hsk1-l01-core-20261005:vocabulary-copy:v-l01-lex-bbc044d7ea-s1:vi",
      "baselineFile": "content/stage3-catalog.json",
      "field": "/vocabulary/0/vi",
      "ownerId": "v-l01-lex-bbc044d7ea-s1",
      "component": "vocabulary",
      "lesson": 1,
      "expectedEffectiveValue": "không có gì; đáp lại lời cảm ơn",
      "newValue": "đừng khách sáo, không cần khách khí",
      "classification": "official-wording-variant",
      "sourceAnchor": {
        "sourceId": "hsk1-official-vi-l01-pdf019-word-10-gloss",
        "kind": "directOfficial",
        "documentSourceId": "hsk1-official-vietnamese-20261004",
        "pdfSHA256": "99ca3e635bbf99bcbbe003e32a0dbdf7ad0af2300b7380959d647e1028cf2764",
        "pdfPages": [
          19
        ],
        "printedPages": [
          "003"
        ],
        "section": "生词 · Từ mới",
        "zhContext": "不客气",
        "officialViText": "đừng khách sáo, không cần khách khí",
        "printedViText": "đừng khách sáo, không cần khách khí",
        "fragments": [
          {
            "pdfPage": 19,
            "printedPage": "003",
            "lineTexts": [
              "đừng khách sáo,",
              "không cần khách khí"
            ]
          }
        ],
        "evidenceRef": {
          "sourceTranscription": {
            "path": "/workspace/scratch/28b55072841a/project-recovery-20261005/continue-phase4/review/l1-prep/source-evidence/author-input/source-transcription.json",
            "sha256": "b05f99aee6c6b6ea1c345d5c80e351306918f5b72c664e996486d3251721afb6",
            "occurrenceId": "hsk1-official-vi-l01-pdf019-word-10-gloss"
          },
          "acceptedSourceReview": {
            "path": "/workspace/scratch/28b55072841a/project-recovery-20261005/continue-phase4/review/l1-prep/source-evidence/review.json",
            "sha256": "725c10e63653ddf2ef6b0898d22bc7237edda51c5ab7478de8864e6b20b983c1",
            "occurrenceId": "hsk1-official-vi-l01-pdf019-word-10-gloss"
          },
          "independentComparison": {
            "path": "/workspace/scratch/28b55072841a/project-recovery-20261005/continue-phase4/review/l1-independent-prepare/l1-title-words-dialogue-comparison.json",
            "sha256": "e03d0039e5a32299fa001494fe33f0db747e8fe937c7a791725f3c6f22d11c9f",
            "mappingId": "l01-independent-17"
          }
        }
      },
      "consumers": [
        {
          "baselineFile": "content/stage3-catalog.json",
          "field": "/vocabulary/0/vi",
          "ownerId": "v-l01-lex-bbc044d7ea-s1",
          "component": "vocabulary"
        }
      ],
      "authorReview": {
        "reviewer": "/root/continue_inventory",
        "status": "accepted",
        "evidenceRef": "/workspace/scratch/28b55072841a/project-recovery-20261005/continue-phase4/review/l1-independent-prepare/l1-title-words-dialogue-comparison.json",
        "reason": "网站使用回应感谢的同义表达及解释；教材为两项固定词义。"
      },
      "candidateScope": {
        "mappingId": "l01-independent-17",
        "kind": "vocabulary-copy",
        "officialComparableBodyEqualsNewValue": true,
        "confirmedMistranslation": false
      },
      "independentReview": {
        "reviewer": "/root/continue_flow",
        "status": "accepted",
        "evidenceRef": "content/official-vi-revisions/hsk1-l01-core-20261005.review.json"
      }
    },
    {
      "changeId": "hsk1-l01-core-20261005:book:textbook-l01-v012:vn",
      "baselineFile": "content/textbook.json",
      "field": "/lessons/0/vocab/11/vn",
      "ownerId": "textbook-l01-v012",
      "component": "textbook",
      "lesson": 1,
      "expectedEffectiveValue": "tạm biệt; hẹn gặp lại",
      "newValue": "tạm biệt",
      "classification": "official-wording-variant",
      "sourceAnchor": {
        "sourceId": "hsk1-official-vi-l01-pdf019-word-12-gloss",
        "kind": "directOfficial",
        "documentSourceId": "hsk1-official-vietnamese-20261004",
        "pdfSHA256": "99ca3e635bbf99bcbbe003e32a0dbdf7ad0af2300b7380959d647e1028cf2764",
        "pdfPages": [
          19
        ],
        "printedPages": [
          "003"
        ],
        "section": "生词 · Từ mới",
        "zhContext": "再见",
        "officialViText": "tạm biệt",
        "printedViText": "tạm biệt",
        "fragments": [
          {
            "pdfPage": 19,
            "printedPage": "003",
            "lineTexts": [
              "tạm biệt"
            ]
          }
        ],
        "evidenceRef": {
          "sourceTranscription": {
            "path": "/workspace/scratch/28b55072841a/project-recovery-20261005/continue-phase4/review/l1-prep/source-evidence/author-input/source-transcription.json",
            "sha256": "b05f99aee6c6b6ea1c345d5c80e351306918f5b72c664e996486d3251721afb6",
            "occurrenceId": "hsk1-official-vi-l01-pdf019-word-12-gloss"
          },
          "acceptedSourceReview": {
            "path": "/workspace/scratch/28b55072841a/project-recovery-20261005/continue-phase4/review/l1-prep/source-evidence/review.json",
            "sha256": "725c10e63653ddf2ef6b0898d22bc7237edda51c5ab7478de8864e6b20b983c1",
            "occurrenceId": "hsk1-official-vi-l01-pdf019-word-12-gloss"
          },
          "independentComparison": {
            "path": "/workspace/scratch/28b55072841a/project-recovery-20261005/continue-phase4/review/l1-independent-prepare/l1-title-words-dialogue-comparison.json",
            "sha256": "e03d0039e5a32299fa001494fe33f0db747e8fe937c7a791725f3c6f22d11c9f",
            "mappingId": "l01-independent-19"
          }
        }
      },
      "consumers": [
        {
          "baselineFile": "content/textbook.json",
          "field": "/lessons/0/vocab/11/vn",
          "ownerId": "textbook-l01-v012",
          "component": "textbook"
        }
      ],
      "authorReview": {
        "reviewer": "/root/continue_inventory",
        "status": "accepted",
        "evidenceRef": "/workspace/scratch/28b55072841a/project-recovery-20261005/continue-phase4/review/l1-independent-prepare/l1-title-words-dialogue-comparison.json",
        "reason": "网站增加“hẹn gặp lại”；教材词表仅“tạm biệt”。"
      },
      "candidateScope": {
        "mappingId": "l01-independent-19",
        "kind": "book",
        "officialComparableBodyEqualsNewValue": true,
        "confirmedMistranslation": false
      },
      "independentReview": {
        "reviewer": "/root/continue_flow",
        "status": "accepted",
        "evidenceRef": "content/official-vi-revisions/hsk1-l01-core-20261005.review.json"
      }
    },
    {
      "changeId": "hsk1-l01-core-20261005:vocabulary-copy:v-l01-lex-82202bb725-s1:vi",
      "baselineFile": "content/stage3-catalog.json",
      "field": "/vocabulary/11/vi",
      "ownerId": "v-l01-lex-82202bb725-s1",
      "component": "vocabulary",
      "lesson": 1,
      "expectedEffectiveValue": "tạm biệt; hẹn gặp lại",
      "newValue": "tạm biệt",
      "classification": "official-wording-variant",
      "sourceAnchor": {
        "sourceId": "hsk1-official-vi-l01-pdf019-word-12-gloss",
        "kind": "directOfficial",
        "documentSourceId": "hsk1-official-vietnamese-20261004",
        "pdfSHA256": "99ca3e635bbf99bcbbe003e32a0dbdf7ad0af2300b7380959d647e1028cf2764",
        "pdfPages": [
          19
        ],
        "printedPages": [
          "003"
        ],
        "section": "生词 · Từ mới",
        "zhContext": "再见",
        "officialViText": "tạm biệt",
        "printedViText": "tạm biệt",
        "fragments": [
          {
            "pdfPage": 19,
            "printedPage": "003",
            "lineTexts": [
              "tạm biệt"
            ]
          }
        ],
        "evidenceRef": {
          "sourceTranscription": {
            "path": "/workspace/scratch/28b55072841a/project-recovery-20261005/continue-phase4/review/l1-prep/source-evidence/author-input/source-transcription.json",
            "sha256": "b05f99aee6c6b6ea1c345d5c80e351306918f5b72c664e996486d3251721afb6",
            "occurrenceId": "hsk1-official-vi-l01-pdf019-word-12-gloss"
          },
          "acceptedSourceReview": {
            "path": "/workspace/scratch/28b55072841a/project-recovery-20261005/continue-phase4/review/l1-prep/source-evidence/review.json",
            "sha256": "725c10e63653ddf2ef6b0898d22bc7237edda51c5ab7478de8864e6b20b983c1",
            "occurrenceId": "hsk1-official-vi-l01-pdf019-word-12-gloss"
          },
          "independentComparison": {
            "path": "/workspace/scratch/28b55072841a/project-recovery-20261005/continue-phase4/review/l1-independent-prepare/l1-title-words-dialogue-comparison.json",
            "sha256": "e03d0039e5a32299fa001494fe33f0db747e8fe937c7a791725f3c6f22d11c9f",
            "mappingId": "l01-independent-19"
          }
        }
      },
      "consumers": [
        {
          "baselineFile": "content/stage3-catalog.json",
          "field": "/vocabulary/11/vi",
          "ownerId": "v-l01-lex-82202bb725-s1",
          "component": "vocabulary"
        }
      ],
      "authorReview": {
        "reviewer": "/root/continue_inventory",
        "status": "accepted",
        "evidenceRef": "/workspace/scratch/28b55072841a/project-recovery-20261005/continue-phase4/review/l1-independent-prepare/l1-title-words-dialogue-comparison.json",
        "reason": "网站增加“hẹn gặp lại”；教材词表仅“tạm biệt”。"
      },
      "candidateScope": {
        "mappingId": "l01-independent-19",
        "kind": "vocabulary-copy",
        "officialComparableBodyEqualsNewValue": true,
        "confirmedMistranslation": false
      },
      "independentReview": {
        "reviewer": "/root/continue_flow",
        "status": "accepted",
        "evidenceRef": "content/official-vi-revisions/hsk1-l01-core-20261005.review.json"
      }
    },
    {
      "changeId": "hsk1-l01-core-20261005:book:textbook-l01-text-3-line-01:vn",
      "baselineFile": "content/textbook.json",
      "field": "/lessons/0/scenes/2/lines/0/vn",
      "ownerId": "textbook-l01-text-3-line-01",
      "component": "textbook",
      "lesson": 1,
      "expectedEffectiveValue": "Cảm ơn!",
      "newValue": "Cảm ơn bạn!",
      "classification": "official-wording-variant",
      "sourceAnchor": {
        "sourceId": "hsk1-official-vi-l01-pdf019-text-3-line-01",
        "kind": "directOfficial",
        "documentSourceId": "hsk1-official-vietnamese-20261004",
        "pdfSHA256": "99ca3e635bbf99bcbbe003e32a0dbdf7ad0af2300b7380959d647e1028cf2764",
        "pdfPages": [
          19
        ],
        "printedPages": [
          "003"
        ],
        "section": "课文译文 · textbook-l01-text-3",
        "zhContext": "谢谢！",
        "officialViText": "Cảm ơn bạn!",
        "printedViText": "Học sinh: Cảm ơn bạn!",
        "fragments": [
          {
            "pdfPage": 19,
            "printedPage": "003",
            "lineTexts": [
              "Học sinh: Cảm ơn bạn!"
            ]
          }
        ],
        "evidenceRef": {
          "sourceTranscription": {
            "path": "/workspace/scratch/28b55072841a/project-recovery-20261005/continue-phase4/review/l1-prep/source-evidence/author-input/source-transcription.json",
            "sha256": "b05f99aee6c6b6ea1c345d5c80e351306918f5b72c664e996486d3251721afb6",
            "occurrenceId": "hsk1-official-vi-l01-pdf019-text-3-line-01"
          },
          "acceptedSourceReview": {
            "path": "/workspace/scratch/28b55072841a/project-recovery-20261005/continue-phase4/review/l1-prep/source-evidence/review.json",
            "sha256": "725c10e63653ddf2ef6b0898d22bc7237edda51c5ab7478de8864e6b20b983c1",
            "occurrenceId": "hsk1-official-vi-l01-pdf019-text-3-line-01"
          },
          "independentComparison": {
            "path": "/workspace/scratch/28b55072841a/project-recovery-20261005/continue-phase4/review/l1-independent-prepare/l1-title-words-dialogue-comparison.json",
            "sha256": "e03d0039e5a32299fa001494fe33f0db747e8fe937c7a791725f3c6f22d11c9f",
            "mappingId": "l01-independent-20"
          }
        },
        "printedSpeakerVi": "Học sinh",
        "speakerZh": "学生们",
        "bodyDerivation": {
          "operation": "remove-exact-printed-speaker-prefix",
          "prefix": "Học sinh: ",
          "body": "Cảm ơn bạn!",
          "preservesPrintedRoleEvidence": true,
          "runtimeRoleField": "s",
          "runtimeRoleValue": "学生们"
        }
      },
      "consumers": [
        {
          "baselineFile": "content/textbook.json",
          "field": "/lessons/0/scenes/2/lines/0/vn",
          "ownerId": "textbook-l01-text-3-line-01",
          "component": "textbook"
        }
      ],
      "authorReview": {
        "reviewer": "/root/continue_inventory",
        "status": "accepted",
        "evidenceRef": "/workspace/scratch/28b55072841a/project-recovery-20261005/continue-phase4/review/l1-independent-prepare/l1-title-words-dialogue-comparison.json",
        "reason": "网站未保留教材正文中的称呼bạn。"
      },
      "candidateScope": {
        "mappingId": "l01-independent-20",
        "kind": "book",
        "officialComparableBodyEqualsNewValue": true,
        "confirmedMistranslation": false
      },
      "independentReview": {
        "reviewer": "/root/continue_flow",
        "status": "accepted",
        "evidenceRef": "content/official-vi-revisions/hsk1-l01-core-20261005.review.json"
      }
    },
    {
      "changeId": "hsk1-l01-core-20261005:book:textbook-l01-text-3-line-02:vn",
      "baselineFile": "content/textbook.json",
      "field": "/lessons/0/scenes/2/lines/1/vn",
      "ownerId": "textbook-l01-text-3-line-02",
      "component": "textbook",
      "lesson": 1,
      "expectedEffectiveValue": "Không có gì!",
      "newValue": "Đừng khách sáo!",
      "classification": "official-wording-variant",
      "sourceAnchor": {
        "sourceId": "hsk1-official-vi-l01-pdf019-text-3-line-02",
        "kind": "directOfficial",
        "documentSourceId": "hsk1-official-vietnamese-20261004",
        "pdfSHA256": "99ca3e635bbf99bcbbe003e32a0dbdf7ad0af2300b7380959d647e1028cf2764",
        "pdfPages": [
          19
        ],
        "printedPages": [
          "003"
        ],
        "section": "课文译文 · textbook-l01-text-3",
        "zhContext": "不客气！",
        "officialViText": "Đừng khách sáo!",
        "printedViText": "Tiểu Ngữ: Đừng khách sáo!",
        "fragments": [
          {
            "pdfPage": 19,
            "printedPage": "003",
            "lineTexts": [
              "Tiểu Ngữ: Đừng khách sáo!"
            ]
          }
        ],
        "evidenceRef": {
          "sourceTranscription": {
            "path": "/workspace/scratch/28b55072841a/project-recovery-20261005/continue-phase4/review/l1-prep/source-evidence/author-input/source-transcription.json",
            "sha256": "b05f99aee6c6b6ea1c345d5c80e351306918f5b72c664e996486d3251721afb6",
            "occurrenceId": "hsk1-official-vi-l01-pdf019-text-3-line-02"
          },
          "acceptedSourceReview": {
            "path": "/workspace/scratch/28b55072841a/project-recovery-20261005/continue-phase4/review/l1-prep/source-evidence/review.json",
            "sha256": "725c10e63653ddf2ef6b0898d22bc7237edda51c5ab7478de8864e6b20b983c1",
            "occurrenceId": "hsk1-official-vi-l01-pdf019-text-3-line-02"
          },
          "independentComparison": {
            "path": "/workspace/scratch/28b55072841a/project-recovery-20261005/continue-phase4/review/l1-independent-prepare/l1-title-words-dialogue-comparison.json",
            "sha256": "e03d0039e5a32299fa001494fe33f0db747e8fe937c7a791725f3c6f22d11c9f",
            "mappingId": "l01-independent-21"
          }
        },
        "printedSpeakerVi": "Tiểu Ngữ",
        "speakerZh": "小语",
        "bodyDerivation": {
          "operation": "remove-exact-printed-speaker-prefix",
          "prefix": "Tiểu Ngữ: ",
          "body": "Đừng khách sáo!",
          "preservesPrintedRoleEvidence": true,
          "runtimeRoleField": "s",
          "runtimeRoleValue": "小语"
        }
      },
      "consumers": [
        {
          "baselineFile": "content/textbook.json",
          "field": "/lessons/0/scenes/2/lines/1/vn",
          "ownerId": "textbook-l01-text-3-line-02",
          "component": "textbook"
        }
      ],
      "authorReview": {
        "reviewer": "/root/continue_inventory",
        "status": "accepted",
        "evidenceRef": "/workspace/scratch/28b55072841a/project-recovery-20261005/continue-phase4/review/l1-independent-prepare/l1-title-words-dialogue-comparison.json",
        "reason": "网站使用“Không có gì!”；教材正文“Đừng khách sáo!”。"
      },
      "candidateScope": {
        "mappingId": "l01-independent-21",
        "kind": "book",
        "officialComparableBodyEqualsNewValue": true,
        "confirmedMistranslation": false
      },
      "independentReview": {
        "reviewer": "/root/continue_flow",
        "status": "accepted",
        "evidenceRef": "content/official-vi-revisions/hsk1-l01-core-20261005.review.json"
      }
    },
    {
      "changeId": "hsk1-l01-core-20261005:book:textbook-l01-text-3-line-03:vn",
      "baselineFile": "content/textbook.json",
      "field": "/lessons/0/scenes/2/lines/2/vn",
      "ownerId": "textbook-l01-text-3-line-03",
      "component": "textbook",
      "lesson": 1,
      "expectedEffectiveValue": "Các em, hẹn gặp lại!",
      "newValue": "Tạm biệt các em!",
      "classification": "official-wording-variant",
      "sourceAnchor": {
        "sourceId": "hsk1-official-vi-l01-pdf019-text-3-line-03",
        "kind": "directOfficial",
        "documentSourceId": "hsk1-official-vietnamese-20261004",
        "pdfSHA256": "99ca3e635bbf99bcbbe003e32a0dbdf7ad0af2300b7380959d647e1028cf2764",
        "pdfPages": [
          19
        ],
        "printedPages": [
          "003"
        ],
        "section": "课文译文 · textbook-l01-text-3",
        "zhContext": "同学们，再见！",
        "officialViText": "Tạm biệt các em!",
        "printedViText": "Vương Nhất Phi: Tạm biệt các em!",
        "fragments": [
          {
            "pdfPage": 19,
            "printedPage": "003",
            "lineTexts": [
              "Vương Nhất Phi: Tạm biệt các em!"
            ]
          }
        ],
        "evidenceRef": {
          "sourceTranscription": {
            "path": "/workspace/scratch/28b55072841a/project-recovery-20261005/continue-phase4/review/l1-prep/source-evidence/author-input/source-transcription.json",
            "sha256": "b05f99aee6c6b6ea1c345d5c80e351306918f5b72c664e996486d3251721afb6",
            "occurrenceId": "hsk1-official-vi-l01-pdf019-text-3-line-03"
          },
          "acceptedSourceReview": {
            "path": "/workspace/scratch/28b55072841a/project-recovery-20261005/continue-phase4/review/l1-prep/source-evidence/review.json",
            "sha256": "725c10e63653ddf2ef6b0898d22bc7237edda51c5ab7478de8864e6b20b983c1",
            "occurrenceId": "hsk1-official-vi-l01-pdf019-text-3-line-03"
          },
          "independentComparison": {
            "path": "/workspace/scratch/28b55072841a/project-recovery-20261005/continue-phase4/review/l1-independent-prepare/l1-title-words-dialogue-comparison.json",
            "sha256": "e03d0039e5a32299fa001494fe33f0db747e8fe937c7a791725f3c6f22d11c9f",
            "mappingId": "l01-independent-22"
          }
        },
        "printedSpeakerVi": "Vương Nhất Phi",
        "speakerZh": "王一飞",
        "bodyDerivation": {
          "operation": "remove-exact-printed-speaker-prefix",
          "prefix": "Vương Nhất Phi: ",
          "body": "Tạm biệt các em!",
          "preservesPrintedRoleEvidence": true,
          "runtimeRoleField": "s",
          "runtimeRoleValue": "王一飞"
        }
      },
      "consumers": [
        {
          "baselineFile": "content/textbook.json",
          "field": "/lessons/0/scenes/2/lines/2/vn",
          "ownerId": "textbook-l01-text-3-line-03",
          "component": "textbook"
        }
      ],
      "authorReview": {
        "reviewer": "/root/continue_inventory",
        "status": "accepted",
        "evidenceRef": "/workspace/scratch/28b55072841a/project-recovery-20261005/continue-phase4/review/l1-independent-prepare/l1-title-words-dialogue-comparison.json",
        "reason": "网站使用hẹn gặp lại且改变语序；教材正文“Tạm biệt các em!”。"
      },
      "candidateScope": {
        "mappingId": "l01-independent-22",
        "kind": "book",
        "officialComparableBodyEqualsNewValue": true,
        "confirmedMistranslation": false
      },
      "independentReview": {
        "reviewer": "/root/continue_flow",
        "status": "accepted",
        "evidenceRef": "content/official-vi-revisions/hsk1-l01-core-20261005.review.json"
      }
    }
  ],
  "coverage": {
    "status": "partial-core-candidate-not-whole-lesson-adoption",
    "lesson": 1,
    "canonicalSourceOccurrencesMapped": 23,
    "canonicalTextbookChanges": 15,
    "canonicalExactMatchesUnchanged": 8,
    "additionalExactLinkedVocabularyCopyChanges": 9,
    "changedRegisteredFields": 24,
    "scopedRegisteredFields": 32,
    "allL1RegisteredFields": 474,
    "canonicalTextbookRegisteredFields": 44,
    "canonicalTextbookFieldsNotYetIncluded": 21,
    "otherRegisteredFieldsOutsideThisCandidate": 442,
    "wholeLessonComplete": false,
    "wholeLessonsAdopted": 0,
    "officialDefaultRegistryActive": false,
    "officialSourcePDFPages": [
      17,
      18,
      19
    ],
    "officialPrintedPages": [
      "001",
      "002",
      "003"
    ],
    "legacyChineseSidecarPageOffsetsUsed": false,
    "unmodifiedCoreMatches": [
      {
        "mappingId": "l01-independent-01",
        "sourceOccurrenceId": "hsk1-official-vi-l01-pdf017-title",
        "category": "lesson-title",
        "registeredRef": {
          "baselineFile": "content/textbook.json",
          "field": "/lessons/0/vn_title",
          "ownerId": "textbook-l01-title",
          "component": "textbook"
        },
        "expectedEffectiveValue": "Xin chào AI Tiểu Ngữ!",
        "officialComparableValue": "Xin chào AI Tiểu Ngữ!",
        "exactMatch": true,
        "changeProposed": false
      },
      {
        "mappingId": "l01-independent-05",
        "sourceOccurrenceId": "hsk1-official-vi-l01-pdf018-word-02-gloss",
        "category": "word-gloss",
        "registeredRef": {
          "baselineFile": "content/textbook.json",
          "field": "/lessons/0/vocab/1/vn",
          "ownerId": "textbook-l01-v002",
          "component": "textbook"
        },
        "expectedEffectiveValue": "mọi người",
        "officialComparableValue": "mọi người",
        "exactMatch": true,
        "changeProposed": false
      },
      {
        "mappingId": "l01-independent-12",
        "sourceOccurrenceId": "hsk1-official-vi-l01-pdf018-text-2-line-01",
        "category": "dialogue-translation",
        "registeredRef": {
          "baselineFile": "content/textbook.json",
          "field": "/lessons/0/scenes/1/lines/0/vn",
          "ownerId": "textbook-l01-text-2-line-01",
          "component": "textbook"
        },
        "expectedEffectiveValue": "Chào cả lớp!",
        "officialComparableValue": "Chào cả lớp!",
        "exactMatch": true,
        "changeProposed": false
      },
      {
        "mappingId": "l01-independent-14",
        "sourceOccurrenceId": "hsk1-official-vi-l01-pdf018-text-2-line-03",
        "category": "dialogue-translation",
        "registeredRef": {
          "baselineFile": "content/textbook.json",
          "field": "/lessons/0/scenes/1/lines/2/vn",
          "ownerId": "textbook-l01-text-2-line-03",
          "component": "textbook"
        },
        "expectedEffectiveValue": "Chào các bạn!",
        "officialComparableValue": "Chào các bạn!",
        "exactMatch": true,
        "changeProposed": false
      },
      {
        "mappingId": "l01-independent-15",
        "sourceOccurrenceId": "hsk1-official-vi-l01-pdf018-text-2-line-04",
        "category": "dialogue-translation",
        "registeredRef": {
          "baselineFile": "content/textbook.json",
          "field": "/lessons/0/scenes/1/lines/3/vn",
          "ownerId": "textbook-l01-text-2-line-04",
          "component": "textbook"
        },
        "expectedEffectiveValue": "Chào Tiểu Ngữ!",
        "officialComparableValue": "Chào Tiểu Ngữ!",
        "exactMatch": true,
        "changeProposed": false
      },
      {
        "mappingId": "l01-independent-16",
        "sourceOccurrenceId": "hsk1-official-vi-l01-pdf019-word-09-gloss",
        "category": "word-gloss",
        "registeredRef": {
          "baselineFile": "content/textbook.json",
          "field": "/lessons/0/vocab/9/vn",
          "ownerId": "textbook-l01-v010",
          "component": "textbook"
        },
        "expectedEffectiveValue": "cảm ơn",
        "officialComparableValue": "cảm ơn",
        "exactMatch": true,
        "changeProposed": false
      },
      {
        "mappingId": "l01-independent-18",
        "sourceOccurrenceId": "hsk1-official-vi-l01-pdf019-word-11-gloss",
        "category": "word-gloss",
        "registeredRef": {
          "baselineFile": "content/textbook.json",
          "field": "/lessons/0/vocab/8/vn",
          "ownerId": "textbook-l01-v009",
          "component": "textbook"
        },
        "expectedEffectiveValue": "bạn học",
        "officialComparableValue": "bạn học",
        "exactMatch": true,
        "changeProposed": false
      },
      {
        "mappingId": "l01-independent-23",
        "sourceOccurrenceId": "hsk1-official-vi-l01-pdf019-text-3-line-04",
        "category": "dialogue-translation",
        "registeredRef": {
          "baselineFile": "content/textbook.json",
          "field": "/lessons/0/scenes/2/lines/3/vn",
          "ownerId": "textbook-l01-text-3-line-04",
          "component": "textbook"
        },
        "expectedEffectiveValue": "Tạm biệt cô ạ!",
        "officialComparableValue": "Tạm biệt cô ạ!",
        "exactMatch": true,
        "changeProposed": false
      }
    ],
    "excluded": "Proper name, POS, scene labels, tips, phonetics, other homework/listening/source activities/figures/numbers/bonus fields and all other lessons; full L1 coverage must be independently accepted before default activation."
  },
  "independentReview": {
    "reviewer": "/root/continue_flow",
    "status": "accepted",
    "proposalSHA256": "488057fc83d6161a0bebc187d21250ccd275c144202ac52cb05ccf7f513ee182",
    "evidenceSHA256": "5cd8a3d67961d0b960e0ac69dbb97ff6a355ca62890a64e658a7198e72d29fd8",
    "evidenceFile": "content/official-vi-revisions/hsk1-l01-core-20261005.review.json",
    "acceptedChangeIds": [
      "hsk1-l01-core-20261005:book:textbook-l01-v006:vn",
      "hsk1-l01-core-20261005:vocabulary-copy:v-l01-lex-440ee0853a-s1:vi",
      "hsk1-l01-core-20261005:book:textbook-l01-text-1-line-01:vn",
      "hsk1-l01-core-20261005:book:textbook-l01-text-1-line-02:vn",
      "hsk1-l01-core-20261005:book:textbook-l01-v003:vn",
      "hsk1-l01-core-20261005:vocabulary-copy:v-l01-lex-27e4fe4c3f-s1:vi",
      "hsk1-l01-core-20261005:book:textbook-l01-v011:vn",
      "hsk1-l01-core-20261005:vocabulary-copy:v-l01-lex-b76783d38c-s1:vi",
      "hsk1-l01-core-20261005:book:textbook-l01-v005:vn",
      "hsk1-l01-core-20261005:vocabulary-copy:v-l01-lex-91c76e0b5a-s1:vi",
      "hsk1-l01-core-20261005:book:textbook-l01-v004:vn",
      "hsk1-l01-core-20261005:vocabulary-copy:v-l01-lex-494f23d624-s1:vi",
      "hsk1-l01-core-20261005:book:textbook-l01-v008:vn",
      "hsk1-l01-core-20261005:vocabulary-copy:v-l01-lex-7a424449a3-s1:vi",
      "hsk1-l01-core-20261005:book:textbook-l01-v007:vn",
      "hsk1-l01-core-20261005:vocabulary-copy:v-l01-lex-2fda3d6ec6-s1:vi",
      "hsk1-l01-core-20261005:book:textbook-l01-text-2-line-02:vn",
      "hsk1-l01-core-20261005:book:textbook-l01-v001:vn",
      "hsk1-l01-core-20261005:vocabulary-copy:v-l01-lex-bbc044d7ea-s1:vi",
      "hsk1-l01-core-20261005:book:textbook-l01-v012:vn",
      "hsk1-l01-core-20261005:vocabulary-copy:v-l01-lex-82202bb725-s1:vi",
      "hsk1-l01-core-20261005:book:textbook-l01-text-3-line-01:vn",
      "hsk1-l01-core-20261005:book:textbook-l01-text-3-line-02:vn",
      "hsk1-l01-core-20261005:book:textbook-l01-text-3-line-03:vn"
    ]
  }
}
`;export{e as default};