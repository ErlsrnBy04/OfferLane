# 求职申请管理看板 · Job Tracker Dashboard

面向大学生的求职申请全流程管理看板。记录公司、岗位、DDL、面试轮次与复盘，拖拽改阶段，一张图看清进度。

**单用户本地应用**：无登录、无云端、数据全部存在项目根目录下的 `dev.db` SQLite 文件里。

## 功能

- **申请卡片 CRUD** — 公司、岗位、渠道、简历版本、薪资、JD 快照、备注
- **漏斗看板** — 8 个阶段（已投递 → 简历筛选 → OA → 一面 → 二面 → HR 面 → Offer / 已挂），拖拽改状态
- **流转时间线** — 每次阶段变化自动写入日志，详情页可查
- **日历视图** — 按月展示 DDL 与面试，颜色区分
- **统计仪表盘** — 总投递 / 进行中 / 回复率 / 平均响应天数 + 阶段分布图 + 近 4 周投递柱状图
- **面试复盘** — 轮次、形式、问的题、自评星级、情绪标签，按时间倒序展示
- **首页** — 近 7 天 DDL / 面试 + 最近动态 + 快捷入口

## 快速开始

```bash
npm install
npm run db:migrate        # 创建 SQLite 数据库
npm run db:seed           # 写入 ~10 条仿真申请
npm run dev               # http://localhost:3000
```

常用命令：

| 命令 | 说明 |
| --- | --- |
| `npm run dev` | 开发服务器 |
| `npm run build` | 生产构建（含 TS 类型检查） |
| `npm run lint` | ESLint |
| `npm run db:studio` | Prisma Studio 可视化查看/编辑数据 |
| `npm run db:reset` | 清库 + 重跑迁移 + 重新 seed |

## 技术栈

- **Next.js 16** · App Router · React 19 · TypeScript
- **Tailwind CSS v4** + shadcn/ui (`base-nova` preset, 基于 `@base-ui/react`)
- **Prisma 7** + better-sqlite3 driver adapter（SQLite 文件数据库）
- **@dnd-kit** 拖拽 · **recharts** 图表 · **react-hook-form + zod** 表单 · **sonner** toast · **date-fns** 日期

## 项目结构

```
src/
├── app/                     路由（App Router）
│   ├── page.tsx            首页 Dashboard
│   ├── applications/       看板 / 新建 / 详情 / 编辑
│   ├── calendar/           日历
│   └── stats/              统计
├── actions/                Server Actions（唯一的写入入口）
├── components/
│   ├── kanban/             拖拽看板
│   ├── forms/              申请表单 / 面试复盘表单
│   ├── stats/              recharts 图表
│   └── ui/                 shadcn 生成的组件
├── lib/
│   ├── prisma.ts           Prisma 单例（含 better-sqlite3 adapter）
│   ├── stages.ts           ★ 阶段/职级/渠道枚举与中文标签（单一事实源）
│   ├── schemas.ts          zod 校验
│   ├── date.ts             DDL 剩余天数/紧急度/格式化
│   └── utils.ts            cn()
└── generated/prisma/       Prisma 生成的 client（被 gitignore）

prisma/
├── schema.prisma           三张表：Application / StageEvent / Interview
├── seed.ts                 开发 seed
└── migrations/
```

## 数据模型要点

- `Application.stage` 是字符串（SQLite 不支持 enum），在 `src/lib/stages.ts` 和 `src/lib/schemas.ts` 做类型约束
- 每次阶段变更 → 写一条 `StageEvent`（通过 `updateStage` Server Action 的 `$transaction`）
- 看板、漏斗图、时间线都消费 `STAGE_ORDER`，改枚举要同时改标签、颜色与 zod schema

## 不在 MVP 范围内

邮件解析、Chrome 插件、多用户、Offer 对比器、情绪支持模块、移动端 PWA、AI 集成 — 后续迭代。
