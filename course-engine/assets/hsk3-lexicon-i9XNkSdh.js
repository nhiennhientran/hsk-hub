var e=`{
  "schemaVersion": 1,
  "courseId": "hsk3-fltrp-2026",
  "version": "2026.1",
  "reviewStatus": {
    "independent": true,
    "reviewer": "independent canonical-identity reviewer (2026-10-02)",
    "notes": [
      "Checked every one of 523 lesson-local source bindings against current reviewed lesson JSON, including identity, pronunciation, Vietnamese, POS, text, original audio group, and exact PDF/printed page provenance.",
      "Independently inspected original word-list pixels for all 36 same-form groups. Page-specific reasons record the printed POS, pronunciation or semantic distinction; see docs/content-audit/canonical-lexicon-independent.md.",
      "No legitimate repeated-sense merges exist within this edition under the printed POS/sense contract. All source IDs and stable canonical sense IDs are retained; translation strings alone never decide identity.",
      "Counts are source-backed POS/sense cards and Chinese forms, not the books' advertised 200/500 syllabus targets. AI source/identity review is not native-speaker or full human-listening certification."
    ]
  },
  "counts": {
    "sourceRecords": 523,
    "senses": 523,
    "chineseForms": 487,
    "verifiedMerges": 0
  },
  "merges": [],
  "sameFormDecisions": [
    {
      "zh": "好像",
      "senseIds": [
        "hsk3-fltrp-2026:sense:l01-word12",
        "hsk3-fltrp-2026:sense:l16-word06"
      ],
      "action": "keep-distinct",
      "reason": "PDF16/printed4 prints hǎoxiàng, adv., seemingly; PDF158/printed146 prints hǎoxiàng, v., seem/be like. The earlier tentative adverb and later resemblance predicate are explicitly POS-distinct, even where Vietnamese glosses overlap.",
      "reviewed": true
    },
    {
      "zh": "客气",
      "senseIds": [
        "hsk3-fltrp-2026:sense:l02-word05",
        "hsk3-fltrp-2026:sense:l02-word06"
      ],
      "action": "keep-distinct",
      "reason": "PDF23/printed11 explicitly prints v./adj.: be polite versus polite. Preserve action/state-of-behaving and adjectival description separately.",
      "reviewed": true
    },
    {
      "zh": "张",
      "senseIds": [
        "hsk3-fltrp-2026:sense:l02-word21",
        "hsk3-fltrp-2026:sense:l16-word20"
      ],
      "action": "keep-distinct",
      "reason": "PDF27/printed15 prints zhāng, m., for paper/pictures; PDF161/printed149 prints zhāng, v., open (the mouth). Counter and opening verb are distinct.",
      "reviewed": true
    },
    {
      "zh": "外卖",
      "senseIds": [
        "hsk3-fltrp-2026:sense:l02-word24",
        "hsk3-fltrp-2026:sense:l02-word25"
      ],
      "action": "keep-distinct",
      "reason": "PDF27/printed15 explicitly prints n./v.: takeout versus offer a takeout service. Food/service noun and selling action have different POS.",
      "reviewed": true
    },
    {
      "zh": "需要",
      "senseIds": [
        "hsk3-fltrp-2026:sense:l03-word26",
        "hsk3-fltrp-2026:sense:l03-word27"
      ],
      "action": "keep-distinct",
      "reason": "PDF37/printed25 explicitly prints v./n. with the shared English gloss need. Keep verbal need and nominal need/demand separate; a shared gloss does not merge printed POS.",
      "reviewed": true
    },
    {
      "zh": "特别",
      "senseIds": [
        "hsk3-fltrp-2026:sense:l04-word13",
        "hsk3-fltrp-2026:sense:l04-word14"
      ],
      "action": "keep-distinct",
      "reason": "PDF44/printed32 explicitly prints adj./adv.: special versus especially. Property adjective and degree/focus adverb remain separate.",
      "reviewed": true
    },
    {
      "zh": "比较",
      "senseIds": [
        "hsk3-fltrp-2026:sense:l05-word13",
        "hsk3-fltrp-2026:sense:l05-word14"
      ],
      "action": "keep-distinct",
      "reason": "PDF53/printed41 explicitly prints v./adv.: compare versus relatively. Comparison action and degree adverb are distinct.",
      "reviewed": true
    },
    {
      "zh": "打算",
      "senseIds": [
        "hsk3-fltrp-2026:sense:l06-word02",
        "hsk3-fltrp-2026:sense:l06-word03"
      ],
      "action": "keep-distinct",
      "reason": "PDF60/printed48 explicitly prints v./n.: plan versus intention. Planning action and intended plan remain separate.",
      "reviewed": true
    },
    {
      "zh": "行",
      "senseIds": [
        "hsk3-fltrp-2026:sense:l06-word05",
        "hsk3-fltrp-2026:sense:l06-word06"
      ],
      "action": "keep-distinct",
      "reason": "PDF60/printed48 explicitly prints v./adj.: be all right versus capable. Acceptance/feasibility predicate and capability adjective are distinct.",
      "reviewed": true
    },
    {
      "zh": "小心",
      "senseIds": [
        "hsk3-fltrp-2026:sense:l06-word08",
        "hsk3-fltrp-2026:sense:l06-word09"
      ],
      "action": "keep-distinct",
      "reason": "PDF62/printed50 explicitly prints v./adj.: take care versus careful. Caution as an action and as an adjectival quality remain separate.",
      "reviewed": true
    },
    {
      "zh": "急",
      "senseIds": [
        "hsk3-fltrp-2026:sense:l06-word13",
        "hsk3-fltrp-2026:sense:l06-word14"
      ],
      "action": "keep-distinct",
      "reason": "PDF62/printed50 explicitly prints adj./v.: urgent versus be anxious. Urgency adjective and anxiety verb differ.",
      "reviewed": true
    },
    {
      "zh": "决定",
      "senseIds": [
        "hsk3-fltrp-2026:sense:l07-word12",
        "hsk3-fltrp-2026:sense:l07-word13"
      ],
      "action": "keep-distinct",
      "reason": "PDF72/printed60 explicitly prints v./n.: decide versus decision. Both Vietnamese fields say quyết định, but identical translation text does not justify merging the printed verbal and nominal uses.",
      "reviewed": true
    },
    {
      "zh": "冰",
      "senseIds": [
        "hsk3-fltrp-2026:sense:l07-word18",
        "hsk3-fltrp-2026:sense:l07-word19"
      ],
      "action": "keep-distinct",
      "reason": "PDF74/printed62 explicitly prints v./n.: freeze versus ice. Chilling action and frozen-water substance have different POS.",
      "reviewed": true
    },
    {
      "zh": "声",
      "senseIds": [
        "hsk3-fltrp-2026:sense:l07-word28",
        "hsk3-fltrp-2026:sense:l07-word29"
      ],
      "action": "keep-distinct",
      "reason": "PDF75/printed63 explicitly prints m./n.: a unit used for sounds versus sound. Sound counter and sound noun remain separate.",
      "reviewed": true
    },
    {
      "zh": "习惯",
      "senseIds": [
        "hsk3-fltrp-2026:sense:l08-word04",
        "hsk3-fltrp-2026:sense:l08-word05"
      ],
      "action": "keep-distinct",
      "reason": "PDF80/printed68 explicitly prints n./v.: habit versus be used to. Habit noun and habituation verb differ.",
      "reviewed": true
    },
    {
      "zh": "感冒",
      "senseIds": [
        "hsk3-fltrp-2026:sense:l08-word11",
        "hsk3-fltrp-2026:sense:l08-word12"
      ],
      "action": "keep-distinct",
      "reason": "PDF82/printed70 explicitly prints v./n.: catch a cold versus cold. Being ill and the illness noun remain separate.",
      "reviewed": true
    },
    {
      "zh": "差不多",
      "senseIds": [
        "hsk3-fltrp-2026:sense:l08-word22",
        "hsk3-fltrp-2026:sense:l08-word23"
      ],
      "action": "keep-distinct",
      "reason": "PDF83/printed71 explicitly prints adv./adj.: almost versus similar. Approximation adverb and similarity adjective differ.",
      "reviewed": true
    },
    {
      "zh": "比赛",
      "senseIds": [
        "hsk3-fltrp-2026:sense:l09-word10",
        "hsk3-fltrp-2026:sense:l09-word11"
      ],
      "action": "keep-distinct",
      "reason": "PDF89/printed77 explicitly prints n./v.: match versus have a match. Event noun and competing verb remain separate.",
      "reviewed": true
    },
    {
      "zh": "练习",
      "senseIds": [
        "hsk3-fltrp-2026:sense:l09-word12",
        "hsk3-fltrp-2026:sense:l09-word13"
      ],
      "action": "keep-distinct",
      "reason": "PDF89/printed77 explicitly prints v./n.: practice versus exercise. Practising action and practice exercise noun remain separate.",
      "reviewed": true
    },
    {
      "zh": "只是",
      "senseIds": [
        "hsk3-fltrp-2026:sense:l09-word16",
        "hsk3-fltrp-2026:sense:l09-word17"
      ],
      "action": "keep-distinct",
      "reason": "PDF91/printed79 explicitly prints adv./conj. Restrictive only and adversative only/but uses remain separate despite overlapping English wording.",
      "reviewed": true
    },
    {
      "zh": "影响",
      "senseIds": [
        "hsk3-fltrp-2026:sense:l09-word23",
        "hsk3-fltrp-2026:sense:l09-word24"
      ],
      "action": "keep-distinct",
      "reason": "PDF93/printed81 explicitly prints n./v.: effect versus affect. Effect noun and influencing verb differ.",
      "reviewed": true
    },
    {
      "zh": "得分",
      "senseIds": [
        "hsk3-fltrp-2026:sense:l09-word25",
        "hsk3-fltrp-2026:sense:l09-word26"
      ],
      "action": "keep-distinct",
      "reason": "PDF93/printed81 explicitly prints v./n. with the shared English gloss score (points). Scoring action and points scored remain POS-distinct.",
      "reviewed": true
    },
    {
      "zh": "清楚",
      "senseIds": [
        "hsk3-fltrp-2026:sense:l10-word04",
        "hsk3-fltrp-2026:sense:l10-word05"
      ],
      "action": "keep-distinct",
      "reason": "PDF99/printed87 explicitly prints adj./v.: clear versus know. Clarity adjective and knowing/understanding verb differ.",
      "reviewed": true
    },
    {
      "zh": "把",
      "senseIds": [
        "hsk3-fltrp-2026:sense:l10-word07",
        "hsk3-fltrp-2026:sense:l12-word13"
      ],
      "action": "keep-distinct",
      "reason": "PDF99/printed87 prints bǎ, prep., fronting an object in the disposal construction; PDF119/printed107 prints bǎ, m., for handled or splayed-legged objects. Grammatical marker and object counter are distinct.",
      "reviewed": true
    },
    {
      "zh": "要求",
      "senseIds": [
        "hsk3-fltrp-2026:sense:l10-word13",
        "hsk3-fltrp-2026:sense:l10-word14"
      ],
      "action": "keep-distinct",
      "reason": "PDF101/printed89 explicitly prints n./v.: requirement versus require. Requirement noun and requiring action differ.",
      "reviewed": true
    },
    {
      "zh": "差",
      "senseIds": [
        "hsk3-fltrp-2026:sense:l10-word15",
        "hsk3-fltrp-2026:sense:l10-word16"
      ],
      "action": "keep-distinct",
      "reason": "PDF101/printed89 explicitly prints adj./v.: poor versus be short of. Poor-quality adjective and lacking verb differ.",
      "reviewed": true
    },
    {
      "zh": "明白",
      "senseIds": [
        "hsk3-fltrp-2026:sense:l10-word24",
        "hsk3-fltrp-2026:sense:l10-word25"
      ],
      "action": "keep-distinct",
      "reason": "PDF103/printed91 explicitly prints v./adj.: understand versus clear. Understanding verb and clarity adjective remain separate.",
      "reviewed": true
    },
    {
      "zh": "努力",
      "senseIds": [
        "hsk3-fltrp-2026:sense:l10-word32",
        "hsk3-fltrp-2026:sense:l10-word33"
      ],
      "action": "keep-distinct",
      "reason": "PDF104/printed92 explicitly prints adj./v.: hard-working versus make an effort. Effortful quality and deliberate effort action remain separate.",
      "reviewed": true
    },
    {
      "zh": "生活",
      "senseIds": [
        "hsk3-fltrp-2026:sense:l11-word26",
        "hsk3-fltrp-2026:sense:l11-word27"
      ],
      "action": "keep-distinct",
      "reason": "PDF113/printed101 explicitly prints n./v.: life versus live. Life noun and living verb differ.",
      "reviewed": true
    },
    {
      "zh": "变化",
      "senseIds": [
        "hsk3-fltrp-2026:sense:l12-word17",
        "hsk3-fltrp-2026:sense:l12-word18"
      ],
      "action": "keep-distinct",
      "reason": "PDF119/printed107 explicitly prints v./n.: change versus variation. Changing action and change/variation noun remain separate.",
      "reviewed": true
    },
    {
      "zh": "节",
      "senseIds": [
        "hsk3-fltrp-2026:sense:l14-word03",
        "hsk3-fltrp-2026:sense:l18-word03"
      ],
      "action": "keep-distinct",
      "reason": "PDF137/printed125 prints jié, m., for class periods/lesson sections; PDF176/printed164 prints jié, n., festival. Lesson counter and festival noun differ.",
      "reviewed": true
    },
    {
      "zh": "一块儿",
      "senseIds": [
        "hsk3-fltrp-2026:sense:l14-word25",
        "hsk3-fltrp-2026:sense:l14-word26"
      ],
      "action": "keep-distinct",
      "reason": "PDF142/printed130 explicitly prints adv./n.: together versus the same place. Joint-action adverb and shared-location noun remain separate.",
      "reviewed": true
    },
    {
      "zh": "根据",
      "senseIds": [
        "hsk3-fltrp-2026:sense:l15-word09",
        "hsk3-fltrp-2026:sense:l15-word10"
      ],
      "action": "keep-distinct",
      "reason": "PDF146/printed134 explicitly prints prep./v.: according to versus depend on. Basis-marking preposition and reliance verb differ.",
      "reviewed": true
    },
    {
      "zh": "经过",
      "senseIds": [
        "hsk3-fltrp-2026:sense:l15-word25",
        "hsk3-fltrp-2026:sense:l15-word26"
      ],
      "action": "keep-distinct",
      "reason": "PDF151/printed139 explicitly prints v./n.: pass by versus process. Passing action and course-of-events noun remain separate.",
      "reviewed": true
    },
    {
      "zh": "有关",
      "senseIds": [
        "hsk3-fltrp-2026:sense:l17-word14",
        "hsk3-fltrp-2026:sense:l17-word15"
      ],
      "action": "keep-distinct",
      "reason": "PDF169/printed157 explicitly prints v./prep.: have something to do with versus about. Relational predicate and topic preposition differ.",
      "reviewed": true
    },
    {
      "zh": "大概",
      "senseIds": [
        "hsk3-fltrp-2026:sense:l18-word06",
        "hsk3-fltrp-2026:sense:l18-word07"
      ],
      "action": "keep-distinct",
      "reason": "PDF176/printed164 explicitly prints adv./adj.: probably versus rough. Probability/approximation adverb and rough-outline adjective differ.",
      "reviewed": true
    }
  ],
  "senses": [
    {
      "id": "hsk3-fltrp-2026:sense:l01-word01",
      "zh": "以为",
      "py": "yǐwéi",
      "vi": "tưởng, cho rằng (thường khác với thực tế)",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l01:word01",
          "lessonId": "hsk3-fltrp-2026:l01",
          "lesson": 1,
          "sourceText": 1,
          "audioTrack": "1-2",
          "source": {
            "pdfPage": 14,
            "printedPage": 2,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l01-word02",
      "zh": "像",
      "py": "xiàng",
      "vi": "giống",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l01:word02",
          "lessonId": "hsk3-fltrp-2026:l01",
          "lesson": 1,
          "sourceText": 1,
          "audioTrack": "1-2",
          "source": {
            "pdfPage": 14,
            "printedPage": 2,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l01-word03",
      "zh": "长",
      "py": "zhǎng",
      "vi": "lớn lên; có diện mạo",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l01:word03",
          "lessonId": "hsk3-fltrp-2026:l01",
          "lesson": 1,
          "sourceText": 1,
          "audioTrack": "1-2",
          "source": {
            "pdfPage": 14,
            "printedPage": 2,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l01-word04",
      "zh": "身高",
      "py": "shēngāo",
      "vi": "chiều cao (của người)",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l01:word04",
          "lessonId": "hsk3-fltrp-2026:l01",
          "lesson": 1,
          "sourceText": 1,
          "audioTrack": "1-2",
          "source": {
            "pdfPage": 14,
            "printedPage": 2,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l01-word05",
      "zh": "米",
      "py": "mǐ",
      "vi": "mét",
      "pos": "lượng từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l01:word05",
          "lessonId": "hsk3-fltrp-2026:l01",
          "lesson": 1,
          "sourceText": 1,
          "audioTrack": "1-2",
          "source": {
            "pdfPage": 14,
            "printedPage": 2,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l01-word06",
      "zh": "瘦",
      "py": "shòu",
      "vi": "gầy",
      "pos": "tính từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l01:word06",
          "lessonId": "hsk3-fltrp-2026:l01",
          "lesson": 1,
          "sourceText": 1,
          "audioTrack": "1-2",
          "source": {
            "pdfPage": 14,
            "printedPage": 2,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l01-word07",
      "zh": "接",
      "py": "jiē",
      "vi": "đón",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l01:word07",
          "lessonId": "hsk3-fltrp-2026:l01",
          "lesson": 1,
          "sourceText": 1,
          "audioTrack": "1-2",
          "source": {
            "pdfPage": 14,
            "printedPage": 2,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l01-word08",
      "zh": "行李",
      "py": "xíngli",
      "vi": "hành lý",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l01:word08",
          "lessonId": "hsk3-fltrp-2026:l01",
          "lesson": 1,
          "sourceText": 2,
          "audioTrack": "1-4",
          "source": {
            "pdfPage": 16,
            "printedPage": 4,
            "section": "课文2：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l01-word09",
      "zh": "丢",
      "py": "diū",
      "vi": "mất, làm mất",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l01:word09",
          "lessonId": "hsk3-fltrp-2026:l01",
          "lesson": 1,
          "sourceText": 2,
          "audioTrack": "1-4",
          "source": {
            "pdfPage": 16,
            "printedPage": 4,
            "section": "课文2：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l01-word10",
      "zh": "箱子",
      "py": "xiāngzi",
      "vi": "va-li; hòm, thùng",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l01:word10",
          "lessonId": "hsk3-fltrp-2026:l01",
          "lesson": 1,
          "sourceText": 2,
          "audioTrack": "1-4",
          "source": {
            "pdfPage": 16,
            "printedPage": 4,
            "section": "课文2：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l01-word11",
      "zh": "号码",
      "py": "hàomǎ",
      "vi": "số, mã số",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l01:word11",
          "lessonId": "hsk3-fltrp-2026:l01",
          "lesson": 1,
          "sourceText": 2,
          "audioTrack": "1-4",
          "source": {
            "pdfPage": 16,
            "printedPage": 4,
            "section": "课文2：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l01-word12",
      "zh": "好像",
      "py": "hǎoxiàng",
      "vi": "hình như, có vẻ",
      "pos": "phó từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l01:word12",
          "lessonId": "hsk3-fltrp-2026:l01",
          "lesson": 1,
          "sourceText": 2,
          "audioTrack": "1-4",
          "source": {
            "pdfPage": 16,
            "printedPage": 4,
            "section": "课文2：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l01-word13",
      "zh": "重要",
      "py": "zhòngyào",
      "vi": "quan trọng",
      "pos": "tính từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l01:word13",
          "lessonId": "hsk3-fltrp-2026:l01",
          "lesson": 1,
          "sourceText": 2,
          "audioTrack": "1-4",
          "source": {
            "pdfPage": 16,
            "printedPage": 4,
            "section": "课文2：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l01-word14",
      "zh": "着急",
      "py": "zháojí",
      "vi": "lo lắng, sốt ruột",
      "pos": "tính từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l01:word14",
          "lessonId": "hsk3-fltrp-2026:l01",
          "lesson": 1,
          "sourceText": 2,
          "audioTrack": "1-4",
          "source": {
            "pdfPage": 16,
            "printedPage": 4,
            "section": "课文2：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l01-word15",
      "zh": "护照",
      "py": "hùzhào",
      "vi": "hộ chiếu",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l01:word15",
          "lessonId": "hsk3-fltrp-2026:l01",
          "lesson": 1,
          "sourceText": 2,
          "audioTrack": "1-4",
          "source": {
            "pdfPage": 16,
            "printedPage": 4,
            "section": "课文2：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l01-word16",
      "zh": "服务台",
      "py": "fúwùtái",
      "vi": "quầy dịch vụ/thông tin",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l01:word16",
          "lessonId": "hsk3-fltrp-2026:l01",
          "lesson": 1,
          "sourceText": 2,
          "audioTrack": "1-4",
          "source": {
            "pdfPage": 16,
            "printedPage": 4,
            "section": "课文2：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l01-word17",
      "zh": "应该",
      "py": "yīnggāi",
      "vi": "nên; chắc là (phỏng đoán)",
      "pos": "động từ năng nguyện",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l01:word17",
          "lessonId": "hsk3-fltrp-2026:l01",
          "lesson": 1,
          "sourceText": 3,
          "audioTrack": "1-6",
          "source": {
            "pdfPage": 18,
            "printedPage": 6,
            "section": "课文3：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l01-word18",
      "zh": "站",
      "py": "zhàn",
      "vi": "đứng",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l01:word18",
          "lessonId": "hsk3-fltrp-2026:l01",
          "lesson": 1,
          "sourceText": 3,
          "audioTrack": "1-6",
          "source": {
            "pdfPage": 18,
            "printedPage": 6,
            "section": "课文3：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l01-word19",
      "zh": "中间",
      "py": "zhōngjiān",
      "vi": "ở giữa",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l01:word19",
          "lessonId": "hsk3-fltrp-2026:l01",
          "lesson": 1,
          "sourceText": 3,
          "audioTrack": "1-6",
          "source": {
            "pdfPage": 18,
            "printedPage": 6,
            "section": "课文3：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l01-word20",
      "zh": "短",
      "py": "duǎn",
      "vi": "ngắn",
      "pos": "tính từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l01:word20",
          "lessonId": "hsk3-fltrp-2026:l01",
          "lesson": 1,
          "sourceText": 3,
          "audioTrack": "1-6",
          "source": {
            "pdfPage": 18,
            "printedPage": 6,
            "section": "课文3：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l01-word21",
      "zh": "头发",
      "py": "tóufa",
      "vi": "tóc",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l01:word21",
          "lessonId": "hsk3-fltrp-2026:l01",
          "lesson": 1,
          "sourceText": 3,
          "audioTrack": "1-6",
          "source": {
            "pdfPage": 18,
            "printedPage": 6,
            "section": "课文3：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l01-word22",
      "zh": "年轻",
      "py": "niánqīng",
      "vi": "trẻ, trẻ tuổi",
      "pos": "tính từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l01:word22",
          "lessonId": "hsk3-fltrp-2026:l01",
          "lesson": 1,
          "sourceText": 3,
          "audioTrack": "1-6",
          "source": {
            "pdfPage": 18,
            "printedPage": 6,
            "section": "课文3：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l01-word23",
      "zh": "发现",
      "py": "fāxiàn",
      "vi": "phát hiện, nhận ra",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l01:word23",
          "lessonId": "hsk3-fltrp-2026:l01",
          "lesson": 1,
          "sourceText": 4,
          "audioTrack": "1-8",
          "source": {
            "pdfPage": 20,
            "printedPage": 8,
            "section": "课文4：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l01-word24",
      "zh": "不见",
      "py": "bújiàn",
      "vi": "mất, không thấy đâu",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l01:word24",
          "lessonId": "hsk3-fltrp-2026:l01",
          "lesson": 1,
          "sourceText": 4,
          "audioTrack": "1-8",
          "source": {
            "pdfPage": 20,
            "printedPage": 8,
            "section": "课文4：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l01-word25",
      "zh": "带",
      "py": "dài",
      "vi": "mang; dẫn, đưa theo",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l01:word25",
          "lessonId": "hsk3-fltrp-2026:l01",
          "lesson": 1,
          "sourceText": 4,
          "audioTrack": "1-8",
          "source": {
            "pdfPage": 20,
            "printedPage": 8,
            "section": "课文4：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l01-word26",
      "zh": "帮助",
      "py": "bāngzhù",
      "vi": "giúp đỡ",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l01:word26",
          "lessonId": "hsk3-fltrp-2026:l01",
          "lesson": 1,
          "sourceText": 4,
          "audioTrack": "1-8",
          "source": {
            "pdfPage": 20,
            "printedPage": 8,
            "section": "课文4：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l01-word27",
      "zh": "照片",
      "py": "zhàopiàn",
      "vi": "bức ảnh",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l01:word27",
          "lessonId": "hsk3-fltrp-2026:l01",
          "lesson": 1,
          "sourceText": 4,
          "audioTrack": "1-8",
          "source": {
            "pdfPage": 20,
            "printedPage": 8,
            "section": "课文4：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l02-word01",
      "zh": "菜单",
      "py": "càidān",
      "vi": "thực đơn",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l02:word01",
          "lessonId": "hsk3-fltrp-2026:l02",
          "lesson": 2,
          "sourceText": 1,
          "audioTrack": "2-2",
          "source": {
            "pdfPage": 23,
            "printedPage": 11,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l02-word02",
      "zh": "又",
      "py": "yòu",
      "vi": "vừa…vừa…; lại",
      "pos": "phó từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l02:word02",
          "lessonId": "hsk3-fltrp-2026:l02",
          "lesson": 2,
          "sourceText": 1,
          "audioTrack": "2-2",
          "source": {
            "pdfPage": 23,
            "printedPage": 11,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l02-word03",
      "zh": "饿",
      "py": "è",
      "vi": "đói",
      "pos": "tính từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l02:word03",
          "lessonId": "hsk3-fltrp-2026:l02",
          "lesson": 2,
          "sourceText": 1,
          "audioTrack": "2-2",
          "source": {
            "pdfPage": 23,
            "printedPage": 11,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l02-word04",
      "zh": "渴",
      "py": "kě",
      "vi": "khát",
      "pos": "tính từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l02:word04",
          "lessonId": "hsk3-fltrp-2026:l02",
          "lesson": 2,
          "sourceText": 1,
          "audioTrack": "2-2",
          "source": {
            "pdfPage": 23,
            "printedPage": 11,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l02-word05",
      "zh": "客气",
      "py": "kèqi",
      "vi": "khách sáo, tỏ ra khách sáo",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l02:word05",
          "lessonId": "hsk3-fltrp-2026:l02",
          "lesson": 2,
          "sourceText": 1,
          "audioTrack": "2-2",
          "source": {
            "pdfPage": 23,
            "printedPage": 11,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l02-word06",
      "zh": "客气",
      "py": "kèqi",
      "vi": "lịch sự, khách sáo",
      "pos": "tính từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l02:word06",
          "lessonId": "hsk3-fltrp-2026:l02",
          "lesson": 2,
          "sourceText": 1,
          "audioTrack": "2-2",
          "source": {
            "pdfPage": 23,
            "printedPage": 11,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l02-word07",
      "zh": "饮料",
      "py": "yǐnliào",
      "vi": "đồ uống",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l02:word07",
          "lessonId": "hsk3-fltrp-2026:l02",
          "lesson": 2,
          "sourceText": 1,
          "audioTrack": "2-2",
          "source": {
            "pdfPage": 23,
            "printedPage": 11,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l02-word08",
      "zh": "好久",
      "py": "hǎojiǔ",
      "vi": "rất lâu, lâu lắm",
      "pos": "tính từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l02:word08",
          "lessonId": "hsk3-fltrp-2026:l02",
          "lesson": 2,
          "sourceText": 1,
          "audioTrack": "2-2",
          "source": {
            "pdfPage": 23,
            "printedPage": 11,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l02-word09",
      "zh": "服务",
      "py": "fúwù",
      "vi": "phục vụ",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l02:word09",
          "lessonId": "hsk3-fltrp-2026:l02",
          "lesson": 2,
          "sourceText": 2,
          "audioTrack": "2-4",
          "source": {
            "pdfPage": 25,
            "printedPage": 13,
            "section": "课文2：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l02-word10",
      "zh": "员",
      "py": "yuán",
      "vi": "hậu tố đặt sau danh từ hoặc động từ để chỉ người",
      "pos": "hậu tố",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l02:word10",
          "lessonId": "hsk3-fltrp-2026:l02",
          "lesson": 2,
          "sourceText": 2,
          "audioTrack": "2-4",
          "source": {
            "pdfPage": 25,
            "printedPage": 13,
            "section": "课文2：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l02-word11",
      "zh": "双",
      "py": "shuāng",
      "vi": "đôi, cặp",
      "pos": "lượng từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l02:word11",
          "lessonId": "hsk3-fltrp-2026:l02",
          "lesson": 2,
          "sourceText": 2,
          "audioTrack": "2-4",
          "source": {
            "pdfPage": 25,
            "printedPage": 13,
            "section": "课文2：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l02-word12",
      "zh": "筷子",
      "py": "kuàizi",
      "vi": "đũa",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l02:word12",
          "lessonId": "hsk3-fltrp-2026:l02",
          "lesson": 2,
          "sourceText": 2,
          "audioTrack": "2-4",
          "source": {
            "pdfPage": 25,
            "printedPage": 13,
            "section": "课文2：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l02-word13",
      "zh": "勺子",
      "py": "sháozi",
      "vi": "thìa, muỗng",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l02:word13",
          "lessonId": "hsk3-fltrp-2026:l02",
          "lesson": 2,
          "sourceText": 2,
          "audioTrack": "2-4",
          "source": {
            "pdfPage": 25,
            "printedPage": 13,
            "section": "课文2：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l02-word14",
      "zh": "碗",
      "py": "wǎn",
      "vi": "bát, chén",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l02:word14",
          "lessonId": "hsk3-fltrp-2026:l02",
          "lesson": 2,
          "sourceText": 2,
          "audioTrack": "2-4",
          "source": {
            "pdfPage": 25,
            "printedPage": 13,
            "section": "课文2：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l02-word15",
      "zh": "马上",
      "py": "mǎshàng",
      "vi": "ngay, lập tức",
      "pos": "phó từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l02:word15",
          "lessonId": "hsk3-fltrp-2026:l02",
          "lesson": 2,
          "sourceText": 2,
          "audioTrack": "2-4",
          "source": {
            "pdfPage": 25,
            "printedPage": 13,
            "section": "课文2：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l02-word16",
      "zh": "热情",
      "py": "rèqíng",
      "vi": "nhiệt tình, niềm nở",
      "pos": "tính từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l02:word16",
          "lessonId": "hsk3-fltrp-2026:l02",
          "lesson": 2,
          "sourceText": 2,
          "audioTrack": "2-4",
          "source": {
            "pdfPage": 25,
            "printedPage": 13,
            "section": "课文2：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l02-word17",
      "zh": "尝",
      "py": "cháng",
      "vi": "nếm, ăn thử",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l02:word17",
          "lessonId": "hsk3-fltrp-2026:l02",
          "lesson": 2,
          "sourceText": 2,
          "audioTrack": "2-4",
          "source": {
            "pdfPage": 25,
            "printedPage": 13,
            "section": "课文2：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l02-word18",
      "zh": "记",
      "py": "jì",
      "vi": "nhớ, ghi nhớ",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l02:word18",
          "lessonId": "hsk3-fltrp-2026:l02",
          "lesson": 2,
          "sourceText": 2,
          "audioTrack": "2-4",
          "source": {
            "pdfPage": 25,
            "printedPage": 13,
            "section": "课文2：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l02-word19",
      "zh": "用",
      "py": "yòng",
      "vi": "dùng, sử dụng; ăn/uống (lịch sự)",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l02:word19",
          "lessonId": "hsk3-fltrp-2026:l02",
          "lesson": 2,
          "sourceText": 2,
          "audioTrack": "2-4",
          "source": {
            "pdfPage": 25,
            "printedPage": 13,
            "section": "课文2：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l02-word20",
      "zh": "鸡",
      "py": "jī",
      "vi": "gà",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l02:word20",
          "lessonId": "hsk3-fltrp-2026:l02",
          "lesson": 2,
          "sourceText": 3,
          "audioTrack": "2-6",
          "source": {
            "pdfPage": 27,
            "printedPage": 15,
            "section": "课文3：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l02-word21",
      "zh": "张",
      "py": "zhāng",
      "vi": "tờ, bức (lượng từ cho giấy, tranh…)",
      "pos": "lượng từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l02:word21",
          "lessonId": "hsk3-fltrp-2026:l02",
          "lesson": 2,
          "sourceText": 3,
          "audioTrack": "2-6",
          "source": {
            "pdfPage": 27,
            "printedPage": 15,
            "section": "课文3：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l02-word22",
      "zh": "不用",
      "py": "búyòng",
      "vi": "không cần",
      "pos": "phó từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l02:word22",
          "lessonId": "hsk3-fltrp-2026:l02",
          "lesson": 2,
          "sourceText": 3,
          "audioTrack": "2-6",
          "source": {
            "pdfPage": 27,
            "printedPage": 15,
            "section": "课文3：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l02-word23",
      "zh": "选",
      "py": "xuǎn",
      "vi": "chọn, lựa chọn",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l02:word23",
          "lessonId": "hsk3-fltrp-2026:l02",
          "lesson": 2,
          "sourceText": 3,
          "audioTrack": "2-6",
          "source": {
            "pdfPage": 27,
            "printedPage": 15,
            "section": "课文3：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l02-word24",
      "zh": "外卖",
      "py": "wàimài",
      "vi": "đồ ăn mang đi/giao tận nơi",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l02:word24",
          "lessonId": "hsk3-fltrp-2026:l02",
          "lesson": 2,
          "sourceText": 3,
          "audioTrack": "2-6",
          "source": {
            "pdfPage": 27,
            "printedPage": 15,
            "section": "课文3：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l02-word25",
      "zh": "外卖",
      "py": "wàimài",
      "vi": "bán đồ ăn mang đi",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l02:word25",
          "lessonId": "hsk3-fltrp-2026:l02",
          "lesson": 2,
          "sourceText": 3,
          "audioTrack": "2-6",
          "source": {
            "pdfPage": 27,
            "printedPage": 15,
            "section": "课文3：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l02-word26",
      "zh": "方便",
      "py": "fāngbiàn",
      "vi": "thuận tiện",
      "pos": "tính từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l02:word26",
          "lessonId": "hsk3-fltrp-2026:l02",
          "lesson": 2,
          "sourceText": 3,
          "audioTrack": "2-6",
          "source": {
            "pdfPage": 27,
            "printedPage": 15,
            "section": "课文3：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l02-word27",
      "zh": "蛋糕",
      "py": "dàngāo",
      "vi": "bánh ngọt, bánh ga-tô",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l02:word27",
          "lessonId": "hsk3-fltrp-2026:l02",
          "lesson": 2,
          "sourceText": 4,
          "audioTrack": "2-8",
          "source": {
            "pdfPage": 28,
            "printedPage": 16,
            "section": "课文4：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l02-word28",
      "zh": "只",
      "py": "zhǐ",
      "vi": "chỉ",
      "pos": "phó từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l02:word28",
          "lessonId": "hsk3-fltrp-2026:l02",
          "lesson": 2,
          "sourceText": 4,
          "audioTrack": "2-8",
          "source": {
            "pdfPage": 28,
            "printedPage": 16,
            "section": "课文4：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l02-word29",
      "zh": "方便面",
      "py": "fāngbiànmiàn",
      "vi": "mì ăn liền",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l02:word29",
          "lessonId": "hsk3-fltrp-2026:l02",
          "lesson": 2,
          "sourceText": 4,
          "audioTrack": "2-8",
          "source": {
            "pdfPage": 28,
            "printedPage": 16,
            "section": "课文4：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l02-word30",
      "zh": "简单",
      "py": "jiǎndān",
      "vi": "đơn giản",
      "pos": "tính từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l02:word30",
          "lessonId": "hsk3-fltrp-2026:l02",
          "lesson": 2,
          "sourceText": 4,
          "audioTrack": "2-8",
          "source": {
            "pdfPage": 28,
            "printedPage": 16,
            "section": "课文4：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l03-word01",
      "zh": "初中",
      "py": "chūzhōng",
      "vi": "trường trung học cơ sở, cấp hai",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l03:word01",
          "lessonId": "hsk3-fltrp-2026:l03",
          "lesson": 3,
          "sourceText": 1,
          "audioTrack": "3-2",
          "source": {
            "pdfPage": 32,
            "printedPage": 20,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l03-word02",
      "zh": "咱们",
      "py": "zánmen",
      "vi": "chúng ta (gồm cả người nói và người nghe)",
      "pos": "đại từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l03:word02",
          "lessonId": "hsk3-fltrp-2026:l03",
          "lesson": 3,
          "sourceText": 1,
          "audioTrack": "3-2",
          "source": {
            "pdfPage": 32,
            "printedPage": 20,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l03-word03",
      "zh": "换",
      "py": "huàn",
      "vi": "đổi, thay",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l03:word03",
          "lessonId": "hsk3-fltrp-2026:l03",
          "lesson": 3,
          "sourceText": 1,
          "audioTrack": "3-2",
          "source": {
            "pdfPage": 32,
            "printedPage": 20,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l03-word04",
      "zh": "房子",
      "py": "fángzi",
      "vi": "nhà, căn nhà",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l03:word04",
          "lessonId": "hsk3-fltrp-2026:l03",
          "lesson": 3,
          "sourceText": 1,
          "audioTrack": "3-2",
          "source": {
            "pdfPage": 32,
            "printedPage": 20,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l03-word05",
      "zh": "小区",
      "py": "xiǎoqū",
      "vi": "khu dân cư",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l03:word05",
          "lessonId": "hsk3-fltrp-2026:l03",
          "lesson": 3,
          "sourceText": 1,
          "audioTrack": "3-2",
          "source": {
            "pdfPage": 32,
            "printedPage": 20,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l03-word06",
      "zh": "环境",
      "py": "huánjìng",
      "vi": "môi trường, quang cảnh xung quanh",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l03:word06",
          "lessonId": "hsk3-fltrp-2026:l03",
          "lesson": 3,
          "sourceText": 1,
          "audioTrack": "3-2",
          "source": {
            "pdfPage": 32,
            "printedPage": 20,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l03-word07",
      "zh": "挺",
      "py": "tǐng",
      "vi": "khá, rất (khẩu ngữ)",
      "pos": "phó từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l03:word07",
          "lessonId": "hsk3-fltrp-2026:l03",
          "lesson": 3,
          "sourceText": 1,
          "audioTrack": "3-2",
          "source": {
            "pdfPage": 32,
            "printedPage": 20,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l03-word08",
      "zh": "空调",
      "py": "kōngtiáo",
      "vi": "máy điều hòa",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l03:word08",
          "lessonId": "hsk3-fltrp-2026:l03",
          "lesson": 3,
          "sourceText": 1,
          "audioTrack": "3-2",
          "source": {
            "pdfPage": 32,
            "printedPage": 20,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l03-word09",
      "zh": "洗衣机",
      "py": "xǐyījī",
      "vi": "máy giặt",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l03:word09",
          "lessonId": "hsk3-fltrp-2026:l03",
          "lesson": 3,
          "sourceText": 1,
          "audioTrack": "3-2",
          "source": {
            "pdfPage": 32,
            "printedPage": 20,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l03-word10",
      "zh": "层",
      "py": "céng",
      "vi": "tầng, lớp",
      "pos": "lượng từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l03:word10",
          "lessonId": "hsk3-fltrp-2026:l03",
          "lesson": 3,
          "sourceText": 1,
          "audioTrack": "3-2",
          "source": {
            "pdfPage": 32,
            "printedPage": 20,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l03-word11",
      "zh": "花园",
      "py": "huāyuán",
      "vi": "vườn hoa, khu vườn",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l03:word11",
          "lessonId": "hsk3-fltrp-2026:l03",
          "lesson": 3,
          "sourceText": 1,
          "audioTrack": "3-2",
          "source": {
            "pdfPage": 32,
            "printedPage": 20,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l03-word12",
      "zh": "灯",
      "py": "dēng",
      "vi": "đèn",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l03:word12",
          "lessonId": "hsk3-fltrp-2026:l03",
          "lesson": 3,
          "sourceText": 2,
          "audioTrack": "3-4",
          "source": {
            "pdfPage": 34,
            "printedPage": 22,
            "section": "课文2：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l03-word13",
      "zh": "关",
      "py": "guān",
      "vi": "tắt; đóng",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l03:word13",
          "lessonId": "hsk3-fltrp-2026:l03",
          "lesson": 3,
          "sourceText": 2,
          "audioTrack": "3-4",
          "source": {
            "pdfPage": 34,
            "printedPage": 22,
            "section": "课文2：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l03-word14",
      "zh": "冰箱",
      "py": "bīngxiāng",
      "vi": "tủ lạnh",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l03:word14",
          "lessonId": "hsk3-fltrp-2026:l03",
          "lesson": 3,
          "sourceText": 2,
          "audioTrack": "3-4",
          "source": {
            "pdfPage": 34,
            "printedPage": 22,
            "section": "课文2：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l03-word15",
      "zh": "卫生间",
      "py": "wèishēngjiān",
      "vi": "phòng vệ sinh, phòng tắm",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l03:word15",
          "lessonId": "hsk3-fltrp-2026:l03",
          "lesson": 3,
          "sourceText": 2,
          "audioTrack": "3-4",
          "source": {
            "pdfPage": 34,
            "printedPage": 22,
            "section": "课文2：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l03-word16",
      "zh": "打扫",
      "py": "dǎsǎo",
      "vi": "quét dọn, làm vệ sinh",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l03:word16",
          "lessonId": "hsk3-fltrp-2026:l03",
          "lesson": 3,
          "sourceText": 2,
          "audioTrack": "3-4",
          "source": {
            "pdfPage": 34,
            "printedPage": 22,
            "section": "课文2：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l03-word17",
      "zh": "搬家",
      "py": "bānjiā",
      "vi": "chuyển nhà",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l03:word17",
          "lessonId": "hsk3-fltrp-2026:l03",
          "lesson": 3,
          "sourceText": 2,
          "audioTrack": "3-4",
          "source": {
            "pdfPage": 34,
            "printedPage": 22,
            "section": "课文2：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l03-word18",
      "zh": "办",
      "py": "bàn",
      "vi": "làm, xử lý (công việc/thủ tục)",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l03:word18",
          "lessonId": "hsk3-fltrp-2026:l03",
          "lesson": 3,
          "sourceText": 3,
          "audioTrack": "3-6",
          "source": {
            "pdfPage": 35,
            "printedPage": 23,
            "section": "课文3：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l03-word19",
      "zh": "信用卡",
      "py": "xìnyòngkǎ",
      "vi": "thẻ tín dụng",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l03:word19",
          "lessonId": "hsk3-fltrp-2026:l03",
          "lesson": 3,
          "sourceText": 3,
          "audioTrack": "3-6",
          "source": {
            "pdfPage": 35,
            "printedPage": 23,
            "section": "课文3：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l03-word20",
      "zh": "还",
      "py": "huán",
      "vi": "trả lại, hoàn trả",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l03:word20",
          "lessonId": "hsk3-fltrp-2026:l03",
          "lesson": 3,
          "sourceText": 3,
          "audioTrack": "3-6",
          "source": {
            "pdfPage": 35,
            "printedPage": 23,
            "section": "课文3：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l03-word21",
      "zh": "听说",
      "py": "tīngshuō",
      "vi": "nghe nói",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l03:word21",
          "lessonId": "hsk3-fltrp-2026:l03",
          "lesson": 3,
          "sourceText": 3,
          "audioTrack": "3-6",
          "source": {
            "pdfPage": 35,
            "printedPage": 23,
            "section": "课文3：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l03-word22",
      "zh": "银行",
      "py": "yínháng",
      "vi": "ngân hàng",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l03:word22",
          "lessonId": "hsk3-fltrp-2026:l03",
          "lesson": 3,
          "sourceText": 3,
          "audioTrack": "3-6",
          "source": {
            "pdfPage": 35,
            "printedPage": 23,
            "section": "课文3：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l03-word23",
      "zh": "才",
      "py": "cái",
      "vi": "mãi…mới; chỉ đến lúc…mới",
      "pos": "phó từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l03:word23",
          "lessonId": "hsk3-fltrp-2026:l03",
          "lesson": 3,
          "sourceText": 3,
          "audioTrack": "3-6",
          "source": {
            "pdfPage": 35,
            "printedPage": 23,
            "section": "课文3：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l03-word24",
      "zh": "纸",
      "py": "zhǐ",
      "vi": "giấy",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l03:word24",
          "lessonId": "hsk3-fltrp-2026:l03",
          "lesson": 3,
          "sourceText": 4,
          "audioTrack": "3-8",
          "source": {
            "pdfPage": 37,
            "printedPage": 25,
            "section": "课文4：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l03-word25",
      "zh": "搬",
      "py": "bān",
      "vi": "chuyển, di chuyển, khuân",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l03:word25",
          "lessonId": "hsk3-fltrp-2026:l03",
          "lesson": 3,
          "sourceText": 4,
          "audioTrack": "3-8",
          "source": {
            "pdfPage": 37,
            "printedPage": 25,
            "section": "课文4：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l03-word26",
      "zh": "需要",
      "py": "xūyào",
      "vi": "cần",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l03:word26",
          "lessonId": "hsk3-fltrp-2026:l03",
          "lesson": 3,
          "sourceText": 4,
          "audioTrack": "3-8",
          "source": {
            "pdfPage": 37,
            "printedPage": 25,
            "section": "课文4：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l03-word27",
      "zh": "需要",
      "py": "xūyào",
      "vi": "nhu cầu",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l03:word27",
          "lessonId": "hsk3-fltrp-2026:l03",
          "lesson": 3,
          "sourceText": 4,
          "audioTrack": "3-8",
          "source": {
            "pdfPage": 37,
            "printedPage": 25,
            "section": "课文4：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l04-word01",
      "zh": "假期",
      "py": "jiàqī",
      "vi": "kỳ nghỉ",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l04:word01",
          "lessonId": "hsk3-fltrp-2026:l04",
          "lesson": 4,
          "sourceText": 1,
          "audioTrack": "4-2",
          "source": {
            "pdfPage": 42,
            "printedPage": 30,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l04-word02",
      "zh": "海",
      "py": "hǎi",
      "vi": "biển",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l04:word02",
          "lessonId": "hsk3-fltrp-2026:l04",
          "lesson": 4,
          "sourceText": 1,
          "audioTrack": "4-2",
          "source": {
            "pdfPage": 42,
            "printedPage": 30,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l04-word03",
      "zh": "草原",
      "py": "cǎoyuán",
      "vi": "thảo nguyên",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l04:word03",
          "lessonId": "hsk3-fltrp-2026:l04",
          "lesson": 4,
          "sourceText": 1,
          "audioTrack": "4-2",
          "source": {
            "pdfPage": 42,
            "printedPage": 30,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l04-word04",
      "zh": "主意",
      "py": "zhǔyi",
      "vi": "ý kiến, ý tưởng",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l04:word04",
          "lessonId": "hsk3-fltrp-2026:l04",
          "lesson": 4,
          "sourceText": 1,
          "audioTrack": "4-2",
          "source": {
            "pdfPage": 42,
            "printedPage": 30,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l04-word05",
      "zh": "骑",
      "py": "qí",
      "vi": "cưỡi; đi (xe đạp, xe máy)",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l04:word05",
          "lessonId": "hsk3-fltrp-2026:l04",
          "lesson": 4,
          "sourceText": 1,
          "audioTrack": "4-2",
          "source": {
            "pdfPage": 42,
            "printedPage": 30,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l04-word06",
      "zh": "马",
      "py": "mǎ",
      "vi": "ngựa",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l04:word06",
          "lessonId": "hsk3-fltrp-2026:l04",
          "lesson": 4,
          "sourceText": 1,
          "audioTrack": "4-2",
          "source": {
            "pdfPage": 42,
            "printedPage": 30,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l04-word07",
      "zh": "羊",
      "py": "yáng",
      "vi": "dê; cừu",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l04:word07",
          "lessonId": "hsk3-fltrp-2026:l04",
          "lesson": 4,
          "sourceText": 1,
          "audioTrack": "4-2",
          "source": {
            "pdfPage": 42,
            "printedPage": 30,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l04-word08",
      "zh": "月亮",
      "py": "yuèliang",
      "vi": "mặt trăng",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l04:word08",
          "lessonId": "hsk3-fltrp-2026:l04",
          "lesson": 4,
          "sourceText": 1,
          "audioTrack": "4-2",
          "source": {
            "pdfPage": 42,
            "printedPage": 30,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l04-word09",
      "zh": "一定",
      "py": "yídìng",
      "vi": "nhất định, chắc chắn",
      "pos": "phó từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l04:word09",
          "lessonId": "hsk3-fltrp-2026:l04",
          "lesson": 4,
          "sourceText": 1,
          "audioTrack": "4-2",
          "source": {
            "pdfPage": 42,
            "printedPage": 30,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l04-word10",
      "zh": "刻",
      "py": "kè",
      "vi": "khắc, mười lăm phút",
      "pos": "lượng từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l04:word10",
          "lessonId": "hsk3-fltrp-2026:l04",
          "lesson": 4,
          "sourceText": 2,
          "audioTrack": "4-4",
          "source": {
            "pdfPage": 44,
            "printedPage": 32,
            "section": "课文2：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l04-word11",
      "zh": "起飞",
      "py": "qǐfēi",
      "vi": "cất cánh",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l04:word11",
          "lessonId": "hsk3-fltrp-2026:l04",
          "lesson": 4,
          "sourceText": 2,
          "audioTrack": "4-4",
          "source": {
            "pdfPage": 44,
            "printedPage": 32,
            "section": "课文2：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l04-word12",
      "zh": "宾馆",
      "py": "bīnguǎn",
      "vi": "khách sạn",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l04:word12",
          "lessonId": "hsk3-fltrp-2026:l04",
          "lesson": 4,
          "sourceText": 2,
          "audioTrack": "4-4",
          "source": {
            "pdfPage": 44,
            "printedPage": 32,
            "section": "课文2：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l04-word13",
      "zh": "特别",
      "py": "tèbié",
      "vi": "đặc biệt",
      "pos": "tính từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l04:word13",
          "lessonId": "hsk3-fltrp-2026:l04",
          "lesson": 4,
          "sourceText": 2,
          "audioTrack": "4-4",
          "source": {
            "pdfPage": 44,
            "printedPage": 32,
            "section": "课文2：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l04-word14",
      "zh": "特别",
      "py": "tèbié",
      "vi": "đặc biệt, rất",
      "pos": "phó từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l04:word14",
          "lessonId": "hsk3-fltrp-2026:l04",
          "lesson": 4,
          "sourceText": 2,
          "audioTrack": "4-4",
          "source": {
            "pdfPage": 44,
            "printedPage": 32,
            "section": "课文2：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l04-word15",
      "zh": "别的",
      "py": "biéde",
      "vi": "khác",
      "pos": "đại từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l04:word15",
          "lessonId": "hsk3-fltrp-2026:l04",
          "lesson": 4,
          "sourceText": 2,
          "audioTrack": "4-4",
          "source": {
            "pdfPage": 44,
            "printedPage": 32,
            "section": "课文2：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l04-word16",
      "zh": "一样",
      "py": "yíyàng",
      "vi": "giống nhau",
      "pos": "tính từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l04:word16",
          "lessonId": "hsk3-fltrp-2026:l04",
          "lesson": 4,
          "sourceText": 2,
          "audioTrack": "4-4",
          "source": {
            "pdfPage": 44,
            "printedPage": 32,
            "section": "课文2：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l04-word17",
      "zh": "牛",
      "py": "niú",
      "vi": "bò",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l04:word17",
          "lessonId": "hsk3-fltrp-2026:l04",
          "lesson": 4,
          "sourceText": 2,
          "audioTrack": "4-4",
          "source": {
            "pdfPage": 44,
            "printedPage": 32,
            "section": "课文2：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l04-word18",
      "zh": "相机",
      "py": "xiàngjī",
      "vi": "máy ảnh",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l04:word18",
          "lessonId": "hsk3-fltrp-2026:l04",
          "lesson": 4,
          "sourceText": 2,
          "audioTrack": "4-4",
          "source": {
            "pdfPage": 44,
            "printedPage": 32,
            "section": "课文2：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l04-word19",
      "zh": "欢迎",
      "py": "huānyíng",
      "vi": "chào mừng, hoan nghênh",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l04:word19",
          "lessonId": "hsk3-fltrp-2026:l04",
          "lesson": 4,
          "sourceText": 3,
          "audioTrack": "4-6",
          "source": {
            "pdfPage": 45,
            "printedPage": 33,
            "section": "课文3：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l04-word20",
      "zh": "司机",
      "py": "sījī",
      "vi": "tài xế",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l04:word20",
          "lessonId": "hsk3-fltrp-2026:l04",
          "lesson": 4,
          "sourceText": 3,
          "audioTrack": "4-6",
          "source": {
            "pdfPage": 45,
            "printedPage": 33,
            "section": "课文3：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l04-word21",
      "zh": "晚点",
      "py": "wǎndiǎn",
      "vi": "trễ giờ (tàu, máy bay…)",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l04:word21",
          "lessonId": "hsk3-fltrp-2026:l04",
          "lesson": 4,
          "sourceText": 3,
          "audioTrack": "4-6",
          "source": {
            "pdfPage": 45,
            "printedPage": 33,
            "section": "课文3：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l04-word22",
      "zh": "久",
      "py": "jiǔ",
      "vi": "lâu",
      "pos": "tính từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l04:word22",
          "lessonId": "hsk3-fltrp-2026:l04",
          "lesson": 4,
          "sourceText": 3,
          "audioTrack": "4-6",
          "source": {
            "pdfPage": 45,
            "printedPage": 33,
            "section": "课文3：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l04-word23",
      "zh": "除了",
      "py": "chúle",
      "vi": "ngoài, trừ",
      "pos": "giới từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l04:word23",
          "lessonId": "hsk3-fltrp-2026:l04",
          "lesson": 4,
          "sourceText": 3,
          "audioTrack": "4-6",
          "source": {
            "pdfPage": 45,
            "printedPage": 33,
            "section": "课文3：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l04-word24",
      "zh": "以外",
      "py": "yǐwài",
      "vi": "bên ngoài, ngoài ra",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l04:word24",
          "lessonId": "hsk3-fltrp-2026:l04",
          "lesson": 4,
          "sourceText": 3,
          "audioTrack": "4-6",
          "source": {
            "pdfPage": 45,
            "printedPage": 33,
            "section": "课文3：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l04-word25",
      "zh": "先",
      "py": "xiān",
      "vi": "trước",
      "pos": "phó từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l04:word25",
          "lessonId": "hsk3-fltrp-2026:l04",
          "lesson": 4,
          "sourceText": 3,
          "audioTrack": "4-6",
          "source": {
            "pdfPage": 45,
            "printedPage": 33,
            "section": "课文3：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l04-word26",
      "zh": "一直",
      "py": "yìzhí",
      "vi": "suốt, liên tục",
      "pos": "phó từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l04:word26",
          "lessonId": "hsk3-fltrp-2026:l04",
          "lesson": 4,
          "sourceText": 4,
          "audioTrack": "4-8",
          "source": {
            "pdfPage": 47,
            "printedPage": 35,
            "section": "课文4：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l04-word27",
      "zh": "干净",
      "py": "gānjìng",
      "vi": "sạch sẽ",
      "pos": "tính từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l04:word27",
          "lessonId": "hsk3-fltrp-2026:l04",
          "lesson": 4,
          "sourceText": 4,
          "audioTrack": "4-8",
          "source": {
            "pdfPage": 47,
            "printedPage": 35,
            "section": "课文4：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l04-word28",
      "zh": "满意",
      "py": "mǎnyì",
      "vi": "hài lòng",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l04:word28",
          "lessonId": "hsk3-fltrp-2026:l04",
          "lesson": 4,
          "sourceText": 4,
          "audioTrack": "4-8",
          "source": {
            "pdfPage": 47,
            "printedPage": 35,
            "section": "课文4：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l05-word01",
      "zh": "总是",
      "py": "zǒngshì",
      "vi": "luôn luôn, cứ",
      "pos": "phó từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l05:word01",
          "lessonId": "hsk3-fltrp-2026:l05",
          "lesson": 5,
          "sourceText": 1,
          "audioTrack": "5-2",
          "source": {
            "pdfPage": 51,
            "printedPage": 39,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l05-word02",
      "zh": "终于",
      "py": "zhōngyú",
      "vi": "cuối cùng (sau chờ đợi)",
      "pos": "phó từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l05:word02",
          "lessonId": "hsk3-fltrp-2026:l05",
          "lesson": 5,
          "sourceText": 1,
          "audioTrack": "5-2",
          "source": {
            "pdfPage": 51,
            "printedPage": 39,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l05-word03",
      "zh": "爬",
      "py": "pá",
      "vi": "leo, bò",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l05:word03",
          "lessonId": "hsk3-fltrp-2026:l05",
          "lesson": 5,
          "sourceText": 1,
          "audioTrack": "5-2",
          "source": {
            "pdfPage": 51,
            "printedPage": 39,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l05-word04",
      "zh": "山",
      "py": "shān",
      "vi": "núi",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l05:word04",
          "lessonId": "hsk3-fltrp-2026:l05",
          "lesson": 5,
          "sourceText": 1,
          "audioTrack": "5-2",
          "source": {
            "pdfPage": 51,
            "printedPage": 39,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l05-word05",
      "zh": "锻炼",
      "py": "duànliàn",
      "vi": "rèn luyện, tập luyện",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l05:word05",
          "lessonId": "hsk3-fltrp-2026:l05",
          "lesson": 5,
          "sourceText": 1,
          "audioTrack": "5-2",
          "source": {
            "pdfPage": 51,
            "printedPage": 39,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l05-word06",
      "zh": "照",
      "py": "zhào",
      "vi": "chụp (ảnh)",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l05:word06",
          "lessonId": "hsk3-fltrp-2026:l05",
          "lesson": 5,
          "sourceText": 1,
          "audioTrack": "5-2",
          "source": {
            "pdfPage": 51,
            "printedPage": 39,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l05-word07",
      "zh": "鞋",
      "py": "xié",
      "vi": "giày",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l05:word07",
          "lessonId": "hsk3-fltrp-2026:l05",
          "lesson": 5,
          "sourceText": 1,
          "audioTrack": "5-2",
          "source": {
            "pdfPage": 51,
            "printedPage": 39,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l05-word08",
      "zh": "大衣",
      "py": "dàyī",
      "vi": "áo khoác dài",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l05:word08",
          "lessonId": "hsk3-fltrp-2026:l05",
          "lesson": 5,
          "sourceText": 1,
          "audioTrack": "5-2",
          "source": {
            "pdfPage": 51,
            "printedPage": 39,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l05-word09",
      "zh": "拍照",
      "py": "pāizhào",
      "vi": "chụp ảnh",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l05:word09",
          "lessonId": "hsk3-fltrp-2026:l05",
          "lesson": 5,
          "sourceText": 2,
          "audioTrack": "5-4",
          "source": {
            "pdfPage": 53,
            "printedPage": 41,
            "section": "课文2：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l05-word10",
      "zh": "感兴趣",
      "py": "gǎn xìngqù",
      "vi": "có hứng thú",
      "pos": "cụm từ (sách không ghi từ loại)",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l05:word10",
          "lessonId": "hsk3-fltrp-2026:l05",
          "lesson": 5,
          "sourceText": 2,
          "audioTrack": "5-4",
          "source": {
            "pdfPage": 53,
            "printedPage": 41,
            "section": "课文2：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l05-word11",
      "zh": "照相",
      "py": "zhàoxiàng",
      "vi": "chụp ảnh",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l05:word11",
          "lessonId": "hsk3-fltrp-2026:l05",
          "lesson": 5,
          "sourceText": 2,
          "audioTrack": "5-4",
          "source": {
            "pdfPage": 53,
            "printedPage": 41,
            "section": "课文2：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l05-word12",
      "zh": "难看",
      "py": "nánkàn",
      "vi": "xấu, khó coi",
      "pos": "tính từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l05:word12",
          "lessonId": "hsk3-fltrp-2026:l05",
          "lesson": 5,
          "sourceText": 2,
          "audioTrack": "5-4",
          "source": {
            "pdfPage": 53,
            "printedPage": 41,
            "section": "课文2：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l05-word13",
      "zh": "比较",
      "py": "bǐjiào",
      "vi": "so sánh",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l05:word13",
          "lessonId": "hsk3-fltrp-2026:l05",
          "lesson": 5,
          "sourceText": 2,
          "audioTrack": "5-4",
          "source": {
            "pdfPage": 53,
            "printedPage": 41,
            "section": "课文2：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l05-word14",
      "zh": "比较",
      "py": "bǐjiào",
      "vi": "tương đối, khá",
      "pos": "phó từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l05:word14",
          "lessonId": "hsk3-fltrp-2026:l05",
          "lesson": 5,
          "sourceText": 2,
          "audioTrack": "5-4",
          "source": {
            "pdfPage": 53,
            "printedPage": 41,
            "section": "课文2：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l05-word15",
      "zh": "水平",
      "py": "shuǐpíng",
      "vi": "trình độ",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l05:word15",
          "lessonId": "hsk3-fltrp-2026:l05",
          "lesson": 5,
          "sourceText": 2,
          "audioTrack": "5-4",
          "source": {
            "pdfPage": 53,
            "printedPage": 41,
            "section": "课文2：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l05-word16",
      "zh": "太阳",
      "py": "tàiyáng",
      "vi": "mặt trời",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l05:word16",
          "lessonId": "hsk3-fltrp-2026:l05",
          "lesson": 5,
          "sourceText": 3,
          "audioTrack": "5-6",
          "source": {
            "pdfPage": 54,
            "printedPage": 42,
            "section": "课文3：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l05-word17",
      "zh": "树",
      "py": "shù",
      "vi": "cây",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l05:word17",
          "lessonId": "hsk3-fltrp-2026:l05",
          "lesson": 5,
          "sourceText": 3,
          "audioTrack": "5-6",
          "source": {
            "pdfPage": 54,
            "printedPage": 42,
            "section": "课文3：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l05-word18",
      "zh": "干",
      "py": "gàn",
      "vi": "làm",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l05:word18",
          "lessonId": "hsk3-fltrp-2026:l05",
          "lesson": 5,
          "sourceText": 3,
          "audioTrack": "5-6",
          "source": {
            "pdfPage": 54,
            "printedPage": 42,
            "section": "课文3：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l05-word19",
      "zh": "电",
      "py": "diàn",
      "vi": "điện",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l05:word19",
          "lessonId": "hsk3-fltrp-2026:l05",
          "lesson": 5,
          "sourceText": 3,
          "audioTrack": "5-6",
          "source": {
            "pdfPage": 54,
            "printedPage": 42,
            "section": "课文3：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l05-word20",
      "zh": "收到",
      "py": "shōudào",
      "vi": "nhận được",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l05:word20",
          "lessonId": "hsk3-fltrp-2026:l05",
          "lesson": 5,
          "sourceText": 4,
          "audioTrack": "5-8",
          "source": {
            "pdfPage": 56,
            "printedPage": 44,
            "section": "课文4：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l05-word21",
      "zh": "封",
      "py": "fēng",
      "vi": "bức (lượng từ cho thư, email)",
      "pos": "lượng từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l05:word21",
          "lessonId": "hsk3-fltrp-2026:l05",
          "lesson": 5,
          "sourceText": 4,
          "audioTrack": "5-8",
          "source": {
            "pdfPage": 56,
            "printedPage": 44,
            "section": "课文4：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l05-word22",
      "zh": "邮件",
      "py": "yóujiàn",
      "vi": "email, thư điện tử",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l05:word22",
          "lessonId": "hsk3-fltrp-2026:l05",
          "lesson": 5,
          "sourceText": 4,
          "audioTrack": "5-8",
          "source": {
            "pdfPage": 56,
            "printedPage": 44,
            "section": "课文4：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l05-word23",
      "zh": "难过",
      "py": "nánguò",
      "vi": "buồn, buồn bã",
      "pos": "tính từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l05:word23",
          "lessonId": "hsk3-fltrp-2026:l05",
          "lesson": 5,
          "sourceText": 4,
          "audioTrack": "5-8",
          "source": {
            "pdfPage": 56,
            "printedPage": 44,
            "section": "课文4：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l05-word24",
      "zh": "哈哈",
      "py": "hāhā",
      "vi": "ha ha (tiếng cười)",
      "pos": "từ mô phỏng tiếng cười (sách không ghi từ loại)",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l05:word24",
          "lessonId": "hsk3-fltrp-2026:l05",
          "lesson": 5,
          "sourceText": 4,
          "audioTrack": "5-8",
          "source": {
            "pdfPage": 56,
            "printedPage": 44,
            "section": "课文4：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l05-word25",
      "zh": "音乐",
      "py": "yīnyuè",
      "vi": "âm nhạc",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l05:word25",
          "lessonId": "hsk3-fltrp-2026:l05",
          "lesson": 5,
          "sourceText": 4,
          "audioTrack": "5-8",
          "source": {
            "pdfPage": 56,
            "printedPage": 44,
            "section": "课文4：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l05-word26",
      "zh": "兴趣",
      "py": "xìngqù",
      "vi": "hứng thú",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l05:word26",
          "lessonId": "hsk3-fltrp-2026:l05",
          "lesson": 5,
          "sourceText": 4,
          "audioTrack": "5-8",
          "source": {
            "pdfPage": 56,
            "printedPage": 44,
            "section": "课文4：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l05-word27",
      "zh": "会",
      "py": "huì",
      "vi": "cuộc họp, buổi hội, buổi biểu diễn",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l05:word27",
          "lessonId": "hsk3-fltrp-2026:l05",
          "lesson": 5,
          "sourceText": 4,
          "audioTrack": "5-8",
          "source": {
            "pdfPage": 56,
            "printedPage": 44,
            "section": "课文4：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l05-word28",
      "zh": "结束",
      "py": "jiéshù",
      "vi": "kết thúc",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l05:word28",
          "lessonId": "hsk3-fltrp-2026:l05",
          "lesson": 5,
          "sourceText": 4,
          "audioTrack": "5-8",
          "source": {
            "pdfPage": 56,
            "printedPage": 44,
            "section": "课文4：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l06-word01",
      "zh": "该",
      "py": "gāi",
      "vi": "nên, đến lúc phải",
      "pos": "động từ năng nguyện",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l06:word01",
          "lessonId": "hsk3-fltrp-2026:l06",
          "lesson": 6,
          "sourceText": 1,
          "audioTrack": "6-2",
          "source": {
            "pdfPage": 60,
            "printedPage": 48,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l06-word02",
      "zh": "打算",
      "py": "dǎsuàn",
      "vi": "dự định",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l06:word02",
          "lessonId": "hsk3-fltrp-2026:l06",
          "lesson": 6,
          "sourceText": 1,
          "audioTrack": "6-2",
          "source": {
            "pdfPage": 60,
            "printedPage": 48,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l06-word03",
      "zh": "打算",
      "py": "dǎsuàn",
      "vi": "dự định, kế hoạch",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l06:word03",
          "lessonId": "hsk3-fltrp-2026:l06",
          "lesson": 6,
          "sourceText": 1,
          "audioTrack": "6-2",
          "source": {
            "pdfPage": 60,
            "printedPage": 48,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l06-word04",
      "zh": "高铁",
      "py": "gāotiě",
      "vi": "tàu cao tốc",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l06:word04",
          "lessonId": "hsk3-fltrp-2026:l06",
          "lesson": 6,
          "sourceText": 1,
          "audioTrack": "6-2",
          "source": {
            "pdfPage": 60,
            "printedPage": 48,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l06-word05",
      "zh": "行",
      "py": "xíng",
      "vi": "được, ổn",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l06:word05",
          "lessonId": "hsk3-fltrp-2026:l06",
          "lesson": 6,
          "sourceText": 1,
          "audioTrack": "6-2",
          "source": {
            "pdfPage": 60,
            "printedPage": 48,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l06-word06",
      "zh": "行",
      "py": "xíng",
      "vi": "giỏi, có khả năng",
      "pos": "tính từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l06:word06",
          "lessonId": "hsk3-fltrp-2026:l06",
          "lesson": 6,
          "sourceText": 1,
          "audioTrack": "6-2",
          "source": {
            "pdfPage": 60,
            "printedPage": 48,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l06-word07",
      "zh": "路口",
      "py": "lùkǒu",
      "vi": "giao lộ, ngã rẽ",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l06:word07",
          "lessonId": "hsk3-fltrp-2026:l06",
          "lesson": 6,
          "sourceText": 2,
          "audioTrack": "6-4",
          "source": {
            "pdfPage": 62,
            "printedPage": 50,
            "section": "课文2：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l06-word08",
      "zh": "小心",
      "py": "xiǎoxīn",
      "vi": "cẩn thận, chú ý",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l06:word08",
          "lessonId": "hsk3-fltrp-2026:l06",
          "lesson": 6,
          "sourceText": 2,
          "audioTrack": "6-4",
          "source": {
            "pdfPage": 62,
            "printedPage": 50,
            "section": "课文2：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l06-word09",
      "zh": "小心",
      "py": "xiǎoxīn",
      "vi": "cẩn thận, thận trọng",
      "pos": "tính từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l06:word09",
          "lessonId": "hsk3-fltrp-2026:l06",
          "lesson": 6,
          "sourceText": 2,
          "audioTrack": "6-4",
          "source": {
            "pdfPage": 62,
            "printedPage": 50,
            "section": "课文2：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l06-word10",
      "zh": "迟到",
      "py": "chídào",
      "vi": "đến muộn",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l06:word10",
          "lessonId": "hsk3-fltrp-2026:l06",
          "lesson": 6,
          "sourceText": 2,
          "audioTrack": "6-4",
          "source": {
            "pdfPage": 62,
            "printedPage": 50,
            "section": "课文2：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l06-word11",
      "zh": "红绿灯",
      "py": "hóng-lǜdēng",
      "vi": "đèn giao thông",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l06:word11",
          "lessonId": "hsk3-fltrp-2026:l06",
          "lesson": 6,
          "sourceText": 2,
          "audioTrack": "6-4",
          "source": {
            "pdfPage": 62,
            "printedPage": 50,
            "section": "课文2：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l06-word12",
      "zh": "后来",
      "py": "hòulái",
      "vi": "sau đó, về sau",
      "pos": "danh từ chỉ thời gian",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l06:word12",
          "lessonId": "hsk3-fltrp-2026:l06",
          "lesson": 6,
          "sourceText": 2,
          "audioTrack": "6-4",
          "source": {
            "pdfPage": 62,
            "printedPage": 50,
            "section": "课文2：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l06-word13",
      "zh": "急",
      "py": "jí",
      "vi": "gấp, khẩn cấp",
      "pos": "tính từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l06:word13",
          "lessonId": "hsk3-fltrp-2026:l06",
          "lesson": 6,
          "sourceText": 2,
          "audioTrack": "6-4",
          "source": {
            "pdfPage": 62,
            "printedPage": 50,
            "section": "课文2：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l06-word14",
      "zh": "急",
      "py": "jí",
      "vi": "sốt ruột, cuống",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l06:word14",
          "lessonId": "hsk3-fltrp-2026:l06",
          "lesson": 6,
          "sourceText": 2,
          "audioTrack": "6-4",
          "source": {
            "pdfPage": 62,
            "printedPage": 50,
            "section": "课文2：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l06-word15",
      "zh": "如果",
      "py": "rúguǒ",
      "vi": "nếu",
      "pos": "liên từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l06:word15",
          "lessonId": "hsk3-fltrp-2026:l06",
          "lesson": 6,
          "sourceText": 2,
          "audioTrack": "6-4",
          "source": {
            "pdfPage": 62,
            "printedPage": 50,
            "section": "课文2：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l06-word16",
      "zh": "以前",
      "py": "yǐqián",
      "vi": "trước đây, trước",
      "pos": "danh từ chỉ thời gian",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l06:word16",
          "lessonId": "hsk3-fltrp-2026:l06",
          "lesson": 6,
          "sourceText": 2,
          "audioTrack": "6-4",
          "source": {
            "pdfPage": 62,
            "printedPage": 50,
            "section": "课文2：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l06-word17",
      "zh": "耳机",
      "py": "ěrjī",
      "vi": "tai nghe",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l06:word17",
          "lessonId": "hsk3-fltrp-2026:l06",
          "lesson": 6,
          "sourceText": 3,
          "audioTrack": "6-6",
          "source": {
            "pdfPage": 63,
            "printedPage": 51,
            "section": "课文3：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l06-word18",
      "zh": "充电宝",
      "py": "chōngdiànbǎo",
      "vi": "sạc dự phòng",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l06:word18",
          "lessonId": "hsk3-fltrp-2026:l06",
          "lesson": 6,
          "sourceText": 3,
          "audioTrack": "6-6",
          "source": {
            "pdfPage": 63,
            "printedPage": 51,
            "section": "课文3：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l06-word19",
      "zh": "常用",
      "py": "cháng yòng",
      "vi": "thường dùng",
      "pos": "cụm từ (sách không ghi từ loại)",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l06:word19",
          "lessonId": "hsk3-fltrp-2026:l06",
          "lesson": 6,
          "sourceText": 3,
          "audioTrack": "6-6",
          "source": {
            "pdfPage": 63,
            "printedPage": 51,
            "section": "课文3：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l06-word20",
      "zh": "越",
      "py": "yuè",
      "vi": "càng",
      "pos": "phó từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l06:word20",
          "lessonId": "hsk3-fltrp-2026:l06",
          "lesson": 6,
          "sourceText": 3,
          "audioTrack": "6-6",
          "source": {
            "pdfPage": 63,
            "printedPage": 51,
            "section": "课文3：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l06-word21",
      "zh": "分开",
      "py": "fēnkāi",
      "vi": "tách ra, chia ra",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l06:word21",
          "lessonId": "hsk3-fltrp-2026:l06",
          "lesson": 6,
          "sourceText": 3,
          "audioTrack": "6-6",
          "source": {
            "pdfPage": 63,
            "printedPage": 51,
            "section": "课文3：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l06-word22",
      "zh": "检查",
      "py": "jiǎnchá",
      "vi": "kiểm tra",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l06:word22",
          "lessonId": "hsk3-fltrp-2026:l06",
          "lesson": 6,
          "sourceText": 3,
          "audioTrack": "6-6",
          "source": {
            "pdfPage": 63,
            "printedPage": 51,
            "section": "课文3：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l06-word23",
      "zh": "刷",
      "py": "shuā",
      "vi": "quét (thẻ, giấy tờ)",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l06:word23",
          "lessonId": "hsk3-fltrp-2026:l06",
          "lesson": 6,
          "sourceText": 3,
          "audioTrack": "6-6",
          "source": {
            "pdfPage": 63,
            "printedPage": 51,
            "section": "课文3：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l06-word24",
      "zh": "检票",
      "py": "jiǎnpiào",
      "vi": "kiểm tra vé, soát vé",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l06:word24",
          "lessonId": "hsk3-fltrp-2026:l06",
          "lesson": 6,
          "sourceText": 3,
          "audioTrack": "6-6",
          "source": {
            "pdfPage": 63,
            "printedPage": 51,
            "section": "课文3：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l06-word25",
      "zh": "电梯",
      "py": "diàntī",
      "vi": "thang máy; thang cuốn",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l06:word25",
          "lessonId": "hsk3-fltrp-2026:l06",
          "lesson": 6,
          "sourceText": 3,
          "audioTrack": "6-6",
          "source": {
            "pdfPage": 63,
            "printedPage": 51,
            "section": "课文3：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l06-word26",
      "zh": "放假",
      "py": "fàngjià",
      "vi": "nghỉ lễ, được nghỉ",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l06:word26",
          "lessonId": "hsk3-fltrp-2026:l06",
          "lesson": 6,
          "sourceText": 4,
          "audioTrack": "6-8",
          "source": {
            "pdfPage": 65,
            "printedPage": 53,
            "section": "课文4：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l06-word27",
      "zh": "沙发",
      "py": "shāfā",
      "vi": "ghế sofa",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l06:word27",
          "lessonId": "hsk3-fltrp-2026:l06",
          "lesson": 6,
          "sourceText": 4,
          "audioTrack": "6-8",
          "source": {
            "pdfPage": 65,
            "printedPage": 53,
            "section": "课文4：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l06-word28",
      "zh": "安静",
      "py": "ānjìng",
      "vi": "yên tĩnh",
      "pos": "tính từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l06:word28",
          "lessonId": "hsk3-fltrp-2026:l06",
          "lesson": 6,
          "sourceText": 4,
          "audioTrack": "6-8",
          "source": {
            "pdfPage": 65,
            "printedPage": 53,
            "section": "课文4：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l06-word29",
      "zh": "选择",
      "py": "xuǎnzé",
      "vi": "lựa chọn",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l06:word29",
          "lessonId": "hsk3-fltrp-2026:l06",
          "lesson": 6,
          "sourceText": 4,
          "audioTrack": "6-8",
          "source": {
            "pdfPage": 65,
            "printedPage": 53,
            "section": "课文4：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l06-word30",
      "zh": "必须",
      "py": "bìxū",
      "vi": "phải, nhất thiết phải",
      "pos": "phó từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l06:word30",
          "lessonId": "hsk3-fltrp-2026:l06",
          "lesson": 6,
          "sourceText": 4,
          "audioTrack": "6-8",
          "source": {
            "pdfPage": 65,
            "printedPage": 53,
            "section": "课文4：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l06-word31",
      "zh": "北京南站",
      "py": "Běijīng Nán Zhàn",
      "vi": "ga Nam Bắc Kinh",
      "pos": "danh từ riêng",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l06:word31",
          "lessonId": "hsk3-fltrp-2026:l06",
          "lesson": 6,
          "sourceText": 4,
          "audioTrack": "6-8",
          "source": {
            "pdfPage": 65,
            "printedPage": 53,
            "section": "课文4：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l07-word01",
      "zh": "辆",
      "py": "liàng",
      "vi": "chiếc (lượng từ cho xe)",
      "pos": "lượng từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l07:word01",
          "lessonId": "hsk3-fltrp-2026:l07",
          "lesson": 7,
          "sourceText": 1,
          "audioTrack": "7-2",
          "source": {
            "pdfPage": 70,
            "printedPage": 58,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l07-word02",
      "zh": "自行车",
      "py": "zìxíngchē",
      "vi": "xe đạp",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l07:word02",
          "lessonId": "hsk3-fltrp-2026:l07",
          "lesson": 7,
          "sourceText": 1,
          "audioTrack": "7-2",
          "source": {
            "pdfPage": 70,
            "printedPage": 58,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l07-word03",
      "zh": "旧",
      "py": "jiù",
      "vi": "cũ",
      "pos": "tính từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l07:word03",
          "lessonId": "hsk3-fltrp-2026:l07",
          "lesson": 7,
          "sourceText": 1,
          "audioTrack": "7-2",
          "source": {
            "pdfPage": 70,
            "printedPage": 58,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l07-word04",
      "zh": "矮",
      "py": "ǎi",
      "vi": "thấp",
      "pos": "tính từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l07:word04",
          "lessonId": "hsk3-fltrp-2026:l07",
          "lesson": 7,
          "sourceText": 1,
          "audioTrack": "7-2",
          "source": {
            "pdfPage": 70,
            "printedPage": 58,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l07-word05",
      "zh": "试",
      "py": "shì",
      "vi": "thử",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l07:word05",
          "lessonId": "hsk3-fltrp-2026:l07",
          "lesson": 7,
          "sourceText": 1,
          "audioTrack": "7-2",
          "source": {
            "pdfPage": 70,
            "printedPage": 58,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l07-word06",
      "zh": "黄色",
      "py": "huángsè",
      "vi": "màu vàng",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l07:word06",
          "lessonId": "hsk3-fltrp-2026:l07",
          "lesson": 7,
          "sourceText": 2,
          "audioTrack": "7-4",
          "source": {
            "pdfPage": 72,
            "printedPage": 60,
            "section": "课文2：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l07-word07",
      "zh": "短裤",
      "py": "duǎnkù",
      "vi": "quần soóc, quần đùi",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l07:word07",
          "lessonId": "hsk3-fltrp-2026:l07",
          "lesson": 7,
          "sourceText": 2,
          "audioTrack": "7-4",
          "source": {
            "pdfPage": 72,
            "printedPage": 60,
            "section": "课文2：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l07-word08",
      "zh": "大小",
      "py": "dàxiǎo",
      "vi": "kích cỡ",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l07:word08",
          "lessonId": "hsk3-fltrp-2026:l07",
          "lesson": 7,
          "sourceText": 2,
          "audioTrack": "7-4",
          "source": {
            "pdfPage": 72,
            "printedPage": 60,
            "section": "课文2：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l07-word09",
      "zh": "合适",
      "py": "héshì",
      "vi": "phù hợp, vừa",
      "pos": "tính từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l07:word09",
          "lessonId": "hsk3-fltrp-2026:l07",
          "lesson": 7,
          "sourceText": 2,
          "audioTrack": "7-4",
          "source": {
            "pdfPage": 72,
            "printedPage": 60,
            "section": "课文2：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l07-word10",
      "zh": "裙子",
      "py": "qúnzi",
      "vi": "váy",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l07:word10",
          "lessonId": "hsk3-fltrp-2026:l07",
          "lesson": 7,
          "sourceText": 2,
          "audioTrack": "7-4",
          "source": {
            "pdfPage": 72,
            "printedPage": 60,
            "section": "课文2：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l07-word11",
      "zh": "更",
      "py": "gèng",
      "vi": "hơn, càng",
      "pos": "phó từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l07:word11",
          "lessonId": "hsk3-fltrp-2026:l07",
          "lesson": 7,
          "sourceText": 2,
          "audioTrack": "7-4",
          "source": {
            "pdfPage": 72,
            "printedPage": 60,
            "section": "课文2：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l07-word12",
      "zh": "决定",
      "py": "juédìng",
      "vi": "quyết định",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l07:word12",
          "lessonId": "hsk3-fltrp-2026:l07",
          "lesson": 7,
          "sourceText": 2,
          "audioTrack": "7-4",
          "source": {
            "pdfPage": 72,
            "printedPage": 60,
            "section": "课文2：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l07-word13",
      "zh": "决定",
      "py": "juédìng",
      "vi": "quyết định",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l07:word13",
          "lessonId": "hsk3-fltrp-2026:l07",
          "lesson": 7,
          "sourceText": 2,
          "audioTrack": "7-4",
          "source": {
            "pdfPage": 72,
            "printedPage": 60,
            "section": "课文2：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l07-word14",
      "zh": "西瓜",
      "py": "xīguā",
      "vi": "dưa hấu",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l07:word14",
          "lessonId": "hsk3-fltrp-2026:l07",
          "lesson": 7,
          "sourceText": 3,
          "audioTrack": "7-6",
          "source": {
            "pdfPage": 74,
            "printedPage": 62,
            "section": "课文3：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l07-word15",
      "zh": "新鲜",
      "py": "xīnxiān",
      "vi": "tươi, tươi mới",
      "pos": "tính từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l07:word15",
          "lessonId": "hsk3-fltrp-2026:l07",
          "lesson": 7,
          "sourceText": 3,
          "audioTrack": "7-6",
          "source": {
            "pdfPage": 74,
            "printedPage": 62,
            "section": "课文3：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l07-word16",
      "zh": "甜",
      "py": "tián",
      "vi": "ngọt",
      "pos": "tính từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l07:word16",
          "lessonId": "hsk3-fltrp-2026:l07",
          "lesson": 7,
          "sourceText": 3,
          "audioTrack": "7-6",
          "source": {
            "pdfPage": 74,
            "printedPage": 62,
            "section": "课文3：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l07-word17",
      "zh": "公斤",
      "py": "gōngjīn",
      "vi": "ki-lô-gam",
      "pos": "lượng từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l07:word17",
          "lessonId": "hsk3-fltrp-2026:l07",
          "lesson": 7,
          "sourceText": 3,
          "audioTrack": "7-6",
          "source": {
            "pdfPage": 74,
            "printedPage": 62,
            "section": "课文3：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l07-word18",
      "zh": "冰",
      "py": "bīng",
      "vi": "ướp lạnh, làm lạnh",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l07:word18",
          "lessonId": "hsk3-fltrp-2026:l07",
          "lesson": 7,
          "sourceText": 3,
          "audioTrack": "7-6",
          "source": {
            "pdfPage": 74,
            "printedPage": 62,
            "section": "课文3：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l07-word19",
      "zh": "冰",
      "py": "bīng",
      "vi": "nước đá, băng",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l07:word19",
          "lessonId": "hsk3-fltrp-2026:l07",
          "lesson": 7,
          "sourceText": 3,
          "audioTrack": "7-6",
          "source": {
            "pdfPage": 74,
            "printedPage": 62,
            "section": "课文3：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l07-word20",
      "zh": "极",
      "py": "jí",
      "vi": "cực kỳ (trong bổ ngữ 极了)",
      "pos": "phó từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l07:word20",
          "lessonId": "hsk3-fltrp-2026:l07",
          "lesson": 7,
          "sourceText": 3,
          "audioTrack": "7-6",
          "source": {
            "pdfPage": 74,
            "printedPage": 62,
            "section": "课文3：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l07-word21",
      "zh": "斤",
      "py": "jīn",
      "vi": "cân Trung Quốc (500g ở Trung Quốc đại lục)",
      "pos": "lượng từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l07:word21",
          "lessonId": "hsk3-fltrp-2026:l07",
          "lesson": 7,
          "sourceText": 3,
          "audioTrack": "7-6",
          "source": {
            "pdfPage": 74,
            "printedPage": 62,
            "section": "课文3：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l07-word22",
      "zh": "香蕉",
      "py": "xiāngjiāo",
      "vi": "chuối",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l07:word22",
          "lessonId": "hsk3-fltrp-2026:l07",
          "lesson": 7,
          "sourceText": 3,
          "audioTrack": "7-6",
          "source": {
            "pdfPage": 74,
            "printedPage": 62,
            "section": "课文3：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l07-word23",
      "zh": "一共",
      "py": "yígòng",
      "vi": "tổng cộng",
      "pos": "phó từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l07:word23",
          "lessonId": "hsk3-fltrp-2026:l07",
          "lesson": 7,
          "sourceText": 3,
          "audioTrack": "7-6",
          "source": {
            "pdfPage": 74,
            "printedPage": 62,
            "section": "课文3：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l07-word24",
      "zh": "毛",
      "py": "máo",
      "vi": "hào, một phần mười tệ",
      "pos": "lượng từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l07:word24",
          "lessonId": "hsk3-fltrp-2026:l07",
          "lesson": 7,
          "sourceText": 3,
          "audioTrack": "7-6",
          "source": {
            "pdfPage": 74,
            "printedPage": 62,
            "section": "课文3：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l07-word25",
      "zh": "结婚",
      "py": "jiéhūn",
      "vi": "kết hôn",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l07:word25",
          "lessonId": "hsk3-fltrp-2026:l07",
          "lesson": 7,
          "sourceText": 4,
          "audioTrack": "7-8",
          "source": {
            "pdfPage": 75,
            "printedPage": 63,
            "section": "课文4：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l07-word26",
      "zh": "不但",
      "py": "búdàn",
      "vi": "không những, không chỉ",
      "pos": "liên từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l07:word26",
          "lessonId": "hsk3-fltrp-2026:l07",
          "lesson": 7,
          "sourceText": 4,
          "audioTrack": "7-8",
          "source": {
            "pdfPage": 75,
            "printedPage": 63,
            "section": "课文4：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l07-word27",
      "zh": "而且",
      "py": "érqiě",
      "vi": "mà còn, hơn nữa",
      "pos": "liên từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l07:word27",
          "lessonId": "hsk3-fltrp-2026:l07",
          "lesson": 7,
          "sourceText": 4,
          "audioTrack": "7-8",
          "source": {
            "pdfPage": 75,
            "printedPage": 63,
            "section": "课文4：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l07-word28",
      "zh": "声",
      "py": "shēng",
      "vi": "tiếng (đơn vị đếm âm thanh)",
      "pos": "lượng từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l07:word28",
          "lessonId": "hsk3-fltrp-2026:l07",
          "lesson": 7,
          "sourceText": 4,
          "audioTrack": "7-8",
          "source": {
            "pdfPage": 75,
            "printedPage": 63,
            "section": "课文4：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l07-word29",
      "zh": "声",
      "py": "shēng",
      "vi": "âm thanh, tiếng",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l07:word29",
          "lessonId": "hsk3-fltrp-2026:l07",
          "lesson": 7,
          "sourceText": 4,
          "audioTrack": "7-8",
          "source": {
            "pdfPage": 75,
            "printedPage": 63,
            "section": "课文4：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l07-word30",
      "zh": "开机",
      "py": "kāijī",
      "vi": "bật máy, khởi động",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l07:word30",
          "lessonId": "hsk3-fltrp-2026:l07",
          "lesson": 7,
          "sourceText": 4,
          "audioTrack": "7-8",
          "source": {
            "pdfPage": 75,
            "printedPage": 63,
            "section": "课文4：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l08-word01",
      "zh": "最近",
      "py": "zuìjìn",
      "vi": "gần đây",
      "pos": "danh từ chỉ thời gian",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l08:word01",
          "lessonId": "hsk3-fltrp-2026:l08",
          "lesson": 8,
          "sourceText": 1,
          "audioTrack": "8-2",
          "source": {
            "pdfPage": 80,
            "printedPage": 68,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l08-word02",
      "zh": "常",
      "py": "cháng",
      "vi": "thường",
      "pos": "phó từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l08:word02",
          "lessonId": "hsk3-fltrp-2026:l08",
          "lesson": 8,
          "sourceText": 1,
          "audioTrack": "8-2",
          "source": {
            "pdfPage": 80,
            "printedPage": 68,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l08-word03",
      "zh": "体育馆",
      "py": "tǐyùguǎn",
      "vi": "nhà thi đấu, nhà thể thao",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l08:word03",
          "lessonId": "hsk3-fltrp-2026:l08",
          "lesson": 8,
          "sourceText": 1,
          "audioTrack": "8-2",
          "source": {
            "pdfPage": 80,
            "printedPage": 68,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l08-word04",
      "zh": "习惯",
      "py": "xíguàn",
      "vi": "thói quen",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l08:word04",
          "lessonId": "hsk3-fltrp-2026:l08",
          "lesson": 8,
          "sourceText": 1,
          "audioTrack": "8-2",
          "source": {
            "pdfPage": 80,
            "printedPage": 68,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l08-word05",
      "zh": "习惯",
      "py": "xíguàn",
      "vi": "quen với",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l08:word05",
          "lessonId": "hsk3-fltrp-2026:l08",
          "lesson": 8,
          "sourceText": 1,
          "audioTrack": "8-2",
          "source": {
            "pdfPage": 80,
            "printedPage": 68,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l08-word06",
      "zh": "胖",
      "py": "pàng",
      "vi": "béo, mập; tăng cân",
      "pos": "tính từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l08:word06",
          "lessonId": "hsk3-fltrp-2026:l08",
          "lesson": 8,
          "sourceText": 1,
          "audioTrack": "8-2",
          "source": {
            "pdfPage": 80,
            "printedPage": 68,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l08-word07",
      "zh": "健康",
      "py": "jiànkāng",
      "vi": "khỏe mạnh, lành mạnh",
      "pos": "tính từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l08:word07",
          "lessonId": "hsk3-fltrp-2026:l08",
          "lesson": 8,
          "sourceText": 1,
          "audioTrack": "8-2",
          "source": {
            "pdfPage": 80,
            "printedPage": 68,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l08-word08",
      "zh": "以后",
      "py": "yǐhòu",
      "vi": "sau, về sau",
      "pos": "danh từ chỉ thời gian",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l08:word08",
          "lessonId": "hsk3-fltrp-2026:l08",
          "lesson": 8,
          "sourceText": 1,
          "audioTrack": "8-2",
          "source": {
            "pdfPage": 80,
            "printedPage": 68,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l08-word09",
      "zh": "羽毛球",
      "py": "yǔmáoqiú",
      "vi": "cầu lông",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l08:word09",
          "lessonId": "hsk3-fltrp-2026:l08",
          "lesson": 8,
          "sourceText": 1,
          "audioTrack": "8-2",
          "source": {
            "pdfPage": 80,
            "printedPage": 68,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l08-word10",
      "zh": "耳朵",
      "py": "ěrduo",
      "vi": "tai",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l08:word10",
          "lessonId": "hsk3-fltrp-2026:l08",
          "lesson": 8,
          "sourceText": 2,
          "audioTrack": "8-4",
          "source": {
            "pdfPage": 82,
            "printedPage": 70,
            "section": "课文2：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l08-word11",
      "zh": "感冒",
      "py": "gǎnmào",
      "vi": "bị cảm",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l08:word11",
          "lessonId": "hsk3-fltrp-2026:l08",
          "lesson": 8,
          "sourceText": 2,
          "audioTrack": "8-4",
          "source": {
            "pdfPage": 82,
            "printedPage": 70,
            "section": "课文2：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l08-word12",
      "zh": "感冒",
      "py": "gǎnmào",
      "vi": "bệnh cảm",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l08:word12",
          "lessonId": "hsk3-fltrp-2026:l08",
          "lesson": 8,
          "sourceText": 2,
          "audioTrack": "8-4",
          "source": {
            "pdfPage": 82,
            "printedPage": 70,
            "section": "课文2：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l08-word13",
      "zh": "发烧",
      "py": "fāshāo",
      "vi": "sốt",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l08:word13",
          "lessonId": "hsk3-fltrp-2026:l08",
          "lesson": 8,
          "sourceText": 2,
          "audioTrack": "8-4",
          "source": {
            "pdfPage": 82,
            "printedPage": 70,
            "section": "课文2：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l08-word14",
      "zh": "低",
      "py": "dī",
      "vi": "thấp",
      "pos": "tính từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l08:word14",
          "lessonId": "hsk3-fltrp-2026:l08",
          "lesson": 8,
          "sourceText": 2,
          "audioTrack": "8-4",
          "source": {
            "pdfPage": 82,
            "printedPage": 70,
            "section": "课文2：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l08-word15",
      "zh": "关心",
      "py": "guānxīn",
      "vi": "quan tâm",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l08:word15",
          "lessonId": "hsk3-fltrp-2026:l08",
          "lesson": 8,
          "sourceText": 2,
          "audioTrack": "8-4",
          "source": {
            "pdfPage": 82,
            "printedPage": 70,
            "section": "课文2：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l08-word16",
      "zh": "注意",
      "py": "zhùyì",
      "vi": "chú ý",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l08:word16",
          "lessonId": "hsk3-fltrp-2026:l08",
          "lesson": 8,
          "sourceText": 2,
          "audioTrack": "8-4",
          "source": {
            "pdfPage": 82,
            "printedPage": 70,
            "section": "课文2：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l08-word17",
      "zh": "突然",
      "py": "tūrán",
      "vi": "đột ngột, bất ngờ",
      "pos": "tính từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l08:word17",
          "lessonId": "hsk3-fltrp-2026:l08",
          "lesson": 8,
          "sourceText": 3,
          "audioTrack": "8-6",
          "source": {
            "pdfPage": 83,
            "printedPage": 71,
            "section": "课文3：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l08-word18",
      "zh": "住院",
      "py": "zhùyuàn",
      "vi": "nằm viện, nhập viện",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l08:word18",
          "lessonId": "hsk3-fltrp-2026:l08",
          "lesson": 8,
          "sourceText": 3,
          "audioTrack": "8-6",
          "source": {
            "pdfPage": 83,
            "printedPage": 71,
            "section": "课文3：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l08-word19",
      "zh": "担心",
      "py": "dānxīn",
      "vi": "lo lắng",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l08:word19",
          "lessonId": "hsk3-fltrp-2026:l08",
          "lesson": 8,
          "sourceText": 3,
          "audioTrack": "8-6",
          "source": {
            "pdfPage": 83,
            "printedPage": 71,
            "section": "课文3：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l08-word20",
      "zh": "腿",
      "py": "tuǐ",
      "vi": "chân (phần từ hông đến cổ chân)",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l08:word20",
          "lessonId": "hsk3-fltrp-2026:l08",
          "lesson": 8,
          "sourceText": 3,
          "audioTrack": "8-6",
          "source": {
            "pdfPage": 83,
            "printedPage": 71,
            "section": "课文3：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l08-word21",
      "zh": "病人",
      "py": "bìngrén",
      "vi": "bệnh nhân",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l08:word21",
          "lessonId": "hsk3-fltrp-2026:l08",
          "lesson": 8,
          "sourceText": 3,
          "audioTrack": "8-6",
          "source": {
            "pdfPage": 83,
            "printedPage": 71,
            "section": "课文3：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l08-word22",
      "zh": "差不多",
      "py": "chàbuduō",
      "vi": "gần, xấp xỉ",
      "pos": "phó từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l08:word22",
          "lessonId": "hsk3-fltrp-2026:l08",
          "lesson": 8,
          "sourceText": 3,
          "audioTrack": "8-6",
          "source": {
            "pdfPage": 83,
            "printedPage": 71,
            "section": "课文3：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l08-word23",
      "zh": "差不多",
      "py": "chàbuduō",
      "vi": "gần giống nhau",
      "pos": "tính từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l08:word23",
          "lessonId": "hsk3-fltrp-2026:l08",
          "lesson": 8,
          "sourceText": 3,
          "audioTrack": "8-6",
          "source": {
            "pdfPage": 83,
            "printedPage": 71,
            "section": "课文3：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l08-word24",
      "zh": "得",
      "py": "děi",
      "vi": "phải, cần phải",
      "pos": "động từ năng nguyện",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l08:word24",
          "lessonId": "hsk3-fltrp-2026:l08",
          "lesson": 8,
          "sourceText": 3,
          "audioTrack": "8-6",
          "source": {
            "pdfPage": 83,
            "printedPage": 71,
            "section": "课文3：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l08-word25",
      "zh": "开心",
      "py": "kāixīn",
      "vi": "vui vẻ",
      "pos": "tính từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l08:word25",
          "lessonId": "hsk3-fltrp-2026:l08",
          "lesson": 8,
          "sourceText": 3,
          "audioTrack": "8-6",
          "source": {
            "pdfPage": 83,
            "printedPage": 71,
            "section": "课文3：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l08-word26",
      "zh": "出院",
      "py": "chūyuàn",
      "vi": "xuất viện",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l08:word26",
          "lessonId": "hsk3-fltrp-2026:l08",
          "lesson": 8,
          "sourceText": 4,
          "audioTrack": "8-8",
          "source": {
            "pdfPage": 85,
            "printedPage": 73,
            "section": "课文4：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l08-word27",
      "zh": "开",
      "py": "kāi",
      "vi": "kê (đơn thuốc)",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l08:word27",
          "lessonId": "hsk3-fltrp-2026:l08",
          "lesson": 8,
          "sourceText": 4,
          "audioTrack": "8-8",
          "source": {
            "pdfPage": 85,
            "printedPage": 73,
            "section": "课文4：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l08-word28",
      "zh": "种",
      "py": "zhǒng",
      "vi": "loại",
      "pos": "lượng từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l08:word28",
          "lessonId": "hsk3-fltrp-2026:l08",
          "lesson": 8,
          "sourceText": 4,
          "audioTrack": "8-8",
          "source": {
            "pdfPage": 85,
            "printedPage": 73,
            "section": "课文4：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l08-word29",
      "zh": "方法",
      "py": "fāngfǎ",
      "vi": "phương pháp, cách",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l08:word29",
          "lessonId": "hsk3-fltrp-2026:l08",
          "lesson": 8,
          "sourceText": 4,
          "audioTrack": "8-8",
          "source": {
            "pdfPage": 85,
            "printedPage": 73,
            "section": "课文4：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l08-word30",
      "zh": "其他",
      "py": "qítā",
      "vi": "khác, còn lại",
      "pos": "đại từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l08:word30",
          "lessonId": "hsk3-fltrp-2026:l08",
          "lesson": 8,
          "sourceText": 4,
          "audioTrack": "8-8",
          "source": {
            "pdfPage": 85,
            "printedPage": 73,
            "section": "课文4：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l08-word31",
      "zh": "心里",
      "py": "xīnlǐ",
      "vi": "trong lòng, trong tâm trí",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l08:word31",
          "lessonId": "hsk3-fltrp-2026:l08",
          "lesson": 8,
          "sourceText": 4,
          "audioTrack": "8-8",
          "source": {
            "pdfPage": 85,
            "printedPage": 73,
            "section": "课文4：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l09-word01",
      "zh": "校园",
      "py": "xiàoyuán",
      "vi": "khuôn viên trường",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l09:word01",
          "lessonId": "hsk3-fltrp-2026:l09",
          "lesson": 9,
          "sourceText": 1,
          "audioTrack": "9-2",
          "source": {
            "pdfPage": 89,
            "printedPage": 77,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l09-word02",
      "zh": "卡",
      "py": "kǎ",
      "vi": "thẻ",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l09:word02",
          "lessonId": "hsk3-fltrp-2026:l09",
          "lesson": 9,
          "sourceText": 1,
          "audioTrack": "9-2",
          "source": {
            "pdfPage": 89,
            "printedPage": 77,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l09-word03",
      "zh": "球场",
      "py": "qiúchǎng",
      "vi": "sân bóng, sân thi đấu",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l09:word03",
          "lessonId": "hsk3-fltrp-2026:l09",
          "lesson": 9,
          "sourceText": 1,
          "audioTrack": "9-2",
          "source": {
            "pdfPage": 89,
            "printedPage": 77,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l09-word04",
      "zh": "为了",
      "py": "wèile",
      "vi": "để, nhằm",
      "pos": "giới từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l09:word04",
          "lessonId": "hsk3-fltrp-2026:l09",
          "lesson": 9,
          "sourceText": 1,
          "audioTrack": "9-2",
          "source": {
            "pdfPage": 89,
            "printedPage": 77,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l09-word05",
      "zh": "运动会",
      "py": "yùndònghuì",
      "vi": "hội thao, đại hội thể thao",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l09:word05",
          "lessonId": "hsk3-fltrp-2026:l09",
          "lesson": 9,
          "sourceText": 1,
          "audioTrack": "9-2",
          "source": {
            "pdfPage": 89,
            "printedPage": 77,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l09-word06",
      "zh": "男生",
      "py": "nánshēng",
      "vi": "nam sinh",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l09:word06",
          "lessonId": "hsk3-fltrp-2026:l09",
          "lesson": 9,
          "sourceText": 1,
          "audioTrack": "9-2",
          "source": {
            "pdfPage": 89,
            "printedPage": 77,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l09-word07",
      "zh": "练",
      "py": "liàn",
      "vi": "tập, luyện",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l09:word07",
          "lessonId": "hsk3-fltrp-2026:l09",
          "lesson": 9,
          "sourceText": 1,
          "audioTrack": "9-2",
          "source": {
            "pdfPage": 89,
            "printedPage": 77,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l09-word08",
      "zh": "参加",
      "py": "cānjiā",
      "vi": "tham gia",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l09:word08",
          "lessonId": "hsk3-fltrp-2026:l09",
          "lesson": 9,
          "sourceText": 1,
          "audioTrack": "9-2",
          "source": {
            "pdfPage": 89,
            "printedPage": 77,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l09-word09",
      "zh": "网球",
      "py": "wǎngqiú",
      "vi": "quần vợt, tennis",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l09:word09",
          "lessonId": "hsk3-fltrp-2026:l09",
          "lesson": 9,
          "sourceText": 1,
          "audioTrack": "9-2",
          "source": {
            "pdfPage": 89,
            "printedPage": 77,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l09-word10",
      "zh": "比赛",
      "py": "bǐsài",
      "vi": "trận đấu, cuộc thi",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l09:word10",
          "lessonId": "hsk3-fltrp-2026:l09",
          "lesson": 9,
          "sourceText": 1,
          "audioTrack": "9-2",
          "source": {
            "pdfPage": 89,
            "printedPage": 77,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l09-word11",
      "zh": "比赛",
      "py": "bǐsài",
      "vi": "thi đấu",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l09:word11",
          "lessonId": "hsk3-fltrp-2026:l09",
          "lesson": 9,
          "sourceText": 1,
          "audioTrack": "9-2",
          "source": {
            "pdfPage": 89,
            "printedPage": 77,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l09-word12",
      "zh": "练习",
      "py": "liànxí",
      "vi": "luyện tập",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l09:word12",
          "lessonId": "hsk3-fltrp-2026:l09",
          "lesson": 9,
          "sourceText": 1,
          "audioTrack": "9-2",
          "source": {
            "pdfPage": 89,
            "printedPage": 77,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l09-word13",
      "zh": "练习",
      "py": "liànxí",
      "vi": "bài tập, việc luyện tập",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l09:word13",
          "lessonId": "hsk3-fltrp-2026:l09",
          "lesson": 9,
          "sourceText": 1,
          "audioTrack": "9-2",
          "source": {
            "pdfPage": 89,
            "printedPage": 77,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l09-word14",
      "zh": "好多",
      "py": "hǎoduō",
      "vi": "rất nhiều",
      "pos": "số từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l09:word14",
          "lessonId": "hsk3-fltrp-2026:l09",
          "lesson": 9,
          "sourceText": 2,
          "audioTrack": "9-4",
          "source": {
            "pdfPage": 91,
            "printedPage": 79,
            "section": "课文2：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l09-word15",
      "zh": "几乎",
      "py": "jīhū",
      "vi": "gần như, hầu như",
      "pos": "phó từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l09:word15",
          "lessonId": "hsk3-fltrp-2026:l09",
          "lesson": 9,
          "sourceText": 2,
          "audioTrack": "9-4",
          "source": {
            "pdfPage": 91,
            "printedPage": 79,
            "section": "课文2：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l09-word16",
      "zh": "只是",
      "py": "zhǐshì",
      "vi": "chỉ, chỉ là",
      "pos": "phó từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l09:word16",
          "lessonId": "hsk3-fltrp-2026:l09",
          "lesson": 9,
          "sourceText": 2,
          "audioTrack": "9-4",
          "source": {
            "pdfPage": 91,
            "printedPage": 79,
            "section": "课文2：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l09-word17",
      "zh": "只是",
      "py": "zhǐshì",
      "vi": "chỉ có điều, nhưng",
      "pos": "liên từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l09:word17",
          "lessonId": "hsk3-fltrp-2026:l09",
          "lesson": 9,
          "sourceText": 2,
          "audioTrack": "9-4",
          "source": {
            "pdfPage": 91,
            "printedPage": 79,
            "section": "课文2：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l09-word18",
      "zh": "啤酒",
      "py": "píjiǔ",
      "vi": "bia",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l09:word18",
          "lessonId": "hsk3-fltrp-2026:l09",
          "lesson": 9,
          "sourceText": 3,
          "audioTrack": "9-6",
          "source": {
            "pdfPage": 93,
            "printedPage": 81,
            "section": "课文3：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l09-word19",
      "zh": "回",
      "py": "huí",
      "vi": "chuyện, lần (đếm sự việc)",
      "pos": "lượng từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l09:word19",
          "lessonId": "hsk3-fltrp-2026:l09",
          "lesson": 9,
          "sourceText": 3,
          "audioTrack": "9-6",
          "source": {
            "pdfPage": 93,
            "printedPage": 81,
            "section": "课文3：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l09-word20",
      "zh": "紧张",
      "py": "jǐnzhāng",
      "vi": "căng thẳng, hồi hộp",
      "pos": "tính từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l09:word20",
          "lessonId": "hsk3-fltrp-2026:l09",
          "lesson": 9,
          "sourceText": 3,
          "audioTrack": "9-6",
          "source": {
            "pdfPage": 93,
            "printedPage": 81,
            "section": "课文3：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l09-word21",
      "zh": "主要",
      "py": "zhǔyào",
      "vi": "chính, chủ yếu",
      "pos": "tính từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l09:word21",
          "lessonId": "hsk3-fltrp-2026:l09",
          "lesson": 9,
          "sourceText": 3,
          "audioTrack": "9-6",
          "source": {
            "pdfPage": 93,
            "printedPage": 81,
            "section": "课文3：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l09-word22",
      "zh": "受到",
      "py": "shòudào",
      "vi": "chịu, nhận (tác động)",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l09:word22",
          "lessonId": "hsk3-fltrp-2026:l09",
          "lesson": 9,
          "sourceText": 3,
          "audioTrack": "9-6",
          "source": {
            "pdfPage": 93,
            "printedPage": 81,
            "section": "课文3：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l09-word23",
      "zh": "影响",
      "py": "yǐngxiǎng",
      "vi": "ảnh hưởng",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l09:word23",
          "lessonId": "hsk3-fltrp-2026:l09",
          "lesson": 9,
          "sourceText": 3,
          "audioTrack": "9-6",
          "source": {
            "pdfPage": 93,
            "printedPage": 81,
            "section": "课文3：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l09-word24",
      "zh": "影响",
      "py": "yǐngxiǎng",
      "vi": "ảnh hưởng đến",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l09:word24",
          "lessonId": "hsk3-fltrp-2026:l09",
          "lesson": 9,
          "sourceText": 3,
          "audioTrack": "9-6",
          "source": {
            "pdfPage": 93,
            "printedPage": 81,
            "section": "课文3：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l09-word25",
      "zh": "得分",
      "py": "défēn",
      "vi": "ghi điểm",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l09:word25",
          "lessonId": "hsk3-fltrp-2026:l09",
          "lesson": 9,
          "sourceText": 3,
          "audioTrack": "9-6",
          "source": {
            "pdfPage": 93,
            "printedPage": 81,
            "section": "课文3：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l09-word26",
      "zh": "得分",
      "py": "défēn",
      "vi": "điểm số",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l09:word26",
          "lessonId": "hsk3-fltrp-2026:l09",
          "lesson": 9,
          "sourceText": 3,
          "audioTrack": "9-6",
          "source": {
            "pdfPage": 93,
            "printedPage": 81,
            "section": "课文3：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l09-word27",
      "zh": "体育",
      "py": "tǐyù",
      "vi": "thể thao, thể dục",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l09:word27",
          "lessonId": "hsk3-fltrp-2026:l09",
          "lesson": 9,
          "sourceText": 4,
          "audioTrack": "9-8",
          "source": {
            "pdfPage": 94,
            "printedPage": 82,
            "section": "课文4：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l09-word28",
      "zh": "世界",
      "py": "shìjiè",
      "vi": "thế giới",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l09:word28",
          "lessonId": "hsk3-fltrp-2026:l09",
          "lesson": 9,
          "sourceText": 4,
          "audioTrack": "9-8",
          "source": {
            "pdfPage": 94,
            "printedPage": 82,
            "section": "课文4：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l09-word29",
      "zh": "运动员",
      "py": "yùndòngyuán",
      "vi": "vận động viên",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l09:word29",
          "lessonId": "hsk3-fltrp-2026:l09",
          "lesson": 9,
          "sourceText": 4,
          "audioTrack": "9-8",
          "source": {
            "pdfPage": 94,
            "printedPage": 82,
            "section": "课文4：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l09-word30",
      "zh": "得到",
      "py": "dédào",
      "vi": "nhận được, đạt được",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l09:word30",
          "lessonId": "hsk3-fltrp-2026:l09",
          "lesson": 9,
          "sourceText": 4,
          "audioTrack": "9-8",
          "source": {
            "pdfPage": 94,
            "printedPage": 82,
            "section": "课文4：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l09-word31",
      "zh": "成绩",
      "py": "chéngjì",
      "vi": "thành tích, kết quả",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l09:word31",
          "lessonId": "hsk3-fltrp-2026:l09",
          "lesson": 9,
          "sourceText": 4,
          "audioTrack": "9-8",
          "source": {
            "pdfPage": 94,
            "printedPage": 82,
            "section": "课文4：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l09-word32",
      "zh": "奥运会",
      "py": "Àoyùnhuì",
      "vi": "Thế vận hội",
      "pos": "danh từ riêng",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l09:word32",
          "lessonId": "hsk3-fltrp-2026:l09",
          "lesson": 9,
          "sourceText": 4,
          "audioTrack": "9-8",
          "source": {
            "pdfPage": 94,
            "printedPage": 82,
            "section": "课文4：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l09-word33",
      "zh": "刘长春",
      "py": "Liú Chángchūn",
      "vi": "Lưu Trường Xuân",
      "pos": "danh từ riêng",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l09:word33",
          "lessonId": "hsk3-fltrp-2026:l09",
          "lesson": 9,
          "sourceText": 4,
          "audioTrack": "9-8",
          "source": {
            "pdfPage": 94,
            "printedPage": 82,
            "section": "课文4：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l10-word01",
      "zh": "数学",
      "py": "shùxué",
      "vi": "toán học",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l10:word01",
          "lessonId": "hsk3-fltrp-2026:l10",
          "lesson": 10,
          "sourceText": 1,
          "audioTrack": "10-2",
          "source": {
            "pdfPage": 99,
            "printedPage": 87,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l10-word02",
      "zh": "认真",
      "py": "rènzhēn",
      "vi": "nghiêm túc, chăm chú",
      "pos": "tính từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l10:word02",
          "lessonId": "hsk3-fltrp-2026:l10",
          "lesson": 10,
          "sourceText": 1,
          "audioTrack": "10-2",
          "source": {
            "pdfPage": 99,
            "printedPage": 87,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l10-word03",
      "zh": "笔记",
      "py": "bǐjì",
      "vi": "ghi chép, vở ghi",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l10:word03",
          "lessonId": "hsk3-fltrp-2026:l10",
          "lesson": 10,
          "sourceText": 1,
          "audioTrack": "10-2",
          "source": {
            "pdfPage": 99,
            "printedPage": 87,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l10-word04",
      "zh": "清楚",
      "py": "qīngchu",
      "vi": "rõ ràng",
      "pos": "tính từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l10:word04",
          "lessonId": "hsk3-fltrp-2026:l10",
          "lesson": 10,
          "sourceText": 1,
          "audioTrack": "10-2",
          "source": {
            "pdfPage": 99,
            "printedPage": 87,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l10-word05",
      "zh": "清楚",
      "py": "qīngchu",
      "vi": "biết rõ",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l10:word05",
          "lessonId": "hsk3-fltrp-2026:l10",
          "lesson": 10,
          "sourceText": 1,
          "audioTrack": "10-2",
          "source": {
            "pdfPage": 99,
            "printedPage": 87,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l10-word06",
      "zh": "黑板",
      "py": "hēibǎn",
      "vi": "bảng đen",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l10:word06",
          "lessonId": "hsk3-fltrp-2026:l10",
          "lesson": 10,
          "sourceText": 1,
          "audioTrack": "10-2",
          "source": {
            "pdfPage": 99,
            "printedPage": 87,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l10-word07",
      "zh": "把",
      "py": "bǎ",
      "vi": "đưa tân ngữ xác định lên trước động từ để nói cách xử lý",
      "pos": "giới từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l10:word07",
          "lessonId": "hsk3-fltrp-2026:l10",
          "lesson": 10,
          "sourceText": 1,
          "audioTrack": "10-2",
          "source": {
            "pdfPage": 99,
            "printedPage": 87,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l10-word08",
      "zh": "作业",
      "py": "zuòyè",
      "vi": "bài tập về nhà",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l10:word08",
          "lessonId": "hsk3-fltrp-2026:l10",
          "lesson": 10,
          "sourceText": 1,
          "audioTrack": "10-2",
          "source": {
            "pdfPage": 99,
            "printedPage": 87,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l10-word09",
      "zh": "遍",
      "py": "biàn",
      "vi": "lượt, lần từ đầu đến cuối",
      "pos": "lượng từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l10:word09",
          "lessonId": "hsk3-fltrp-2026:l10",
          "lesson": 10,
          "sourceText": 1,
          "audioTrack": "10-2",
          "source": {
            "pdfPage": 99,
            "printedPage": 87,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l10-word10",
      "zh": "提高",
      "py": "tígāo",
      "vi": "nâng cao, cải thiện",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l10:word10",
          "lessonId": "hsk3-fltrp-2026:l10",
          "lesson": 10,
          "sourceText": 1,
          "audioTrack": "10-2",
          "source": {
            "pdfPage": 99,
            "printedPage": 87,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l10-word11",
      "zh": "历史",
      "py": "lìshǐ",
      "vi": "lịch sử",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l10:word11",
          "lessonId": "hsk3-fltrp-2026:l10",
          "lesson": 10,
          "sourceText": 2,
          "audioTrack": "10-4",
          "source": {
            "pdfPage": 101,
            "printedPage": 89,
            "section": "课文2：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l10-word12",
      "zh": "难",
      "py": "nán",
      "vi": "khó",
      "pos": "tính từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l10:word12",
          "lessonId": "hsk3-fltrp-2026:l10",
          "lesson": 10,
          "sourceText": 2,
          "audioTrack": "10-4",
          "source": {
            "pdfPage": 101,
            "printedPage": 89,
            "section": "课文2：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l10-word13",
      "zh": "要求",
      "py": "yāoqiú",
      "vi": "yêu cầu",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l10:word13",
          "lessonId": "hsk3-fltrp-2026:l10",
          "lesson": 10,
          "sourceText": 2,
          "audioTrack": "10-4",
          "source": {
            "pdfPage": 101,
            "printedPage": 89,
            "section": "课文2：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l10-word14",
      "zh": "要求",
      "py": "yāoqiú",
      "vi": "yêu cầu, đòi hỏi",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l10:word14",
          "lessonId": "hsk3-fltrp-2026:l10",
          "lesson": 10,
          "sourceText": 2,
          "audioTrack": "10-4",
          "source": {
            "pdfPage": 101,
            "printedPage": 89,
            "section": "课文2：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l10-word15",
      "zh": "差",
      "py": "chà",
      "vi": "kém, tệ",
      "pos": "tính từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l10:word15",
          "lessonId": "hsk3-fltrp-2026:l10",
          "lesson": 10,
          "sourceText": 2,
          "audioTrack": "10-4",
          "source": {
            "pdfPage": 101,
            "printedPage": 89,
            "section": "课文2：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l10-word16",
      "zh": "差",
      "py": "chà",
      "vi": "thiếu",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l10:word16",
          "lessonId": "hsk3-fltrp-2026:l10",
          "lesson": 10,
          "sourceText": 2,
          "audioTrack": "10-4",
          "source": {
            "pdfPage": 101,
            "printedPage": 89,
            "section": "课文2：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l10-word17",
      "zh": "复习",
      "py": "fùxí",
      "vi": "ôn tập",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l10:word17",
          "lessonId": "hsk3-fltrp-2026:l10",
          "lesson": 10,
          "sourceText": 2,
          "audioTrack": "10-4",
          "source": {
            "pdfPage": 101,
            "printedPage": 89,
            "section": "课文2：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l10-word18",
      "zh": "外语",
      "py": "wàiyǔ",
      "vi": "ngoại ngữ",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l10:word18",
          "lessonId": "hsk3-fltrp-2026:l10",
          "lesson": 10,
          "sourceText": 2,
          "audioTrack": "10-4",
          "source": {
            "pdfPage": 101,
            "printedPage": 89,
            "section": "课文2：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l10-word19",
      "zh": "当然",
      "py": "dāngrán",
      "vi": "đương nhiên",
      "pos": "phó từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l10:word19",
          "lessonId": "hsk3-fltrp-2026:l10",
          "lesson": 10,
          "sourceText": 2,
          "audioTrack": "10-4",
          "source": {
            "pdfPage": 101,
            "printedPage": 89,
            "section": "课文2：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l10-word20",
      "zh": "遇到",
      "py": "yùdào",
      "vi": "gặp, gặp phải",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l10:word20",
          "lessonId": "hsk3-fltrp-2026:l10",
          "lesson": 10,
          "sourceText": 2,
          "audioTrack": "10-4",
          "source": {
            "pdfPage": 101,
            "printedPage": 89,
            "section": "课文2：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l10-word21",
      "zh": "办公室",
      "py": "bàngōngshì",
      "vi": "văn phòng",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l10:word21",
          "lessonId": "hsk3-fltrp-2026:l10",
          "lesson": 10,
          "sourceText": 2,
          "audioTrack": "10-4",
          "source": {
            "pdfPage": 101,
            "printedPage": 89,
            "section": "课文2：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l10-word22",
      "zh": "页",
      "py": "yè",
      "vi": "trang",
      "pos": "lượng từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l10:word22",
          "lessonId": "hsk3-fltrp-2026:l10",
          "lesson": 10,
          "sourceText": 3,
          "audioTrack": "10-6",
          "source": {
            "pdfPage": 103,
            "printedPage": 91,
            "section": "课文3：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l10-word23",
      "zh": "对话",
      "py": "duìhuà",
      "vi": "đối thoại, trò chuyện",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l10:word23",
          "lessonId": "hsk3-fltrp-2026:l10",
          "lesson": 10,
          "sourceText": 3,
          "audioTrack": "10-6",
          "source": {
            "pdfPage": 103,
            "printedPage": 91,
            "section": "课文3：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l10-word24",
      "zh": "明白",
      "py": "míngbai",
      "vi": "hiểu",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l10:word24",
          "lessonId": "hsk3-fltrp-2026:l10",
          "lesson": 10,
          "sourceText": 3,
          "audioTrack": "10-6",
          "source": {
            "pdfPage": 103,
            "printedPage": 91,
            "section": "课文3：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l10-word25",
      "zh": "明白",
      "py": "míngbai",
      "vi": "rõ ràng",
      "pos": "tính từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l10:word25",
          "lessonId": "hsk3-fltrp-2026:l10",
          "lesson": 10,
          "sourceText": 3,
          "audioTrack": "10-6",
          "source": {
            "pdfPage": 103,
            "printedPage": 91,
            "section": "课文3：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l10-word26",
      "zh": "讲",
      "py": "jiǎng",
      "vi": "giảng, giải thích",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l10:word26",
          "lessonId": "hsk3-fltrp-2026:l10",
          "lesson": 10,
          "sourceText": 3,
          "audioTrack": "10-6",
          "source": {
            "pdfPage": 103,
            "printedPage": 91,
            "section": "课文3：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l10-word27",
      "zh": "句",
      "py": "jù",
      "vi": "câu (lượng từ cho lời nói, câu văn)",
      "pos": "lượng từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l10:word27",
          "lessonId": "hsk3-fltrp-2026:l10",
          "lesson": 10,
          "sourceText": 3,
          "audioTrack": "10-6",
          "source": {
            "pdfPage": 103,
            "printedPage": 91,
            "section": "课文3：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l10-word28",
      "zh": "句子",
      "py": "jùzi",
      "vi": "câu",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l10:word28",
          "lessonId": "hsk3-fltrp-2026:l10",
          "lesson": 10,
          "sourceText": 3,
          "audioTrack": "10-6",
          "source": {
            "pdfPage": 103,
            "printedPage": 91,
            "section": "课文3：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l10-word29",
      "zh": "年级",
      "py": "niánjí",
      "vi": "khối lớp, năm học",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l10:word29",
          "lessonId": "hsk3-fltrp-2026:l10",
          "lesson": 10,
          "sourceText": 4,
          "audioTrack": "10-8",
          "source": {
            "pdfPage": 104,
            "printedPage": 92,
            "section": "课文4：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l10-word30",
      "zh": "后年",
      "py": "hòunián",
      "vi": "năm sau nữa",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l10:word30",
          "lessonId": "hsk3-fltrp-2026:l10",
          "lesson": 10,
          "sourceText": 4,
          "audioTrack": "10-8",
          "source": {
            "pdfPage": 104,
            "printedPage": 92,
            "section": "课文4：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l10-word31",
      "zh": "一般",
      "py": "yìbān",
      "vi": "thông thường, phổ biến",
      "pos": "tính từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l10:word31",
          "lessonId": "hsk3-fltrp-2026:l10",
          "lesson": 10,
          "sourceText": 4,
          "audioTrack": "10-8",
          "source": {
            "pdfPage": 104,
            "printedPage": 92,
            "section": "课文4：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l10-word32",
      "zh": "努力",
      "py": "nǔlì",
      "vi": "chăm chỉ, nỗ lực",
      "pos": "tính từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l10:word32",
          "lessonId": "hsk3-fltrp-2026:l10",
          "lesson": 10,
          "sourceText": 4,
          "audioTrack": "10-8",
          "source": {
            "pdfPage": 104,
            "printedPage": 92,
            "section": "课文4：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l10-word33",
      "zh": "努力",
      "py": "nǔlì",
      "vi": "cố gắng, nỗ lực",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l10:word33",
          "lessonId": "hsk3-fltrp-2026:l10",
          "lesson": 10,
          "sourceText": 4,
          "audioTrack": "10-8",
          "source": {
            "pdfPage": 104,
            "printedPage": 92,
            "section": "课文4：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l11-word01",
      "zh": "会议",
      "py": "huìyì",
      "vi": "cuộc họp, hội nghị",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l11:word01",
          "lessonId": "hsk3-fltrp-2026:l11",
          "lesson": 11,
          "sourceText": 1,
          "audioTrack": "11-2",
          "source": {
            "pdfPage": 108,
            "printedPage": 96,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l11-word02",
      "zh": "经理",
      "py": "jīnglǐ",
      "vi": "quản lý, giám đốc",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l11:word02",
          "lessonId": "hsk3-fltrp-2026:l11",
          "lesson": 11,
          "sourceText": 1,
          "audioTrack": "11-2",
          "source": {
            "pdfPage": 108,
            "printedPage": 96,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l11-word03",
      "zh": "开会",
      "py": "kāihuì",
      "vi": "họp",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l11:word03",
          "lessonId": "hsk3-fltrp-2026:l11",
          "lesson": 11,
          "sourceText": 1,
          "audioTrack": "11-2",
          "source": {
            "pdfPage": 108,
            "printedPage": 96,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l11-word04",
      "zh": "后天",
      "py": "hòutiān",
      "vi": "ngày kia",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l11:word04",
          "lessonId": "hsk3-fltrp-2026:l11",
          "lesson": 11,
          "sourceText": 1,
          "audioTrack": "11-2",
          "source": {
            "pdfPage": 108,
            "printedPage": 96,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l11-word05",
      "zh": "地点",
      "py": "dìdiǎn",
      "vi": "địa điểm",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l11:word05",
          "lessonId": "hsk3-fltrp-2026:l11",
          "lesson": 11,
          "sourceText": 1,
          "audioTrack": "11-2",
          "source": {
            "pdfPage": 108,
            "printedPage": 96,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l11-word06",
      "zh": "室",
      "py": "shì",
      "vi": "phòng",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l11:word06",
          "lessonId": "hsk3-fltrp-2026:l11",
          "lesson": 11,
          "sourceText": 1,
          "audioTrack": "11-2",
          "source": {
            "pdfPage": 108,
            "printedPage": 96,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l11-word07",
      "zh": "发",
      "py": "fā",
      "vi": "gửi",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l11:word07",
          "lessonId": "hsk3-fltrp-2026:l11",
          "lesson": 11,
          "sourceText": 1,
          "audioTrack": "11-2",
          "source": {
            "pdfPage": 108,
            "printedPage": 96,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l11-word08",
      "zh": "笔记本（电脑）",
      "py": "bǐjìběn (diànnǎo)",
      "vi": "máy tính xách tay",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l11:word08",
          "lessonId": "hsk3-fltrp-2026:l11",
          "lesson": 11,
          "sourceText": 1,
          "audioTrack": "11-2",
          "source": {
            "pdfPage": 108,
            "printedPage": 96,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l11-word09",
      "zh": "或者",
      "py": "huòzhě",
      "vi": "hoặc",
      "pos": "liên từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l11:word09",
          "lessonId": "hsk3-fltrp-2026:l11",
          "lesson": 11,
          "sourceText": 1,
          "audioTrack": "11-2",
          "source": {
            "pdfPage": 108,
            "printedPage": 96,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l11-word10",
      "zh": "声音",
      "py": "shēngyīn",
      "vi": "âm thanh, tiếng",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l11:word10",
          "lessonId": "hsk3-fltrp-2026:l11",
          "lesson": 11,
          "sourceText": 2,
          "audioTrack": "11-4",
          "source": {
            "pdfPage": 110,
            "printedPage": 98,
            "section": "课文2：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l11-word11",
      "zh": "看来",
      "py": "kànlái",
      "vi": "xem ra, có vẻ",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l11:word11",
          "lessonId": "hsk3-fltrp-2026:l11",
          "lesson": 11,
          "sourceText": 2,
          "audioTrack": "11-4",
          "source": {
            "pdfPage": 110,
            "printedPage": 98,
            "section": "课文2：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l11-word12",
      "zh": "办法",
      "py": "bànfǎ",
      "vi": "cách, biện pháp",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l11:word12",
          "lessonId": "hsk3-fltrp-2026:l11",
          "lesson": 11,
          "sourceText": 2,
          "audioTrack": "11-4",
          "source": {
            "pdfPage": 110,
            "printedPage": 98,
            "section": "课文2：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l11-word13",
      "zh": "解决",
      "py": "jiějué",
      "vi": "giải quyết",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l11:word13",
          "lessonId": "hsk3-fltrp-2026:l11",
          "lesson": 11,
          "sourceText": 2,
          "audioTrack": "11-4",
          "source": {
            "pdfPage": 110,
            "printedPage": 98,
            "section": "课文2：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l11-word14",
      "zh": "只能",
      "py": "zhǐ néng",
      "vi": "chỉ có thể, chỉ còn cách",
      "pos": "cụm từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l11:word14",
          "lessonId": "hsk3-fltrp-2026:l11",
          "lesson": 11,
          "sourceText": 2,
          "audioTrack": "11-4",
          "source": {
            "pdfPage": 110,
            "printedPage": 98,
            "section": "课文2：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l11-word15",
      "zh": "别人",
      "py": "biérén",
      "vi": "người khác",
      "pos": "đại từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l11:word15",
          "lessonId": "hsk3-fltrp-2026:l11",
          "lesson": 11,
          "sourceText": 2,
          "audioTrack": "11-4",
          "source": {
            "pdfPage": 110,
            "printedPage": 98,
            "section": "课文2：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l11-word16",
      "zh": "请假",
      "py": "qǐngjià",
      "vi": "xin nghỉ phép",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l11:word16",
          "lessonId": "hsk3-fltrp-2026:l11",
          "lesson": 11,
          "sourceText": 3,
          "audioTrack": "11-6",
          "source": {
            "pdfPage": 111,
            "printedPage": 99,
            "section": "课文3：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l11-word17",
      "zh": "同事",
      "py": "tóngshì",
      "vi": "đồng nghiệp",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l11:word17",
          "lessonId": "hsk3-fltrp-2026:l11",
          "lesson": 11,
          "sourceText": 3,
          "audioTrack": "11-6",
          "source": {
            "pdfPage": 111,
            "printedPage": 99,
            "section": "课文3：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l11-word18",
      "zh": "休假",
      "py": "xiūjià",
      "vi": "nghỉ phép, nghỉ kỳ nghỉ",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l11:word18",
          "lessonId": "hsk3-fltrp-2026:l11",
          "lesson": 11,
          "sourceText": 3,
          "audioTrack": "11-6",
          "source": {
            "pdfPage": 111,
            "printedPage": 99,
            "section": "课文3：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l11-word19",
      "zh": "怕",
      "py": "pà",
      "vi": "sợ",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l11:word19",
          "lessonId": "hsk3-fltrp-2026:l11",
          "lesson": 11,
          "sourceText": 3,
          "audioTrack": "11-6",
          "source": {
            "pdfPage": 111,
            "printedPage": 99,
            "section": "课文3：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l11-word20",
      "zh": "邮箱",
      "py": "yóuxiāng",
      "vi": "hộp thư, địa chỉ email",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l11:word20",
          "lessonId": "hsk3-fltrp-2026:l11",
          "lesson": 11,
          "sourceText": 3,
          "audioTrack": "11-6",
          "source": {
            "pdfPage": 111,
            "printedPage": 99,
            "section": "课文3：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l11-word21",
      "zh": "老张",
      "py": "Lǎo Zhāng",
      "vi": "anh/chú Trương (cách gọi thân mật)",
      "pos": "danh từ riêng",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l11:word21",
          "lessonId": "hsk3-fltrp-2026:l11",
          "lesson": 11,
          "sourceText": 3,
          "audioTrack": "11-6",
          "source": {
            "pdfPage": 111,
            "printedPage": 99,
            "section": "课文3：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l11-word22",
      "zh": "愿意",
      "py": "yuànyì",
      "vi": "sẵn lòng, muốn",
      "pos": "động từ năng nguyện",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l11:word22",
          "lessonId": "hsk3-fltrp-2026:l11",
          "lesson": 11,
          "sourceText": 4,
          "audioTrack": "11-8",
          "source": {
            "pdfPage": 113,
            "printedPage": 101,
            "section": "课文4：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l11-word23",
      "zh": "城市",
      "py": "chéngshì",
      "vi": "thành phố",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l11:word23",
          "lessonId": "hsk3-fltrp-2026:l11",
          "lesson": 11,
          "sourceText": 4,
          "audioTrack": "11-8",
          "source": {
            "pdfPage": 113,
            "printedPage": 101,
            "section": "课文4：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l11-word24",
      "zh": "离开",
      "py": "líkāi",
      "vi": "rời, xa",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l11:word24",
          "lessonId": "hsk3-fltrp-2026:l11",
          "lesson": 11,
          "sourceText": 4,
          "audioTrack": "11-8",
          "source": {
            "pdfPage": 113,
            "printedPage": 101,
            "section": "课文4：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l11-word25",
      "zh": "机会",
      "py": "jīhuì",
      "vi": "cơ hội",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l11:word25",
          "lessonId": "hsk3-fltrp-2026:l11",
          "lesson": 11,
          "sourceText": 4,
          "audioTrack": "11-8",
          "source": {
            "pdfPage": 113,
            "printedPage": 101,
            "section": "课文4：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l11-word26",
      "zh": "生活",
      "py": "shēnghuó",
      "vi": "cuộc sống",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l11:word26",
          "lessonId": "hsk3-fltrp-2026:l11",
          "lesson": 11,
          "sourceText": 4,
          "audioTrack": "11-8",
          "source": {
            "pdfPage": 113,
            "printedPage": 101,
            "section": "课文4：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l11-word27",
      "zh": "生活",
      "py": "shēnghuó",
      "vi": "sống, sinh sống",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l11:word27",
          "lessonId": "hsk3-fltrp-2026:l11",
          "lesson": 11,
          "sourceText": 4,
          "audioTrack": "11-8",
          "source": {
            "pdfPage": 113,
            "printedPage": 101,
            "section": "课文4：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l11-word28",
      "zh": "为",
      "py": "wèi",
      "vi": "vì, cho",
      "pos": "giới từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l11:word28",
          "lessonId": "hsk3-fltrp-2026:l11",
          "lesson": 11,
          "sourceText": 4,
          "audioTrack": "11-8",
          "source": {
            "pdfPage": 113,
            "printedPage": 101,
            "section": "课文4：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l11-word29",
      "zh": "或",
      "py": "huò",
      "vi": "hoặc",
      "pos": "liên từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l11:word29",
          "lessonId": "hsk3-fltrp-2026:l11",
          "lesson": 11,
          "sourceText": 4,
          "audioTrack": "11-8",
          "source": {
            "pdfPage": 113,
            "printedPage": 101,
            "section": "课文4：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l12-word01",
      "zh": "街",
      "py": "jiē",
      "vi": "phố",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l12:word01",
          "lessonId": "hsk3-fltrp-2026:l12",
          "lesson": 12,
          "sourceText": 1,
          "audioTrack": "12-2",
          "source": {
            "pdfPage": 117,
            "printedPage": 105,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l12-word02",
      "zh": "开花",
      "py": "kāihuā",
      "vi": "nở hoa",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l12:word02",
          "lessonId": "hsk3-fltrp-2026:l12",
          "lesson": 12,
          "sourceText": 1,
          "audioTrack": "12-2",
          "source": {
            "pdfPage": 117,
            "printedPage": 105,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l12-word03",
      "zh": "公园",
      "py": "gōngyuán",
      "vi": "công viên",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l12:word03",
          "lessonId": "hsk3-fltrp-2026:l12",
          "lesson": 12,
          "sourceText": 1,
          "audioTrack": "12-2",
          "source": {
            "pdfPage": 117,
            "printedPage": 105,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l12-word04",
      "zh": "船",
      "py": "chuán",
      "vi": "thuyền",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l12:word04",
          "lessonId": "hsk3-fltrp-2026:l12",
          "lesson": 12,
          "sourceText": 1,
          "audioTrack": "12-2",
          "source": {
            "pdfPage": 117,
            "printedPage": 105,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l12-word05",
      "zh": "工作日",
      "py": "gōngzuòrì",
      "vi": "ngày làm việc",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l12:word05",
          "lessonId": "hsk3-fltrp-2026:l12",
          "lesson": 12,
          "sourceText": 1,
          "audioTrack": "12-2",
          "source": {
            "pdfPage": 117,
            "printedPage": 105,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l12-word06",
      "zh": "地方",
      "py": "dìfang",
      "vi": "nơi, chỗ",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l12:word06",
          "lessonId": "hsk3-fltrp-2026:l12",
          "lesson": 12,
          "sourceText": 1,
          "audioTrack": "12-2",
          "source": {
            "pdfPage": 117,
            "printedPage": 105,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l12-word07",
      "zh": "刚才",
      "py": "gāngcái",
      "vi": "vừa nãy",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l12:word07",
          "lessonId": "hsk3-fltrp-2026:l12",
          "lesson": 12,
          "sourceText": 2,
          "audioTrack": "12-4",
          "source": {
            "pdfPage": 119,
            "printedPage": 107,
            "section": "课文2：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l12-word08",
      "zh": "刮",
      "py": "guā",
      "vi": "thổi (gió)",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l12:word08",
          "lessonId": "hsk3-fltrp-2026:l12",
          "lesson": 12,
          "sourceText": 2,
          "audioTrack": "12-4",
          "source": {
            "pdfPage": 119,
            "printedPage": 107,
            "section": "课文2：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l12-word09",
      "zh": "风",
      "py": "fēng",
      "vi": "gió",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l12:word09",
          "lessonId": "hsk3-fltrp-2026:l12",
          "lesson": 12,
          "sourceText": 2,
          "audioTrack": "12-4",
          "source": {
            "pdfPage": 119,
            "printedPage": 107,
            "section": "课文2：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l12-word10",
      "zh": "新闻",
      "py": "xīnwén",
      "vi": "tin tức",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l12:word10",
          "lessonId": "hsk3-fltrp-2026:l12",
          "lesson": 12,
          "sourceText": 2,
          "audioTrack": "12-4",
          "source": {
            "pdfPage": 119,
            "printedPage": 107,
            "section": "课文2：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l12-word11",
      "zh": "伞",
      "py": "sǎn",
      "vi": "ô, dù",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l12:word11",
          "lessonId": "hsk3-fltrp-2026:l12",
          "lesson": 12,
          "sourceText": 2,
          "audioTrack": "12-4",
          "source": {
            "pdfPage": 119,
            "printedPage": 107,
            "section": "课文2：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l12-word12",
      "zh": "借",
      "py": "jiè",
      "vi": "cho mượn",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l12:word12",
          "lessonId": "hsk3-fltrp-2026:l12",
          "lesson": 12,
          "sourceText": 2,
          "audioTrack": "12-4",
          "source": {
            "pdfPage": 119,
            "printedPage": 107,
            "section": "课文2：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l12-word13",
      "zh": "把",
      "py": "bǎ",
      "vi": "cái (lượng từ cho vật có cán hoặc chân xòe)",
      "pos": "lượng từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l12:word13",
          "lessonId": "hsk3-fltrp-2026:l12",
          "lesson": 12,
          "sourceText": 2,
          "audioTrack": "12-4",
          "source": {
            "pdfPage": 119,
            "printedPage": 107,
            "section": "课文2：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l12-word14",
      "zh": "雨衣",
      "py": "yǔyī",
      "vi": "áo mưa",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l12:word14",
          "lessonId": "hsk3-fltrp-2026:l12",
          "lesson": 12,
          "sourceText": 2,
          "audioTrack": "12-4",
          "source": {
            "pdfPage": 119,
            "printedPage": 107,
            "section": "课文2：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l12-word15",
      "zh": "变",
      "py": "biàn",
      "vi": "thay đổi",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l12:word15",
          "lessonId": "hsk3-fltrp-2026:l12",
          "lesson": 12,
          "sourceText": 2,
          "audioTrack": "12-4",
          "source": {
            "pdfPage": 119,
            "printedPage": 107,
            "section": "课文2：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l12-word16",
      "zh": "季节",
      "py": "jìjié",
      "vi": "mùa",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l12:word16",
          "lessonId": "hsk3-fltrp-2026:l12",
          "lesson": 12,
          "sourceText": 2,
          "audioTrack": "12-4",
          "source": {
            "pdfPage": 119,
            "printedPage": 107,
            "section": "课文2：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l12-word17",
      "zh": "变化",
      "py": "biànhuà",
      "vi": "thay đổi",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l12:word17",
          "lessonId": "hsk3-fltrp-2026:l12",
          "lesson": 12,
          "sourceText": 2,
          "audioTrack": "12-4",
          "source": {
            "pdfPage": 119,
            "printedPage": 107,
            "section": "课文2：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l12-word18",
      "zh": "变化",
      "py": "biànhuà",
      "vi": "sự thay đổi",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l12:word18",
          "lessonId": "hsk3-fltrp-2026:l12",
          "lesson": 12,
          "sourceText": 2,
          "audioTrack": "12-4",
          "source": {
            "pdfPage": 119,
            "printedPage": 107,
            "section": "课文2：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l12-word19",
      "zh": "冬天",
      "py": "dōngtiān",
      "vi": "mùa đông",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l12:word19",
          "lessonId": "hsk3-fltrp-2026:l12",
          "lesson": 12,
          "sourceText": 3,
          "audioTrack": "12-6",
          "source": {
            "pdfPage": 120,
            "printedPage": 108,
            "section": "课文3：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l12-word20",
      "zh": "常常",
      "py": "chángcháng",
      "vi": "thường xuyên",
      "pos": "phó từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l12:word20",
          "lessonId": "hsk3-fltrp-2026:l12",
          "lesson": 12,
          "sourceText": 3,
          "audioTrack": "12-6",
          "source": {
            "pdfPage": 120,
            "printedPage": 108,
            "section": "课文3：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l12-word21",
      "zh": "关注",
      "py": "guānzhù",
      "vi": "quan tâm theo dõi",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l12:word21",
          "lessonId": "hsk3-fltrp-2026:l12",
          "lesson": 12,
          "sourceText": 3,
          "audioTrack": "12-6",
          "source": {
            "pdfPage": 120,
            "printedPage": 108,
            "section": "课文3：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l12-word22",
      "zh": "四季",
      "py": "sìjì",
      "vi": "bốn mùa",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l12:word22",
          "lessonId": "hsk3-fltrp-2026:l12",
          "lesson": 12,
          "sourceText": 4,
          "audioTrack": "12-8",
          "source": {
            "pdfPage": 122,
            "printedPage": 110,
            "section": "课文4：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l12-word23",
      "zh": "春天",
      "py": "chūntiān",
      "vi": "mùa xuân",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l12:word23",
          "lessonId": "hsk3-fltrp-2026:l12",
          "lesson": 12,
          "sourceText": 4,
          "audioTrack": "12-8",
          "source": {
            "pdfPage": 122,
            "printedPage": 110,
            "section": "课文4：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l12-word24",
      "zh": "夏天",
      "py": "xiàtiān",
      "vi": "mùa hè",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l12:word24",
          "lessonId": "hsk3-fltrp-2026:l12",
          "lesson": 12,
          "sourceText": 4,
          "audioTrack": "12-8",
          "source": {
            "pdfPage": 122,
            "printedPage": 110,
            "section": "课文4：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l12-word25",
      "zh": "凉快",
      "py": "liángkuai",
      "vi": "mát mẻ, dễ chịu",
      "pos": "tính từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l12:word25",
          "lessonId": "hsk3-fltrp-2026:l12",
          "lesson": 12,
          "sourceText": 4,
          "audioTrack": "12-8",
          "source": {
            "pdfPage": 122,
            "printedPage": 110,
            "section": "课文4：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l12-word26",
      "zh": "秋天",
      "py": "qiūtiān",
      "vi": "mùa thu",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l12:word26",
          "lessonId": "hsk3-fltrp-2026:l12",
          "lesson": 12,
          "sourceText": 4,
          "audioTrack": "12-8",
          "source": {
            "pdfPage": 122,
            "printedPage": 110,
            "section": "课文4：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l12-word27",
      "zh": "叶子",
      "py": "yèzi",
      "vi": "lá cây",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l12:word27",
          "lessonId": "hsk3-fltrp-2026:l12",
          "lesson": 12,
          "sourceText": 4,
          "audioTrack": "12-8",
          "source": {
            "pdfPage": 122,
            "printedPage": 110,
            "section": "课文4：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l12-word28",
      "zh": "变成",
      "py": "biànchéng",
      "vi": "biến thành, trở thành",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l12:word28",
          "lessonId": "hsk3-fltrp-2026:l12",
          "lesson": 12,
          "sourceText": 4,
          "audioTrack": "12-8",
          "source": {
            "pdfPage": 122,
            "printedPage": 110,
            "section": "课文4：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l13-word01",
      "zh": "请客",
      "py": "qǐngkè",
      "vi": "mời, đãi khách",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l13:word01",
          "lessonId": "hsk3-fltrp-2026:l13",
          "lesson": 13,
          "sourceText": 1,
          "audioTrack": "13-2",
          "source": {
            "pdfPage": 128,
            "printedPage": 116,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l13-word02",
      "zh": "南方",
      "py": "nánfāng",
      "vi": "miền Nam",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l13:word02",
          "lessonId": "hsk3-fltrp-2026:l13",
          "lesson": 13,
          "sourceText": 1,
          "audioTrack": "13-2",
          "source": {
            "pdfPage": 128,
            "printedPage": 116,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l13-word03",
      "zh": "北方",
      "py": "běifāng",
      "vi": "miền Bắc",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l13:word03",
          "lessonId": "hsk3-fltrp-2026:l13",
          "lesson": 13,
          "sourceText": 1,
          "audioTrack": "13-2",
          "source": {
            "pdfPage": 128,
            "printedPage": 116,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l13-word04",
      "zh": "做法",
      "py": "zuòfǎ",
      "vi": "cách làm",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l13:word04",
          "lessonId": "hsk3-fltrp-2026:l13",
          "lesson": 13,
          "sourceText": 1,
          "audioTrack": "13-2",
          "source": {
            "pdfPage": 128,
            "printedPage": 116,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l13-word05",
      "zh": "不同",
      "py": "bù tóng",
      "vi": "khác nhau",
      "pos": "cụm từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l13:word05",
          "lessonId": "hsk3-fltrp-2026:l13",
          "lesson": 13,
          "sourceText": 1,
          "audioTrack": "13-2",
          "source": {
            "pdfPage": 128,
            "printedPage": 116,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l13-word06",
      "zh": "加",
      "py": "jiā",
      "vi": "thêm",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l13:word06",
          "lessonId": "hsk3-fltrp-2026:l13",
          "lesson": 13,
          "sourceText": 1,
          "audioTrack": "13-2",
          "source": {
            "pdfPage": 128,
            "printedPage": 116,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l13-word07",
      "zh": "的话",
      "py": "dehuà",
      "vi": "nếu (đặt cuối vế điều kiện)",
      "pos": "trợ từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l13:word07",
          "lessonId": "hsk3-fltrp-2026:l13",
          "lesson": 13,
          "sourceText": 1,
          "audioTrack": "13-2",
          "source": {
            "pdfPage": 128,
            "printedPage": 116,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l13-word08",
      "zh": "做客",
      "py": "zuòkè",
      "vi": "đến chơi với tư cách khách",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l13:word08",
          "lessonId": "hsk3-fltrp-2026:l13",
          "lesson": 13,
          "sourceText": 1,
          "audioTrack": "13-2",
          "source": {
            "pdfPage": 128,
            "printedPage": 116,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l13-word09",
      "zh": "邻居",
      "py": "línjū",
      "vi": "hàng xóm",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l13:word09",
          "lessonId": "hsk3-fltrp-2026:l13",
          "lesson": 13,
          "sourceText": 2,
          "audioTrack": "13-4",
          "source": {
            "pdfPage": 130,
            "printedPage": 118,
            "section": "课文2：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l13-word10",
      "zh": "放心",
      "py": "fàngxīn",
      "vi": "yên tâm",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l13:word10",
          "lessonId": "hsk3-fltrp-2026:l13",
          "lesson": 13,
          "sourceText": 2,
          "audioTrack": "13-4",
          "source": {
            "pdfPage": 130,
            "printedPage": 118,
            "section": "课文2：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l13-word11",
      "zh": "酒",
      "py": "jiǔ",
      "vi": "rượu, đồ uống có cồn",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l13:word11",
          "lessonId": "hsk3-fltrp-2026:l13",
          "lesson": 13,
          "sourceText": 2,
          "audioTrack": "13-4",
          "source": {
            "pdfPage": 130,
            "printedPage": 118,
            "section": "课文2：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l13-word12",
      "zh": "放",
      "py": "fàng",
      "vi": "đặt, để",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l13:word12",
          "lessonId": "hsk3-fltrp-2026:l13",
          "lesson": 13,
          "sourceText": 2,
          "audioTrack": "13-4",
          "source": {
            "pdfPage": 130,
            "printedPage": 118,
            "section": "课文2：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l13-word13",
      "zh": "客人",
      "py": "kèrén",
      "vi": "khách",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l13:word13",
          "lessonId": "hsk3-fltrp-2026:l13",
          "lesson": 13,
          "sourceText": 2,
          "audioTrack": "13-4",
          "source": {
            "pdfPage": 130,
            "printedPage": 118,
            "section": "课文2：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l13-word14",
      "zh": "晚会",
      "py": "wǎnhuì",
      "vi": "buổi tiệc tối, đêm liên hoan",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l13:word14",
          "lessonId": "hsk3-fltrp-2026:l13",
          "lesson": 13,
          "sourceText": 3,
          "audioTrack": "13-6",
          "source": {
            "pdfPage": 132,
            "printedPage": 120,
            "section": "课文3：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l13-word15",
      "zh": "礼物",
      "py": "lǐwù",
      "vi": "quà tặng",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l13:word15",
          "lessonId": "hsk3-fltrp-2026:l13",
          "lesson": 13,
          "sourceText": 3,
          "audioTrack": "13-6",
          "source": {
            "pdfPage": 132,
            "printedPage": 120,
            "section": "课文3：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l13-word16",
      "zh": "画家",
      "py": "huàjiā",
      "vi": "họa sĩ",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l13:word16",
          "lessonId": "hsk3-fltrp-2026:l13",
          "lesson": 13,
          "sourceText": 3,
          "audioTrack": "13-6",
          "source": {
            "pdfPage": 132,
            "printedPage": 120,
            "section": "课文3：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l13-word17",
      "zh": "盘子",
      "py": "pánzi",
      "vi": "đĩa",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l13:word17",
          "lessonId": "hsk3-fltrp-2026:l13",
          "lesson": 13,
          "sourceText": 3,
          "audioTrack": "13-6",
          "source": {
            "pdfPage": 132,
            "printedPage": 120,
            "section": "课文3：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l13-word18",
      "zh": "一边",
      "py": "yìbiān",
      "vi": "vừa (làm đồng thời)",
      "pos": "phó từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l13:word18",
          "lessonId": "hsk3-fltrp-2026:l13",
          "lesson": 13,
          "sourceText": 3,
          "audioTrack": "13-6",
          "source": {
            "pdfPage": 132,
            "printedPage": 120,
            "section": "课文3：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l13-word19",
      "zh": "聊天儿",
      "py": "liáotiānr",
      "vi": "trò chuyện",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l13:word19",
          "lessonId": "hsk3-fltrp-2026:l13",
          "lesson": 13,
          "sourceText": 3,
          "audioTrack": "13-6",
          "source": {
            "pdfPage": 132,
            "printedPage": 120,
            "section": "课文3：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l13-word20",
      "zh": "来自",
      "py": "láizì",
      "vi": "đến từ",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l13:word20",
          "lessonId": "hsk3-fltrp-2026:l13",
          "lesson": 13,
          "sourceText": 4,
          "audioTrack": "13-8",
          "source": {
            "pdfPage": 134,
            "printedPage": 122,
            "section": "课文4：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l13-word21",
      "zh": "夫妻",
      "py": "fūqī",
      "vi": "vợ chồng",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l13:word21",
          "lessonId": "hsk3-fltrp-2026:l13",
          "lesson": 13,
          "sourceText": 4,
          "audioTrack": "13-8",
          "source": {
            "pdfPage": 134,
            "printedPage": 122,
            "section": "课文4：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l13-word22",
      "zh": "直到",
      "py": "zhídào",
      "vi": "mãi đến",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l13:word22",
          "lessonId": "hsk3-fltrp-2026:l13",
          "lesson": 13,
          "sourceText": 4,
          "audioTrack": "13-8",
          "source": {
            "pdfPage": 134,
            "printedPage": 122,
            "section": "课文4：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l13-word23",
      "zh": "地图",
      "py": "dìtú",
      "vi": "bản đồ",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l13:word23",
          "lessonId": "hsk3-fltrp-2026:l13",
          "lesson": 13,
          "sourceText": 4,
          "audioTrack": "13-8",
          "source": {
            "pdfPage": 134,
            "printedPage": 122,
            "section": "课文4：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l13-word24",
      "zh": "点",
      "py": "diǎn",
      "vi": "chấm, điểm",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l13:word24",
          "lessonId": "hsk3-fltrp-2026:l13",
          "lesson": 13,
          "sourceText": 4,
          "audioTrack": "13-8",
          "source": {
            "pdfPage": 134,
            "printedPage": 122,
            "section": "课文4：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l13-word25",
      "zh": "感到",
      "py": "gǎndào",
      "vi": "cảm thấy",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l13:word25",
          "lessonId": "hsk3-fltrp-2026:l13",
          "lesson": 13,
          "sourceText": 4,
          "audioTrack": "13-8",
          "source": {
            "pdfPage": 134,
            "printedPage": 122,
            "section": "课文4：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l13-word26",
      "zh": "东方",
      "py": "dōngfāng",
      "vi": "phương Đông",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l13:word26",
          "lessonId": "hsk3-fltrp-2026:l13",
          "lesson": 13,
          "sourceText": 4,
          "audioTrack": "13-8",
          "source": {
            "pdfPage": 134,
            "printedPage": 122,
            "section": "课文4：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l13-word27",
      "zh": "文化",
      "py": "wénhuà",
      "vi": "văn hóa",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l13:word27",
          "lessonId": "hsk3-fltrp-2026:l13",
          "lesson": 13,
          "sourceText": 4,
          "audioTrack": "13-8",
          "source": {
            "pdfPage": 134,
            "printedPage": 122,
            "section": "课文4：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l13-word28",
      "zh": "英国",
      "py": "Yīngguó",
      "vi": "Vương quốc Anh",
      "pos": "danh từ riêng",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l13:word28",
          "lessonId": "hsk3-fltrp-2026:l13",
          "lesson": 13,
          "sourceText": 4,
          "audioTrack": "13-8",
          "source": {
            "pdfPage": 134,
            "printedPage": 122,
            "section": "课文4：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l14-word01",
      "zh": "词典",
      "py": "cídiǎn",
      "vi": "từ điển",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l14:word01",
          "lessonId": "hsk3-fltrp-2026:l14",
          "lesson": 14,
          "sourceText": 1,
          "audioTrack": "14-2",
          "source": {
            "pdfPage": 137,
            "printedPage": 125,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l14-word02",
      "zh": "最好",
      "py": "zuìhǎo",
      "vi": "tốt nhất nên",
      "pos": "phó từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l14:word02",
          "lessonId": "hsk3-fltrp-2026:l14",
          "lesson": 14,
          "sourceText": 1,
          "audioTrack": "14-2",
          "source": {
            "pdfPage": 137,
            "printedPage": 125,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l14-word03",
      "zh": "节",
      "py": "jié",
      "vi": "tiết (lượng từ đếm tiết học)",
      "pos": "lượng từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l14:word03",
          "lessonId": "hsk3-fltrp-2026:l14",
          "lesson": 14,
          "sourceText": 1,
          "audioTrack": "14-2",
          "source": {
            "pdfPage": 137,
            "printedPage": 125,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l14-word04",
      "zh": "图书馆",
      "py": "túshūguǎn",
      "vi": "thư viện",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l14:word04",
          "lessonId": "hsk3-fltrp-2026:l14",
          "lesson": 14,
          "sourceText": 1,
          "audioTrack": "14-2",
          "source": {
            "pdfPage": 137,
            "printedPage": 125,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l14-word05",
      "zh": "被",
      "py": "bèi",
      "vi": "bị, được (đánh dấu bị động)",
      "pos": "giới từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l14:word05",
          "lessonId": "hsk3-fltrp-2026:l14",
          "lesson": 14,
          "sourceText": 1,
          "audioTrack": "14-2",
          "source": {
            "pdfPage": 137,
            "printedPage": 125,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l14-word06",
      "zh": "名人",
      "py": "míngrén",
      "vi": "người nổi tiếng",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l14:word06",
          "lessonId": "hsk3-fltrp-2026:l14",
          "lesson": 14,
          "sourceText": 1,
          "audioTrack": "14-2",
          "source": {
            "pdfPage": 137,
            "printedPage": 125,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l14-word07",
      "zh": "故事",
      "py": "gùshi",
      "vi": "câu chuyện",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l14:word07",
          "lessonId": "hsk3-fltrp-2026:l14",
          "lesson": 14,
          "sourceText": 1,
          "audioTrack": "14-2",
          "source": {
            "pdfPage": 137,
            "printedPage": 125,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l14-word08",
      "zh": "然后",
      "py": "ránhòu",
      "vi": "sau đó",
      "pos": "liên từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l14:word08",
          "lessonId": "hsk3-fltrp-2026:l14",
          "lesson": 14,
          "sourceText": 2,
          "audioTrack": "14-4",
          "source": {
            "pdfPage": 139,
            "printedPage": 127,
            "section": "课文2：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l14-word09",
      "zh": "报纸",
      "py": "bàozhǐ",
      "vi": "báo",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l14:word09",
          "lessonId": "hsk3-fltrp-2026:l14",
          "lesson": 14,
          "sourceText": 2,
          "audioTrack": "14-4",
          "source": {
            "pdfPage": 139,
            "printedPage": 127,
            "section": "课文2：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l14-word10",
      "zh": "忘记",
      "py": "wàngjì",
      "vi": "quên",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l14:word10",
          "lessonId": "hsk3-fltrp-2026:l14",
          "lesson": 14,
          "sourceText": 2,
          "audioTrack": "14-4",
          "source": {
            "pdfPage": 139,
            "printedPage": 127,
            "section": "课文2：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l14-word11",
      "zh": "电子书",
      "py": "diànzǐshū",
      "vi": "sách điện tử",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l14:word11",
          "lessonId": "hsk3-fltrp-2026:l14",
          "lesson": 14,
          "sourceText": 2,
          "audioTrack": "14-4",
          "source": {
            "pdfPage": 139,
            "printedPage": 127,
            "section": "课文2：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l14-word12",
      "zh": "女生",
      "py": "nǚshēng",
      "vi": "nữ sinh",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l14:word12",
          "lessonId": "hsk3-fltrp-2026:l14",
          "lesson": 14,
          "sourceText": 3,
          "audioTrack": "14-6",
          "source": {
            "pdfPage": 141,
            "printedPage": 129,
            "section": "课文3：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l14-word13",
      "zh": "表演",
      "py": "biǎoyǎn",
      "vi": "biểu diễn",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l14:word13",
          "lessonId": "hsk3-fltrp-2026:l14",
          "lesson": 14,
          "sourceText": 3,
          "audioTrack": "14-6",
          "source": {
            "pdfPage": 141,
            "printedPage": 129,
            "section": "课文3：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l14-word14",
      "zh": "节目",
      "py": "jiémù",
      "vi": "tiết mục, chương trình",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l14:word14",
          "lessonId": "hsk3-fltrp-2026:l14",
          "lesson": 14,
          "sourceText": 3,
          "audioTrack": "14-6",
          "source": {
            "pdfPage": 141,
            "printedPage": 129,
            "section": "课文3：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l14-word15",
      "zh": "怎么办",
      "py": "zěnme bàn",
      "vi": "làm thế nào, làm sao đây",
      "pos": "cụm từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l14:word15",
          "lessonId": "hsk3-fltrp-2026:l14",
          "lesson": 14,
          "sourceText": 3,
          "audioTrack": "14-6",
          "source": {
            "pdfPage": 141,
            "printedPage": 129,
            "section": "课文3：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l14-word16",
      "zh": "校长",
      "py": "xiàozhǎng",
      "vi": "hiệu trưởng",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l14:word16",
          "lessonId": "hsk3-fltrp-2026:l14",
          "lesson": 14,
          "sourceText": 3,
          "audioTrack": "14-6",
          "source": {
            "pdfPage": 141,
            "printedPage": 129,
            "section": "课文3：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l14-word17",
      "zh": "面前",
      "py": "miànqián",
      "vi": "trước mặt",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l14:word17",
          "lessonId": "hsk3-fltrp-2026:l14",
          "lesson": 14,
          "sourceText": 3,
          "audioTrack": "14-6",
          "source": {
            "pdfPage": 141,
            "printedPage": 129,
            "section": "课文3：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l14-word18",
      "zh": "有些",
      "py": "yǒuxiē",
      "vi": "hơi, có phần",
      "pos": "phó từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l14:word18",
          "lessonId": "hsk3-fltrp-2026:l14",
          "lesson": 14,
          "sourceText": 3,
          "audioTrack": "14-6",
          "source": {
            "pdfPage": 141,
            "printedPage": 129,
            "section": "课文3：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l14-word19",
      "zh": "相信",
      "py": "xiāngxìn",
      "vi": "tin tưởng",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l14:word19",
          "lessonId": "hsk3-fltrp-2026:l14",
          "lesson": 14,
          "sourceText": 3,
          "audioTrack": "14-6",
          "source": {
            "pdfPage": 141,
            "printedPage": 129,
            "section": "课文3：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l14-word20",
      "zh": "新年",
      "py": "xīnnián",
      "vi": "năm mới",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l14:word20",
          "lessonId": "hsk3-fltrp-2026:l14",
          "lesson": 14,
          "sourceText": 4,
          "audioTrack": "14-8",
          "source": {
            "pdfPage": 142,
            "printedPage": 130,
            "section": "课文4：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l14-word21",
      "zh": "班级",
      "py": "bānjí",
      "vi": "lớp học",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l14:word21",
          "lessonId": "hsk3-fltrp-2026:l14",
          "lesson": 14,
          "sourceText": 4,
          "audioTrack": "14-8",
          "source": {
            "pdfPage": 142,
            "printedPage": 130,
            "section": "课文4：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l14-word22",
      "zh": "跳",
      "py": "tiào",
      "vi": "nhảy",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l14:word22",
          "lessonId": "hsk3-fltrp-2026:l14",
          "lesson": 14,
          "sourceText": 4,
          "audioTrack": "14-8",
          "source": {
            "pdfPage": 142,
            "printedPage": 130,
            "section": "课文4：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l14-word23",
      "zh": "留学生",
      "py": "liúxuéshēng",
      "vi": "du học sinh",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l14:word23",
          "lessonId": "hsk3-fltrp-2026:l14",
          "lesson": 14,
          "sourceText": 4,
          "audioTrack": "14-8",
          "source": {
            "pdfPage": 142,
            "printedPage": 130,
            "section": "课文4：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l14-word24",
      "zh": "最后",
      "py": "zuìhòu",
      "vi": "cuối cùng",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l14:word24",
          "lessonId": "hsk3-fltrp-2026:l14",
          "lesson": 14,
          "sourceText": 4,
          "audioTrack": "14-8",
          "source": {
            "pdfPage": 142,
            "printedPage": 130,
            "section": "课文4：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l14-word25",
      "zh": "一块儿",
      "py": "yíkuàir",
      "vi": "cùng nhau",
      "pos": "phó từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l14:word25",
          "lessonId": "hsk3-fltrp-2026:l14",
          "lesson": 14,
          "sourceText": 4,
          "audioTrack": "14-8",
          "source": {
            "pdfPage": 142,
            "printedPage": 130,
            "section": "课文4：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l14-word26",
      "zh": "一块儿",
      "py": "yíkuàir",
      "vi": "cùng một chỗ",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l14:word26",
          "lessonId": "hsk3-fltrp-2026:l14",
          "lesson": 14,
          "sourceText": 4,
          "audioTrack": "14-8",
          "source": {
            "pdfPage": 142,
            "printedPage": 130,
            "section": "课文4：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l14-word27",
      "zh": "网站",
      "py": "wǎngzhàn",
      "vi": "trang web",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l14:word27",
          "lessonId": "hsk3-fltrp-2026:l14",
          "lesson": 14,
          "sourceText": 4,
          "audioTrack": "14-8",
          "source": {
            "pdfPage": 142,
            "printedPage": 130,
            "section": "课文4：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l14-word28",
      "zh": "视频",
      "py": "shìpín",
      "vi": "video",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l14:word28",
          "lessonId": "hsk3-fltrp-2026:l14",
          "lesson": 14,
          "sourceText": 4,
          "audioTrack": "14-8",
          "source": {
            "pdfPage": 142,
            "printedPage": 130,
            "section": "课文4：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l15-word01",
      "zh": "蓝",
      "py": "lán",
      "vi": "xanh lam",
      "pos": "tính từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l15:word01",
          "lessonId": "hsk3-fltrp-2026:l15",
          "lesson": 15,
          "sourceText": 1,
          "audioTrack": "15-2",
          "source": {
            "pdfPage": 146,
            "printedPage": 134,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l15-word02",
      "zh": "段",
      "py": "duàn",
      "vi": "đoạn, khoảng (thời gian, khoảng cách)",
      "pos": "lượng từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l15:word02",
          "lessonId": "hsk3-fltrp-2026:l15",
          "lesson": 15,
          "sourceText": 1,
          "audioTrack": "15-2",
          "source": {
            "pdfPage": 146,
            "printedPage": 134,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l15-word03",
      "zh": "附近",
      "py": "fùjìn",
      "vi": "vùng gần, lân cận",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l15:word03",
          "lessonId": "hsk3-fltrp-2026:l15",
          "lesson": 15,
          "sourceText": 1,
          "audioTrack": "15-2",
          "source": {
            "pdfPage": 146,
            "printedPage": 134,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l15-word04",
      "zh": "马路",
      "py": "mǎlù",
      "vi": "đường phố",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l15:word04",
          "lessonId": "hsk3-fltrp-2026:l15",
          "lesson": 15,
          "sourceText": 1,
          "audioTrack": "15-2",
          "source": {
            "pdfPage": 146,
            "printedPage": 134,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l15-word05",
      "zh": "平时",
      "py": "píngshí",
      "vi": "lúc bình thường",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l15:word05",
          "lessonId": "hsk3-fltrp-2026:l15",
          "lesson": 15,
          "sourceText": 1,
          "audioTrack": "15-2",
          "source": {
            "pdfPage": 146,
            "printedPage": 134,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l15-word06",
      "zh": "放学",
      "py": "fàngxué",
      "vi": "tan học",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l15:word06",
          "lessonId": "hsk3-fltrp-2026:l15",
          "lesson": 15,
          "sourceText": 1,
          "audioTrack": "15-2",
          "source": {
            "pdfPage": 146,
            "printedPage": 134,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l15-word07",
      "zh": "游戏",
      "py": "yóuxì",
      "vi": "trò chơi",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l15:word07",
          "lessonId": "hsk3-fltrp-2026:l15",
          "lesson": 15,
          "sourceText": 1,
          "audioTrack": "15-2",
          "source": {
            "pdfPage": 146,
            "printedPage": 134,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l15-word08",
      "zh": "老人",
      "py": "lǎorén",
      "vi": "người cao tuổi",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l15:word08",
          "lessonId": "hsk3-fltrp-2026:l15",
          "lesson": 15,
          "sourceText": 1,
          "audioTrack": "15-2",
          "source": {
            "pdfPage": 146,
            "printedPage": 134,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l15-word09",
      "zh": "根据",
      "py": "gēnjù",
      "vi": "theo, căn cứ vào",
      "pos": "giới từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l15:word09",
          "lessonId": "hsk3-fltrp-2026:l15",
          "lesson": 15,
          "sourceText": 1,
          "audioTrack": "15-2",
          "source": {
            "pdfPage": 146,
            "printedPage": 134,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l15-word10",
      "zh": "根据",
      "py": "gēnjù",
      "vi": "dựa vào",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l15:word10",
          "lessonId": "hsk3-fltrp-2026:l15",
          "lesson": 15,
          "sourceText": 1,
          "audioTrack": "15-2",
          "source": {
            "pdfPage": 146,
            "printedPage": 134,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l15-word11",
      "zh": "了解",
      "py": "liǎojiě",
      "vi": "hiểu, biết rõ",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l15:word11",
          "lessonId": "hsk3-fltrp-2026:l15",
          "lesson": 15,
          "sourceText": 2,
          "audioTrack": "15-4",
          "source": {
            "pdfPage": 148,
            "printedPage": 136,
            "section": "课文2：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l15-word12",
      "zh": "可是",
      "py": "kěshì",
      "vi": "nhưng",
      "pos": "liên từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l15:word12",
          "lessonId": "hsk3-fltrp-2026:l15",
          "lesson": 15,
          "sourceText": 2,
          "audioTrack": "15-4",
          "source": {
            "pdfPage": 148,
            "printedPage": 136,
            "section": "课文2：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l15-word13",
      "zh": "以上",
      "py": "yǐshàng",
      "vi": "trở lên, trên",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l15:word13",
          "lessonId": "hsk3-fltrp-2026:l15",
          "lesson": 15,
          "sourceText": 2,
          "audioTrack": "15-4",
          "source": {
            "pdfPage": 148,
            "printedPage": 136,
            "section": "课文2：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l15-word14",
      "zh": "有名",
      "py": "yǒumíng",
      "vi": "nổi tiếng",
      "pos": "tính từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l15:word14",
          "lessonId": "hsk3-fltrp-2026:l15",
          "lesson": 15,
          "sourceText": 2,
          "audioTrack": "15-4",
          "source": {
            "pdfPage": 148,
            "printedPage": 136,
            "section": "课文2：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l15-word15",
      "zh": "景点",
      "py": "jǐngdiǎn",
      "vi": "điểm tham quan",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l15:word15",
          "lessonId": "hsk3-fltrp-2026:l15",
          "lesson": 15,
          "sourceText": 2,
          "audioTrack": "15-4",
          "source": {
            "pdfPage": 148,
            "printedPage": 136,
            "section": "课文2：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l15-word16",
      "zh": "游客",
      "py": "yóukè",
      "vi": "du khách",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l15:word16",
          "lessonId": "hsk3-fltrp-2026:l15",
          "lesson": 15,
          "sourceText": 2,
          "audioTrack": "15-4",
          "source": {
            "pdfPage": 148,
            "printedPage": 136,
            "section": "课文2：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l15-word17",
      "zh": "外地",
      "py": "wàidì",
      "vi": "nơi khác, địa phương khác",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l15:word17",
          "lessonId": "hsk3-fltrp-2026:l15",
          "lesson": 15,
          "sourceText": 2,
          "audioTrack": "15-4",
          "source": {
            "pdfPage": 148,
            "printedPage": 136,
            "section": "课文2：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l15-word18",
      "zh": "聊",
      "py": "liáo",
      "vi": "trò chuyện",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l15:word18",
          "lessonId": "hsk3-fltrp-2026:l15",
          "lesson": 15,
          "sourceText": 2,
          "audioTrack": "15-4",
          "source": {
            "pdfPage": 148,
            "printedPage": 136,
            "section": "课文2：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l15-word19",
      "zh": "南京",
      "py": "Nánjīng",
      "vi": "Nam Kinh",
      "pos": "danh từ riêng",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l15:word19",
          "lessonId": "hsk3-fltrp-2026:l15",
          "lesson": 15,
          "sourceText": 2,
          "audioTrack": "15-4",
          "source": {
            "pdfPage": 148,
            "printedPage": 136,
            "section": "课文2：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l15-word20",
      "zh": "河",
      "py": "hé",
      "vi": "sông",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l15:word20",
          "lessonId": "hsk3-fltrp-2026:l15",
          "lesson": 15,
          "sourceText": 3,
          "audioTrack": "15-6",
          "source": {
            "pdfPage": 150,
            "printedPage": 138,
            "section": "课文3：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l15-word21",
      "zh": "关系",
      "py": "guānxi",
      "vi": "quan hệ, liên quan",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l15:word21",
          "lessonId": "hsk3-fltrp-2026:l15",
          "lesson": 15,
          "sourceText": 3,
          "audioTrack": "15-6",
          "source": {
            "pdfPage": 150,
            "printedPage": 138,
            "section": "课文3：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l15-word22",
      "zh": "养",
      "py": "yǎng",
      "vi": "nuôi dưỡng, trồng",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l15:word22",
          "lessonId": "hsk3-fltrp-2026:l15",
          "lesson": 15,
          "sourceText": 3,
          "audioTrack": "15-6",
          "source": {
            "pdfPage": 150,
            "printedPage": 138,
            "section": "课文3：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l15-word23",
      "zh": "黄河",
      "py": "Huáng Hé",
      "vi": "Hoàng Hà",
      "pos": "danh từ riêng",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l15:word23",
          "lessonId": "hsk3-fltrp-2026:l15",
          "lesson": 15,
          "sourceText": 3,
          "audioTrack": "15-6",
          "source": {
            "pdfPage": 150,
            "printedPage": 138,
            "section": "课文3：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l15-word24",
      "zh": "西北",
      "py": "xīběi",
      "vi": "tây bắc",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l15:word24",
          "lessonId": "hsk3-fltrp-2026:l15",
          "lesson": 15,
          "sourceText": 4,
          "audioTrack": "15-8",
          "source": {
            "pdfPage": 151,
            "printedPage": 139,
            "section": "课文4：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l15-word25",
      "zh": "经过",
      "py": "jīngguò",
      "vi": "đi qua, chảy qua",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l15:word25",
          "lessonId": "hsk3-fltrp-2026:l15",
          "lesson": 15,
          "sourceText": 4,
          "audioTrack": "15-8",
          "source": {
            "pdfPage": 151,
            "printedPage": 139,
            "section": "课文4：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l15-word26",
      "zh": "经过",
      "py": "jīngguò",
      "vi": "quá trình, diễn biến",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l15:word26",
          "lessonId": "hsk3-fltrp-2026:l15",
          "lesson": 15,
          "sourceText": 4,
          "audioTrack": "15-8",
          "source": {
            "pdfPage": 151,
            "printedPage": 139,
            "section": "课文4：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l15-word27",
      "zh": "草地",
      "py": "cǎodì",
      "vi": "bãi cỏ",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l15:word27",
          "lessonId": "hsk3-fltrp-2026:l15",
          "lesson": 15,
          "sourceText": 4,
          "audioTrack": "15-8",
          "source": {
            "pdfPage": 151,
            "printedPage": 139,
            "section": "课文4：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l15-word28",
      "zh": "遇见",
      "py": "yùjiàn",
      "vi": "gặp",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l15:word28",
          "lessonId": "hsk3-fltrp-2026:l15",
          "lesson": 15,
          "sourceText": 4,
          "audioTrack": "15-8",
          "source": {
            "pdfPage": 151,
            "printedPage": 139,
            "section": "课文4：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l16-word01",
      "zh": "脏",
      "py": "zāng",
      "vi": "bẩn",
      "pos": "tính từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l16:word01",
          "lessonId": "hsk3-fltrp-2026:l16",
          "lesson": 16,
          "sourceText": 1,
          "audioTrack": "16-2",
          "source": {
            "pdfPage": 158,
            "printedPage": 146,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l16-word02",
      "zh": "可爱",
      "py": "kě'ài",
      "vi": "đáng yêu",
      "pos": "tính từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l16:word02",
          "lessonId": "hsk3-fltrp-2026:l16",
          "lesson": 16,
          "sourceText": 1,
          "audioTrack": "16-2",
          "source": {
            "pdfPage": 158,
            "printedPage": 146,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l16-word03",
      "zh": "一会儿",
      "py": "yíhuìr",
      "vi": "lúc thì (luân phiên trong thời gian ngắn)",
      "pos": "phó từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l16:word03",
          "lessonId": "hsk3-fltrp-2026:l16",
          "lesson": 16,
          "sourceText": 1,
          "audioTrack": "16-2",
          "source": {
            "pdfPage": 158,
            "printedPage": 146,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l16-word04",
      "zh": "脚",
      "py": "jiǎo",
      "vi": "bàn chân",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l16:word04",
          "lessonId": "hsk3-fltrp-2026:l16",
          "lesson": 16,
          "sourceText": 1,
          "audioTrack": "16-2",
          "source": {
            "pdfPage": 158,
            "printedPage": 146,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l16-word05",
      "zh": "照顾",
      "py": "zhàogù",
      "vi": "chăm sóc",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l16:word05",
          "lessonId": "hsk3-fltrp-2026:l16",
          "lesson": 16,
          "sourceText": 1,
          "audioTrack": "16-2",
          "source": {
            "pdfPage": 158,
            "printedPage": 146,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l16-word06",
      "zh": "好像",
      "py": "hǎoxiàng",
      "vi": "dường như, giống như",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l16:word06",
          "lessonId": "hsk3-fltrp-2026:l16",
          "lesson": 16,
          "sourceText": 1,
          "audioTrack": "16-2",
          "source": {
            "pdfPage": 158,
            "printedPage": 146,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l16-word07",
      "zh": "认得",
      "py": "rènde",
      "vi": "nhận ra, biết mặt",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l16:word07",
          "lessonId": "hsk3-fltrp-2026:l16",
          "lesson": 16,
          "sourceText": 1,
          "audioTrack": "16-2",
          "source": {
            "pdfPage": 158,
            "printedPage": 146,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l16-word08",
      "zh": "周末",
      "py": "zhōumò",
      "vi": "cuối tuần",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l16:word08",
          "lessonId": "hsk3-fltrp-2026:l16",
          "lesson": 16,
          "sourceText": 1,
          "audioTrack": "16-2",
          "source": {
            "pdfPage": 158,
            "printedPage": 146,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l16-word09",
      "zh": "动物园",
      "py": "dòngwùyuán",
      "vi": "sở thú",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l16:word09",
          "lessonId": "hsk3-fltrp-2026:l16",
          "lesson": 16,
          "sourceText": 1,
          "audioTrack": "16-2",
          "source": {
            "pdfPage": 158,
            "printedPage": 146,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l16-word10",
      "zh": "动物",
      "py": "dòngwù",
      "vi": "động vật",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l16:word10",
          "lessonId": "hsk3-fltrp-2026:l16",
          "lesson": 16,
          "sourceText": 1,
          "audioTrack": "16-2",
          "source": {
            "pdfPage": 158,
            "printedPage": 146,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l16-word11",
      "zh": "大熊猫",
      "py": "dàxióngmāo",
      "vi": "gấu trúc lớn",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l16:word11",
          "lessonId": "hsk3-fltrp-2026:l16",
          "lesson": 16,
          "sourceText": 2,
          "audioTrack": "16-4",
          "source": {
            "pdfPage": 159,
            "printedPage": 147,
            "section": "课文2：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l16-word12",
      "zh": "奇怪",
      "py": "qíguài",
      "vi": "kỳ lạ",
      "pos": "tính từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l16:word12",
          "lessonId": "hsk3-fltrp-2026:l16",
          "lesson": 16,
          "sourceText": 2,
          "audioTrack": "16-4",
          "source": {
            "pdfPage": 159,
            "printedPage": 147,
            "section": "课文2：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l16-word13",
      "zh": "其实",
      "py": "qíshí",
      "vi": "thực ra",
      "pos": "phó từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l16:word13",
          "lessonId": "hsk3-fltrp-2026:l16",
          "lesson": 16,
          "sourceText": 2,
          "audioTrack": "16-4",
          "source": {
            "pdfPage": 159,
            "printedPage": 147,
            "section": "课文2：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l16-word14",
      "zh": "竹子",
      "py": "zhúzi",
      "vi": "tre, trúc",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l16:word14",
          "lessonId": "hsk3-fltrp-2026:l16",
          "lesson": 16,
          "sourceText": 2,
          "audioTrack": "16-4",
          "source": {
            "pdfPage": 159,
            "printedPage": 147,
            "section": "课文2：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l16-word15",
      "zh": "国宝",
      "py": "guóbǎo",
      "vi": "quốc bảo",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l16:word15",
          "lessonId": "hsk3-fltrp-2026:l16",
          "lesson": 16,
          "sourceText": 2,
          "audioTrack": "16-4",
          "source": {
            "pdfPage": 159,
            "printedPage": 147,
            "section": "课文2：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l16-word16",
      "zh": "全",
      "py": "quán",
      "vi": "toàn bộ",
      "pos": "tính từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l16:word16",
          "lessonId": "hsk3-fltrp-2026:l16",
          "lesson": 16,
          "sourceText": 2,
          "audioTrack": "16-4",
          "source": {
            "pdfPage": 159,
            "printedPage": 147,
            "section": "课文2：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l16-word17",
      "zh": "野生",
      "py": "yěshēng",
      "vi": "hoang dã",
      "pos": "tính từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l16:word17",
          "lessonId": "hsk3-fltrp-2026:l16",
          "lesson": 16,
          "sourceText": 2,
          "audioTrack": "16-4",
          "source": {
            "pdfPage": 159,
            "printedPage": 147,
            "section": "课文2：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l16-word18",
      "zh": "关于",
      "py": "guānyú",
      "vi": "về (chủ đề)",
      "pos": "giới từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l16:word18",
          "lessonId": "hsk3-fltrp-2026:l16",
          "lesson": 16,
          "sourceText": 2,
          "audioTrack": "16-4",
          "source": {
            "pdfPage": 159,
            "printedPage": 147,
            "section": "课文2：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l16-word19",
      "zh": "饱",
      "py": "bǎo",
      "vi": "no bụng",
      "pos": "tính từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l16:word19",
          "lessonId": "hsk3-fltrp-2026:l16",
          "lesson": 16,
          "sourceText": 3,
          "audioTrack": "16-6",
          "source": {
            "pdfPage": 161,
            "printedPage": 149,
            "section": "课文3：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l16-word20",
      "zh": "张",
      "py": "zhāng",
      "vi": "mở, há",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l16:word20",
          "lessonId": "hsk3-fltrp-2026:l16",
          "lesson": 16,
          "sourceText": 3,
          "audioTrack": "16-6",
          "source": {
            "pdfPage": 161,
            "printedPage": 149,
            "section": "课文3：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l16-word21",
      "zh": "嘴",
      "py": "zuǐ",
      "vi": "miệng",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l16:word21",
          "lessonId": "hsk3-fltrp-2026:l16",
          "lesson": 16,
          "sourceText": 3,
          "audioTrack": "16-6",
          "source": {
            "pdfPage": 161,
            "printedPage": 149,
            "section": "课文3：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l16-word22",
      "zh": "身边",
      "py": "shēnbiān",
      "vi": "bên cạnh mình",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l16:word22",
          "lessonId": "hsk3-fltrp-2026:l16",
          "lesson": 16,
          "sourceText": 3,
          "audioTrack": "16-6",
          "source": {
            "pdfPage": 161,
            "printedPage": 149,
            "section": "课文3：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l16-word23",
      "zh": "半天",
      "py": "bàntiān",
      "vi": "một lúc lâu",
      "pos": "cụm số lượng",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l16:word23",
          "lessonId": "hsk3-fltrp-2026:l16",
          "lesson": 16,
          "sourceText": 3,
          "audioTrack": "16-6",
          "source": {
            "pdfPage": 161,
            "printedPage": 149,
            "section": "课文3：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l16-word24",
      "zh": "脸",
      "py": "liǎn",
      "vi": "mặt",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l16:word24",
          "lessonId": "hsk3-fltrp-2026:l16",
          "lesson": 16,
          "sourceText": 3,
          "audioTrack": "16-6",
          "source": {
            "pdfPage": 161,
            "printedPage": 149,
            "section": "课文3：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l16-word25",
      "zh": "大人",
      "py": "dàren",
      "vi": "người lớn",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l16:word25",
          "lessonId": "hsk3-fltrp-2026:l16",
          "lesson": 16,
          "sourceText": 4,
          "audioTrack": "16-8",
          "source": {
            "pdfPage": 162,
            "printedPage": 150,
            "section": "课文4：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l16-word26",
      "zh": "喜爱",
      "py": "xǐ'ài",
      "vi": "yêu thích",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l16:word26",
          "lessonId": "hsk3-fltrp-2026:l16",
          "lesson": 16,
          "sourceText": 4,
          "audioTrack": "16-8",
          "source": {
            "pdfPage": 162,
            "printedPage": 150,
            "section": "课文4：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l17-word01",
      "zh": "向",
      "py": "xiàng",
      "vi": "về phía; hướng tới",
      "pos": "giới từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l17:word01",
          "lessonId": "hsk3-fltrp-2026:l17",
          "lesson": 17,
          "sourceText": 1,
          "audioTrack": "17-2",
          "source": {
            "pdfPage": 167,
            "printedPage": 155,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l17-word02",
      "zh": "楼梯",
      "py": "lóutī",
      "vi": "cầu thang",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l17:word02",
          "lessonId": "hsk3-fltrp-2026:l17",
          "lesson": 17,
          "sourceText": 1,
          "audioTrack": "17-2",
          "source": {
            "pdfPage": 167,
            "printedPage": 155,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l17-word03",
      "zh": "害怕",
      "py": "hàipà",
      "vi": "sợ hãi",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l17:word03",
          "lessonId": "hsk3-fltrp-2026:l17",
          "lesson": 17,
          "sourceText": 1,
          "audioTrack": "17-2",
          "source": {
            "pdfPage": 167,
            "printedPage": 155,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l17-word04",
      "zh": "生气",
      "py": "shēngqì",
      "vi": "tức giận",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l17:word04",
          "lessonId": "hsk3-fltrp-2026:l17",
          "lesson": 17,
          "sourceText": 1,
          "audioTrack": "17-2",
          "source": {
            "pdfPage": 167,
            "printedPage": 155,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l17-word05",
      "zh": "常见",
      "py": "cháng jiàn",
      "vi": "thường gặp",
      "pos": "cụm từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l17:word05",
          "lessonId": "hsk3-fltrp-2026:l17",
          "lesson": 17,
          "sourceText": 1,
          "audioTrack": "17-2",
          "source": {
            "pdfPage": 167,
            "printedPage": 155,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l17-word06",
      "zh": "聪明",
      "py": "cōngming",
      "vi": "thông minh",
      "pos": "tính từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l17:word06",
          "lessonId": "hsk3-fltrp-2026:l17",
          "lesson": 17,
          "sourceText": 1,
          "audioTrack": "17-2",
          "source": {
            "pdfPage": 167,
            "printedPage": 155,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l17-word07",
      "zh": "错",
      "py": "cuò",
      "vi": "lỗi, sai sót",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l17:word07",
          "lessonId": "hsk3-fltrp-2026:l17",
          "lesson": 17,
          "sourceText": 1,
          "audioTrack": "17-2",
          "source": {
            "pdfPage": 167,
            "printedPage": 155,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l17-word08",
      "zh": "认为",
      "py": "rènwéi",
      "vi": "cho rằng",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l17:word08",
          "lessonId": "hsk3-fltrp-2026:l17",
          "lesson": 17,
          "sourceText": 1,
          "audioTrack": "17-2",
          "source": {
            "pdfPage": 167,
            "printedPage": 155,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l17-word09",
      "zh": "到处",
      "py": "dàochù",
      "vi": "khắp nơi",
      "pos": "phó từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l17:word09",
          "lessonId": "hsk3-fltrp-2026:l17",
          "lesson": 17,
          "sourceText": 2,
          "audioTrack": "17-4",
          "source": {
            "pdfPage": 169,
            "printedPage": 157,
            "section": "课文2：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l17-word10",
      "zh": "继续",
      "py": "jìxù",
      "vi": "tiếp tục",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l17:word10",
          "lessonId": "hsk3-fltrp-2026:l17",
          "lesson": 17,
          "sourceText": 2,
          "audioTrack": "17-4",
          "source": {
            "pdfPage": 169,
            "printedPage": 157,
            "section": "课文2：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l17-word11",
      "zh": "同意",
      "py": "tóngyì",
      "vi": "đồng ý",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l17:word11",
          "lessonId": "hsk3-fltrp-2026:l17",
          "lesson": 17,
          "sourceText": 2,
          "audioTrack": "17-4",
          "source": {
            "pdfPage": 169,
            "printedPage": 157,
            "section": "课文2：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l17-word12",
      "zh": "可",
      "py": "kě",
      "vi": "nhưng",
      "pos": "liên từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l17:word12",
          "lessonId": "hsk3-fltrp-2026:l17",
          "lesson": 17,
          "sourceText": 2,
          "audioTrack": "17-4",
          "source": {
            "pdfPage": 169,
            "printedPage": 157,
            "section": "课文2：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l17-word13",
      "zh": "屋子",
      "py": "wūzi",
      "vi": "phòng, nhà",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l17:word13",
          "lessonId": "hsk3-fltrp-2026:l17",
          "lesson": 17,
          "sourceText": 2,
          "audioTrack": "17-4",
          "source": {
            "pdfPage": 169,
            "printedPage": 157,
            "section": "课文2：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l17-word14",
      "zh": "有关",
      "py": "yǒuguān",
      "vi": "có liên quan",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l17:word14",
          "lessonId": "hsk3-fltrp-2026:l17",
          "lesson": 17,
          "sourceText": 2,
          "audioTrack": "17-4",
          "source": {
            "pdfPage": 169,
            "printedPage": 157,
            "section": "课文2：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l17-word15",
      "zh": "有关",
      "py": "yǒuguān",
      "vi": "về, liên quan đến",
      "pos": "giới từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l17:word15",
          "lessonId": "hsk3-fltrp-2026:l17",
          "lesson": 17,
          "sourceText": 2,
          "audioTrack": "17-4",
          "source": {
            "pdfPage": 169,
            "printedPage": 157,
            "section": "课文2：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l17-word16",
      "zh": "关机",
      "py": "guānjī",
      "vi": "tắt máy, tắt điện thoại",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l17:word16",
          "lessonId": "hsk3-fltrp-2026:l17",
          "lesson": 17,
          "sourceText": 3,
          "audioTrack": "17-6",
          "source": {
            "pdfPage": 171,
            "printedPage": 159,
            "section": "课文3：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l17-word17",
      "zh": "前天",
      "py": "qiántiān",
      "vi": "hôm kia",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l17:word17",
          "lessonId": "hsk3-fltrp-2026:l17",
          "lesson": 17,
          "sourceText": 3,
          "audioTrack": "17-6",
          "source": {
            "pdfPage": 171,
            "printedPage": 159,
            "section": "课文3：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l17-word18",
      "zh": "留学",
      "py": "liúxué",
      "vi": "du học",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l17:word18",
          "lessonId": "hsk3-fltrp-2026:l17",
          "lesson": 17,
          "sourceText": 3,
          "audioTrack": "17-6",
          "source": {
            "pdfPage": 171,
            "printedPage": 159,
            "section": "课文3：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l17-word19",
      "zh": "国家",
      "py": "guójiā",
      "vi": "quốc gia",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l17:word19",
          "lessonId": "hsk3-fltrp-2026:l17",
          "lesson": 17,
          "sourceText": 3,
          "audioTrack": "17-6",
          "source": {
            "pdfPage": 171,
            "printedPage": 159,
            "section": "课文3：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l17-word20",
      "zh": "比如",
      "py": "bǐrú",
      "vi": "ví dụ như",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l17:word20",
          "lessonId": "hsk3-fltrp-2026:l17",
          "lesson": 17,
          "sourceText": 3,
          "audioTrack": "17-6",
          "source": {
            "pdfPage": 171,
            "printedPage": 159,
            "section": "课文3：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l17-word21",
      "zh": "查",
      "py": "chá",
      "vi": "tra cứu",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l17:word21",
          "lessonId": "hsk3-fltrp-2026:l17",
          "lesson": 17,
          "sourceText": 3,
          "audioTrack": "17-6",
          "source": {
            "pdfPage": 171,
            "printedPage": 159,
            "section": "课文3：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l17-word22",
      "zh": "有用",
      "py": "yǒuyòng",
      "vi": "hữu ích",
      "pos": "tính từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l17:word22",
          "lessonId": "hsk3-fltrp-2026:l17",
          "lesson": 17,
          "sourceText": 3,
          "audioTrack": "17-6",
          "source": {
            "pdfPage": 171,
            "printedPage": 159,
            "section": "课文3：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l17-word23",
      "zh": "容易",
      "py": "róngyì",
      "vi": "dễ",
      "pos": "tính từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l17:word23",
          "lessonId": "hsk3-fltrp-2026:l17",
          "lesson": 17,
          "sourceText": 4,
          "audioTrack": "17-8",
          "source": {
            "pdfPage": 172,
            "printedPage": 160,
            "section": "课文4：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l17-word24",
      "zh": "回答",
      "py": "huídá",
      "vi": "trả lời",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l17:word24",
          "lessonId": "hsk3-fltrp-2026:l17",
          "lesson": 17,
          "sourceText": 4,
          "audioTrack": "17-8",
          "source": {
            "pdfPage": 172,
            "printedPage": 160,
            "section": "课文4：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l17-word25",
      "zh": "方向",
      "py": "fāngxiàng",
      "vi": "hướng, phương hướng",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l17:word25",
          "lessonId": "hsk3-fltrp-2026:l17",
          "lesson": 17,
          "sourceText": 4,
          "audioTrack": "17-8",
          "source": {
            "pdfPage": 172,
            "printedPage": 160,
            "section": "课文4：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l17-word26",
      "zh": "只有",
      "py": "zhǐyǒu",
      "vi": "chỉ khi, chỉ có",
      "pos": "liên từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l17:word26",
          "lessonId": "hsk3-fltrp-2026:l17",
          "lesson": 17,
          "sourceText": 4,
          "audioTrack": "17-8",
          "source": {
            "pdfPage": 172,
            "printedPage": 160,
            "section": "课文4：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l17-word27",
      "zh": "真正",
      "py": "zhēnzhèng",
      "vi": "thật sự",
      "pos": "phó từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l17:word27",
          "lessonId": "hsk3-fltrp-2026:l17",
          "lesson": 17,
          "sourceText": 4,
          "audioTrack": "17-8",
          "source": {
            "pdfPage": 172,
            "printedPage": 160,
            "section": "课文4：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l17-word28",
      "zh": "难题",
      "py": "nántí",
      "vi": "vấn đề khó, bài toán khó",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l17:word28",
          "lessonId": "hsk3-fltrp-2026:l17",
          "lesson": 17,
          "sourceText": 4,
          "audioTrack": "17-8",
          "source": {
            "pdfPage": 172,
            "printedPage": 160,
            "section": "课文4：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l18-word01",
      "zh": "怎样",
      "py": "zěnyàng",
      "vi": "như thế nào",
      "pos": "đại từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l18:word01",
          "lessonId": "hsk3-fltrp-2026:l18",
          "lesson": 18,
          "sourceText": 1,
          "audioTrack": "18-2",
          "source": {
            "pdfPage": 176,
            "printedPage": 164,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l18-word02",
      "zh": "过节",
      "py": "guòjié",
      "vi": "đón lễ, ăn Tết",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l18:word02",
          "lessonId": "hsk3-fltrp-2026:l18",
          "lesson": 18,
          "sourceText": 1,
          "audioTrack": "18-2",
          "source": {
            "pdfPage": 176,
            "printedPage": 164,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l18-word03",
      "zh": "节",
      "py": "jié",
      "vi": "ngày lễ, Tết",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l18:word03",
          "lessonId": "hsk3-fltrp-2026:l18",
          "lesson": 18,
          "sourceText": 1,
          "audioTrack": "18-2",
          "source": {
            "pdfPage": 176,
            "printedPage": 164,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l18-word04",
      "zh": "节日",
      "py": "jiérì",
      "vi": "ngày lễ",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l18:word04",
          "lessonId": "hsk3-fltrp-2026:l18",
          "lesson": 18,
          "sourceText": 1,
          "audioTrack": "18-2",
          "source": {
            "pdfPage": 176,
            "printedPage": 164,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l18-word05",
      "zh": "联欢",
      "py": "liánhuān",
      "vi": "liên hoan, cùng vui chơi",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l18:word05",
          "lessonId": "hsk3-fltrp-2026:l18",
          "lesson": 18,
          "sourceText": 1,
          "audioTrack": "18-2",
          "source": {
            "pdfPage": 176,
            "printedPage": 164,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l18-word06",
      "zh": "大概",
      "py": "dàgài",
      "vi": "có lẽ; khoảng, chừng",
      "pos": "phó từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l18:word06",
          "lessonId": "hsk3-fltrp-2026:l18",
          "lesson": 18,
          "sourceText": 1,
          "audioTrack": "18-2",
          "source": {
            "pdfPage": 176,
            "printedPage": 164,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l18-word07",
      "zh": "大概",
      "py": "dàgài",
      "vi": "sơ lược, đại khái",
      "pos": "tính từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l18:word07",
          "lessonId": "hsk3-fltrp-2026:l18",
          "lesson": 18,
          "sourceText": 1,
          "audioTrack": "18-2",
          "source": {
            "pdfPage": 176,
            "printedPage": 164,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l18-word08",
      "zh": "春节",
      "py": "Chūnjié",
      "vi": "Tết Nguyên đán",
      "pos": "danh từ riêng",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l18:word08",
          "lessonId": "hsk3-fltrp-2026:l18",
          "lesson": 18,
          "sourceText": 1,
          "audioTrack": "18-2",
          "source": {
            "pdfPage": 176,
            "printedPage": 164,
            "section": "课文1：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l18-word09",
      "zh": "阿姨",
      "py": "āyí",
      "vi": "cô, dì (cách xưng hô với phụ nữ thế hệ mẹ)",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l18:word09",
          "lessonId": "hsk3-fltrp-2026:l18",
          "lesson": 18,
          "sourceText": 2,
          "audioTrack": "18-4",
          "source": {
            "pdfPage": 178,
            "printedPage": 166,
            "section": "课文2：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l18-word10",
      "zh": "叔叔",
      "py": "shūshu",
      "vi": "chú (cách xưng hô với nam giới thế hệ cha)",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l18:word10",
          "lessonId": "hsk3-fltrp-2026:l18",
          "lesson": 18,
          "sourceText": 2,
          "audioTrack": "18-4",
          "source": {
            "pdfPage": 178,
            "printedPage": 166,
            "section": "课文2：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l18-word11",
      "zh": "收",
      "py": "shōu",
      "vi": "nhận",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l18:word11",
          "lessonId": "hsk3-fltrp-2026:l18",
          "lesson": 18,
          "sourceText": 2,
          "audioTrack": "18-4",
          "source": {
            "pdfPage": 178,
            "printedPage": 166,
            "section": "课文2：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l18-word12",
      "zh": "总",
      "py": "zǒng",
      "vi": "luôn, thường xuyên",
      "pos": "phó từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l18:word12",
          "lessonId": "hsk3-fltrp-2026:l18",
          "lesson": 18,
          "sourceText": 2,
          "audioTrack": "18-4",
          "source": {
            "pdfPage": 178,
            "printedPage": 166,
            "section": "课文2：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l18-word13",
      "zh": "起",
      "py": "qǐ",
      "vi": "(sau động từ) chỉ người hoặc sự việc được nói đến, nhớ đến",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l18:word13",
          "lessonId": "hsk3-fltrp-2026:l18",
          "lesson": 18,
          "sourceText": 2,
          "audioTrack": "18-4",
          "source": {
            "pdfPage": 178,
            "printedPage": 166,
            "section": "课文2：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l18-word14",
      "zh": "见面",
      "py": "jiànmiàn",
      "vi": "gặp mặt",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l18:word14",
          "lessonId": "hsk3-fltrp-2026:l18",
          "lesson": 18,
          "sourceText": 2,
          "audioTrack": "18-4",
          "source": {
            "pdfPage": 178,
            "printedPage": 166,
            "section": "课文2：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l18-word15",
      "zh": "矿泉水",
      "py": "kuàngquánshuǐ",
      "vi": "nước khoáng",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l18:word15",
          "lessonId": "hsk3-fltrp-2026:l18",
          "lesson": 18,
          "sourceText": 2,
          "audioTrack": "18-4",
          "source": {
            "pdfPage": 178,
            "printedPage": 166,
            "section": "课文2：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l18-word16",
      "zh": "刚刚",
      "py": "gānggāng",
      "vi": "vừa mới",
      "pos": "phó từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l18:word16",
          "lessonId": "hsk3-fltrp-2026:l18",
          "lesson": 18,
          "sourceText": 2,
          "audioTrack": "18-4",
          "source": {
            "pdfPage": 178,
            "printedPage": 166,
            "section": "课文2：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l18-word17",
      "zh": "出发",
      "py": "chūfā",
      "vi": "khởi hành, xuất phát",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l18:word17",
          "lessonId": "hsk3-fltrp-2026:l18",
          "lesson": 18,
          "sourceText": 3,
          "audioTrack": "18-6",
          "source": {
            "pdfPage": 180,
            "printedPage": 168,
            "section": "课文3：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l18-word18",
      "zh": "不久",
      "py": "bùjiǔ",
      "vi": "không lâu",
      "pos": "tính từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l18:word18",
          "lessonId": "hsk3-fltrp-2026:l18",
          "lesson": 18,
          "sourceText": 3,
          "audioTrack": "18-6",
          "source": {
            "pdfPage": 180,
            "printedPage": 168,
            "section": "课文3：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l18-word19",
      "zh": "发生",
      "py": "fāshēng",
      "vi": "xảy ra",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l18:word19",
          "lessonId": "hsk3-fltrp-2026:l18",
          "lesson": 18,
          "sourceText": 3,
          "audioTrack": "18-6",
          "source": {
            "pdfPage": 180,
            "printedPage": 168,
            "section": "课文3：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l18-word20",
      "zh": "刚",
      "py": "gāng",
      "vi": "vừa, mới",
      "pos": "phó từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l18:word20",
          "lessonId": "hsk3-fltrp-2026:l18",
          "lesson": 18,
          "sourceText": 3,
          "audioTrack": "18-6",
          "source": {
            "pdfPage": 180,
            "printedPage": 168,
            "section": "课文3：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l18-word21",
      "zh": "只要",
      "py": "zhǐyào",
      "vi": "chỉ cần",
      "pos": "liên từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l18:word21",
          "lessonId": "hsk3-fltrp-2026:l18",
          "lesson": 18,
          "sourceText": 3,
          "audioTrack": "18-6",
          "source": {
            "pdfPage": 180,
            "printedPage": 168,
            "section": "课文3：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l18-word22",
      "zh": "学期",
      "py": "xuéqī",
      "vi": "học kỳ",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l18:word22",
          "lessonId": "hsk3-fltrp-2026:l18",
          "lesson": 18,
          "sourceText": 3,
          "audioTrack": "18-6",
          "source": {
            "pdfPage": 180,
            "printedPage": 168,
            "section": "课文3：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l18-word23",
      "zh": "毕业",
      "py": "bìyè",
      "vi": "tốt nghiệp",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l18:word23",
          "lessonId": "hsk3-fltrp-2026:l18",
          "lesson": 18,
          "sourceText": 3,
          "audioTrack": "18-6",
          "source": {
            "pdfPage": 180,
            "printedPage": 168,
            "section": "课文3：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l18-word24",
      "zh": "出生",
      "py": "chūshēng",
      "vi": "ra đời, sinh ra",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l18:word24",
          "lessonId": "hsk3-fltrp-2026:l18",
          "lesson": 18,
          "sourceText": 4,
          "audioTrack": "18-8",
          "source": {
            "pdfPage": 182,
            "printedPage": 170,
            "section": "课文4：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l18-word25",
      "zh": "过去",
      "py": "guòqù",
      "vi": "quá khứ, trước đây",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l18:word25",
          "lessonId": "hsk3-fltrp-2026:l18",
          "lesson": 18,
          "sourceText": 4,
          "audioTrack": "18-8",
          "source": {
            "pdfPage": 182,
            "printedPage": 170,
            "section": "课文4：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l18-word26",
      "zh": "懂得",
      "py": "dǒngde",
      "vi": "hiểu, biết",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l18:word26",
          "lessonId": "hsk3-fltrp-2026:l18",
          "lesson": 18,
          "sourceText": 4,
          "audioTrack": "18-8",
          "source": {
            "pdfPage": 182,
            "printedPage": 170,
            "section": "课文4：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l18-word27",
      "zh": "坚持",
      "py": "jiānchí",
      "vi": "kiên trì",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l18:word27",
          "lessonId": "hsk3-fltrp-2026:l18",
          "lesson": 18,
          "sourceText": 4,
          "audioTrack": "18-8",
          "source": {
            "pdfPage": 182,
            "printedPage": 170,
            "section": "课文4：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l18-word28",
      "zh": "完成",
      "py": "wánchéng",
      "vi": "hoàn thành",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l18:word28",
          "lessonId": "hsk3-fltrp-2026:l18",
          "lesson": 18,
          "sourceText": 4,
          "audioTrack": "18-8",
          "source": {
            "pdfPage": 182,
            "printedPage": 170,
            "section": "课文4：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l18-word29",
      "zh": "目标",
      "py": "mùbiāo",
      "vi": "mục tiêu",
      "pos": "danh từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l18:word29",
          "lessonId": "hsk3-fltrp-2026:l18",
          "lesson": 18,
          "sourceText": 4,
          "audioTrack": "18-8",
          "source": {
            "pdfPage": 182,
            "printedPage": 170,
            "section": "课文4：生词",
            "provenance": "textbook"
          }
        }
      ]
    },
    {
      "id": "hsk3-fltrp-2026:sense:l18-word30",
      "zh": "发展",
      "py": "fāzhǎn",
      "vi": "phát triển",
      "pos": "động từ",
      "sources": [
        {
          "wordId": "hsk3-fltrp-2026:l18:word30",
          "lessonId": "hsk3-fltrp-2026:l18",
          "lesson": 18,
          "sourceText": 4,
          "audioTrack": "18-8",
          "source": {
            "pdfPage": 182,
            "printedPage": 170,
            "section": "课文4：生词",
            "provenance": "textbook"
          }
        }
      ]
    }
  ]
}
`;export{e as default};