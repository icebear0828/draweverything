---
trigger: "/dev|开发|start"
description: "启动开发服务器并管理开发环境"
execution_modes:
  - instruction
---

# Dev Server Manager

// turbo-all

## 环境要求

> [!NOTE]
> 本 Skill 为**纯指令型**，依赖项目已有的 Node.js/Bun 环境。

### 前置检查

确保项目依赖已安装：
```bash
bun install
# 或
pnpm install
```

---

## 触发方式

```
/dev [command]

示例：
/dev           # 启动开发服务器
/dev status    # 检查服务状态
/dev restart   # 重启服务器
```

---

## 工作流程

### Phase 1: 环境检查

1. 验证 `node_modules` 存在
2. 检查 `vite.config.ts` 配置
3. 验证端口 3000 可用

```bash
# 检查依赖
ls node_modules/.vite 2>/dev/null || echo "需要运行 bun install"

# 检查端口占用 (Windows)
netstat -ano | findstr :3000
```

### Phase 2: 启动开发服务器

```bash
bun run dev
# 或
pnpm dev
```

> [!NOTE]
> 服务器启动后访问 http://localhost:3000

### Phase 3: 热更新验证

开发服务器支持以下热更新：
- React 组件修改 → 即时更新
- TypeScript 修改 → 类型检查 + 更新
- CSS 修改 → 样式注入
- `vite.config.ts` 修改 → 需重启

---

## 参数说明

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| command | string | start | start/status/restart |

---

## 常用命令速查

| 命令 | 说明 |
|------|------|
| `bun run dev` | 启动开发服务器 |
| `bun run build` | 生产构建 |
| `bun run preview` | 预览生产构建 |
| `pnpm dev` | 启动开发服务器 (pnpm) |
| `pnpm build` | 生产构建 (pnpm) |

---

## 输出示例

```
✓ 依赖检查完成
✓ 端口 3000 可用
✓ 开发服务器启动中...

  VITE v6.2.0  ready in 500 ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
```

---

## 错误处理

| 错误 | 原因 | 解决方案 |
|------|------|----------|
| `ENOENT: node_modules` | 依赖未安装 | 运行 `bun install` |
| `EADDRINUSE: 3000` | 端口被占用 | 关闭占用进程或修改 vite.config.ts |
| `GEMINI_API_KEY undefined` | 环境变量缺失 | 设置 `GEMINI_API_KEY` 环境变量 |
| TypeScript 错误 | 类型不匹配 | 查看终端错误信息修复 |
