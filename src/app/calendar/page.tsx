import Link from "next/link";
import {
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { zhCN } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { STAGE_TONE, type Stage } from "@/lib/stages";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Item =
  | { kind: "deadline"; appId: string; title: string; stage: Stage }
  | { kind: "interview"; appId: string; title: string; round: string };

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ m?: string }>;
}) {
  const { m } = await searchParams;
  const today = new Date();
  const cursor = m
    ? new Date(`${m}-01T00:00:00`)
    : new Date(today.getFullYear(), today.getMonth(), 1);

  const monthStart = startOfMonth(cursor);
  const monthEnd = endOfMonth(cursor);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const [appsWithDdl, interviews] = await Promise.all([
    prisma.application.findMany({
      where: {
        deadline: { gte: gridStart, lte: gridEnd },
      },
      select: {
        id: true,
        company: true,
        position: true,
        stage: true,
        deadline: true,
      },
    }),
    prisma.interview.findMany({
      where: {
        occurredAt: { gte: gridStart, lte: gridEnd },
      },
      select: {
        id: true,
        round: true,
        occurredAt: true,
        application: { select: { id: true, company: true } },
      },
    }),
  ]);

  const byDay = new Map<string, Item[]>();
  const keyOf = (d: Date) => format(d, "yyyy-MM-dd");

  for (const a of appsWithDdl) {
    if (!a.deadline) continue;
    const k = keyOf(a.deadline);
    const list = byDay.get(k) ?? [];
    list.push({
      kind: "deadline",
      appId: a.id,
      title: `${a.company} · ${a.position}`,
      stage: a.stage as Stage,
    });
    byDay.set(k, list);
  }
  for (const iv of interviews) {
    const k = keyOf(iv.occurredAt);
    const list = byDay.get(k) ?? [];
    list.push({
      kind: "interview",
      appId: iv.application.id,
      title: iv.application.company,
      round: iv.round,
    });
    byDay.set(k, list);
  }

  const days: Date[] = [];
  for (let d = new Date(gridStart); d <= gridEnd; d.setDate(d.getDate() + 1)) {
    days.push(new Date(d));
  }

  const prevMonth = format(addMonths(cursor, -1), "yyyy-MM");
  const nextMonth = format(addMonths(cursor, 1), "yyyy-MM");

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">日历</h1>
          <p className="text-sm text-muted-foreground">
            DDL 与面试时间一览
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Link
            href={`/calendar?m=${prevMonth}`}
            className="inline-flex size-8 items-center justify-center rounded-lg border hover:bg-muted"
          >
            <ChevronLeft className="size-4" />
          </Link>
          <div className="min-w-28 text-center text-sm font-medium">
            {format(cursor, "yyyy 年 M 月", { locale: zhCN })}
          </div>
          <Link
            href={`/calendar?m=${nextMonth}`}
            className="inline-flex size-8 items-center justify-center rounded-lg border hover:bg-muted"
          >
            <ChevronRight className="size-4" />
          </Link>
        </div>
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="grid grid-cols-7 bg-muted/40 text-xs text-muted-foreground">
          {["一", "二", "三", "四", "五", "六", "日"].map((w) => (
            <div key={w} className="px-3 py-2 text-center">
              周{w}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 border-t">
          {days.map((d) => {
            const key = keyOf(d);
            const items = byDay.get(key) ?? [];
            const outside = !isSameMonth(d, cursor);
            const isToday = isSameDay(d, today);
            return (
              <div
                key={key}
                className={cn(
                  "min-h-28 border-r border-b p-1.5 text-xs",
                  outside && "bg-muted/20 text-muted-foreground/50",
                )}
              >
                <div
                  className={cn(
                    "mb-1 inline-flex size-5 items-center justify-center rounded-full text-[11px]",
                    isToday && "bg-primary text-primary-foreground font-medium",
                  )}
                >
                  {d.getDate()}
                </div>
                <div className="space-y-0.5">
                  {items.slice(0, 3).map((it, i) => (
                    <Link
                      key={i}
                      href={`/applications/${it.appId}`}
                      className="block"
                    >
                      {it.kind === "deadline" ? (
                        <div
                          className={cn(
                            "rounded bg-red-50 text-red-700 border border-red-200 px-1 py-0.5 truncate hover:bg-red-100",
                          )}
                          title={`DDL: ${it.title}`}
                        >
                          DDL · {it.title}
                        </div>
                      ) : (
                        <div
                          className="rounded bg-amber-50 text-amber-700 border border-amber-200 px-1 py-0.5 truncate hover:bg-amber-100"
                          title={`${it.round}: ${it.title}`}
                        >
                          {it.round} · {it.title}
                        </div>
                      )}
                    </Link>
                  ))}
                  {items.length > 3 && (
                    <div className="text-[10px] text-muted-foreground px-1">
                      +{items.length - 3} 更多
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Legend />
    </div>
  );
}

function Legend() {
  return (
    <div className="flex items-center gap-4 text-xs text-muted-foreground">
      <span className="inline-flex items-center gap-1.5">
        <span className="size-2.5 rounded bg-red-400" />
        DDL
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="size-2.5 rounded bg-amber-400" />
        面试
      </span>
    </div>
  );
}

// Silence unused import warning for STAGE_TONE if tree-shake complains
void STAGE_TONE;
