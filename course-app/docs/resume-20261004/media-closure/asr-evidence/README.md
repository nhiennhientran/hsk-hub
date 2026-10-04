# 原轨转录证据恢复与固定版本 pilot

2026-10-04。本目录只保存检查、脚本和候选工作流；不会修改课文、越南语、媒体精细片段、生产按钮或部署站点。root 负责安装实际 `.github/workflows`、提交、运行和下载结果。

## 当前阶段成果：两句固定范围已独立复核，26课208轨原始证据已闭环

- 正式 small run **37217540172**（head `b32215e5990c3d9673f6fb0f8c27e804c062b6e6`）和 medium run **37218301490**（head `5b913cad4f7c20bc991b34e9ec182d6b006f2000`）实际成功，各24条 raw。实际 ZIP SHA 分别 `90a2e29e7bc756852f60255c9c1f4539cc7c09810a2ad21a93f1da6dff39c209`、`8dc57778140991be2b6102dc35406eb1a1fdab6a9886b54e3d481a1444f336f1`；解包分别在 `final-run-37217540172/`、`medium-run-37218301490/`。旧small草稿run不算正式结果。
- small固定 `536b066...`，medium官方固定 `08e178d48790749d25932bbc082711ddcfdfbc4f`。两模型实际 compute type 均 `int8_float32`，请求CPU/int8。small实测38.773秒、峰RSS764788KiB；medium179.397秒、2310084KiB；比较基准是同一462.768秒原音。未引用官方台式机 benchmark 充当实测。
- `verify-final-artifact.py` 14项真实完整性检查通过：最终head、冻结脚本、全部26依赖、每轨 raw文件 SHA、24原 MP3 SHA、24完整 PCM SHA/采样/时长、3原lesson完整JSON SHA和无prompt选项。worker源比较JSON与冻结本地输入字节完全一致。model二进制未在artifact，模型4文件SHA的范围是已核冻结worker实际记录，不冒认另在本地重新哈希模型。
- `pilot-exact-match-report.json` 的100唯一原始目标观察为39词、46行、15子句，包含父子层级重叠，绝非100精准完成。其中39词仅38个独立时间范围（“快”两个词义共用一个观察）。实际生成并完整解码100个 raw-range WAV探针，`candidate-boundary-evidence.json` 74项held：67活跃能量边界、16低概率，及“画/画笔”来源区间共享等。0项生产精准认可。
- medium没有全面改善：词31唯一、行46、子句27；**HSK2 L5T2**产生大量“上来”循环及“中文字幕组”，许多高概率零时长。该轨medium不得用于证明small，保留原轨回退。不同模型同字不等于安全词首词尾；“画笔”、鱼/肉/过等跨模型边界差亦需held，不能追逐转录count。
- 独立QA已经亲验2 ZIP/58文件、24 PCM、100 WAV源采样、600 RMS窗口，核对本次官方VI教材17页的中文、146目标与24轨label，分别477检查。报告 `../../qa-audio-asr-pilot/review.json` 冻结SHA `d2ee1f58558820fd16a94784307b04285115678cfe70028a2aef33874062f67e`。当前旧中文PDF缺失，额外实视用新VI HSK2 SHA `6465777a77f8d9cb0d29b47f00b36a8e9e9ff627509f0f02a9909c7aaeaa231b`、printed+14、CropBox；没有改写旧中文source hash或冒认重新读到旧PDF。
- 三目标真实裁切双模型 run **37219656715**（head `70e001fa0cee9f6a01fe2dc7fed2a04d1cd5db5f`）已成功并亲验两 ZIP、6 crop raw/完整源 PCM/3 WAV。两句独立审校报告 `../../qa-audio-asr-pilot/post-crop-review.json` 固定 SHA `76c0d3571f5ea0ce1c2d40de7baeffe3a58155ee6782a27636d99865c761501c`、169检查；只接受 `因为我喜欢白色啊！`（L4 text2 line3，16k帧159680–197921，9.98–12.3700625）及 `你们别客气，快坐吧！`（L5 text2 line8 sentence2，572480–614240，35.78–38.39）的精确机器复核范围。两个低于0.5的 raw 词概率仍完整保留，未降低全局阈值；仅对这6条观察明确使用為/歡/們/別/氣五字繁简映射，原raw、教材中文及拼音未改。无真人/母语者/声调/设备认证。L5母句和第1句均未接受。
- `颜色`完整原轨（L4T8，0–3.168，0–50688帧）仅接受原词条整轨身份；重复次数未知，不计新增词精切，不添加single-pronunciation/repetition授权，现行词组整轨回退保留。两句窄接入使用独立 `reviewed-sentence-subset` JSON/authority；代码固定整个 authority 的canonical SHA、2 ID和精确源帧，旧两manifest和authority保持原字节。L5显示“第2句原音”，新gate失败保留旧61精词/13hold和完整课文回退。18项新旧unit（包含真实延迟digest并发、拒绝/旧scope错误/新chunk404回退）与tsc/build通过。root提供实际可执行Chromium后二句边界/seek/stop/history、颜色回退、错误checksum保留旧片段共4项本地真实通过（final source后重建再验，18:10:46开始、报告SHA440920105bce54d604e0fad0f8f3445b886e5d1733eb789879f186d5ca0cc7bd）；WebKit本地0执行，待root正式远端CI。证据在reviewed-sentence-native-chromium/。

剩余9组、26课、208轨small raw正式 run **37219831025**（head `3f7285359c2f7fc0c552157df68feb61c9758f53`）成功并全部下载。`remaining-run-37219831025/verified-collection.json`：9实际 ZIP/208原MP3 SHA/208完整16k PCM SHA、26当前教材JSON全部匹配，模型/固定26依赖/raw选项均匹配。无H3 metadata源漂移。10331 raw word 中50个零/无效时长涉及23轨，14轨非CJK语义，3轨同词频>=10需语域复核，35轨有上述至少一项风险，0空轨。

严格目标盘点624词义、597源行、396多句子句、818含CJK句子单位。旧823标点单位多出的5项为4个省略号行+舞台说明尾括号，不是删教材。9组literal诊断有477词/340行/238子句唯一原word-boundary观察，含父子重叠；477词义只443个独立raw区间。301候选附额外raw风险，其余754也未具备实际候选边界和独立剪裁审校，**此剩余批0精切promotion**。真实JSON、固定版本和recipe都保存，WAV/ZIP/模型缓存不进入Git。见该批 `README.md`、`diagnostic-summary.json`；媒体审校与后续越南语全文教材对标继续分开保存。

## 初始恢复时已做的检查与状态

- 当前两个精细片段 manifest 引用的 **46 个 ASR/波形/静音/源验证文件均不在当前恢复仓库**。精确路径保存在 `recovery-status.json`。现有已接受片段元数据仍保留；没有伪造找回旧 raw evidence。
- 对确切文件名及 HSK2/3 证据目的做了文件检索，并检查最新 400 个文件记录。没有找到对应 raw ASR/align 包；旧 HSK1 模糊命中不可替代 HSK2/3 同名音轨。此结果只证明本次检索未恢复目标文件，并不证明所有历史存储都不存在它们。
- 当前默认 Python 与主运行时 Python 均没有 faster-whisper、Whisper、PyTorch、Transformers、CTranslate2、ONNX Runtime、HF Hub 或已配置的转录工具；检查过的明确模型缓存与历史 `/tmp/hsk-asr-env` 路径亦不存在。没有寻找、读取或打印 API keys。
- 原始 MP3 在仓库内可访问；此前声学检查已经解码全部 232 条剩余轨。安静区间和能量区间不是语义边界，不能据此把词和句强行对齐。
- 本次先导是 **HSK2 第4–6课、每课1–8轨，共24轨**。实际本地 preflight 已完整通过哈希、字节数和解码检查，16kHz 单声道 float32 PCM 总长 **462.768秒**。`local-pilot-preflight/` 的 `run.json` 明确写 `preflight-passed-asr-not-run`；这是输入检查，不是已执行 ASR。

## 可执行入口

`transcribe-original-tracks.py` 默认只允许此先导运行。它为每条原 MP3 比对 `audio-manifest.json` 中的 SHA/大小，再用 FFmpeg 明确解码整轨，保存 PCM SHA、时长与采样率。模型只接收 PCM 音频，不接收教材词句；单独的 `source-comparison-input.json` 供转录之后比较，绝不传给模型。

默认固定模型：`Systran/faster-whisper-small`，完整提交 **`536b0662742c02347bc0e980a01041f333bce120`**。只下载 `config.json`、`model.bin`、`tokenizer.json`、`vocabulary.txt`，确认实际 snapshot commit 后保存每个文件的 SHA 和大小；从本地模型目录加载，避免按模型短名称自动取浮动 `main`。CPU、int8、2线程、单worker；保存实际 compute type。

固定识别选项为中文转录、beam=5、temperature=0、word timestamps、关闭 VAD 和前文条件，`initial_prompt/prefix/hotwords=None`。保留全部原始 segment/word 字段、概率和 transcribe info，不修正 ASR 汉字、不向 ASR 注入教材、不把识别汉字写回教材。脚本支持 `--model-id/--model-revision`；不同模型须提供自身经官方页面验证的40位 commit，以供后续 medium 等交叉验证。

```sh
python course-app/docs/resume-20261004/media-closure/asr-evidence/transcribe-original-tracks.py \
  --level 2 --lessons 4,5,6 --cpu-threads 2 \
  --model-id Systran/faster-whisper-small \
  --model-revision 536b0662742c02347bc0e980a01041f333bce120 \
  --cache .repro-output/asr-model-cache \
  --output .repro-output/asr-evidence/hsk2-l04-06-small
```

新输出目录必须为空；不覆盖旧 `run.json`。`--preflight-only` 不需要 ASR 包，可单独重跑真实输入验证。程序逐轨落盘，记录 raw evidence SHA；中途失败保存诊断和已经完成的轨，返回非零。没有 clip promotion 功能。`peakResidentMemoryKiB` 是 Linux worker 进程峰值内存，运行时和 RTF 是实际测量，不引用官方台式机 benchmark 充当本项目性能。

`requirements.txt` 固定全部26个运行依赖，包括 faster-whisper 1.2.1、CTranslate2 4.6.0、HF Hub 0.34.4、PyAV 15.1.0、tokenizers 0.21.4 和 ONNX Runtime 1.22.1。候选 `hsk-audio-asr-pilot.yml` 使用 Ubuntu 24.04、Python 3.11.13、pip 25.2，执行 `pip check` 并保存 `pip freeze --all` 和 pip install report（实际 wheel URL/SHA/依赖元数据）。FFmpeg 取 runner 的 OS 软件包并记录实际版本，因此 OS 包不是跨日期位级锁定；每次解码的 PCM SHA 供后续重跑比较。

工作流只有 `contents:read`，checkout 不保留凭据，只缓存指定的公开模型目录，始终上传证据 artifact，保留30天。它不 commit、不部署、不上传完整模型、MP3 或 PDF。对本次先导所需公开依赖及模型的下载是已授权媒体工作；不会借无关浏览器、网站或账户绕过权限。

## 结果回来之后的实际验收

按每一条轨完成下面的台账，而不是因为运行快就扩展或宣布精准完成。

1. 确认24/24原轨 SHA、实际模型40位 commit、4个模型文件 SHA、26个依赖和 wheel provenance；完整读取 raw timestamp。记录实际 CPU 时间、峰值内存、失败和空转录。
2. 将 ASR 的 CJK 识别与已接受中文教材原文逐项比对。词组轨记录原词序和重复朗读；课文轨记录行、单句和同一行多句。同音、专名、繁简、儿化、漏字均作为识别局限单列，不能修改教材来迎合 ASR。
3. 候选边界必须有实际识别对应与邻接语境证据；对齐需记录覆盖、未匹配残差、重复歧义、跨度、词首词尾和相邻句侵入。声学能量可帮助检查前后尾巴，不能单独证明“这就是某词/某句”。低置信度、错读、漏词、不可区分的重复均保留未解状态；必要时用独立固定 medium 模型重新转录相关原轨或候选 crop。
4. 独立审校读取源内容、raw ASR、所选区间和声学边界，审查是否切断轻声/辅音/尾音、带入邻句、遗漏同一词重复或错绑原轨。只有经过 review 的候选才由 root 接入 production segment manifest，并运行对应覆盖/播放器回归。
5. 无法证实的词/句继续明确标注原词组/整轨回退。单词、行、单句、整组和整轨分别统计；机器证据与真人逐段听辨分别记录。ASR 成功、文件全解码或静音观察均不等于真人/母语者验收。

## 扩展范围与真实未解回退

`remaining-batches.json` 精确列出29课、232条原轨：HSK2 L4–15 共12课；HSK3 L2–18 共17课。先导完成性能与质量审查之后，才由 root 启用每批2–3课的 matrix（最多2个并行批次）；当前 candidate workflow 只运行24轨先导。旧4个已精细化课内尚有13个词待核验，独立列账，不能混进29课未开工统计。

原 `checkpoints/unified-20261003/PLAN.md` 的 Gate11 需要图、音频片段、笔画覆盖，接受的 `AUTONOMOUS-PLAN.md` A6 要求按批处理和真实检查。明确回退允许真实未解项保留可用原音，但不能把未处理的675个词和660条课文行都当成已完成精准切片。

当前 runtime 标签已明确：`course-app/src/lesson-view.ts` 未验证独立词时显示等待核验说明和“听所在生词组原音”，不显示独立原词按钮；`course-app/src/main.ts` 将“整组生词原音”和“完整课文原音”分开，合成语音另标；精细行按钮只有存在 accepted segment 才显示。`listening-view.ts` 的整轨任务按钮只说播放原音，没有“单句精准”认证。本次没有发现必需修复的虚假精准标签，因此不改生产文件。

## 一手公开版本依据

2026-10-04检索。模型的 immutable commit、下载 revision 语义、CPU int8 与 word timestamps 来自下列官方资料；选择 small 作先导是为了实测可执行性，不是质量已经合格的推论。

- [faster-whisper 官方1.2.1发布](https://github.com/SYSTRAN/faster-whisper/releases/tag/v1.2.1)
- [faster-whisper 1.2.1 维护者 PyPI 页面：CPU int8、word timestamps、必须遍历 generator](https://pypi.org/project/faster-whisper/1.2.1/)
- [Systran small 官方模型固定提交](https://huggingface.co/Systran/faster-whisper-small/commit/536b0662742c02347bc0e980a01041f333bce120)
- [Systran small 官方文件列表](https://huggingface.co/Systran/faster-whisper-small/tree/536b0662742c02347bc0e980a01041f333bce120)
- [HF Hub 官方下载指南：snapshot_download、完整 commit revision](https://huggingface.co/docs/huggingface_hub/guides/download)
- 固定关键依赖维护者发布页面：[CTranslate2 4.6.0](https://pypi.org/project/ctranslate2/4.6.0/)、[HF Hub 0.34.4](https://pypi.org/project/huggingface-hub/0.34.4/)、[PyAV 15.1.0](https://pypi.org/project/av/15.1.0/)、[tokenizers 0.21.4](https://pypi.org/project/tokenizers/0.21.4/)、[ONNX Runtime 1.22.1](https://pypi.org/project/onnxruntime/1.22.1/)。

初始候选阶段已通过24轨 preflight、脚本 AST 与 candidate YAML 解析；正式远程结果和两句独立审校进度见页首。208轨诊断仍0精切promotion，两句只有指定范围机器接受；真人听辨、声调/设备认证均false，上线尚待用户确认。
