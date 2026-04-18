import { prisma } from "@/lib/prisma";
import { KanbanBoard, type KanbanApplication } from "@/components/kanban/kanban-board";
import Link from "next/link";
import { Plus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ showRejected?: string }>;
}) {
  const { showRejected: showRejectedParam } = await searchParams;
  const showRejected = showRejectedParam === "1";

  const apps = await prisma.application.findMany({
    orderBy: [{ lastActionAt: "desc" }],
    select: {
      id: true,
      company: true,
      position: true,
      level: true,
      city: true,
      stage: true,
      deadline: true,
      lastActionAt: true,
      interviews: { select: { round: true } },
    },
  });

  const data: KanbanApplication[] = apps.map((a) => ({
    id: a.id,
    company: a.company,
    position: a.position,
    level: a.level,
    city: a.city,
    stage: a.stage,
    deadline: a.deadline,
    lastActionAt: a.lastActionAt,
    interviewRounds: a.interviews.map((i) => i.round),
  }));

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">申请看板</h1>
          <p className="text-sm text-muted-foreground">
            拖动卡片即可改变阶段 · 共 {apps.length} 个申请
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={
              showRejected ? "/applications" : "/applications?showRejected=1"
            }
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            {showRejected ? "隐藏已挂" : "显示已挂"}
          </Link>
          <Link
            href="/applications/new"
            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="size-4" /> 新建
          </Link>
        </div>
      </div>

      {apps.length === 0 ? (
        <EmptyState />
      ) : (
        <KanbanBoard applications={data} showRejected={showRejected} />
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-dashed py-20 text-center">
      <div className="text-5xl mb-3">📋</div>
      <p className="text-sm text-muted-foreground mb-4">
        还没有任何申请，新建第一条开始记录吧
      </p>
      <Link
        href="/applications/new"
        className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        <Plus className="size-4" /> 新建申请
      </Link>
    </div>
  );
}
