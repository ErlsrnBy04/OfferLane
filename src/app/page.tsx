import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  CalendarClock,
  Clock,
  LayoutGrid,
  Plus,
  Sparkles,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import {
  ACTIVE_STAGES,
  STAGE_LABEL,
  STAGE_TONE,
  type Stage,
} from "@/lib/stages";
import {
  daysUntil,
  deadlineUrgency,
  fmtDate,
  fmtDateTime,
  fromNow,
  urgencyClass,
} from "@/lib/date";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const now = new Date();
  const weekLater = new Date();
  weekLater.setDate(now.getDate() + 7);

  const [upcomingDeadlines, upcomingInterviews, total, activeCount, offerCount] =
    await Promise.all([
      prisma.application.findMany({
        where: {
          deadline: { gte: now, lte: weekLater },
          stage: { notIn: ["OFFER", "REJECTED"] },
        },
        orderBy: { deadline: "asc" },
        take: 5,
        select: {
          id: true,
          company: true,
          position: true,
          stage: true,
          deadline: true,
        },
      }),
      prisma.interview.findMany({
        where: { occurredAt: { gte: now, lte: weekLater } },
        orderBy: { occurredAt: "asc" },
        take: 5,
        select: {
          id: true,
          round: true,
          occurredAt: true,
          application: { select: { id: true, company: true, position: true } },
        },
      }),
      prisma.application.count(),
      prisma.application.count({
        where: { stage: { notIn: ["OFFER", "REJECTED"] } },
      }),
      prisma.application.count({ where: { stage: "OFFER" } }),
    ]);

  const recentApps = await prisma.application.findMany({
    orderBy: { lastActionAt: "desc" },
    take: 5,
    select: {
      id: true,
      company: true,
      position: true,
      stage: true,
      lastActionAt: true,
    },
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">你好 👋</h1>
          <p className="text-sm text-muted-foreground">
            {total === 0
              ? "还没有任何申请，来新建第一条吧"
              : `你正在追踪 ${activeCount} 个进行中的申请${offerCount > 0 ? `，已收到 ${offerCount} 个 offer` : ""}`}
          </p>
        </div>
        <Link
          href="/applications/new"
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="size-4" /> 新建申请
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Upcoming DDLs */}
        <Panel
          title="近 7 天 DDL"
          icon={<AlertCircle className="size-4" />}
          emptyText="没有临近的截止时间 👍"
          isEmpty={upcomingDeadlines.length === 0}
        >
          {upcomingDeadlines.map((a) => {
            const urgency = deadlineUrgency(a.deadline);
            const days = daysUntil(a.deadline);
            return (
              <Link
                key={a.id}
                href={`/applications/${a.id}`}
                className="flex items-center justify-between gap-3 rounded-lg border bg-card px-3 py-2.5 hover:border-primary/40"
              >
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">
                    {a.company}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {a.position} · {STAGE_LABEL[a.stage as Stage]}
                  </div>
                </div>
                <div
                  className={cn(
                    "shrink-0 rounded border px-1.5 py-0.5 text-xs tabular-nums",
                    urgencyClass(urgency),
                  )}
                >
                  {days !== null && days < 0
                    ? `过期 ${-days}d`
                    : days === 0
                      ? `今天 ${fmtDate(a.deadline, "HH:mm")}`
                      : `${days} 天后`}
                </div>
              </Link>
            );
          })}
        </Panel>

        {/* Upcoming interviews */}
        <Panel
          title="近 7 天面试"
          icon={<CalendarClock className="size-4" />}
          emptyText="暂无面试安排"
          isEmpty={upcomingInterviews.length === 0}
        >
          {upcomingInterviews.map((iv) => (
            <Link
              key={iv.id}
              href={`/applications/${iv.application.id}`}
              className="flex items-center justify-between gap-3 rounded-lg border bg-card px-3 py-2.5 hover:border-primary/40"
            >
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">
                  {iv.application.company} · {iv.round}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {iv.application.position}
                </div>
              </div>
              <div className="shrink-0 text-xs text-muted-foreground tabular-nums">
                {fmtDateTime(iv.occurredAt)}
              </div>
            </Link>
          ))}
        </Panel>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
              <Clock className="size-3.5" /> 最近动态
            </h2>
            <Link
              href="/applications"
              className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-0.5"
            >
              全部 <ArrowRight className="size-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {recentApps.length === 0 ? (
              <div className="rounded-xl border border-dashed py-10 text-center text-sm text-muted-foreground">
                还没有任何动态
              </div>
            ) : (
              recentApps.map((a) => {
                const tone = STAGE_TONE[a.stage as Stage];
                return (
                  <Link
                    key={a.id}
                    href={`/applications/${a.id}`}
                    className="flex items-center justify-between gap-3 rounded-lg border bg-card px-3 py-2.5 hover:border-primary/40"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={cn("size-2 rounded-full shrink-0", tone.dot)} />
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">
                          {a.company}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {a.position} · {STAGE_LABEL[a.stage as Stage]}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground shrink-0">
                      {fromNow(a.lastActionAt)}
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
            <Sparkles className="size-3.5" /> 快捷入口
          </h2>
          <div className="space-y-2">
            <QuickLink
              href="/applications"
              icon={<LayoutGrid className="size-4" />}
              title="看板"
              hint={`${ACTIVE_STAGES.length} 个阶段`}
            />
            <QuickLink
              href="/calendar"
              icon={<CalendarClock className="size-4" />}
              title="日历"
              hint="看 DDL 与面试"
            />
            <QuickLink
              href="/stats"
              icon={<Sparkles className="size-4" />}
              title="统计"
              hint="转化率 & 投递节奏"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function Panel({
  title,
  icon,
  isEmpty,
  emptyText,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  isEmpty?: boolean;
  emptyText?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border bg-card p-4 space-y-3">
      <div className="flex items-center gap-1.5 text-sm font-medium">
        {icon}
        {title}
      </div>
      {isEmpty ? (
        <div className="py-6 text-center text-xs text-muted-foreground">
          {emptyText}
        </div>
      ) : (
        <div className="space-y-2">{children}</div>
      )}
    </div>
  );
}

function QuickLink({
  href,
  icon,
  title,
  hint,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  hint?: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2.5 rounded-lg border bg-card px-3 py-2.5 hover:border-primary/40"
    >
      <div className="grid size-8 place-items-center rounded-lg bg-muted text-muted-foreground">
        {icon}
      </div>
      <div className="flex-1">
        <div className="text-sm font-medium">{title}</div>
        {hint && (
          <div className="text-xs text-muted-foreground">{hint}</div>
        )}
      </div>
      <ArrowRight className="size-3.5 text-muted-foreground" />
    </Link>
  );
}
