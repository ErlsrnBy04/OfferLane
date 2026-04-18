# OfferLane · 求职申请管理看板

面向大学生的求职申请全流程管理工具。记录公司、岗位、DDL、面试轮次与复盘，用漏斗看板一张图看清所有进展。

单用户本地应用 —— 无需登录，无需云端，数据全部存在项目根目录的 `dev.db` SQLite 文件里。

## 功能

- **漏斗看板** —— 已投递 / 简历筛选 / OA / 一面 / 二面 / HR 面 / Offer / 已挂 共 8 个阶段，拖拽即可改阶段
- **拖拽派生面试** —— 卡片拖入面试列时弹出小表单，一步完成"改阶段"和"建面试记录"
- **申请卡片 CRUD** —— 公司、岗位、渠道、简历版本、薪资、JD 快照、备注
- **流转时间线** —— 每次阶段变化自动写入日志，详情页可追溯
- **面试复盘** —— 轮次、形式、问到的题、自评星级、情绪标签
- **日历视图** —— 按月展示 DDL 与面试
- **统计仪表盘** —— 总投递、进行中、回复率、平均响应天数，阶段分布 + 近 4 周投递趋势
- **首页** —— 近 7 天 DDL / 面试 + 最近动态 + 快捷入口

## 快速开始

环境要求：Node.js 20 及以上。

```bash
git clone git@github.com:ErlsrnBy04/OfferLane.git
cd OfferLane
cp .env.example .env
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

浏览器打开 <http://localhost:3000> 即可使用。

## 常用命令

| 命令 | 说明 |
| --- | --- |
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 生产构建 |
| `npm run db:studio` | 用 Prisma Studio 查看/编辑数据 |
| `npm run db:reset` | 清空数据库并重新 seed |

## 技术栈

- Next.js 16（App Router）· React 19 · TypeScript
- Tailwind CSS v4 · shadcn/ui（base-nova preset）
- Prisma 7 · SQLite（better-sqlite3 driver adapter）
- @dnd-kit · Recharts · react-hook-form + Zod · date-fns · sonner
