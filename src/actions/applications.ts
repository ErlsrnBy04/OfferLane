"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  applicationCreateSchema,
  applicationUpdateSchema,
  updateStageSchema,
  updateStageWithInterviewSchema,
} from "@/lib/schemas";
import { isInterviewStage, type Stage } from "@/lib/stages";

function revalidateAll() {
  revalidatePath("/");
  revalidatePath("/applications");
  revalidatePath("/calendar");
  revalidatePath("/stats");
}

export async function createApplication(input: unknown) {
  const parsed = applicationCreateSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false as const,
      errors: parsed.error.flatten().fieldErrors,
    };
  }
  const data = parsed.data;
  const created = await prisma.application.create({
    data: {
      company: data.company,
      position: data.position,
      level: data.level,
      city: data.city ?? null,
      channel: data.channel ?? null,
      channelDetail: data.channelDetail ?? null,
      stage: data.stage,
      salaryMin: data.salaryMin ?? null,
      salaryMax: data.salaryMax ?? null,
      jdSnapshot: data.jdSnapshot ?? null,
      resumeVersion: data.resumeVersion ?? null,
      notes: data.notes ?? null,
      appliedAt: data.appliedAt,
      deadline: data.deadline ?? null,
      lastActionAt: new Date(),
      events: {
        create: {
          fromStage: null,
          toStage: data.stage,
          occurredAt: data.appliedAt,
          note: "创建申请",
        },
      },
    },
  });
  revalidateAll();
  return { ok: true as const, id: created.id };
}

export async function updateApplication(id: string, input: unknown) {
  const parsed = applicationUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false as const,
      errors: parsed.error.flatten().fieldErrors,
    };
  }
  await prisma.application.update({
    where: { id },
    data: {
      ...parsed.data,
      lastActionAt: new Date(),
    },
  });
  revalidateAll();
  revalidatePath(`/applications/${id}`);
  return { ok: true as const };
}

export async function deleteApplication(id: string) {
  await prisma.application.delete({ where: { id } });
  revalidateAll();
  return { ok: true as const };
}

export async function updateStage(input: unknown) {
  const parsed = updateStageSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: "参数校验失败" };
  }
  const { id, toStage, note } = parsed.data;
  const current = await prisma.application.findUnique({
    where: { id },
    select: { stage: true },
  });
  if (!current) return { ok: false as const, error: "申请不存在" };
  if (current.stage === toStage) return { ok: true as const };

  await prisma.$transaction([
    prisma.application.update({
      where: { id },
      data: { stage: toStage, lastActionAt: new Date() },
    }),
    prisma.stageEvent.create({
      data: {
        applicationId: id,
        fromStage: current.stage,
        toStage,
        note: note ?? null,
      },
    }),
  ]);
  revalidateAll();
  revalidatePath(`/applications/${id}`);
  return { ok: true as const, fromStage: current.stage as Stage };
}

export async function updateStageWithInterview(input: unknown) {
  const parsed = updateStageWithInterviewSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: "参数校验失败" };
  }
  const { id, toStage, interview } = parsed.data;
  if (!isInterviewStage(toStage as Stage)) {
    return { ok: false as const, error: "此操作仅适用于面试阶段" };
  }

  const current = await prisma.application.findUnique({
    where: { id },
    select: { stage: true },
  });
  if (!current) return { ok: false as const, error: "申请不存在" };

  const needsStageChange = current.stage !== toStage;
  const now = new Date();

  const created = await prisma.$transaction(async (tx) => {
    if (needsStageChange) {
      await tx.application.update({
        where: { id },
        data: { stage: toStage, lastActionAt: now },
      });
      await tx.stageEvent.create({
        data: {
          applicationId: id,
          fromStage: current.stage,
          toStage,
          note: `派生「${interview.round}」`,
        },
      });
    } else {
      await tx.application.update({
        where: { id },
        data: { lastActionAt: now },
      });
    }
    return tx.interview.create({
      data: {
        applicationId: id,
        round: interview.round,
        format: interview.format,
        interviewer: interview.interviewer ?? null,
        durationMin: interview.durationMin ?? null,
        questions: interview.questions ?? null,
        selfRating: interview.selfRating ?? null,
        mood: interview.mood ?? null,
        occurredAt: interview.occurredAt,
      },
      select: { id: true },
    });
  });

  revalidateAll();
  revalidatePath(`/applications/${id}`);
  return { ok: true as const, interviewId: created.id };
}
