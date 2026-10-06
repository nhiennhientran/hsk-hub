var e=`{
  "schemaVersion": 1,
  "baseline": "71b39192133c82f684384f450dda6079d3253440",
  "revision": "hsk1-display-20261004-01",
  "sources": [
    {
      "id": "hsk1-chinese-original",
      "title": "新HSK教程1 · 原中文教材",
      "sha256": "25d1aad102e4179307b5bc4f932927bbd244b3f4dd53edeb6cfd4dbbb8d4f2ba"
    }
  ],
  "changes": [
    {
      "target": "textbook-l04-text-1-line-03",
      "lesson": 4,
      "field": "py",
      "expected": "tā yǒu duō shǎo gè xué shēng？",
      "value": "Tā yǒu duōshao gè xuéshēng?",
      "source": {
        "id": "hsk1-chinese-original",
        "printedPages": [
          19
        ],
        "pdfPages": [
          34
        ]
      },
      "reason": "原页明确duōshao，少为轻声；保持原句和稳定编号。"
    },
    {
      "target": "textbook-l04-v002",
      "lesson": 4,
      "field": "pos",
      "expected": "adj",
      "value": "pron",
      "source": {
        "id": "hsk1-chinese-original",
        "printedPages": [
          25
        ],
        "pdfPages": [
          40
        ]
      },
      "reason": "原页“多”标注pron.，此处是询问程度的代词。"
    },
    {
      "target": "textbook-l04-v002",
      "lesson": 4,
      "field": "posLabel",
      "expected": "形容词 · Tính từ",
      "value": "代词 · Đại từ",
      "source": {
        "id": "hsk1-chinese-original",
        "printedPages": [
          25
        ],
        "pdfPages": [
          40
        ]
      },
      "reason": "配合原教材pron.修正词性展示。"
    },
    {
      "target": "textbook-l05-text-1-line-04",
      "lesson": 5,
      "field": "py",
      "expected": "xīng qī rì。 jīn tiān wǒ xiū xī。",
      "value": "Xīngqīrì. Jīntiān wǒ xiūxi.",
      "source": {
        "id": "hsk1-chinese-original",
        "printedPages": [
          28
        ],
        "pdfPages": [
          43
        ]
      },
      "reason": "休息后音节读轻声，原书xiūxi。"
    },
    {
      "target": "textbook-l05-text-2-line-04",
      "lesson": 5,
      "field": "py",
      "expected": "wǒ huì zuò miàn tiáo ér、 jiǎo zi， yě huì zuò yī xiē cài。 xīng qī tiān wǒ yě zuò fàn。",
      "value": "Wǒ huì zuò miàntiáor, jiǎozi, yě huì zuò yìxiē cài. Xīngqītiān wǒ yě zuò fàn.",
      "source": {
        "id": "hsk1-chinese-original",
        "printedPages": [
          30
        ],
        "pdfPages": [
          45
        ]
      },
      "reason": "原书面条儿儿化、饺子轻声、一些一变调；保持原书拼音词组。"
    },
    {
      "target": "textbook-l05-text-3-line-06",
      "lesson": 5,
      "field": "py",
      "expected": "wǒ yě hěn xǐ huān tā。",
      "value": "Wǒ yě hěn xǐhuan tā.",
      "source": {
        "id": "hsk1-chinese-original",
        "printedPages": [
          32
        ],
        "pdfPages": [
          47
        ]
      },
      "reason": "喜欢后音节轻声。"
    },
    {
      "target": "textbook-l05-title",
      "lesson": 5,
      "field": "title_py",
      "expected": "jīn tiān wǒ xiū xī",
      "value": "Jīntiān wǒ xiūxi",
      "source": {
        "id": "hsk1-chinese-original",
        "printedPages": [
          27
        ],
        "pdfPages": [
          42
        ]
      },
      "reason": "按原书标题拼音恢复轻声音节；仅展示修订，不改冻结历史题库。"
    },
    {
      "target": "textbook-l06-text-1-line-02",
      "lesson": 6,
      "field": "py",
      "expected": "wǒ de shǒu jī hào shì + 3 3   6 0 1 4 9 3 1 9 0。",
      "value": "Wǒ de shǒujīhào shì sān sān liù líng yāo sì jiǔ sān yāo jiǔ líng.",
      "source": {
        "id": "hsk1-chinese-original",
        "printedPages": [
          36
        ],
        "pdfPages": [
          51
        ]
      },
      "reason": "现版用数字代替电话号读音；原书明确逐位读且1读yāo。"
    },
    {
      "target": "textbook-l06-text-1-line-03",
      "lesson": 6,
      "field": "py",
      "expected": "wǒ de shǒu jī hào shì + 8 6   1 3 5 5 2 7 2 1 1 6 0。",
      "value": "Wǒ de shǒujīhào shì bā liù yāo sān wǔ wǔ èr qī èr yāo yāo liù líng.",
      "source": {
        "id": "hsk1-chinese-original",
        "printedPages": [
          36
        ],
        "pdfPages": [
          51
        ]
      },
      "reason": "逐位读电话号码；1读yāo。"
    },
    {
      "target": "textbook-l06-text-1-line-01",
      "lesson": 6,
      "field": "py",
      "expected": "jiā yuè， nǐ de shǒu jī hào shì duō shǎo？",
      "value": "Jiāyuè, nǐ de shǒujīhào shì duōshao?",
      "source": {
        "id": "hsk1-chinese-original",
        "printedPages": [
          36
        ],
        "pdfPages": [
          51
        ]
      },
      "reason": "按源页课文拼音纠正轻声、儿化或喂的第二声；仅展示修订，不改冻结历史题库。"
    },
    {
      "target": "textbook-l06-text-2-line-01",
      "lesson": 6,
      "field": "py",
      "expected": "jiā yuè， míng tiān nǐ qù nǎ ér？",
      "value": "Jiāyuè, míngtiān nǐ qù nǎr?",
      "source": {
        "id": "hsk1-chinese-original",
        "printedPages": [
          37
        ],
        "pdfPages": [
          52
        ]
      },
      "reason": "按源页课文拼音纠正轻声、儿化或喂的第二声；仅展示修订，不改冻结历史题库。"
    },
    {
      "target": "textbook-l06-text-3-line-01",
      "lesson": 6,
      "field": "py",
      "expected": "xīng qī tiān wǒ men qù nǎ ér chī wǎn fàn？",
      "value": "Xīngqītiān wǒmen qù nǎr chī wǎnfàn?",
      "source": {
        "id": "hsk1-chinese-original",
        "printedPages": [
          39
        ],
        "pdfPages": [
          54
        ]
      },
      "reason": "按源页课文拼音纠正轻声、儿化或喂的第二声；仅展示修订，不改冻结历史题库。"
    },
    {
      "target": "textbook-l06-v014",
      "lesson": 6,
      "field": "py",
      "expected": "nàbian",
      "value": "nàbiān",
      "source": {
        "id": "hsk1-chinese-original",
        "printedPages": [
          40
        ],
        "pdfPages": [
          55
        ]
      },
      "reason": "主教材nàbian与原书不同；来源词表拼音为nàbiān，仅展示修订，不改冻结历史题库。"
    },
    {
      "target": "textbook-l06-title",
      "lesson": 6,
      "field": "title_py",
      "expected": "nǐ de shǒu jī hào shì duō shǎo",
      "value": "Nǐ de shǒujīhào shì duōshao?",
      "source": {
        "id": "hsk1-chinese-original",
        "printedPages": [
          35
        ],
        "pdfPages": [
          50
        ]
      },
      "reason": "按原书标题拼音恢复轻声音节；仅展示修订，不改冻结历史题库。"
    },
    {
      "target": "textbook-l07-text-3-line-02",
      "lesson": 7,
      "field": "py",
      "expected": "wǒ zài jiā lǐ ne。",
      "value": "Wǒ zài jiā li ne.",
      "source": {
        "id": "hsk1-chinese-original",
        "printedPages": [
          51
        ],
        "pdfPages": [
          66
        ]
      },
      "reason": "后置方位词里按原书轻声。"
    },
    {
      "target": "textbook-l07-text-3-line-05",
      "lesson": 7,
      "field": "py",
      "expected": "hǎo de， nǐ qù diàn lǐ mǎi xiē cài ba。",
      "value": "Hǎo de, nǐ qù diàn li mǎi xiē cài ba.",
      "source": {
        "id": "hsk1-chinese-original",
        "printedPages": [
          51
        ],
        "pdfPages": [
          66
        ]
      },
      "reason": "店里中里按原书轻声。"
    },
    {
      "target": "textbook-l07-text-1-line-02",
      "lesson": 7,
      "field": "py",
      "expected": "zǎo shàng bā diǎn sì shí。",
      "value": "Zǎoshang bā diǎn sìshí.",
      "source": {
        "id": "hsk1-chinese-original",
        "printedPages": [
          46
        ],
        "pdfPages": [
          61
        ]
      },
      "reason": "按源页课文拼音纠正轻声、儿化或喂的第二声；仅展示修订，不改冻结历史题库。"
    },
    {
      "target": "textbook-l07-text-3-line-01",
      "lesson": 7,
      "field": "py",
      "expected": "wèi， nǐ zài nǎ ér ne？",
      "value": "Wéi, nǐ zài nǎr ne?",
      "source": {
        "id": "hsk1-chinese-original",
        "printedPages": [
          51
        ],
        "pdfPages": [
          66
        ]
      },
      "reason": "按源页课文拼音纠正轻声、儿化或喂的第二声；仅展示修订，不改冻结历史题库。"
    },
    {
      "target": "textbook-l07-text-3-line-03",
      "lesson": 7,
      "field": "py",
      "expected": "wǒ wǎn shàng liù diǎn bàn xià bān。",
      "value": "Wǒ wǎnshang liù diǎn bàn xiàbān.",
      "source": {
        "id": "hsk1-chinese-original",
        "printedPages": [
          51
        ],
        "pdfPages": [
          66
        ]
      },
      "reason": "按源页课文拼音纠正轻声、儿化或喂的第二声；仅展示修订，不改冻结历史题库。"
    },
    {
      "target": "textbook-l07-title",
      "lesson": 7,
      "field": "title_py",
      "expected": "wǒ wǎn shàng liù diǎn bàn xià bān",
      "value": "Wǒ wǎnshang liù diǎn bàn xiàbān",
      "source": {
        "id": "hsk1-chinese-original",
        "printedPages": [
          45
        ],
        "pdfPages": [
          60
        ]
      },
      "reason": "按原书标题拼音恢复轻声音节；仅展示修订，不改冻结历史题库。"
    },
    {
      "target": "textbook-l08-text-1-line-02",
      "lesson": 8,
      "field": "py",
      "expected": "wǒ méi kàn jiàn， tā zài nǎ ér ne？",
      "value": "Wǒ méi kànjiàn, tā zài nǎr ne?",
      "source": {
        "id": "hsk1-chinese-original",
        "printedPages": [
          55
        ],
        "pdfPages": [
          70
        ]
      },
      "reason": "按源页课文拼音纠正轻声、儿化或喂的第二声；仅展示修订，不改冻结历史题库。"
    },
    {
      "target": "textbook-l08-text-2-line-01",
      "lesson": 8,
      "field": "py",
      "expected": "wǒ men zài nǎ ér jiàn ne？",
      "value": "Wǒmen zài nǎr jiàn ne?",
      "source": {
        "id": "hsk1-chinese-original",
        "printedPages": [
          57
        ],
        "pdfPages": [
          72
        ]
      },
      "reason": "按源页课文拼音纠正轻声、儿化或喂的第二声；仅展示修订，不改冻结历史题库。"
    },
    {
      "target": "textbook-l08-title",
      "lesson": 8,
      "field": "title_py",
      "expected": "wǒ bà bà yě zài yī yuàn gōng zuò",
      "value": "Wǒ bàba yě zài yīyuàn gōngzuò",
      "source": {
        "id": "hsk1-chinese-original",
        "printedPages": [
          54
        ],
        "pdfPages": [
          69
        ]
      },
      "reason": "按原书标题拼音恢复轻声音节；仅展示修订，不改冻结历史题库。"
    },
    {
      "target": "textbook-l06-grammar-01",
      "lesson": 6,
      "field": "examples",
      "expected": [
        {
          "zh": "我想去超市。",
          "py": "wǒ xiǎng qù chāo shì。",
          "vn": "Tôi muốn đi siêu thị."
        },
        {
          "zh": "我不想休息。",
          "py": "wǒ bù xiǎng xiū xī。",
          "vn": "Tôi không muốn nghỉ."
        }
      ],
      "value": [
        {
          "zh": "我想去超市。",
          "py": "Wǒ xiǎng qù chāoshì.",
          "vn": "Tôi muốn đi siêu thị."
        },
        {
          "zh": "我哥哥不想休息。",
          "py": "Wǒ gēge bù xiǎng xiūxi.",
          "vn": "Anh trai tôi không muốn nghỉ ngơi."
        }
      ],
      "source": {
        "id": "hsk1-chinese-original",
        "printedPages": [
          38
        ],
        "pdfPages": [
          53
        ]
      },
      "reason": "恢复原书完整例句/对话和原有顺序。原页这些例句未印拼音，拼音和越译为编辑补充，官方越文全面核对后置。"
    },
    {
      "target": "textbook-l06-grammar-02",
      "lesson": 6,
      "field": "examples",
      "expected": [
        {
          "zh": "我想去超市买东西。",
          "py": "wǒ xiǎng qù chāo shì mǎi dōngxi。",
          "vn": "Tôi muốn đi siêu thị mua đồ."
        },
        {
          "zh": "我们坐出租车去西安饭店。",
          "py": "wǒ men zuò chū zū chē qù xī ān fàn diàn。",
          "vn": "Chúng ta đi taxi đến Nhà hàng Tây An."
        }
      ],
      "value": [
        {
          "zh": "我想去超市买东西。",
          "py": "Wǒ xiǎng qù chāoshì mǎi dōngxi.",
          "vn": "Tôi muốn đến siêu thị mua đồ."
        },
        {
          "zh": "我们去西安饭店吃晚饭。",
          "py": "Wǒmen qù Xī’ān Fàndiàn chī wǎnfàn.",
          "vn": "Chúng tôi đến nhà hàng Tây An ăn tối."
        },
        {
          "zh": "我们坐出租车去西安饭店。",
          "py": "Wǒmen zuò chūzūchē qù Xī’ān Fàndiàn.",
          "vn": "Chúng tôi đi taxi đến nhà hàng Tây An."
        },
        {
          "zh": "她坐出租车去超市。",
          "py": "Tā zuò chūzūchē qù chāoshì.",
          "vn": "Cô ấy đi taxi đến siêu thị."
        }
      ],
      "source": {
        "id": "hsk1-chinese-original",
        "printedPages": [
          40
        ],
        "pdfPages": [
          55
        ]
      },
      "reason": "恢复原书完整例句/对话和原有顺序。原页这些例句未印拼音，拼音和越译为编辑补充，官方越文全面核对后置。"
    },
    {
      "target": "textbook-l07-grammar-01",
      "lesson": 7,
      "field": "examples",
      "expected": [
        {
          "zh": "上午十点十分",
          "py": "shàng wǔ shí diǎn shí fēn",
          "vn": "10 giờ 10 sáng"
        },
        {
          "zh": "下午两点",
          "py": "xià wǔ liǎng diǎn",
          "vn": "2 giờ chiều"
        },
        {
          "zh": "晚上六点半",
          "py": "wǎn shàng liù diǎn bàn",
          "vn": "6 giờ rưỡi tối"
        }
      ],
      "value": [
        {
          "zh": "上午",
          "py": "Shàngwǔ",
          "vn": "Buổi sáng"
        },
        {
          "zh": "中午十二点",
          "py": "Zhōngwǔ shí’èr diǎn",
          "vn": "Mười hai giờ trưa"
        },
        {
          "zh": "下午两点半",
          "py": "Xiàwǔ liǎng diǎn bàn",
          "vn": "Hai giờ rưỡi chiều"
        },
        {
          "zh": "晚上九点十分",
          "py": "Wǎnshang jiǔ diǎn shí fēn",
          "vn": "Chín giờ mười phút tối"
        }
      ],
      "source": {
        "id": "hsk1-chinese-original",
        "printedPages": [
          47
        ],
        "pdfPages": [
          62
        ]
      },
      "reason": "恢复原书完整例句/对话和原有顺序。原页这些例句未印拼音，拼音和越译为编辑补充，官方越文全面核对后置。五行点/分表由来源活动精确保留。"
    },
    {
      "target": "textbook-l07-grammar-02",
      "lesson": 7,
      "field": "examples",
      "expected": [
        {
          "zh": "我们下午三点见吧。",
          "py": "wǒ men xià wǔ sān diǎn jiàn ba。",
          "vn": "Ba giờ chiều chúng ta gặp nhau nhé."
        },
        {
          "zh": "我们去西安饭店吃晚饭吧。",
          "py": "wǒ men qù xī ān fàn diàn chī wǎn fàn ba。",
          "vn": "Chúng ta đến Nhà hàng Tây An ăn tối nhé."
        }
      ],
      "value": [
        {
          "zh": "A：我们下午三点见吧。\\nB：好的。",
          "py": "A: Wǒmen xiàwǔ sān diǎn jiàn ba.\\nB: Hǎo de.",
          "vn": "A: Chiều nay ba giờ chúng ta gặp nhé.\\nB: Được."
        },
        {
          "zh": "A：你去超市买吧。\\nB：超市没有。",
          "py": "A: Nǐ qù chāoshì mǎi ba.\\nB: Chāoshì méiyǒu.",
          "vn": "A: Bạn đến siêu thị mua nhé.\\nB: Siêu thị không có."
        },
        {
          "zh": "A：我们去西安饭店吃晚饭吧。\\nB：好的。",
          "py": "A: Wǒmen qù Xī’ān Fàndiàn chī wǎnfàn ba.\\nB: Hǎo de.",
          "vn": "A: Chúng ta đến nhà hàng Tây An ăn tối nhé.\\nB: Được."
        }
      ],
      "source": {
        "id": "hsk1-chinese-original",
        "printedPages": [
          48
        ],
        "pdfPages": [
          63
        ]
      },
      "reason": "恢复原书完整例句/对话和原有顺序。原页这些例句未印拼音，拼音和越译为编辑补充，官方越文全面核对后置。"
    },
    {
      "target": "textbook-l07-grammar-03",
      "lesson": 7,
      "field": "examples",
      "expected": [
        {
          "zh": "她上午十点半上课。",
          "py": "tā shàng wǔ shí diǎn bàn shàng kè。",
          "vn": "Cô ấy vào học lúc 10 giờ 30 sáng."
        },
        {
          "zh": "我下午不去学校。",
          "py": "wǒ xià wǔ bù qù xué xiào。",
          "vn": "Chiều nay tôi không đến trường."
        }
      ],
      "value": [
        {
          "zh": "我不想去。",
          "py": "Wǒ bù xiǎng qù.",
          "vn": "Tôi không muốn đi."
        },
        {
          "zh": "妹妹很高兴。",
          "py": "Mèimei hěn gāoxìng.",
          "vn": "Em gái rất vui."
        },
        {
          "zh": "她上午十点半上课。",
          "py": "Tā shàngwǔ shí diǎn bàn shàngkè.",
          "vn": "Cô ấy học lúc mười giờ rưỡi sáng."
        }
      ],
      "source": {
        "id": "hsk1-chinese-original",
        "printedPages": [
          50
        ],
        "pdfPages": [
          65
        ]
      },
      "reason": "恢复原书完整例句/对话和原有顺序。原页这些例句未印拼音，拼音和越译为编辑补充，官方越文全面核对后置。三组开放填空在来源活动保持不自动判分。"
    },
    {
      "target": "textbook-l07-grammar-04",
      "lesson": 7,
      "field": "examples",
      "expected": [
        {
          "zh": "我明天下午两点还上课呢。",
          "py": "wǒ míng tiān xià wǔ liǎng diǎn hái shàng kè ne。",
          "vn": "Hai giờ chiều mai tôi vẫn còn học đấy."
        },
        {
          "zh": "李文晚上还有事呢。",
          "py": "lǐ wén wǎn shàng hái yǒu shì ne。",
          "vn": "Buổi tối Lý Văn vẫn còn có việc đấy."
        }
      ],
      "value": [
        {
          "zh": "我明天下午两点还上课呢。",
          "py": "Wǒ míngtiān xiàwǔ liǎng diǎn hái shàngkè ne.",
          "vn": "Chiều mai lúc hai giờ tôi vẫn còn tiết học đấy."
        },
        {
          "zh": "妹妹会做两个菜呢。",
          "py": "Mèimei huì zuò liǎng gè cài ne.",
          "vn": "Em gái biết nấu hai món đấy."
        },
        {
          "zh": "李文晚上还有事呢。",
          "py": "Lǐ Wén wǎnshang hái yǒu shì ne.",
          "vn": "Buổi tối Lý Văn vẫn còn có việc đấy."
        }
      ],
      "source": {
        "id": "hsk1-chinese-original",
        "printedPages": [
          50
        ],
        "pdfPages": [
          65
        ]
      },
      "reason": "恢复原书完整例句/对话和原有顺序。原页这些例句未印拼音，拼音和越译为编辑补充，官方越文全面核对后置。"
    },
    {
      "target": "textbook-l08-grammar-01",
      "lesson": 8,
      "field": "examples",
      "expected": [
        {
          "zh": "房间里有一只小猫。",
          "py": "fáng jiān lǐ yǒu yì zhī xiǎo māo。",
          "vn": "Trong phòng có một chú mèo con."
        },
        {
          "zh": "小雪的手机在桌子上。",
          "py": "xiǎo xuě de shǒu jī zài zhuō zi shàng。",
          "vn": "Điện thoại của Tiểu Tuyết ở trên bàn."
        }
      ],
      "value": [
        {
          "zh": "房间里有一只小猫。",
          "py": "Fángjiān li yǒu yì zhī xiǎo māo.",
          "vn": "Trong phòng có một chú mèo con."
        },
        {
          "zh": "我们去书店外吧。",
          "py": "Wǒmen qù shūdiàn wài ba.",
          "vn": "Chúng ta ra ngoài hiệu sách nhé."
        },
        {
          "zh": "小雪的手机在桌子上呢。",
          "py": "Xiǎoxuě de shǒujī zài zhuōzi shàng ne.",
          "vn": "Điện thoại của Tiểu Tuyết ở trên bàn đấy."
        }
      ],
      "source": {
        "id": "hsk1-chinese-original",
        "printedPages": [
          56
        ],
        "pdfPages": [
          71
        ]
      },
      "reason": "恢复原书完整例句/对话和原有顺序。原页这些例句未印拼音，拼音和越译为编辑补充，官方越文全面核对后置。"
    },
    {
      "target": "textbook-l08-grammar-02",
      "lesson": 8,
      "field": "examples",
      "expected": [
        {
          "zh": "我在学校吃午饭。",
          "py": "wǒ zài xué xiào chī wǔ fàn。",
          "vn": "Tôi ăn trưa ở trường."
        },
        {
          "zh": "他爸爸在医院工作。",
          "py": "tā bàba zài yī yuàn gōng zuò。",
          "vn": "Bố anh ấy làm việc ở bệnh viện."
        }
      ],
      "value": [
        {
          "zh": "我在学校吃午饭。",
          "py": "Wǒ zài xuéxiào chī wǔfàn.",
          "vn": "Tôi ăn trưa ở trường."
        },
        {
          "zh": "他爸爸在医院工作。",
          "py": "Tā bàba zài yīyuàn gōngzuò.",
          "vn": "Bố anh ấy làm việc ở bệnh viện."
        },
        {
          "zh": "你在哪儿买菜？",
          "py": "Nǐ zài nǎr mǎi cài?",
          "vn": "Bạn mua rau ở đâu?"
        }
      ],
      "source": {
        "id": "hsk1-chinese-original",
        "printedPages": [
          57
        ],
        "pdfPages": [
          72
        ]
      },
      "reason": "恢复原书完整例句/对话和原有顺序。原页这些例句未印拼音，拼音和越译为编辑补充，官方越文全面核对后置。"
    },
    {
      "target": "textbook-l08-grammar-03",
      "lesson": 8,
      "field": "examples",
      "expected": [
        {
          "zh": "下午两点你能到吗？",
          "py": "xià wǔ liǎng diǎn nǐ néng dào ma？",
          "vn": "Hai giờ chiều bạn đến được không?"
        },
        {
          "zh": "我不能去学校吃午饭。",
          "py": "wǒ bù néng qù xué xiào chī wǔ fàn。",
          "vn": "Tôi không thể đến trường ăn trưa."
        }
      ],
      "value": [
        {
          "zh": "下午两点你能到吗？",
          "py": "Xiàwǔ liǎng diǎn nǐ néng dào ma?",
          "vn": "Hai giờ chiều bạn đến được không?"
        },
        {
          "zh": "爸爸能去。",
          "py": "Bàba néng qù.",
          "vn": "Bố có thể đi."
        },
        {
          "zh": "我不能去学校吃午饭。",
          "py": "Wǒ bù néng qù xuéxiào chī wǔfàn.",
          "vn": "Tôi không thể đến trường ăn trưa."
        }
      ],
      "source": {
        "id": "hsk1-chinese-original",
        "printedPages": [
          58
        ],
        "pdfPages": [
          73
        ]
      },
      "reason": "恢复原书完整例句/对话和原有顺序。原页这些例句未印拼音，拼音和越译为编辑补充，官方越文全面核对后置。"
    },
    {
      "target": "textbook-l06-grammar-02",
      "lesson": 6,
      "field": "desc",
      "expected": "Câu liên động có hai hay nhiều động từ cùng chung một chủ ngữ. Động tác trước có thể là cách thức hoặc địa điểm để thực hiện mục đích phía sau.",
      "value": "Vị ngữ của câu liên động gồm hai hay nhiều cụm động từ. Hai ý nghĩa trong bài này là mục đích hành động và cách thức hành động.",
      "source": {
        "id": "hsk1-chinese-original",
        "printedPages": [
          40
        ],
        "pdfPages": [
          55
        ]
      },
      "reason": "对应原书两类连动句说明；越译为编辑补充，官方越文核对后置。"
    },
    {
      "target": "textbook-l07-grammar-01",
      "lesson": 7,
      "field": "desc",
      "expected": "Dùng 点 và 分 để nói giờ phút. Có thể thêm 早上、上午、中午、下午、晚上 phía trước để nêu khoảng thời gian trong ngày.",
      "value": "“点、分” biểu thị thời điểm cụ thể. Giờ tròn dùng “点”; khi có phút dùng “分”, thường có thể lược “分”. Tuy nhiên, với mười phút phải giữ “分”; khi dưới mười phút phải đọc “零”. Các danh từ thời gian như “上午、中午、下午、晚上” chỉ các khoảng trong ngày; có thể thêm thời điểm cụ thể ngay sau đó.",
      "source": {
        "id": "hsk1-chinese-original",
        "printedPages": [
          47
        ],
        "pdfPages": [
          62
        ]
      },
      "reason": "补齐整点、十分不可省分和个位分钟读零等原书说明；完整五行时间表在来源活动保留。越译为编辑补充，官方越文核对后置。"
    }
  ]
}
`;export{e as default};