"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { interviewCreateSchema } from "@/lib/schemas";
import { FORMAT_OPTIONS } from "@/lib/stages";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { createInterview } from "@/actions/interviews";
import { cn } from "@/lib/utils";
import type { z } from "zod";

type FormValues = z.input<typeof interviewCreateSchema>;

export function InterviewDebriefForm({
  applicationId,
}: {
  applicationId: string;
}) {
  const [pending, startTransition] = useTransition();
  const [expanded, setExpanded] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(interviewCreateSchema) as never,
    defaultValues: {
      applicationId,
      round: "一面",
      format: "VIDEO",
      occurredAt: new Date().toISOString().slice(0, 16) as unknown as Date,
    },
  });

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      const res = await createInterview(values);
      if (!res.ok) {
        toast.error("保存失败");
        return;
      }
      toast.success("复盘已记录");
      reset({
        applicationId,
        round: "一面",
        format: "VIDEO",
        occurredAt: new Date().toISOString().slice(0, 16) as unknown as Date,
      });
      setExpanded(false);
    });
  }

  if (!expanded) {
    return (
      <Button variant="outline" size="sm" onClick={() => setExpanded(true)}>
        + 新增面试复盘
      </Button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-3 rounded-xl border bg-card p-4"
    >
      <input type="hidden" {...register("applicationId")} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Mini label="轮次" error={errors.round?.message}>
          <Input placeholder="一面/二面/HR面" {...register("round")} />
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
        <Mini label="时间">
          <Input type="datetime-local" {...register("occurredAt")} />
        </Mini>
        <Mini label="时长（分钟）">
          <Input type="number" {...register("durationMin")} />
        </Mini>
        <Mini label="面试官">
          <Input placeholder="如：后端技术面" {...register("interviewer")} />
        </Mini>
        <Mini label="自评 (1-5)">
          <Input type="number" min={1} max={5} {...register("selfRating")} />
        </Mini>
      </div>
      <Mini label="被问到的问题">
        <Textarea rows={4} placeholder="每行一个，或任意格式" {...register("questions")} />
      </Mini>
      <Mini label="情绪/感受">
        <Input placeholder="紧张/发挥正常/被拷打..." {...register("mood")} />
      </Mini>
      <div className="flex items-center gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "保存中..." : "保存复盘"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => setExpanded(false)}
        >
          取消
        </Button>
      </div>
    </form>
  );
}

function Mini({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
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
