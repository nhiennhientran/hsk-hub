# HSK3 额外来源元数据独立工程验收

最终候选通过工程验收，可由根线程按已授权范围接入。冻结 proposal SHA256：`615c1f39801a163fbc86618b3da731274abb47a741fa0a2ee34db437d053d4b1`；joined SHA256：`af765496215f0b6081904b9d3f0df3f13234737feddd0f2120174de54ed920fa`；底层全量来源视觉验收 SHA256：`9f015fbf612d81a8c8ab498ecf6b3af40209f5ae0832d34e78bc961f85d5a23c`。脚本哈希及逐项结论在 `independent-review.json`。

本轮只读生产候选与脚本；正例和负例均运行真实作者 pipeline，在完整的临时 app 副本中执行，未写实际 course 文件。全重建预演及全重建接入两个正例通过；34个负例全部在课文件写入前拒绝。末课文件或末词发生异常时，前面的课文件也没有写入。临时副本第二次 apply 被拒绝，既有结果未再次改写。完整执行证据在 `final-pipeline-probes.json`，可重现脚本为 `run_final_pipeline_probes.py`。

| 检查 | 实测结果 |
| --- | --- |
| 唯一课文件、额外来源 registry | 18 / 18 |
| 唯一稳定词条、完整 expectedWord、新增词来源 | 523 / 523 / 523 |
| 原印词条出现、词框、词表头词 | 491 / 72 / 487 |
| 分批全量视觉验收稳定行 | 171 + 184 + 168 = 523 |
| 词表普通／专名／带星头词 | 479 / 8 / 23 |
| 接入后删除两项新增字段，原课深对象准确恢复 | 18 / 18 |
| canonical lexicon 文件字节 | 不变，SHA `a3c72056adcde40201c46d5dd04aee5d0a633508b90acb09ec4d4dadd14eeef3` |
| 原 appendixSource／编号词性元数据／编号词性 source | 保持 217 / 174 / 0 |
| 新来源词表锚点／编号元数据／编号词性 source | 523 / 523 / 523 |

523个新增来源并不声称每词都有原印词性：508行有原印词性，15行原书没有印词性，保持明确的 `posPrinted: false`，没有补造原书标签。原关系拼音、客气星号的三个来源差异保留在新 evidence 中，原 py、vi、POS、source、appendixSource、音轨、稳定ID及 canonical 值未替换。

新教材身份为 SHA `7e4e6953ff41659af5ec4ca3efd12c7b53e9703f7529ee65d418426afd814951`、96,266,563字节、212页；原中文 PDF 为 SHA `33a9c743f73f634f97a9864aa0423ac4e3568b3febbf57b63e983b5dcc0932f2`、预期75,121,060字节、212页。两者不是同一文件。18个父 registry 显式区分这两个来源，523个子 evidence 均指向新来源 registry。原中文 PDF 没有在本轮恢复，原英语附录和全面越文翻译均未重新认证。底层81页原图视觉、523稳定行及词表审校由独立来源审查者 `qa_hsk1_05_08` 完成，本工程审查没有重复声称执行那项视觉工作。

初版确有保护缺口，真实负例曾误接受仅355行审校却改写的验收状态、旧SHA或外来父来源、重复registry、改动来源页／词头及18/523总数正确但只写17个唯一课文件。作者修复后，apply必须从固定四输入和真实QA文件重建 joined，核全量523唯一ID及四输入完整manifest，再重建整份proposal并逐对象相等核对；随后核18唯一文件、lesson/course ID、原文件SHA、完整原词条及新增字段不存在，并在任何写入前验证全部18个候选。上述初版绕过在最终版本均已拒绝。初版证据另存 `initial-negative-probes.json`，不代表最终版本状态。

根线程接入后需核18个实际 candidate SHA和 canonical SHA，继续 course 检查、构建及运行验证。正式上线仍按用户要求先确认。

## 实际接入后的回归

根线程已实际接入18课及523来源字段。实际18个文件SHA、`metadata-integration-result.json` 与独立临时pipeline正例的18个candidate SHA逐一完全相同，canonical保持冻结SHA。原121项测试仅历史星号补丁的整词比较因新增元数据失败；已仅剥离单独精确验证的 `additionalSourceEvidence` 再保留完整旧对象比较，旧source、appendixSource、星号、homework、texts断言全部保留。新增一项检查全18个registry与523完整旧词及来源增量；其他字段不宽松过滤。

相关3项测试通过，完整 `npm test` **122通过、0失败**。证据在 `post-apply-test-regression.json` 和 `course-test-after-metadata.log`。本审查者仅改相关tests和此QA目录，没有修改course内容或来源proposal。
