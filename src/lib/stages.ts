export const STAGE_ORDER = [
  "APPLIED",
  "SCREENING",
  "OA",
  "INTERVIEW_1",
  "INTERVIEW_2",
  "INTERVIEW_HR",
  "OFFER",
  "REJECTED",
] as const;

export type Stage = (typeof STAGE_ORDER)[number];

export const STAGE_LABEL: Record<Stage, string> = {
  APPLIED: "已投递",
  SCREENING: "简历筛选",
  OA: "笔试/OA",
  INTERVIEW_1: "一面",
  INTERVIEW_2: "二面",
  INTERVIEW_HR: "HR 面",
  OFFER: "Offer",
  REJECTED: "已挂",
};

// 用 Tailwind 语义色：看板列头的 accent 条 + 卡片左边框
export const STAGE_TONE: Record<
  Stage,
  { dot: string; ring: string; text: string }
> = {
  APPLIED: { dot: "bg-slate-400", ring: "ring-slate-200", text: "text-slate-600" },
  SCREENING: { dot: "bg-sky-400", ring: "ring-sky-200", text: "text-sky-600" },
  OA: { dot: "bg-violet-400", ring: "ring-violet-200", text: "text-violet-600" },
  INTERVIEW_1: { dot: "bg-amber-400", ring: "ring-amber-200", text: "text-amber-600" },
  INTERVIEW_2: { dot: "bg-orange-400", ring: "ring-orange-200", text: "text-orange-600" },
  INTERVIEW_HR: { dot: "bg-pink-400", ring: "ring-pink-200", text: "text-pink-600" },
  OFFER: { dot: "bg-emerald-500", ring: "ring-emerald-200", text: "text-emerald-600" },
  REJECTED: { dot: "bg-zinc-400", ring: "ring-zinc-200", text: "text-zinc-500" },
};

export const ACTIVE_STAGES: Stage[] = STAGE_ORDER.filter(
  (s) => s !== "REJECTED",
) as Stage[];

export const INTERVIEW_STAGES = [
  "INTERVIEW_1",
  "INTERVIEW_2",
  "INTERVIEW_HR",
] as const satisfies readonly Stage[];

export type InterviewStage = (typeof INTERVIEW_STAGES)[number];

export function isInterviewStage(s: Stage): s is InterviewStage {
  return (INTERVIEW_STAGES as readonly Stage[]).includes(s);
}

export const STAGE_TO_DEFAULT_ROUND: Record<InterviewStage, string> = {
  INTERVIEW_1: STAGE_LABEL.INTERVIEW_1,
  INTERVIEW_2: STAGE_LABEL.INTERVIEW_2,
  INTERVIEW_HR: STAGE_LABEL.INTERVIEW_HR,
};

export const LEVEL_OPTIONS = [
  { value: "INTERN", label: "实习" },
  { value: "NEW_GRAD", label: "校招" },
  { value: "SOCIAL", label: "社招" },
] as const;
export type Level = (typeof LEVEL_OPTIONS)[number]["value"];

export const CHANNEL_OPTIONS = [
  { value: "REFERRAL", label: "内推" },
  { value: "OFFICIAL", label: "官网" },
  { value: "PLATFORM", label: "招聘平台" },
  { value: "HEADHUNTER", label: "猎头" },
] as const;
export type Channel = (typeof CHANNEL_OPTIONS)[number]["value"];

export const FORMAT_OPTIONS = [
  { value: "PHONE", label: "电话" },
  { value: "VIDEO", label: "视频" },
  { value: "ONSITE", label: "现场" },
] as const;
export type Format = (typeof FORMAT_OPTIONS)[number]["value"];

export function levelLabel(v?: string | null) {
  return LEVEL_OPTIONS.find((o) => o.value === v)?.label ?? v ?? "";
}
export function channelLabel(v?: string | null) {
  return CHANNEL_OPTIONS.find((o) => o.value === v)?.label ?? v ?? "";
}
export function formatLabel(v?: string | null) {
  return FORMAT_OPTIONS.find((o) => o.value === v)?.label ?? v ?? "";
}
