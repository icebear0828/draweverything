# Changelog

## [3.5.0] - 2026-01-17

### Added
- **Conditional Composer 模式** - 支持 `--dry` 和 `--video` flags，分离验证与执行
- **health-check Primitive** - 添加到可用 Primitives 清单
- **4 个新 Prompt 模板** - `watercolor.md`, `cyberpunk.md`, `smooth-transition.md`, `veo-prompt-guide.md`

### Changed
- Prompts 清单从 5 个扩展到 9 个模板
- 与 timelapse-generator 生态对齐

### RLAIF 评估驱动
- 评估前分数: 94/100 (S 🏆)
- 评估后分数: 96/100 (S+ 目标)
- 主要改进: 清单完整性、Conditional Composer 模式

---

## [3.4.0] - 2026-01-15

### Added
- **Immutability Guards** - 迭代退化防护机制，保护 `style_anchor`, `character_roster`, `visual_signature`, `prompt_prefix` 等核心身份字段
- **Core Philosophy 第 5 条** - Identity Preservation 原则
- **execution_modes 声明** - Frontmatter 新增执行模式声明

### Changed
- 对齐 `skill-rlaif` v2.1 的 Iterative Drift Prevention 标准

### RLAIF 评估驱动
- 评估前分数: 89/100 (A 🥇)
- 评估后分数: 94/100 (S 🏆 目标)
- 主要改进: 防止生成的 Skill 在 RLAIF 迭代中丢失视觉风格、角色一致性等关键特征

---

## [3.3.0] - 2026-01-14

### Added
- **Execution Mode System** - 6 种执行模式：instruction, api:python, subagent:browser, subagent:task, delegate, hybrid
- **模式选择决策树** - Mermaid 可视化决策辅助
- **Subagent 执行模板** - Antigravity browser_subagent + Claude Code Task 双平台适配
- **Skill 委托协议** - 委托声明表 + Phase 模板 + 委托链图
- **执行模式验证清单** - 新增 4 项检查项

### Changed
- Core Philosophy 新增第 4 条：Execution Flexibility
- Frontmatter 扩展支持 `execution_modes` 声明

### Design Rationale
实现方案 C (Skill 嵌套委托) + D (双模板平台适配)，支持：
- 复用已有 Skill 生态
- 跨平台 Subagent 委托
- 多 Agent 编排流水线

---

## [3.2.0] - 2026-01-14

### Added
- **Mermaid 工作流程图** - 与 skill-rlaif 可视化标准对齐
- **输出产物清单** - 明确列出最终交付文件
- **增强 pyproject.toml 模板** - 含 ruff/mypy/pytest 开发依赖和配置
- **扩展 Safety Rules** - 添加敏感信息 .env 管理规范

### Changed
- 八维评估分数从 85 提升至预期 92+ (S 级目标)

### RLAIF 评估驱动
- 评估前分数: 85/100 (A 🥇)
- 主要扣分项: 缺少流程图、输出产物清单、工具链配置不完整

---

## [3.1.0] - 2026-01-14

### Added
- `versions/v1.0.0/` - Historical version archive (RLAIF compliance)
- Enhanced template with explicit "环境要求" section for pure instruction skills
- Template guidance for creating meta-skills (evaluator, orchestrator types)

### Fixed
- RLAIF self-assessment: evaluator skill created by generator now passes its own criteria
- Clarified distinction between script-based and pure-instruction skills in templates

### Changed
- Verification Checklist now includes maintainability artifacts (CHANGELOG, EVALUATION_LOG)

---

## [3.0.0] - 2026-01-10


### 新增功能

- ✅ **Phase 5: 置信度评估** - 生成 Skill 后自动触发 `/rlaif` 进行完整评估
- ✅ 置信度 < 80 禁止自动交付，需用户确认
- ✅ 更新 Verification Checklist 为强制评估流程
- ✅ Safety Rules 新增置信度交付规则

### 设计理由

基于用户需求：确保 skill-generator 生成的 Skill 可用性有保障，通过 RLAIF 闭环自动验证和修复。

---

## [2.0.0] - 2026-01-10

### RLAIF Optimization (Ralph Loop)

**评估分数**: 45/100 → 92/100

#### 问题清单 (优化前)

| 严重程度 | 问题 |
|----------|------|
| 🔴 严重 | 缺少 YAML frontmatter (trigger/description) |
| 🔴 严重 | 无环境初始化说明 |
| 🟡 中等 | 无 pyproject.toml 模板 |
| 🟡 中等 | 无错误处理指导 |
| 🟢 轻微 | 输出示例不完整 |

#### 修改内容

- ✅ 添加 YAML frontmatter (`trigger`, `description`)
- ✅ 添加 `// turbo-all` 标记
- ✅ 新增完整 SKILL.md 模板（含环境要求、触发方式、工作流程、参数说明、错误处理）
- ✅ 新增 pyproject.toml 模板（使用 `dependency-groups` 替代已废弃的 `tool.uv.dev-dependencies`）
- ✅ 新增 Python 脚本模板（使用 logging 而非 print，含 type hints）
- ✅ 新增 Verification Checklist
- ✅ 新增完整示例（screenshot skill）

#### 验证

通过 `playwright-browser` skill 测试验证模板可用性：
- `uv sync` ✅
- `playwright install chromium` ✅
- `uv run python scripts/open_browser.py` ✅
