"use client";

import { useMemo, useState, useTransition } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  useDroppable,
  useDraggable,
} from "@dnd-kit/core";
import { toast } from "sonner";
import Link from "next/link";
import {
  ACTIVE_STAGES,
  STAGE_LABEL,
  STAGE_ORDER,
  STAGE_TONE,
  isInterviewStage,
  levelLabel,
  type InterviewStage,
  type Stage,
} from "@/lib/stages";
import { daysUntil, deadlineUrgency, fmtDate, fromNow, urgencyClass } from "@/lib/date";
import { cn } from "@/lib/utils";
import { updateStage } from "@/actions/applications";
import { DeriveInterviewDialog } from "@/components/kanban/derive-interview-dialog";
import { Clock, MapPin, GripVertical } from "lucide-react";

export type KanbanApplication = {
  id: string;
  company: string;
  position: string;
  level: string;
  city: string | null;
  stage: string;
  deadline: Date | null;
  lastActionAt: Date;
  interviewRounds: string[];
};

export function KanbanBoard({
  applications,
  showRejected = false,
}: {
  applications: KanbanApplication[];
  showRejected?: boolean;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );
  const [items, setItems] = useState(applications);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const [pendingMove, setPendingMove] = useState<{
    id: string;
    toStage: InterviewStage;
    existingRounds: string[];
  } | null>(null);

  const stages = (showRejected ? STAGE_ORDER : ACTIVE_STAGES) as Stage[];

  const grouped = useMemo(() => {
    const g: Record<Stage, KanbanApplication[]> = {} as Record<Stage, KanbanApplication[]>;
    for (const s of stages) g[s] = [];
    for (const app of items) {
      const s = app.stage as Stage;
      if (g[s]) g[s].push(app);
    }
    return g;
  }, [items, stages]);

  const activeApp = activeId ? items.find((a) => a.id === activeId) : null;

  function onDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  function onDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;
    const id = String(active.id);
    const toStage = String(over.id) as Stage;
    const prev = items.find((a) => a.id === id);
    if (!prev || prev.stage === toStage) return;

    if (isInterviewStage(toStage)) {
      setPendingMove({
        id,
        toStage,
        existingRounds: prev.interviewRounds,
      });
      return;
    }

    // 乐观更新
    const snapshot = items;
    setItems((list) =>
      list.map((a) => (a.id === id ? { ...a, stage: toStage } : a)),
    );

    startTransition(async () => {
      const res = await updateStage({ id, toStage });
      if (!res.ok) {
        setItems(snapshot);
        toast.error(("error" in res && res.error) || "更新失败");
      } else {
        toast.success(`已移动到「${STAGE_LABEL[toStage]}」`);
      }
    });
  }

  return (
    <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-3 min-w-fit">
          {stages.map((stage) => (
            <KanbanColumn
              key={stage}
              stage={stage}
              apps={grouped[stage]}
            />
          ))}
        </div>
      </div>
      <DragOverlay>
        {activeApp ? (
          <div className="rotate-2 shadow-lg">
            <ApplicationCard app={activeApp} isOverlay />
          </div>
        ) : null}
      </DragOverlay>
      {pendingMove && (
        <DeriveInterviewDialog
          open
          onOpenChange={(o) => {
            if (!o) setPendingMove(null);
          }}
          applicationId={pendingMove.id}
          toStage={pendingMove.toStage}
          existingRounds={pendingMove.existingRounds}
          onConfirmed={() => {
            const { id, toStage } = pendingMove;
            setItems((list) =>
              list.map((a) =>
                a.id === id
                  ? {
                      ...a,
                      stage: toStage,
                      interviewRounds: [...a.interviewRounds],
                    }
                  : a,
              ),
            );
          }}
        />
      )}
    </DndContext>
  );
}

function KanbanColumn({
  stage,
  apps,
}: {
  stage: Stage;
  apps: KanbanApplication[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  const tone = STAGE_TONE[stage];
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex w-72 shrink-0 flex-col rounded-xl bg-background/70 ring-1 ring-border",
        isOver && "ring-2 ring-primary/50 bg-primary/5",
      )}
    >
      <div className="flex items-center justify-between px-3 py-2.5 border-b">
        <div className="flex items-center gap-2">
          <span className={cn("size-2 rounded-full", tone.dot)} />
          <span className="text-sm font-medium">{STAGE_LABEL[stage]}</span>
        </div>
        <span className="text-xs text-muted-foreground tabular-nums">
          {apps.length}
        </span>
      </div>
      <div className="flex flex-col gap-2 p-2 min-h-24">
        {apps.map((a) => (
          <ApplicationCard key={a.id} app={a} />
        ))}
        {apps.length === 0 && (
          <div className="py-6 text-center text-xs text-muted-foreground/70">
            暂无
          </div>
        )}
      </div>
    </div>
  );
}

function ApplicationCard({
  app,
  isOverlay = false,
}: {
  app: KanbanApplication;
  isOverlay?: boolean;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: app.id,
    disabled: isOverlay,
  });
  const urgency = deadlineUrgency(app.deadline);
  const days = daysUntil(app.deadline);
  const tone = STAGE_TONE[app.stage as Stage];

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={cn(
        "group relative rounded-lg bg-card border border-border/80 ring-1 ring-transparent shadow-xs hover:border-primary/30 hover:ring-primary/20 transition-all cursor-grab active:cursor-grabbing touch-none",
        isDragging && "opacity-30",
      )}
    >
      <div
        className={cn(
          "absolute inset-y-2 left-0 w-1 rounded-r-sm",
          tone.dot,
        )}
      />
      <div className="flex items-start gap-1 pl-3 pr-2 py-2.5">
        <GripVertical
          className="mt-0.5 size-3.5 shrink-0 text-muted-foreground/40 group-hover:text-muted-foreground/70"
          aria-hidden
        />
        <Link
          href={`/applications/${app.id}`}
          className="flex-1 min-w-0 space-y-1"
        >
          <div className="flex items-start justify-between gap-1.5">
            <div className="text-sm font-medium leading-tight truncate">
              {app.company}
            </div>
            <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
              {levelLabel(app.level)}
            </span>
          </div>
          <div className="text-xs text-muted-foreground truncate">
            {app.position}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            {app.city && (
              <span className="flex items-center gap-0.5">
                <MapPin className="size-3" />
                {app.city}
              </span>
            )}
            <span className="flex items-center gap-0.5">
              <Clock className="size-3" />
              {fromNow(app.lastActionAt)}
            </span>
          </div>
          {app.deadline && urgency !== "none" && (
            <div
              className={cn(
                "mt-1 inline-flex items-center rounded border px-1.5 py-0.5 text-[10px]",
                urgencyClass(urgency),
              )}
            >
              {days !== null && days < 0
                ? `已过期 ${-days} 天`
                : days === 0
                  ? `今天截止 · ${fmtDate(app.deadline, "HH:mm")}`
                  : `${days} 天后截止`}
            </div>
          )}
        </Link>
      </div>
    </div>
  );
}
