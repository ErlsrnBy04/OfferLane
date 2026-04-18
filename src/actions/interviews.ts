"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { interviewCreateSchema } from "@/lib/schemas";

export async function createInterview(input: unknown) {
  const parsed = interviewCreateSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false as const,
      errors: parsed.error.flatten().fieldErrors,
    };
  }
  const data = parsed.data;
  const created = await prisma.interview.create({
    data: {
      applicationId: data.applicationId,
      round: data.round,
      format: data.format,
      interviewer: data.interviewer ?? null,
      durationMin: data.durationMin ?? null,
      questions: data.questions ?? null,
      selfRating: data.selfRating ?? null,
      mood: data.mood ?? null,
      occurredAt: data.occurredAt,
    },
  });
  await prisma.application.update({
    where: { id: data.applicationId },
    data: { lastActionAt: new Date() },
  });
  revalidatePath(`/applications/${data.applicationId}`);
  revalidatePath("/applications");
  revalidatePath("/calendar");
  return { ok: true as const, id: created.id };
}

export async function deleteInterview(id: string, applicationId: string) {
  await prisma.interview.delete({ where: { id } });
  revalidatePath(`/applications/${applicationId}`);
  return { ok: true as const };
}
