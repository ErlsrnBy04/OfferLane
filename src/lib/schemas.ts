import { z } from "zod";
import { STAGE_ORDER } from "./stages";

const stageEnum = z.enum(STAGE_ORDER as unknown as [string, ...string[]]);
const levelEnum = z.enum(["INTERN", "NEW_GRAD", "SOCIAL"]);
const channelEnum = z.enum(["REFERRAL", "OFFICIAL", "PLATFORM", "HEADHUNTER"]);
const formatEnum = z.enum(["PHONE", "VIDEO", "ONSITE"]);

const optionalString = z
  .string()
  .trim()
  .max(2000)
  .optional()
  .or(z.literal("").transform(() => undefined));

const optionalShort = z
  .string()
  .trim()
  .max(200)
  .optional()
  .or(z.literal("").transform(() => undefined));

export const applicationCreateSchema = z.object({
  company: z.string().trim().min(1, "公司名必填").max(100),
  position: z.string().trim().min(1, "岗位必填").max(100),
  level: levelEnum,
  city: optionalShort,
  channel: channelEnum.optional().or(z.literal("").transform(() => undefined)),
  channelDetail: optionalShort,
  stage: stageEnum.default("APPLIED"),
  salaryMin: z.coerce.number().int().min(0).max(999).optional().or(z.nan().transform(() => undefined)),
  salaryMax: z.coerce.number().int().min(0).max(999).optional().or(z.nan().transform(() => undefined)),
  jdSnapshot: optionalString,
  resumeVersion: optionalShort,
  notes: optionalString,
  appliedAt: z.coerce.date(),
  deadline: z.coerce.date().optional().or(z.literal("").transform(() => undefined)),
});

export const applicationUpdateSchema = applicationCreateSchema.partial();

export const updateStageSchema = z.object({
  id: z.string().min(1),
  toStage: stageEnum,
  note: optionalString,
});

export const interviewCreateSchema = z.object({
  applicationId: z.string().min(1),
  round: z.string().trim().min(1, "轮次必填").max(50),
  format: formatEnum,
  interviewer: optionalShort,
  durationMin: z.coerce.number().int().min(0).max(600).optional().or(z.nan().transform(() => undefined)),
  questions: optionalString,
  selfRating: z.coerce.number().int().min(1).max(5).optional().or(z.nan().transform(() => undefined)),
  mood: optionalShort,
  occurredAt: z.coerce.date(),
});

export const updateStageWithInterviewSchema = z.object({
  id: z.string().min(1),
  toStage: stageEnum,
  interview: interviewCreateSchema.omit({ applicationId: true }),
});

export type ApplicationCreateInput = z.infer<typeof applicationCreateSchema>;
export type ApplicationUpdateInput = z.infer<typeof applicationUpdateSchema>;
export type InterviewCreateInput = z.infer<typeof interviewCreateSchema>;
export type UpdateStageWithInterviewInput = z.infer<
  typeof updateStageWithInterviewSchema
>;
