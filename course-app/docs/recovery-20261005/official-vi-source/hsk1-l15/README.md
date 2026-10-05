# HSK1 第15课官方越文来源恢复作者稿

来源仅为用户上传官方越文 PDF，SHA256 `99ca3e635bbf99bcbbe003e32a0dbdf7ad0af2300b7380959d647e1028cf2764`。实际逐页读取 PDF128–137 / 页脚112–121，正文完整范围、相邻边界和跨页关系均在 source.json 声明，不靠旧版偏移猜页。

本课127个正文越文 occurrence、17普通词表行、17个实际印刷词性、14条完整角色译文。全部称呼/角色前缀和原段落保留；真实空词性保持null，不制造新源。`fragments` 保留物理越文行；中文锚点另记实际页。中文例句未印越文时不推造译文。

附录138–144的88项实际VI沿用共享 source IDs，跨包须按 occurrenceId/实际PDF页去重，不能当本课新增词或网站完成率。附录词条正文只有中文/PY/课号，未印VI词义；20个本课相关索引行仅为有界中文/PY/课号/星号证据。

原书观察（忠实保留，不替网站做语义接受）：
- Actual printed VI is 8 giờ sáng Chủ nhật chúng em đã đến sân bay Đại Hưng, có sớm không cô? Chinese and surrounding travel-plan dialogue discuss the arrival itinerary. Printed đã is faithfully retained as a book/context tense observation; no website future-to-past repair or blanket semantic acceptance.
- Body words13/14 have no stars; appendix *机场/*接 have stars. Actual markings separately retained, no canonical overwrite.
- Three proper rows no printed POS field; rawPosLabel/posOccurrenceId null and printedPOSFieldPresent false. 大兴机场 and its pinyin actually wrap in two physical lines, explicit metadata retained.
- Three physical VI lines have boundary joiners space then empty; the quoted Chinese construction crosses between lines2/3 without an invented Chinese word-space.
- Printed mixed-language row ends line1 at 看 and line2 starts书; lineJoiner empty keeps 我喜欢看书 continuous while preserving physical lineTexts.

`build-source.py` 验原 PDF 整文件SHA，按实际 CropBox 重渲17完整页，并以人工原页转录常量重建 JSON。`verify-source.py` 实际执行来源、PNG字节、片段拼接、角色、POS与Unicode清单检查；1259项通过、0失败仅为作者结构自检，不能代替独立原页审校。`self-verification.log` 为真实执行输出。`visual-raster-readback.json` 证明包内PNG与实际已视觉读取原页的字节完全相同。未使用OCR代替语言审读，未自动 Unicode 改写。

作者完成；independentReview pending。网站对照0、activation0、runtimeWrites0、可信proof false。未读取网站旧越文或改任何原始课文、词库、评分、媒体、注册表及Git refs/index。冻结后立即交root独立核查及同步代理逐文件远程读回；本地冻结不等于远程保存成功。
