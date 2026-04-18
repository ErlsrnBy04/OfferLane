import { format, startOfWeek, subWeeks } from "date-fns";
import { zhCN } from "date-fns/locale";
import { prisma } from "@/lib/prisma";
import { STAGE_LABEL, STAGE_ORDER, type Stage } from "@/lib/stages";
import {
  StageFunnelChart,
  WeeklyAppliedChart,
} from "@/components/stats/charts";

export const dynamic = "force-dynamic";

const STAGE_COLORS: Record<Stage, string> = {
  APPLIED: "#94a3b8",
  SCREENING: "#38bdf8",
  OA: "#a78bfa",
  INTERVIEW_1: "#fbbf24",
  INTERVIEW_2: "#fb923c",
  INTERVIEW_HR: "#f472b6",
  OFFER: "#10b981",
  REJECTED: "#d4d4d8",
};

export default async function StatsPage() {
  const apps = await prisma.application.findMany({
    select: {
      id: true,
      stage: true,
      appliedAt: true,
      lastActionAt: true,
      events: { select: { toStage: true, occurredAt: true }, orderBy: { occurredAt: "asc" } },
    },
  });

  const total = apps.length;
  const ongoing = apps.filter(
    (a) => !["OFFER", "REJECTED"].includes(a.stage),
  ).length;
  const offered = apps.filter((a) => a.stage === "OFFER").length;
  const rejected = apps.filter((a) => a.stage === "REJECTED").length;

  // 回复率 = 有过任何阶段推进（除 APPLIED 初始事件）的申请 / 总数
  const replied = apps.filter(
    (a) => a.events.filter((e) => e.toStage !== "APPLIED").length > 0,
  ).length;
  const replyRate = total > 0 ? Math.round((replied / total) * 100) : 0;

  // 平均响应天数 = 从 APPLIED 到下一个阶段的天数均值
  const respDays: number[] = [];
  for (const a of apps) {
    const apply = a.events.find((e) => e.toStage === "APPLIED");
    const next = a.events.find(
      (e) => e.toStage !== "APPLIED" && (!apply || e.occurredAt >= apply.occurredAt),
    );
    if (apply && next) {
      const d = Math.floor(
        (next.occurredAt.getTime() - apply.occurredAt.getTime()) /
          (24 * 3600 * 1000),
      );
      if (d >= 0) respDays.push(d);
    }
  }
  const avgRespDays =
    respDays.length > 0
      ? (respDays.reduce((a, b) => a + b, 0) / respDays.length).toFixed(1)
      : "—";

  // 漏斗数据：按阶段顺序累计（实际上是当前状态分布）
  const stageCount: Record<Stage, number> = {} as Record<Stage, number>;
  for (const s of STAGE_ORDER) stageCount[s] = 0;
  for (const a of apps) stageCount[a.stage as Stage]++;

  const funnelData = STAGE_ORDER.map((s) => ({
    stage: s,
    label: STAGE_LABEL[s],
    count: stageCount[s],
    color: STAGE_COLORS[s],
  }));

  // 近 4 周投递
  const now = new Date();
  const weeks: { week: string; count: number }[] = [];
  for (let i = 3; i >= 0; i--) {
    const weekStart = startOfWeek(subWeeks(now, i), { weekStartsOn: 1 });
    const weekEnd = startOfWeek(subWeeks(now, i - 1), { weekStartsOn: 1 });
    const count = apps.filter(
      (a) => a.appliedAt >= weekStart && a.appliedAt < weekEnd,
    ).length;
    weeks.push({
      week: format(weekStart, "M/d", { locale: zhCN }),
      count,
    });
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">统计</h1>
        <p className="text-sm text-muted-foreground">
          整体进度与转化情况
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="总投递" value={total} />
        <StatCard
          label="进行中"
          value={ongoing}
          hint={`已挂 ${rejected} · Offer ${offered}`}
        />
        <StatCard
          label="回复率"
          value={`${replyRate}%`}
          hint={`${replied}/${total} 有后续反馈`}
        />
        <StatCard
          label="平均响应天数"
          value={avgRespDays}
          hint="投递 → 首次推进"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="阶段分布" hint="当前申请在各阶段的数量">
          <StageFunnelChart data={funnelData} />
        </ChartCard>
        <ChartCard title="近 4 周投递" hint="每周投出的申请数">
          <WeeklyAppliedChart data={weeks} />
        </ChartCard>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div className="text-2xl font-semibold tabular-nums">{value}</div>
      {hint && (
        <div className="text-xs text-muted-foreground mt-1">{hint}</div>
      )}
    </div>
  );
}

function ChartCard({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="mb-4">
        <div className="text-sm font-medium">{title}</div>
        {hint && (
          <div className="text-xs text-muted-foreground">{hint}</div>
        )}
      </div>
      {children}
    </div>
  );
}
