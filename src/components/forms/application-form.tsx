"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { applicationCreateSchema } from "@/lib/schemas";
import {
  CHANNEL_OPTIONS,
  LEVEL_OPTIONS,
  STAGE_LABEL,
  STAGE_ORDER,
} from "@/lib/stages";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  createApplication,
  updateApplication,
} from "@/actions/applications";
import { cn } from "@/lib/utils";
import type { z } from "zod";

type FormValues = z.input<typeof applicationCreateSchema>;

function toDateInputValue(d?: Date | null) {
  if (!d) return "";
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function toDateTimeInputValue(d?: Date | null) {
  if (!d) return "";
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function ApplicationForm({
  mode,
  initial,
}: {
  mode: "create" | "edit";
  initial?: {
    id: string;
    company: string;
    position: string;
    level: string;
    city: string | null;
    channel: string | null;
    channelDetail: string | null;
    stage: string;
    salaryMin: number | null;
    salaryMax: number | null;
    jdSnapshot: string | null;
    resumeVersion: string | null;
    notes: string | null;
    appliedAt: Date;
    deadline: Date | null;
  };
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(applicationCreateSchema) as never,
    defaultValues: initial
      ? {
          company: initial.company,
          position: initial.position,
          level: initial.level as FormValues["level"],
          city: initial.city ?? "",
          channel: (initial.channel ?? "") as FormValues["channel"],
          channelDetail: initial.channelDetail ?? "",
          stage: initial.stage as FormValues["stage"],
          salaryMin: initial.salaryMin ?? undefined,
          salaryMax: initial.salaryMax ?? undefined,
          jdSnapshot: initial.jdSnapshot ?? "",
          resumeVersion: initial.resumeVersion ?? "",
          notes: initial.notes ?? "",
          appliedAt: toDateInputValue(initial.appliedAt) as unknown as Date,
          deadline: toDateTimeInputValue(initial.deadline) as unknown as Date,
        }
      : {
          stage: "APPLIED" as FormValues["stage"],
          level: "INTERN" as FormValues["level"],
          appliedAt: toDateInputValue(new Date()) as unknown as Date,
        },
  });

  async function onSubmit(values: FormValues) {
    setServerError(null);
    startTransition(async () => {
      const res =
        mode === "create"
          ? await createApplication(values)
          : await updateApplication(initial!.id, values);
      if (!res.ok) {
        setServerError("保存失败，请检查字段");
        toast.error("保存失败");
        return;
      }
      toast.success(mode === "create" ? "已创建" : "已保存");
      if (mode === "create" && "id" in res) {
        router.push(`/applications/${res.id}`);
      } else {
        router.refresh();
        router.push(`/applications/${initial!.id}`);
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="max-w-3xl space-y-5"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="公司" required error={errors.company?.message}>
          <Input placeholder="如：字节跳动" {...register("company")} />
        </Field>
        <Field label="岗位" required error={errors.position?.message}>
          <Input placeholder="如：后端工程师（实习）" {...register("position")} />
        </Field>
        <Field label="职级" required error={errors.level?.message}>
          <NativeSelect {...register("level")}>
            {LEVEL_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field label="当前阶段">
          <NativeSelect {...register("stage")}>
            {STAGE_ORDER.map((s) => (
              <option key={s} value={s}>
                {STAGE_LABEL[s]}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field label="城市">
          <Input placeholder="如：北京" {...register("city")} />
        </Field>
        <Field label="投递渠道">
          <NativeSelect {...register("channel")}>
            <option value="">（未填）</option>
            {CHANNEL_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field label="渠道明细" hint="内推人名字 / 平台名 / 猎头">
          <Input {...register("channelDetail")} />
        </Field>
        <Field label="简历版本" hint="如 v3-后端.pdf">
          <Input {...register("resumeVersion")} />
        </Field>
        <Field label="薪资下限 (K)">
          <Input type="number" inputMode="numeric" {...register("salaryMin")} />
        </Field>
        <Field label="薪资上限 (K)">
          <Input type="number" inputMode="numeric" {...register("salaryMax")} />
        </Field>
        <Field label="投递日" required error={errors.appliedAt?.message as string | undefined}>
          <Input type="date" {...register("appliedAt")} />
        </Field>
        <Field label="截止时间 (DDL)" hint="笔试/面试/Offer 答复截止">
          <Input type="datetime-local" {...register("deadline")} />
        </Field>
      </div>

      <Field label="JD 快照" hint="粘贴 JD 文本，防止网页下架">
        <Textarea rows={4} {...register("jdSnapshot")} />
      </Field>
      <Field label="备注">
        <Textarea rows={3} {...register("notes")} />
      </Field>

      {serverError && (
        <div className="text-sm text-red-600">{serverError}</div>
      )}

      <div className="flex items-center gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "保存中..." : mode === "create" ? "创建" : "保存"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.back()}
        >
          取消
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  required,
  hint,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="flex items-center gap-1 text-xs">
        {label}
        {required && <span className="text-red-500">*</span>}
        {hint && (
          <span className="text-muted-foreground font-normal">· {hint}</span>
        )}
      </Label>
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
        "flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}
