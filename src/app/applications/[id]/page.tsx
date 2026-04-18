import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  ExternalLink,
  MapPin,
  Pencil,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import {
  STAGE_LABEL,
  STAGE_TONE,
  channelLabel,
  formatLabel,
  levelLabel,
  type Stage,
} from "@/lib/stages";
import {
  fmtDate,
  fmtDateTime,
  daysUntil,
  deadlineUrgency,
  urgencyClass,
} from "@/lib/date";
import { cn } from "@/lib/utils";
import { InterviewDebriefForm } from "@/components/forms/interview-debrief-form";
import { DeleteApplicationButton } from "@/components/delete-application-button";

export const dynamic = "force-dynamic";

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const app = await prisma.application.findUnique({
    where: { id },
    include: {
      events: { orderBy: { occurredAt: "desc" } },
      interviews: { orderBy: { occurredAt: "desc" } },
    },
  });
  if (!app) notFound();

  const tone = STAGE_TONE[app.stage as Stage];
  const urgency = deadlineUrgency(app.deadline);
  const days = daysUntil(app.deadline);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <Link
        href="/applications"
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3" /> 返回看板
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className={cn("size-2.5 rounded-full", tone.dot)} />
            <span className={cn("text-xs font-medium", tone.text)}>
              {STAGE_LABEL[app.stage as Stage]}
            </span>
            <span className="text-xs text-muted-foreground">·</span>
            <span className="text-xs text-muted-foreground">
              {levelLabel(app.level)}
            </span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {app.company}
          </h1>
          <p className="text-muted-foreground">{app.position}</p>
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground pt-1">
            {app.city && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3" />
                {app.city}
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <Calendar className="size-3" />
              投递于 {fmtDate(app.appliedAt)}
            </span>
            {app.deadline && urgency !== "none" && (
              <span
                className={cn(
                  "inline-flex items-center rounded border px-1.5 py-0.5",
                  urgencyClass(urgency),
                )}
              >
                DDL {fmtDateTime(app.deadline)}
                {days !== null &&
                  (days < 0
                    ? `（过期 ${-days} 天）`
                    : days === 0
                      ? "（今天）"
                      : `（${days} 天后）`)}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/applications/${app.id}/edit`}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-input bg-background px-3 text-sm font-medium hover:bg-muted"
          >
            <Pencil className="size-3.5" /> 编辑
          </Link>
          <DeleteApplicationButton id={app.id} />
        </div>
      </div>

      {/* Info grid */}
      <section className="rounded-xl border bg-card p-5">
        <h2 className="text-sm font-medium mb-4">基本信息</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-4 text-sm">
          <InfoItem label="渠道" value={channelLabel(app.channel)} />
          <InfoItem label="渠道明细" value={app.channelDetail ?? "—"} />
          <InfoItem label="简历版本" value={app.resumeVersion ?? "—"} />
          <InfoItem
            label="薪资区间"
            value={
              app.salaryMin || app.salaryMax
                ? `${app.salaryMin ?? "?"} - ${app.salaryMax ?? "?"} K`
                : "—"
            }
          />
          <InfoItem label="最近动作" value={fmtDateTime(app.lastActionAt)} />
          <InfoItem label="创建于" value={fmtDate(app.createdAt)} />
        </div>
        {app.notes && (
          <div className="mt-4 pt-4 border-t">
            <div className="text-xs text-muted-foreground mb-1.5">备注</div>
            <p className="text-sm whitespace-pre-wrap">{app.notes}</p>
          </div>
        )}
        {app.jdSnapshot && (
          <details className="mt-4 pt-4 border-t">
            <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground inline-flex items-center gap-1">
              <ExternalLink className="size-3" />
              JD 快照
            </summary>
            <pre className="mt-2 whitespace-pre-wrap text-sm bg-muted/50 rounded-lg p-3 max-h-80 overflow-auto">
              {app.jdSnapshot}
            </pre>
          </details>
        )}
      </section>

      {/* Timeline */}
      <section className="rounded-xl border bg-card p-5">
        <h2 className="text-sm font-medium mb-4">流转时间线</h2>
        <ol className="relative border-l border-border ml-2 space-y-4">
          {app.events.map((e) => (
            <li key={e.id} className="pl-4 relative">
              <span
                className={cn(
                  "absolute -left-[5px] top-1.5 size-2.5 rounded-full ring-4 ring-card",
                  STAGE_TONE[e.toStage as Stage].dot,
                )}
              />
              <div className="flex items-center gap-2 text-sm">
                {e.fromStage && (
                  <>
                    <span className="text-muted-foreground">
                      {STAGE_LABEL[e.fromStage as Stage]}
                    </span>
                    <span className="text-muted-foreground">→</span>
                  </>
                )}
                <span className="font-medium">
                  {STAGE_LABEL[e.toStage as Stage]}
                </span>
                <span className="text-xs text-muted-foreground">
                  · {fmtDateTime(e.occurredAt)}
                </span>
              </div>
              {e.note && (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {e.note}
                </p>
              )}
            </li>
          ))}
        </ol>
      </section>

      {/* Interviews */}
      <section className="rounded-xl border bg-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium">面试复盘</h2>
          <span className="text-xs text-muted-foreground">
            共 {app.interviews.length} 次
          </span>
        </div>
        {app.interviews.length > 0 && (
          <ul className="space-y-3">
            {app.interviews.map((iv) => (
              <li
                key={iv.id}
                className="rounded-lg bg-muted/40 p-3 text-sm space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{iv.round}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatLabel(iv.format)}
                    </span>
                    {iv.durationMin != null && (
                      <span className="text-xs text-muted-foreground">
                        · {iv.durationMin} 分钟
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {iv.selfRating != null && (
                      <span className="text-amber-500">
                        {"★".repeat(iv.selfRating)}
                        {"☆".repeat(Math.max(0, 5 - iv.selfRating))}
                      </span>
                    )}
                    <span>{fmtDateTime(iv.occurredAt)}</span>
                  </div>
                </div>
                {iv.interviewer && (
                  <div className="text-xs text-muted-foreground">
                    面试官：{iv.interviewer}
                  </div>
                )}
                {iv.questions && (
                  <div className="text-sm whitespace-pre-wrap">
                    {iv.questions}
                  </div>
                )}
                {iv.mood && (
                  <div className="text-xs text-muted-foreground">
                    情绪：{iv.mood}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
        <InterviewDebriefForm applicationId={app.id} />
      </section>
    </div>
  );
}

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-xs text-muted-foreground mb-0.5">{label}</div>
      <div className="text-sm">{value}</div>
    </div>
  );
}
