# 第三步播放器接口

`new-hsk1/hsk1/stage3/player.js` 绑定 `index.html` 中持久存在的单一 `#lesson-audio` 与 `#audio-controls`。它不创建第二个音频元素，不读写存档，不输出音频base64，也不在恢复或渲染时自动播放。

```js
const player = window.HSKStep3Player.create({
  onStart({id, replay}) { /* 当前听力题实际开始后记录一次听取；词卡播放不改听力记录。 */ },
  onRateChange(rate) { /* 只有学生操作速度下拉框时触发；保存偏好。 */ }
});
player.setRate(state.preferences.rate);
player.setItem({id: 'l01-listen-01', label: 'Bài 1 · Câu 1'});
```

多次调用 `create` 返回同一个实例，只替换回调，不重复绑定按钮事件。回调应由应用层处理自己的异常。播放中选择选项引起页面重绘时，再次 `setItem` 相同ID只更新说明文字，不暂停、不重置播放位置、不重复计听取。

| 方法 | 行为与返回 |
|---|---|
| `setItem({id,label})` | 换ID立即停止并清空上一音源，从0开始待学生播放；返回状态 |
| `setItem(null)` | 停止并隐藏控件；返回状态 |
| `setRate(rate)` | 接受0.65/0.75/1/1.25/1.5，应用速率并尽量保调；返回速率，不触发保存回调 |
| `play()` | 首次从头播放，暂停后继续；结束后重新从头；返回Promise<boolean> |
| `pause()` | 暂停；加载中调用也取消晚到的播放动作；返回状态 |
| `replay()` | 主动从头重播；返回Promise<boolean> |
| `stop()` | 停止、清空媒体源、位置归零；保留当前项目供后续明确播放；返回状态 |
| `getState()` | 返回 `{id,available,state,rate,currentTime,duration,paused,error}`，不含媒体dataURL |

`play/replay` 加载失败或被浏览器拒绝时返回 `false` 并显示可重试提示；不向按钮事件留下未处理Promise拒绝。加载成功并实际启动时才通过原生 `playing` 事件触发 `onStart`。首次启动及主动从头重播各计一次，暂停后恢复不重复计数；结束后再按播放作为从头重播，`replay: true`。回调不产生分数。

当前项目ID写入 `audio.dataset.mediaId`，无项目时删除。`#audio-status.dataset.state` 为 `idle/loading/playing/paused/ended/error`。`loading` 时暂停按钮仍可用；`error` 时播放按钮可重试。没有媒体索引的项目隐藏控件，由卡片界面说明该词缺少独立原音，不能阻止记忆练习。

## 媒体载入约定

`window.HSKStep3MediaIndex = {clips: { [id]: {lesson,duration,sha256,bytes} }, ...}`。

`window.HSKStep3Media[id]` 是 `data:audio/...;base64,...`。独立HTML已经内联时直接使用，播放过程不请求外部媒体。多文件版按需加载 `media/lesson-01.js` 至 `media/lesson-15.js`，每份脚本填充该课媒体映射。词卡音源用原始词源记录ID，听力用题目ID。

同课脚本的加载Promise可以复用；加载错误或脚本未提供目标媒体时会删除失败缓存与脚本节点，下一次明确点击重新载入。切题、切模块、停止或加载中暂停会使旧异步请求失效；晚到的脚本可进入缓存，但不会自行播放。请根应用在切模块、切轮、导入或切题时调用 `stop`/`setItem`。

进度由媒体 `loadedmetadata/durationchange/timeupdate/seeking/seeked` 更新；实际时长尚未就绪时仅用索引时长作显示。结束以片段自身 `ended` 事件为准，不使用固定墙钟定时器截句。播放器设置标准 `preservesPitch` 及可用的厂商兼容属性，但不能把浏览器属性设置宣称为听觉质量认证。

## 验证边界

本文件先执行 `node --check`；纯Node事件替身可用于验证回调次数与异步取消逻辑。真实HTML媒体解码、75道听力实际交互、五档速度、失败重试和最终导出物必须由隔离CI浏览器测试验证。代码检查不等于人工听取原音。
