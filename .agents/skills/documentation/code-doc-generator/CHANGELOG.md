# Changelog

## [1.0.0] - 2026-01-25

### Added
- 初始发布
- 6 阶段代码分析工作流:
  1. 代码扫描与索引
  2. 架构分析
  3. 依赖图谱构建
  4. 逻辑解构 (函数级/类级/算法级)
  5. 文档生成
  6. 验证与输出
- 3 种输出格式支持:
  - `replicable`: 可复刻详细文档
  - `overview`: 架构概览
  - `api`: API 接口文档
- 4 种分析范围:
  - `full`: 完整分析
  - `architecture`: 仅架构
  - `logic`: 核心逻辑
  - `interface`: 接口定义
- 依赖图谱可视化 (Mermaid)
- 循环依赖检测
- 复刻指南生成 (按实现顺序)
- Immutability Guards 保护核心文档结构
