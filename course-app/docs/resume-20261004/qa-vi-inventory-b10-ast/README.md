# 新VI清单AST修复独立验证

独立执行真实旧/新builder中提取的crawler及其依赖声明，未执行两个完整清单生成器、未修改root脚本。作者 `verify-ast-coverage.mjs` 也实际运行成功。262项结构、源字节、位置和值、旧记录保留与必要负例检查全部通过。

|真实同字节源|旧crawler|新crawler|结果|
|---|---:|---:|---|
|`course-app/src/dom.ts`|0|2|补回sourceNote整模板及补充内容条件尾段|
|`course-app/src/lesson-view.ts`|85|87|补回答标签和合成语音模板；原85条完整记录字节内容/ID/位置不变|

新builder相对历史builder确实只删除AST loop忽略列表中的 `value`，并加两条解释注释。历史builder SHA仍是8ef5eb37677d333beb4117310f79160b902b242809edda57122bed7858949d72，新builder SHA是0c23ca8f61f6883513827d461afd82dc6684333420f32dfd27ab2106a93a0b44。

独立扩展fixture验证了具名ASCII VI字段、计算属性名、嵌套对象/数组、class普通方法/getter/static方法、对象方法、箭头函数、条件模板及子文字。旧2条、新17条，新增候选各只输出一次。所有输出确实能回到实际AST字符串节点、值和源码范围；没有把Literal.value原始字符串再次解析成代码/JSON，没有生成虚构的 `Chào` 子字段。数字、空VI、注释、正则和纯中文元数据没有成为语言候选。

当前main.ts已不同于835清单快照，仅记录真实drift、排除旧偏移比较。另以插入一行的fixture实际确认源码位置改变会产生新source-specific occurrence IDs；不能把旧位置映射失效当成语言覆盖遗漏。

初次独立harness曾把声明节点数误设为15；实际13个节点包含16个所需名称（一个节点定义四个变量）。只有这两条harness计数断言失败，遍历内容检查均已通过。历史诊断原样保留，最终改为验证准确名称集合后262项通过；未为此修改任何生产或作者crawler。

证据是 `independent-probe-results.json` 的逐项检查和完整实际输出、作者实际输出、fixture，以及 `review.json` 边界。7个实际输入执行前后SHA/bytes全部不变。

```bash
node course-app/docs/resume-20261004/qa-vi-inventory-b10-ast/run-independent-probes.mjs
```

仅接受这项窄AST遍历修复。HEAD尚未固定，不接受新全量清单，不宣称全站VI覆盖完成或正式教材译文审校完成。新的engineering source固定后仍需实际全量生成与来源/消费者身份复核。
