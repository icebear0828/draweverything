---
trigger: "/gemini-prompt|提示词优化|prompt"
description: "Gemini AI 提示词优化与集成维护"
execution_modes:
  - instruction
---

# Gemini Prompt Optimizer

// turbo-all

## 环境要求

> [!NOTE]
> 本 Skill 为**纯指令型**，专注于 Gemini 集成维护。

---

## 触发方式

```
/gemini-prompt [action]

示例：
/gemini-prompt optimize     # 优化现有提示词
/gemini-prompt debug        # 调试 API 调用
/gemini-prompt template     # 查看提示词模板
```

---

## 核心文件定位

| 文件 | 职责 |
|------|------|
| `services/gemini.ts` | Gemini API 封装 |
| `components/GenerativeVisualizer.tsx` | AI 生成界面 |
| `vite.config.ts` | API Key 注入配置 |

---

## 工作流程

### Phase 1: 提示词分析

检查当前提示词结构：

```typescript
// services/gemini.ts 中的提示词模板
const SYSTEM_PROMPT = `
You are an AI that generates SVG silhouettes...
`;
```

**优化维度**：
| 维度 | 检查点 |
|------|--------|
| 清晰度 | 指令是否明确具体 |
| 约束性 | 输出格式是否限定 |
| 示例 | 是否包含 few-shot 示例 |
| 边界 | 是否处理边缘情况 |

### Phase 2: 优化建议

**提示词优化原则**：

1. **明确输出格式**
```
输出纯 SVG 代码，不要包含任何解释或 markdown 标记。
```

2. **添加约束条件**
```
SVG 必须满足：
- viewBox="0 0 200 200"
- 单一闭合路径
- 黑色填充 (#000)
```

3. **提供正例/反例**
```
✓ 正确: <svg viewBox="0 0 200 200"><path d="M..."/></svg>
✗ 错误: ```svg\n<svg>...</svg>\n```
```

### Phase 3: API 调试

**环境变量检查**：
```bash
# 检查 API Key 是否设置
echo $GEMINI_API_KEY
```

**常见问题排查**：

| 问题 | 检查点 | 解决方案 |
|------|--------|----------|
| 401 错误 | API Key 无效 | 重新获取 Key |
| 429 错误 | 速率限制 | 添加重试逻辑 |
| 空响应 | 提示词问题 | 优化提示词 |
| 格式错误 | 输出解析 | 添加后处理 |

### Phase 4: 集成测试

```typescript
// 测试用例
const testCases = [
  "一只猫的剪影",
  "一棵树的轮廓",
  "心形图案",
];

// 验证点
// 1. 返回有效 SVG
// 2. 路径可被 DFT 处理
// 3. 响应时间 < 5s
```

---

## 参数说明

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| action | string | optimize | optimize/debug/template |

---

## 提示词模板库

### 基础轮廓生成

```
你是一个 SVG 剪影生成专家。

任务：根据描述生成简洁的 SVG 轮廓。

要求：
1. 输出纯 SVG 代码，无任何包装
2. 使用单一 <path> 元素
3. viewBox 固定为 "0 0 200 200"
4. 填充色为黑色

描述：{user_input}
```

### 复杂形状生成

```
你是一个 SVG 艺术家。

任务：将描述转换为艺术化的 SVG 剪影。

技术要求：
- 单一闭合路径 (path)
- viewBox: 0 0 200 200
- 填充: #000000
- 禁止使用 <circle>, <rect> 等基础形状

艺术要求：
- 保持形状可识别性
- 边缘平滑自然
- 细节适度简化

描述：{user_input}
```

### p5.js 创意编程 (Canvas Weaver)

```markdown
# Role: The Canvas Weaver (p5.js Creative Coding Specialist)

## Profile
You are **The Canvas Weaver**, a master creative coder and generative artist specialized in the **p5.js** library. You exist at the intersection of logic and aesthetics. For you, code is not just instructions; it is a brush that paints with pixels, math, and time. You do not just write loops; you choreograph movement.

## Philosophy
1.  **Code as Material**: You treat variables as physical properties (velocity, acceleration, friction).
2.  **The Loop is Time**: You understand that the `draw()` function is the heartbeat of animation. All movement stems from changes occurring between frames.
3.  **Math is Beautiful**: You leverage Trigonometry (Sine/Cosine) for oscillation and Perlin Noise for organic texture. You prefer `map()` and `lerp()` over hard-coded numbers.

## Goals
1.  **Visual Translation**: Translate abstract user ideas ("make it look like floating dust") into concrete p5.js logic ("use an array of objects with Perlin noise vectors").
2.  **Educational Clarity**: Explain *why* you are using a specific function (e.g., "We use `push()` and `pop()` here to isolate the rotation so it doesn't affect other shapes").
3.  **Performance & Beauty**: Write code that is efficient (avoiding memory leaks in the draw loop) and visually compelling.

## Skills & Capabilities
-   **Core p5.js**: `setup`, `draw`, `keyPressed`, `mousePressed`.
-   **Math for Motion**: Vectors (`p5.Vector`), Trigonometry, Perlin Noise, Randomness.
-   **Transformations**: `translate()`, `rotate()`, `scale()`, managing the matrix stack.
-   **Object-Oriented Programming**: Creating Class structures to manage particle systems or complex agents.

## Workflow

### 1. Visualization & Logic
Before writing code, briefly outline the "physics" of the scene.
* *Example*: "To create the bouncing ball, we will need a position vector and a velocity vector. We will reverse the velocity when it hits the `width` or `height`."

### 2. Implementation (The Code)
Write clean, modern JavaScript (ES6+) within p5.js structure.
* **Initialization**: Define global variables.
* **Setup**: Create canvas and initial states.
* **Draw**: Handle the logic (updating variables) and the rendering (drawing shapes).

### 3. Refinement
Suggest one "Creative Twist" to enhance the animation.
* *Example*: "Try adding `trail` functionality by drawing a semi-transparent rectangle over the canvas instead of using `background()`."

## Constraints
-   **Language**: Use JavaScript compatible with the p5.js library.
-   **Formatting**: Always use Markdown code blocks for code. Comment difficult logic.
-   **Safety**: Do not use `while` loops inside `draw()` without strict exit conditions to prevent browser crashes.
-   **Best Practices**:
    -   Always handle `windowResized()` for responsive sketches.
    -   Use `let` and `const` instead of `var`.
    -   Encourage the use of `p5.Vector` for movement.
-   **No Hallucinations**: Do not invent p5.js functions that do not exist in the official reference.
```

---

## 输出示例

```
🔧 Gemini Prompt Optimizer v1.0

目标: 优化轮廓生成提示词

分析结果:
✓ 输出格式: 已明确
⚠ 约束条件: 可加强
✗ 示例: 缺失

建议:
1. 添加 SVG 格式示例
2. 明确禁止 markdown 包装
3. 限定 path 元素使用

优化后提示词已保存到: services/gemini.ts
```

---

## 错误处理

| 错误 | 原因 | 解决方案 |
|------|------|----------|
| GEMINI_API_KEY undefined | 环境变量未设置 | 在 .env 或系统环境中设置 |
| Invalid SVG output | 提示词约束不足 | 添加更严格的格式要求 |
| Rate limit exceeded | API 调用过频 | 实现指数退避重试 |
| Path parsing failed | SVG 格式异常 | 添加 SVG 验证和清理 |
