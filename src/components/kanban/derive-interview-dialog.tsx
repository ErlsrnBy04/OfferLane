"use client";

import { useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import type { z } from "zod";
import { interviewCreateSchema } from "@/lib/schemas";
import {
  FORMAT_OPTIONS,
  STAGE_LABEL,
  STAGE_TO_DEFAULT_ROUND,
  type InterviewStage,
} from "@/lib/stages";
import { updateStageWithInterview } from "@/actions/applications";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type FormValues = z.input<typeof interviewCreateSchema>;

export function DeriveInterviewDialog({
  open,
  onOpenChange,
  applicationId,
  toStage,
  existingRounds,
  onConfirmed,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  applicationId: string;
  toStage: InterviewStage;
  existingRounds: string[];
  onConfirmed: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const defaultRound = STAGE_TO_DEFAULT_ROUND[toStage];

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(interviewCreateSchema) as never,
    defaultValues: {
      applicationId,
      round: defaultRound,
      format: "VIDEO",
      occurredAt: new Date().toISOString().slice(0, 16) as unknown as Date,
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        applicationId,
        round: defaultRound,
        format: "VIDEO",
        occurredAt: new Date().toISOString().slice(0, 16) as unknown as Date,
      });
    }
  }, [open, applicationId, defaultRound, reset]);

  const watchedRound = watch("round");
  const hasDuplicate =
    !!watchedRound && existingRounds.includes(watchedRound.trim());

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      const { applicationId: _appId, ...interview } = values;
      const res = await updateStageWithInterview({
        id: applicationId,
        toStage,
        interview,
      });
      if (!res.ok) {
        toast.error(res.error ?? "保存失败");
        return;
      }
      toast.success(`已移动到「${STAGE_LABEL[toStage]}」并记录面试`);
      onConfirmed();
      onOpenChange(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>派生「{STAGE_LABEL[toStage]}」面试记录</DialogTitle>
          <DialogDescription>
            卡片将移动到「{STAGE_LABEL[toStage]}」列，并创建对应的面试条目。
          </DialogDescription>
        </DialogHeader>
        <form
          id="derive-interview-form"
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-3"
        >
          <input type="hidden" {...register("applicationId")} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Mini label="轮次" error={errors.round?.message}>
              <Input {...register("round")} />
              {hasDuplicate && (
                <p className="text-xs text-amber-600">
                  已有「{watchedRound}」记录，确认后会新增一条
                </p>
              )}
            </Mini>
            <Mini label="形式">
              <NativeSelect {...register("format")}>
                {FORMAT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </NativeSelect>
            </Mini>
            <Mini label="时间" error={errors.occurredAt?.message}>
              <Input type="datetime-local" {...register("occurredAt")} />
            </Mini>
            <Mini label="时长（分钟）">
              <Input type="number" {...register("durationMin")} />
            </Mini>
            <Mini label="面试官" className="sm:col-span-2">
              <Input placeholder="如：后端技术面" {...register("interviewer")} />
            </Mini>
          </div>
        </form>
        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={pending}
          >
            取消
          </Button>
          <Button
            type="submit"
            form="derive-interview-form"
            disabled={pending}
          >
            {pending ? "保存中..." : "确认"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Mini({
  label,
  error,
  className,
  children,
}: {
  label: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-1", className)}>
      <Label className="text-xs">{label}</Label>
      {children}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

function NativeSelect({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}
