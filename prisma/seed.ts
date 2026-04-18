import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const url = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
const path = url.startsWith("file:") ? url.slice(5) : url;
const adapter = new PrismaBetterSqlite3({ url: path });
const prisma = new PrismaClient({ adapter });

/** 今天偏移 N 天 */
const d = (offset: number, hour = 10, minute = 0) => {
  const x = new Date();
  x.setHours(hour, minute, 0, 0);
  x.setDate(x.getDate() + offset);
  return x;
};

async function main() {
  // 清空旧数据（幂等 seed）
  await prisma.interview.deleteMany();
  await prisma.stageEvent.deleteMany();
  await prisma.application.deleteMany();

  const apps = [
    {
      company: "字节跳动",
      position: "后端工程师（实习）",
      level: "INTERN",
      city: "北京",
      channel: "REFERRAL",
      channelDetail: "学长 @王磊",
      stage: "INTERVIEW_2",
      salaryMin: 300,
      salaryMax: 400,
      resumeVersion: "v3-后端.pdf",
      appliedAt: d(-14),
      deadline: null,
      notes: "一面问了 MySQL 索引 + Redis 持久化，答得一般。",
    },
    {
      company: "美团",
      position: "数据分析师（校招）",
      level: "NEW_GRAD",
      city: "上海",
      channel: "OFFICIAL",
      stage: "OA",
      salaryMin: 25,
      salaryMax: 35,
      resumeVersion: "v2-数据.pdf",
      appliedAt: d(-5),
      deadline: d(1, 23, 59),
      notes: "SQL + 概率题笔试，48h 内完成。",
    },
    {
      company: "腾讯",
      position: "前端开发（暑期实习）",
      level: "INTERN",
      city: "深圳",
      channel: "PLATFORM",
      channelDetail: "BOSS 直聘",
      stage: "APPLIED",
      salaryMin: 250,
      salaryMax: 350,
      resumeVersion: "v3-前端.pdf",
      appliedAt: d(-2),
      deadline: null,
    },
    {
      company: "阿里巴巴",
      position: "算法工程师（校招）",
      level: "NEW_GRAD",
      city: "杭州",
      channel: "REFERRAL",
      channelDetail: "实验室师兄",
      stage: "INTERVIEW_HR",
      salaryMin: 30,
      salaryMax: 40,
      resumeVersion: "v4-算法.pdf",
      appliedAt: d(-21),
      deadline: d(3, 18),
      notes: "HR 面，主要聊意向和薪资预期。",
    },
    {
      company: "小红书",
      position: "产品经理（实习）",
      level: "INTERN",
      city: "上海",
      channel: "REFERRAL",
      channelDetail: "朋友内推",
      stage: "INTERVIEW_1",
      salaryMin: 200,
      salaryMax: 300,
      appliedAt: d(-9),
      deadline: null,
      notes: "一面约在下周二 14:00。",
    },
    {
      company: "网易",
      position: "游戏策划（校招）",
      level: "NEW_GRAD",
      city: "杭州",
      channel: "OFFICIAL",
      stage: "SCREENING",
      appliedAt: d(-6),
      deadline: null,
    },
    {
      company: "拼多多",
      position: "后端开发（校招）",
      level: "NEW_GRAD",
      city: "上海",
      channel: "PLATFORM",
      channelDetail: "牛客网",
      stage: "OFFER",
      salaryMin: 35,
      salaryMax: 45,
      appliedAt: d(-30),
      deadline: d(7, 18),
      notes: "已发 offer，7 天内答复。",
    },
    {
      company: "京东",
      position: "测试工程师（实习）",
      level: "INTERN",
      city: "北京",
      channel: "OFFICIAL",
      stage: "REJECTED",
      appliedAt: d(-18),
      notes: "二面后挂。反馈：项目经验不足。",
    },
    {
      company: "百度",
      position: "机器学习工程师（实习）",
      level: "INTERN",
      city: "北京",
      channel: "REFERRAL",
      channelDetail: "导师推荐",
      stage: "APPLIED",
      appliedAt: d(-1),
    },
    {
      company: "得物",
      position: "iOS 开发（校招）",
      level: "NEW_GRAD",
      city: "上海",
      channel: "PLATFORM",
      stage: "INTERVIEW_1",
      salaryMin: 28,
      salaryMax: 38,
      appliedAt: d(-8),
      deadline: d(0, 20),
      notes: "今晚 20:00 一面。",
    },
  ];

  for (const a of apps) {
    const app = await prisma.application.create({
      data: {
        ...a,
        lastActionAt: new Date(),
      },
    });
    // 给每个写一条初始流转事件
    await prisma.stageEvent.create({
      data: {
        applicationId: app.id,
        fromStage: null,
        toStage: "APPLIED",
        occurredAt: a.appliedAt,
        note: "投递成功",
      },
    });
    // 若当前阶段 != APPLIED，再补一条
    if (a.stage !== "APPLIED") {
      await prisma.stageEvent.create({
        data: {
          applicationId: app.id,
          fromStage: "APPLIED",
          toStage: a.stage,
          occurredAt: new Date(a.appliedAt.getTime() + 3 * 24 * 3600 * 1000),
          note: "阶段推进",
        },
      });
    }
    // 给处于面试阶段及以后的，补 1 条复盘
    if (["INTERVIEW_1", "INTERVIEW_2", "INTERVIEW_HR", "OFFER"].includes(a.stage)) {
      await prisma.interview.create({
        data: {
          applicationId: app.id,
          round: "一面",
          format: "VIDEO",
          interviewer: "技术面试官",
          durationMin: 50,
          questions: "1. 自我介绍\n2. 项目中最有挑战的部分\n3. 算法题：两数之和",
          selfRating: 4,
          mood: "紧张但发挥正常",
          occurredAt: new Date(a.appliedAt.getTime() + 5 * 24 * 3600 * 1000),
        },
      });
    }
  }

  const count = await prisma.application.count();
  console.log(`✔ Seeded ${count} applications.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
