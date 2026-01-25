---
trigger: "/build|构建|打包"
description: "执行生产构建并验证产物"
execution_modes:
  - instruction
---

# Build & Deploy Manager

// turbo-all

## 环境要求

> [!NOTE]
> 本 Skill 为**纯指令型**，依赖项目已有的构建工具链。

---

## 触发方式

```
/build [options]

示例：
/build              # 完整构建流程
/build --preview    # 构建后启动预览服务器
/build --analyze    # 构建并分析包大小
```

---

## 工作流程

### Phase 1: 预构建检查

1. 验证 TypeScript 类型无错误
2. 检查环境变量配置
3. 清理旧构建产物

```bash
# 类型检查
bun run tsc --noEmit

# 清理 dist 目录
rm -rf dist
```

### Phase 2: 执行构建

```bash
bun run build
```

**构建输出目录**: `dist/`

### Phase 3: 产物验证

构建完成后检查：

| 检查项 | 命令 | 期望 |
|--------|------|------|
| 入口文件 | `ls dist/index.html` | 存在 |
| JS 产物 | `ls dist/assets/*.js` | 存在 |
| CSS 产物 | `ls dist/assets/*.css` | 存在 |
| 产物大小 | `du -sh dist/` | < 2MB |

### Phase 4: 预览验证 (可选)

```bash
bun run preview
```

> [!NOTE]
> 预览服务器默认运行在 http://localhost:4173

---

## 参数说明

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| --preview | flag | false | 构建后启动预览服务器 |
| --analyze | flag | false | 分析包大小 |
| --clean | flag | true | 构建前清理 dist |

---

## 构建配置参考

关键配置文件：`vite.config.ts`

```typescript
// 当前配置要点
{
  server: { port: 3000 },
  define: { 'import.meta.env.GEMINI_API_KEY': ... },
  resolve: { alias: { '@': '.' } }
}
```

---

## 输出示例

```
✓ TypeScript 类型检查通过
✓ 清理旧构建产物
✓ 开始生产构建...

vite v6.2.0 building for production...
✓ 50 modules transformed.
dist/index.html                   0.50 kB │ gzip:  0.32 kB
dist/assets/index-xxxxx.css       5.20 kB │ gzip:  1.80 kB
dist/assets/index-xxxxx.js      180.00 kB │ gzip: 58.00 kB

✓ built in 2.50s
✓ 构建完成，产物大小: 186 kB
```

---

## 错误处理

| 错误 | 原因 | 解决方案 |
|------|------|----------|
| TS2xxx 类型错误 | TypeScript 类型不匹配 | 修复类型定义后重新构建 |
| 模块未找到 | 依赖缺失 | 运行 `bun install` |
| 内存溢出 | 项目过大 | 增加 Node 内存限制 |
| 环境变量未定义 | .env 配置缺失 | 检查环境变量设置 |
