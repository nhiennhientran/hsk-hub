# B10 越南语清单 AST 修复

历史A9清单及其freeze保持原样。新builder仅移除AST遍历时对`value`键的全局排除，使Property.value和MethodDefinition.value节点可到达。已执行实际函数提取探针：真实dom.ts从0条到2条；嵌套对象/命名ASCII越文/方法体/模板分支fixture从1条到7条，ID无重复。Literal.value原始字符串不是AST节点，不递归成伪节点。实际输出保存在ast-coverage-probe.json。

完整新清单等待B10运行时代码提交冻结后重建；本修复和探针不代表越南语语义完成或浏览器通过，旧46463不能替代新候选的覆盖清单。
