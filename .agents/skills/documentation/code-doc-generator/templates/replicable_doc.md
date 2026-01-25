# {{PROJECT_NAME}} 技术文档

> 🎯 **本文档详细程度可支持从零复刻整个项目**

---

## 📋 文档信息

| 属性 | 值 |
|------|-----|
| **生成时间** | {{TIMESTAMP}} |
| **源代码路径** | `{{SOURCE_PATH}}` |
| **代码行数** | {{TOTAL_LINES}} |
| **文件数量** | {{FILE_COUNT}} |
| **分析深度** | {{DEPTH}} |

---

## 目录

1. [项目概览](#1-项目概览)
2. [架构设计](#2-架构设计)
3. [依赖关系](#3-依赖关系)
4. [核心模块详解](#4-核心模块详解)
5. [数据流](#5-数据流)
6. [复刻指南](#6-复刻指南)

---

## 1. 项目概览

### 1.1 技术栈

| 层级 | 技术 | 版本 |
|------|------|------|
| 语言 | {{LANGUAGE}} | {{LANGUAGE_VERSION}} |
| 框架 | {{FRAMEWORK}} | {{FRAMEWORK_VERSION}} |
| 构建工具 | {{BUILD_TOOL}} | {{BUILD_VERSION}} |
| 测试 | {{TEST_FRAMEWORK}} | {{TEST_VERSION}} |

### 1.2 目录结构

```
{{PROJECT_NAME}}/
├── {{DIR_STRUCTURE}}
```

### 1.3 入口点

| 入口文件 | 职责 | 路径 |
|----------|------|------|
| {{ENTRY_1}} | {{ENTRY_1_DESC}} | `{{ENTRY_1_PATH}}` |

---

## 2. 架构设计

### 2.1 整体架构图

```mermaid
{{ARCHITECTURE_DIAGRAM}}
```

### 2.2 设计决策

| 决策 | 选择 | 理由 |
|------|------|------|
| {{DECISION_1}} | {{CHOICE_1}} | {{REASON_1}} |

### 2.3 使用的设计模式

| 模式 | 位置 | 用途 |
|------|------|------|
| {{PATTERN_1}} | `{{PATTERN_1_LOC}}` | {{PATTERN_1_USE}} |

---

## 3. 依赖关系

### 3.1 外部依赖

| 包名 | 版本 | 用途 |
|------|------|------|
| {{DEP_1}} | {{DEP_1_VER}} | {{DEP_1_USE}} |

### 3.2 内部模块依赖图

```mermaid
{{DEPENDENCY_GRAPH}}
```

### 3.3 循环依赖警告

{{#if HAS_CIRCULAR}}
> [!WARNING]
> 检测到以下循环依赖，建议重构:
> - {{CIRCULAR_1}}
{{else}}
✅ 未检测到循环依赖
{{/if}}

---

## 4. 核心模块详解

{{#each MODULES}}
### 4.{{@index}} {{MODULE_NAME}}

**📍 位置**: `{{MODULE_PATH}}`

**🎯 职责**: {{MODULE_RESPONSIBILITY}}

#### 类与函数

{{#each CLASSES}}
##### Class: `{{CLASS_NAME}}`

**属性**:
| 属性 | 类型 | 可见性 | 作用 |
|------|------|--------|------|
{{#each PROPERTIES}}
| `{{PROP_NAME}}` | {{PROP_TYPE}} | {{VISIBILITY}} | {{PROP_DESC}} |
{{/each}}

**方法**:
| 方法 | 签名 | 职责 |
|------|------|------|
{{#each METHODS}}
| `{{METHOD_NAME}}` | `{{SIGNATURE}}` | {{METHOD_DESC}} |
{{/each}}

{{/each}}

{{#each FUNCTIONS}}
##### Function: `{{FUNC_NAME}}`

**签名**: `{{FUNC_SIGNATURE}}`

**参数**:
| 参数 | 类型 | 说明 |
|------|------|------|
{{#each PARAMS}}
| `{{PARAM_NAME}}` | {{PARAM_TYPE}} | {{PARAM_DESC}} |
{{/each}}

**返回值**: {{RETURN_TYPE}}

**实现逻辑**:
```{{LANGUAGE}}
{{IMPLEMENTATION}}
```

{{/each}}

{{/each}}

---

## 5. 数据流

### 5.1 主要数据流程

```mermaid
{{DATA_FLOW_DIAGRAM}}
```

### 5.2 状态转换

```mermaid
{{STATE_DIAGRAM}}
```

---

## 6. 复刻指南

> [!IMPORTANT]
> **按此顺序实现可最小化依赖阻塞**

### Step 1: 环境准备

```bash
# 创建项目目录
mkdir {{PROJECT_NAME}}
cd {{PROJECT_NAME}}

# 初始化
{{INIT_COMMAND}}

# 安装依赖
{{INSTALL_COMMAND}}
```

### Step 2: 基础类型定义

创建 `{{TYPES_PATH}}`:

```{{LANGUAGE}}
{{TYPES_CODE}}
```

### Step 3: 工具函数

按以下顺序实现:

{{#each IMPL_ORDER}}
#### {{@index}}. {{FILE_NAME}}

```{{LANGUAGE}}
{{FILE_CODE}}
```

{{/each}}

### Step N: 最终集成

```{{LANGUAGE}}
{{ENTRY_CODE}}
```

---

## 附录

### A. 完整文件清单

| 文件 | 行数 | 职责 |
|------|------|------|
{{#each FILES}}
| `{{FILE_PATH}}` | {{LINE_COUNT}} | {{FILE_DESC}} |
{{/each}}

### B. 术语表

| 术语 | 定义 |
|------|------|
| {{TERM_1}} | {{DEF_1}} |

---

> 📝 本文档由 `/doc-gen` 技能自动生成
> 🕐 生成时间: {{TIMESTAMP}}
