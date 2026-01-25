# 函数文档模板

## `{{FUNCTION_NAME}}({{PARAMS_INLINE}}): {{RETURN_TYPE}}`

**📍 位置**: `{{FILE_PATH}}:{{START_LINE}}-{{END_LINE}}`

**🎯 职责**: {{RESPONSIBILITY}}

---

### 📥 输入参数

| 参数 | 类型 | 必填 | 约束 | 默认值 | 示例值 |
|------|------|------|------|--------|--------|
{{#each PARAMS}}
| `{{NAME}}` | `{{TYPE}}` | {{REQUIRED}} | {{CONSTRAINTS}} | {{DEFAULT}} | `{{EXAMPLE}}` |
{{/each}}

---

### 📤 返回值

| 类型 | 条件 | 示例 |
|------|------|------|
{{#each RETURN_CASES}}
| `{{TYPE}}` | {{CONDITION}} | `{{EXAMPLE}}` |
{{/each}}

---

### 🔄 执行流程

```mermaid
flowchart TD
{{#each STEPS}}
    {{STEP_ID}}[{{STEP_DESC}}]
{{/each}}
{{#each STEP_CONNECTIONS}}
    {{FROM}} --> {{TO}}
{{/each}}
```

**步骤详解**:

{{#each STEPS}}
{{@index}}. **{{STEP_TITLE}}** (行 {{LINE_RANGE}})
   - {{STEP_DETAIL}}
   {{#if CODE_SNIPPET}}
   ```{{LANGUAGE}}
   {{CODE_SNIPPET}}
   ```
   {{/if}}

{{/each}}

---

### 💡 关键实现细节

{{#each KEY_DETAILS}}
#### {{DETAIL_TITLE}}

**位置**: 行 {{LINE_RANGE}}

**说明**: {{EXPLANATION}}

```{{LANGUAGE}}
{{CODE}}
```

{{/each}}

---

### ⚠️ 边界条件与异常

| 输入条件 | 预期行为 | 处理方式 |
|----------|----------|----------|
{{#each EDGE_CASES}}
| {{INPUT}} | {{BEHAVIOR}} | {{HANDLING}} |
{{/each}}

---

### 🔗 调用关系

#### 被调用于:
{{#each CALLED_BY}}
- `{{CALLER}}()` - {{CONTEXT}}
{{/each}}

#### 调用了:
{{#each CALLS}}
- `{{CALLEE}}()` - {{PURPOSE}}
{{/each}}

---

### 🧪 测试示例

```{{LANGUAGE}}
// 正常用例
{{NORMAL_TEST}}

// 边界用例
{{EDGE_TEST}}

// 错误用例
{{ERROR_TEST}}
```

---

### 📝 注意事项

{{#each NOTES}}
> [!{{NOTE_TYPE}}]
> {{NOTE_CONTENT}}

{{/each}}

---

> 🔗 返回 [模块文档]({{MODULE_DOC_LINK}}) | [主文档]({{MAIN_DOC_LINK}})
