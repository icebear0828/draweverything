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
/math-debug worker       # 调试 Web Worker DFT
```

---

## 核心文件定位

| 模块 | 文件路径 | 职责 |
|------|----------|------|
| 数学核心 | `utils/math.ts` | DFT、重采样、坐标转换 |
| DFT Worker | `workers/dft.worker.ts` | 后台线程 DFT 计算 |
| Worker 类型 | `workers/dft.types.ts` | Worker 消息协议 |
| 数据 Store | `stores/useDataStore.ts` | 数据管道管理、Worker 集成 |
| 类型定义 | `types/core.ts` | Complex, FourierCoefficient |
| 图层类型 | `types/layer.ts` | MathLayer, ProcessedLayer |

### 旧文件 (仍可用但非主路径)
| 模块 | 文件路径 | 说明 |
|------|----------|------|
| 路径生成 Hook | `hooks/usePathGenerator.ts` | 已集成到 useDataStore |
| 傅里叶 Hook | `hooks/useFourier.ts` | 已集成到 useDataStore |

---

## 架构变更 (v4.0)

### 新数据流

```
输入 → useDataStore.compileFunctions()
         ↓
    generateFromFunction() → resamplePath()
         ↓
    computeDFTWithWorker() [Web Worker]
         ↓
    dft.worker.ts → dft()
         ↓
    processedLayers → 渲染
```

### Web Worker 集成

DFT 计算现在在 Web Worker 中执行，避免主线程阻塞：

```typescript
// stores/useDataStore.ts
const computeDFTWithWorker = (pathsData, layersConfig) => {
  // 1. 尝试使用 Worker
  // 2. 失败时回退到主线程 processPathsToLayersSync()
}

// workers/dft.worker.ts
self.onmessage = (event) => {
  // 接收 COMPUTE_DFT 请求
  // 执行 dft() 计算
  // 返回 DFT_RESULT 响应
}
```

---

## 工作流程

### Phase 1: 问题定位

1. 确定异常现象（路径断裂？形状错误？动画卡顿？）
2. 定位可能的模块
3. 检查相关函数

**常见问题映射**：

| 现象 | 可能原因 | 检查位置 |
|------|----------|----------|
| 路径不闭合 | 采样不均匀 | `utils/math.ts:resamplePath()` |
| 形状失真 | DFT 系数截断 | `utils/math.ts:dft()` 或 `workers/dft.worker.ts` |
| 极坐标异常 | 角度计算错误 | `utils/math.ts:generateFromFunction()` |
| 动画抖动 | 相位计算问题 | `FourierCoefficient.phase` |
| Worker 超时 | 数据过大 | `stores/useDataStore.ts:computeDFTWithWorker()` |
| Worker 失败 | 浏览器不支持 | 检查 fallback 到 `processPathsToLayersSync()` |

### Phase 2: 数据流追踪

**调试点**:
```typescript
// utils/math.ts 关键函数

// 1. 参数方程到路径
generateFromFunction(xFn, yFn, tMin, tMax, points, scale, shouldCenter, isPolar)
// 输出: Complex[] 路径点

// 2. 路径重采样
resamplePath(points, targetCount)
// 输出: 均匀分布的 Complex[]

// 3. 离散傅里叶变换 (主线程)
dft(path)
// 输出: FourierCoefficient[] 按幅度排序

// 4. Worker 计算 (stores/useDataStore.ts)
computeDFTWithWorker(pathsData, layersConfig)
// 输出: Promise<ProcessedLayer[]>
```

### Phase 3: 验证修复

**参数方程验证**:
```typescript
// 测试用例：圆形
xFn = "Math.cos(t)"
yFn = "Math.sin(t)"
// 期望：完美圆形轨迹

// 测试用例：心形
xFn = "16*Math.pow(Math.sin(t),3)"
yFn = "13*Math.cos(t)-5*Math.cos(2*t)-2*Math.cos(3*t)-Math.cos(4*t)"
// 期望：心形轨迹
```

**极坐标验证**:
```typescript
// 测试用例：玫瑰曲线
xFn = "Math.cos(4*t)"  // r
yFn = "t"              // theta
isPolar = true
// 期望：8 瓣玫瑰
```

---

## 参数说明

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| target | string | all | dft/resample/equation/polar/worker |

---

## 调试检查清单

### DFT 算法检查
- [ ] 输入路径点数量 >= 64
- [ ] 路径点均匀分布
- [ ] 系数按幅度降序排列
- [ ] 频率范围正确 (-N/2 to N/2)

### 重采样检查
- [ ] 输入路径非空
- [ ] 目标点数合理 (通常 256-2048)
- [ ] 闭合路径首尾相连
- [ ] 弧长计算正确

### 坐标转换检查
- [ ] 极坐标 (r, θ) → 笛卡尔 (x, y) 正确
- [ ] 角度范围 [0, 2π]
- [ ] 负半径处理正确

### Web Worker 检查
- [ ] Worker 正确初始化
- [ ] 消息协议正确 (DFTRequest/DFTResponse)
- [ ] Fallback 机制工作
- [ ] 内存无泄漏 (pendingRequests 清理)

---

## 输出示例

```
🔍 Fourier Math Debugger v2.0

目标: DFT 算法 + Worker
文件: utils/math.ts, workers/dft.worker.ts

检查点 1: 输入验证
✓ 路径点数量: 2048 (OK)
✓ 路径闭合: 是

检查点 2: Worker 状态
✓ Worker 初始化: 成功
✓ 消息协议: 正确

检查点 3: DFT 计算
✓ 系数数量: 2048
✓ 最大幅度: 150.32 (freq=1)
✓ 排序: 正确

检查点 4: 重建误差
✓ MSE: 0.0001 (OK)

结论: DFT 算法工作正常
```

---

## 错误处理

| 错误 | 原因 | 解决方案 |
|------|------|----------|
| 路径点为空 | 方程语法错误 | 检查 xFn/yFn 表达式 |
| NaN 出现 | 除零或无效运算 | 检查方程边界条件 |
| 形状严重失真 | 采样点过少 | 增加 pointCount |
| 动画不流畅 | 系数过多 | 限制渲染的系数数量 |
| Worker 错误 | 浏览器不支持 | 自动 fallback 到主线程 |
| 内存溢出 | 点数过大 | 限制 pointCount <= 4096 |
