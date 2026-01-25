---
trigger: "/math-debug|数学调试|fourier"
description: "傅里叶算法调试与数学函数验证"
execution_modes:
  - instruction
---

# Fourier Math Debugger

// turbo-all

## 环境要求

> [!NOTE]
> 本 Skill 为**纯指令型**，专注于数学逻辑调试。

---

## 触发方式

```
/math-debug [target]

示例：
/math-debug dft          # 调试 DFT 算法
/math-debug resample     # 调试路径重采样
/math-debug equation     # 验证参数方程
/math-debug polar        # 调试极坐标转换
```

---

## 核心文件定位

| 模块 | 文件路径 | 职责 |
|------|----------|------|
| 数学核心 | `utils/math.ts` | DFT、重采样、坐标转换 |
| 路径生成 | `hooks/usePathGenerator.ts` | 数据管道管理 |
| 傅里叶 Hook | `hooks/useFourier.ts` | DFT 计算与优化 |
| 类型定义 | `types.ts` | FourierCoefficient, MathLayer |

---

## 工作流程

### Phase 1: 问题定位

1. 确定异常现象（路径断裂？形状错误？动画卡顿？）
2. 定位可能的模块
3. 检查相关函数

**常见问题映射**：

| 现象 | 可能原因 | 检查函数 |
|------|----------|----------|
| 路径不闭合 | 采样不均匀 | `resamplePath()` |
| 形状失真 | DFT 系数截断 | `dft()` 排序逻辑 |
| 极坐标异常 | 角度计算错误 | `generateFromFunction()` |
| 动画抖动 | 相位计算问题 | `FourierCoefficient.phase` |

### Phase 2: 数据流追踪

**数据管道**:
```
输入 → generateFromFunction() → resamplePath() → dft() → 渲染
        (参数方程)              (均匀采样)       (频域转换)
```

**调试点**:
```typescript
// utils/math.ts 关键函数

// 1. 参数方程到路径
generateFromFunction(xFn, yFn, sampleCount, isPolar?)
// 输出: Complex[] 路径点

// 2. 路径重采样
resamplePath(points, targetCount)
// 输出: 均匀分布的 Complex[]

// 3. 离散傅里叶变换
dft(path)
// 输出: FourierCoefficient[] 按幅度排序
```

### Phase 3: 验证修复

**参数方程验证**:
```typescript
// 测试用例：圆形
xFn = "cos(t)"
yFn = "sin(t)"
// 期望：完美圆形轨迹

// 测试用例：心形
xFn = "16*sin(t)^3"
yFn = "13*cos(t)-5*cos(2*t)-2*cos(3*t)-cos(4*t)"
// 期望：心形轨迹
```

**极坐标验证**:
```typescript
// 测试用例：玫瑰曲线
r = "cos(4*t)"
theta = "t"
isPolar = true
// 期望：8 瓣玫瑰
```

---

## 参数说明

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| target | string | all | dft/resample/equation/polar |

---

## 调试检查清单

### DFT 算法检查
- [ ] 输入路径点数量 >= 64
- [ ] 路径点均匀分布
- [ ] 系数按幅度降序排列
- [ ] 频率范围正确 (-N/2 to N/2)

### 重采样检查
- [ ] 输入路径非空
- [ ] 目标点数合理 (通常 256-1024)
- [ ] 闭合路径首尾相连
- [ ] 弧长计算正确

### 坐标转换检查
- [ ] 极坐标 (r, θ) → 笛卡尔 (x, y) 正确
- [ ] 角度范围 [0, 2π]
- [ ] 负半径处理正确

---

## 输出示例

```
🔍 Fourier Math Debugger v1.0

目标: DFT 算法
文件: utils/math.ts

检查点 1: 输入验证
✓ 路径点数量: 512 (OK)
✓ 路径闭合: 是

检查点 2: DFT 计算
✓ 系数数量: 512
✓ 最大幅度: 150.32 (freq=1)
✓ 排序: 正确

检查点 3: 重建误差
✓ MSE: 0.0001 (OK)

结论: DFT 算法工作正常
```

---

## 错误处理

| 错误 | 原因 | 解决方案 |
|------|------|----------|
| 路径点为空 | 方程语法错误 | 检查 xFn/yFn 表达式 |
| NaN 出现 | 除零或无效运算 | 检查方程边界条件 |
| 形状严重失真 | 采样点过少 | 增加 sampleCount |
| 动画不流畅 | 系数过多 | 限制渲染的系数数量 |
