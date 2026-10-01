/* Lesson 3 pilot: textbook-scoped tasks. Translation is submitted for teacher review. */
(function (root, factory) {
  'use strict';
  var bank = factory();
  if (typeof module === 'object' && module.exports) module.exports = bank;
  if (root) {
    root.HSKStep1Bank = bank;
    root.HSKStep1BankVersion = 'stage1-20261001';
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  return [
  {
    "id": 3,
    "lesson": 3,
    "title": "我是中国人",
    "title_vi": "Tôi là người Trung Quốc",
    "goal_vi": "Giới thiệu quốc tịch và quan hệ bằng 是, 的, 吗; nói về mức độ bận và nỗi nhớ.",
    "goal_zh": "用“是、的、吗”介绍国籍、身份和关系，表达忙碌程度与想念。",
    "scope_note_vi": "Bài tập sử dụng nội dung đã học trong Bài 1–3.",
    "source": {
      "label": "Giáo trình, tr. 10–17",
      "book": "新HSK教程1",
      "printPages": [
        10,
        11,
        12,
        13,
        14,
        15,
        16,
        17
      ],
      "pdfPages": [
        25,
        26,
        27,
        28,
        29,
        30,
        31,
        32
      ]
    },
    "choice": [
      {
        "id": "l03-choice-01",
        "prompt": "Chọn câu trả lời phù hợp cho câu hỏi về quốc tịch.",
        "stem": "你是哪国人？",
        "options": [
          "我很忙。",
          "我是法国人。",
          "她是我姐姐。",
          "我叫李文。"
        ],
        "answer": 1,
        "explanation": "哪国人 hỏi người nước nào. 我是法国人 trả lời quốc tịch; các câu khác nói về mức độ bận, quan hệ hoặc tên.",
        "skill": "问国籍",
        "kind": "choice",
        "legacyCompatible": true,
        "assessment": "automatic",
        "optionFeedback": [
          "我很忙 nghĩa là “Tôi rất bận”, chưa cho biết người nói là người nước nào.",
          "法国人 nghĩa là “người Pháp”. 我是法国人 trả lời trực tiếp câu hỏi về quốc tịch.",
          "她是我姐姐 nghĩa là “Cô ấy là chị gái tôi”, nói về quan hệ gia đình.",
          "我叫李文 nghĩa là “Tôi tên là Lý Văn”, trả lời câu hỏi về tên."
        ],
        "source": {
          "label": "Giáo trình, tr. 11, 12, 15",
          "printPages": [
            11,
            12,
            15
          ],
          "pdfPages": [
            26,
            27,
            30
          ]
        }
      },
      {
        "id": "l03-choice-02",
        "prompt": "Cô ấy là chị gái của tôi. Chọn từ nối quan hệ sở hữu.",
        "stem": "她是我___姐姐。",
        "options": [
          "吗",
          "也",
          "的",
          "哪"
        ],
        "answer": 2,
        "explanation": "我 + 的 + 姐姐 nghĩa là chị gái của tôi. Với người thân có thể nói 我姐姐, nhưng khi điền vào chỗ trống ở đây thì chọn 的.",
        "skill": "的与亲属关系",
        "kind": "choice",
        "legacyCompatible": true,
        "assessment": "automatic",
        "optionFeedback": [
          "吗 đặt ở cuối câu hỏi có – không, không nối 我 với 姐姐.",
          "也 nghĩa là “cũng”. Trong câu giới thiệu này, 也 cần đứng trước 是, không đứng giữa 我 và 姐姐.",
          "的 tạo cụm 我的姐姐: “chị gái của tôi”. Cũng có thể nói 我姐姐, nhưng ở đây cần chọn một từ để điền vào chỗ trống.",
          "哪 nghĩa là “nào”, không diễn tả quan hệ “chị gái của tôi” trong câu này."
        ],
        "source": {
          "label": "Giáo trình, tr. 11, 12, 14",
          "printPages": [
            11,
            12,
            14
          ],
          "pdfPages": [
            26,
            27,
            29
          ]
        }
      },
      {
        "id": "l03-choice-03",
        "prompt": "Chọn câu hỏi xác nhận người nghe có phải là học sinh hay không.",
        "stem": "",
        "options": [
          "你是学生吗？",
          "你是哪国人？",
          "她是我老师。",
          "我们很想你。"
        ],
        "answer": 0,
        "explanation": "Giữ câu 你是学生 rồi thêm 吗 ở cuối để hỏi “Bạn có phải là học sinh không?”. Trong ba lựa chọn còn lại, 哪国人 hỏi quốc tịch; hai câu còn lại là câu trần thuật.",
        "skill": "吗问句",
        "kind": "choice",
        "legacyCompatible": true,
        "assessment": "automatic",
        "optionFeedback": [
          "你是学生吗？ dùng 吗 để hỏi người nghe có phải là học sinh hay không.",
          "你是哪国人？ hỏi quốc tịch, không hỏi người nghe có phải là học sinh hay không.",
          "她是我老师。 là câu giới thiệu giáo viên của người nói, không phải câu hỏi.",
          "我们很想你。 diễn tả nỗi nhớ: “Chúng tôi rất nhớ bạn”, không phải câu hỏi."
        ],
        "source": {
          "label": "Giáo trình, tr. 14, 17",
          "printPages": [
            14,
            17
          ],
          "pdfPages": [
            29,
            32
          ]
        }
      },
      {
        "id": "l03-choice-04",
        "prompt": "Bạn không bận lắm. Chọn câu trả lời đúng với thông tin này.",
        "stem": "你工作忙吗？",
        "options": [
          "我很忙。",
          "我是老师。",
          "我们很想你。",
          "我不太忙。"
        ],
        "answer": 3,
        "explanation": "不太忙 nghĩa là “không bận lắm”: 不太 đứng trước 忙 để diễn tả mức độ không cao. Vì đề bài cho biết bạn không bận lắm, câu trả lời phù hợp là 我不太忙。",
        "skill": "不太",
        "kind": "choice",
        "legacyCompatible": true,
        "assessment": "automatic",
        "optionFeedback": [
          "我很忙 nghĩa là “Tôi rất bận”, khác với thông tin “không bận lắm”.",
          "我是老师 nghĩa là “Tôi là giáo viên”, chưa trả lời về mức độ bận.",
          "我们很想你 nghĩa là “Chúng tôi rất nhớ bạn”, không nói về mức độ bận.",
          "我不太忙 nghĩa là “Tôi không bận lắm”. 不太 làm giảm mức độ của 忙."
        ],
        "source": {
          "label": "Giáo trình, tr. 14, 15",
          "printPages": [
            14,
            15
          ],
          "pdfPages": [
            29,
            30
          ]
        }
      },
      {
        "id": "l03-choice-05",
        "prompt": "Lý Văn là người Trung Quốc; cô giáo cũng là người Trung Quốc. Chọn từ điền.",
        "stem": "李文是中国人。老师___是中国人。",
        "options": [
          "谁",
          "什么",
          "也",
          "哪"
        ],
        "answer": 2,
        "explanation": "也 nghĩa là cũng, thể hiện hai người có cùng quốc tịch. Đặt 也 trước 是: 老师也是中国人.",
        "skill": "也是",
        "kind": "choice",
        "legacyCompatible": true,
        "assessment": "automatic",
        "optionFeedback": [
          "谁 nghĩa là “ai”, không bổ sung ý “cũng” giữa hai câu này.",
          "什么 nghĩa là “gì”, không diễn tả việc hai người có cùng quốc tịch.",
          "也 nghĩa là “cũng” và đứng trước 是: 老师也是中国人。",
          "哪 nghĩa là “nào”, thường dùng trong 哪国人 để hỏi quốc tịch; câu này cần ý “cũng”."
        ],
        "source": {
          "label": "Giáo trình, tr. 10, 12",
          "printPages": [
            10,
            12
          ],
          "pdfPages": [
            25,
            27
          ]
        }
      }
    ],
    "sort": [
      {
        "id": "l03-sort-01",
        "prompt": "Ghép câu giới thiệu quốc tịch.",
        "meaning": "Tôi là người Thái Lan.",
        "tokens": [
          "我",
          "是",
          "泰国人"
        ],
        "answers": [
          "我是泰国人。"
        ],
        "explanation": "Trật tự là chủ ngữ 我 + 是 + quốc tịch 泰国人. 人 sau tên nước chỉ người của nước đó.",
        "skill": "国籍表达",
        "kind": "sort",
        "legacyCompatible": true,
        "assessment": "automatic",
        "source": {
          "label": "Giáo trình, tr. 11, 12",
          "printPages": [
            11,
            12
          ],
          "pdfPages": [
            26,
            27
          ]
        }
      },
      {
        "id": "l03-sort-02",
        "prompt": "Ghép câu hỏi có – không.",
        "meaning": "Bạn là người Trung Quốc phải không?",
        "tokens": [
          "你",
          "是",
          "中国人",
          "吗"
        ],
        "answers": [
          "你是中国人吗？"
        ],
        "explanation": "Giữ nguyên trật tự 你是中国人 rồi thêm 吗 ở cuối câu để hỏi.",
        "skill": "吗问句",
        "kind": "sort",
        "legacyCompatible": true,
        "assessment": "automatic",
        "source": {
          "label": "Giáo trình, tr. 11, 14",
          "printPages": [
            11,
            14
          ],
          "pdfPages": [
            26,
            29
          ]
        }
      },
      {
        "id": "l03-sort-03",
        "prompt": "Ghép câu giới thiệu giáo viên. Bắt đầu bằng 她.",
        "meaning": "Cô ấy là giáo viên tiếng Trung của tôi.",
        "tokens": [
          "她",
          "是",
          "我的",
          "中文老师"
        ],
        "answers": [
          "她是我的中文老师。"
        ],
        "explanation": "我的 đứng trước 中文老师 để nói giáo viên tiếng Trung của tôi. Cả cụm 我的中文老师 đứng sau 是.",
        "skill": "的字结构",
        "kind": "sort",
        "legacyCompatible": true,
        "assessment": "automatic",
        "source": {
          "label": "Giáo trình, tr. 10, 11",
          "printPages": [
            10,
            11
          ],
          "pdfPages": [
            25,
            26
          ]
        }
      },
      {
        "id": "l03-sort-04",
        "prompt": "Ghép câu diễn tả mức độ bận.",
        "meaning": "Chị gái tôi không bận lắm.",
        "tokens": [
          "我姐姐",
          "不",
          "太",
          "忙"
        ],
        "answers": [
          "我姐姐不太忙。"
        ],
        "explanation": "Chủ ngữ là 我姐姐: “chị gái tôi”. 不太 đứng ngay trước 忙 để nói “không bận lắm”; không đặt 是 trước 忙.",
        "skill": "不太忙",
        "kind": "sort",
        "legacyCompatible": true,
        "assessment": "automatic",
        "source": {
          "label": "Giáo trình, tr. 11, 14",
          "printPages": [
            11,
            14
          ],
          "pdfPages": [
            26,
            29
          ]
        }
      },
      {
        "id": "l03-sort-05",
        "prompt": "Ghép câu diễn tả nỗi nhớ.",
        "meaning": "Chúng tôi cũng rất nhớ bạn.",
        "tokens": [
          "我们",
          "也",
          "很",
          "想",
          "你"
        ],
        "answers": [
          "我们也很想你。"
        ],
        "explanation": "我们 là “chúng tôi”; 想你 là “nhớ bạn”. 也 đứng trước 很想: 我们也很想你。 Trong bài này, 想 mang nghĩa “nhớ”, không phải “muốn làm việc gì”.",
        "skill": "想与也",
        "kind": "sort",
        "legacyCompatible": true,
        "assessment": "automatic",
        "source": {
          "label": "Giáo trình, tr. 14",
          "printPages": [
            14
          ],
          "pdfPages": [
            29
          ]
        }
      }
    ],
    "translation": [
      {
        "id": "l03-translation-free-01",
        "kind": "translation",
        "assessment": "manual",
        "legacyCompatible": false,
        "prompt": "Giáo viên tiếng Trung của tôi là người Pháp.",
        "skill": "所属关系与国籍",
        "source": {
          "label": "Giáo trình, tr. 10, 11",
          "printPages": [
            10,
            11
          ],
          "pdfPages": [
            25,
            26
          ]
        }
      },
      {
        "id": "l03-translation-free-02",
        "kind": "translation",
        "assessment": "manual",
        "legacyCompatible": false,
        "prompt": "Cô ấy có phải là chị gái của bạn không?",
        "skill": "人物关系与吗问句",
        "source": {
          "label": "Giáo trình, tr. 11, 12, 14",
          "printPages": [
            11,
            12,
            14
          ],
          "pdfPages": [
            26,
            27,
            29
          ]
        }
      },
      {
        "id": "l03-translation-free-03",
        "kind": "translation",
        "assessment": "manual",
        "legacyCompatible": false,
        "prompt": "Đây là bạn học của tôi.",
        "skill": "这与关系介绍",
        "source": {
          "label": "Giáo trình, tr. 11, 12, 16",
          "printPages": [
            11,
            12,
            16
          ],
          "pdfPages": [
            26,
            27,
            31
          ]
        }
      },
      {
        "id": "l03-translation-free-04",
        "kind": "translation",
        "assessment": "manual",
        "legacyCompatible": false,
        "prompt": "Chị gái tôi không phải là giáo viên.",
        "skill": "不是与身份关系",
        "source": {
          "label": "Giáo trình, tr. 11, 14",
          "printPages": [
            11,
            14
          ],
          "pdfPages": [
            26,
            29
          ]
        }
      },
      {
        "id": "l03-translation-free-05",
        "kind": "translation",
        "assessment": "manual",
        "legacyCompatible": false,
        "prompt": "Tôi rất nhớ các bạn.",
        "skill": "想念义与人称",
        "source": {
          "label": "Giáo trình, tr. 14",
          "printPages": [
            14
          ],
          "pdfPages": [
            29
          ]
        }
      }
    ]
  }
];
});
