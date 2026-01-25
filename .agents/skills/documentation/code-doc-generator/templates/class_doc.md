# 类文档模板

## Class: `{{CLASS_NAME}}`

**📍 位置**: `{{FILE_PATH}}:{{START_LINE}}-{{END_LINE}}`

**🎯 职责**: {{RESPONSIBILITY}}

**🏷️ 类型**: {{CLASS_TYPE}} <!-- class | abstract class | interface | type -->

{{#if EXTENDS}}
**🔗 继承自**: `{{EXTENDS}}`
{{/if}}

{{#if IMPLEMENTS}}
**📋 实现接口**: {{#each IMPLEMENTS}}`{{this}}`{{#unless @last}}, {{/unless}}{{/each}}
{{/if}}

---

### 📊 类图

```mermaid
classDiagram
    class {{CLASS_NAME}} {
        {{#each PROPERTIES}}
        {{VISIBILITY_SYMBOL}}{{NAME}}: {{TYPE}}
        {{/each}}
        {{#each METHODS}}
        {{VISIBILITY_SYMBOL}}{{NAME}}({{PARAMS}}): {{RETURN}}
        {{/each}}
    }
    {{#if EXTENDS}}
    {{EXTENDS}} <|-- {{CLASS_NAME}}
    {{/if}}
    {{#each IMPLEMENTS}}
    {{this}} <|.. {{../CLASS_NAME}}
    {{/each}}
    {{#each DEPENDENCIES}}
    {{../CLASS_NAME}} --> {{this}}
    {{/each}}
```

---

### 📦 属性 (Properties)

| 属性 | 类型 | 可见性 | 修饰符 | 默认值 | 作用 |
|------|------|--------|--------|--------|------|
{{#each PROPERTIES}}
| `{{NAME}}` | `{{TYPE}}` | {{VISIBILITY}} | {{MODIFIERS}} | {{DEFAULT}} | {{DESCRIPTION}} |
{{/each}}

{{#each PROPERTIES}}
#### `{{NAME}}`

**类型**: `{{TYPE}}`

**说明**: {{DETAILED_DESCRIPTION}}

{{#if GETTER}}
**Getter**: 
```{{LANGUAGE}}
{{GETTER_CODE}}
```
{{/if}}

{{#if SETTER}}
**Setter**: 
```{{LANGUAGE}}
{{SETTER_CODE}}
```
{{/if}}

---

{{/each}}

---

### 🏭 构造函数

```{{LANGUAGE}}
{{CONSTRUCTOR_CODE}}
```

**参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
{{#each CONSTRUCTOR_PARAMS}}
| `{{NAME}}` | `{{TYPE}}` | {{REQUIRED}} | {{DESCRIPTION}} |
{{/each}}

**初始化流程**:
{{#each INIT_STEPS}}
{{@index}}. {{STEP}}
{{/each}}

---

### 🔧 方法 (Methods)

#### 方法概览

| 方法 | 签名 | 可见性 | 静态 | 职责 |
|------|------|--------|------|------|
{{#each METHODS}}
| `{{NAME}}` | `({{PARAMS}}): {{RETURN}}` | {{VISIBILITY}} | {{STATIC}} | {{BRIEF_DESC}} |
{{/each}}

{{#each METHODS}}
---

#### `{{NAME}}({{PARAMS}}): {{RETURN_TYPE}}`

**可见性**: {{VISIBILITY}} {{#if STATIC}}| **静态**: ✅{{/if}}

**职责**: {{DESCRIPTION}}

**签名**:
```{{LANGUAGE}}
{{SIGNATURE}}
```

**参数**:
| 参数 | 类型 | 说明 |
|------|------|------|
{{#each METHOD_PARAMS}}
| `{{NAME}}` | `{{TYPE}}` | {{DESCRIPTION}} |
{{/each}}

**返回值**: `{{RETURN_TYPE}}` - {{RETURN_DESC}}

**实现**:
```{{LANGUAGE}}
{{IMPLEMENTATION}}
```

**关键逻辑**:
{{#each KEY_LOGIC}}
- **行 {{LINE}}**: {{EXPLANATION}}
{{/each}}

{{/each}}

---

### 🔄 生命周期

```mermaid
stateDiagram-v2
{{#each LIFECYCLE_STATES}}
    {{#if IS_INITIAL}}[*] --> {{STATE}}{{else}}{{FROM}} --> {{STATE}}: {{TRIGGER}}{{/if}}
{{/each}}
{{#each FINAL_STATES}}
    {{STATE}} --> [*]
{{/each}}
```

**状态说明**:
| 状态 | 描述 | 触发条件 |
|------|------|----------|
{{#each STATES_DESC}}
| {{STATE}} | {{DESC}} | {{TRIGGER}} |
{{/each}}

---

### 🔗 依赖关系

#### 依赖 (使用了):
| 类/模块 | 用途 | 引入方式 |
|---------|------|----------|
{{#each DEPENDENCIES}}
| `{{NAME}}` | {{PURPOSE}} | {{IMPORT_TYPE}} |
{{/each}}

#### 被依赖于:
| 类/模块 | 使用场景 |
|---------|----------|
{{#each DEPENDENTS}}
| `{{NAME}}` | {{CONTEXT}} |
{{/each}}

---

### 📐 设计模式

{{#if PATTERNS}}
| 模式 | 角色 | 说明 |
|------|------|------|
{{#each PATTERNS}}
| {{PATTERN_NAME}} | {{ROLE}} | {{EXPLANATION}} |
{{/each}}
{{else}}
未检测到明显设计模式
{{/if}}

---

### 🧪 使用示例

```{{LANGUAGE}}
{{USAGE_EXAMPLE}}
```

---

### ⚠️ 注意事项

{{#each CAVEATS}}
> [!{{LEVEL}}]
> {{MESSAGE}}

{{/each}}

---

### 📝 复刻要点

1. **前置依赖**: {{#each PREREQUISITES}}`{{this}}`{{#unless @last}}, {{/unless}}{{/each}}
2. **实现顺序**: 
   {{#each IMPL_ORDER}}
   - {{@index}}. `{{METHOD}}` - {{REASON}}
   {{/each}}
3. **关键测试点**:
   {{#each TEST_POINTS}}
   - {{POINT}}
   {{/each}}

---

> 🔗 返回 [模块文档]({{MODULE_DOC_LINK}}) | [主文档]({{MAIN_DOC_LINK}})
