import { format, formatDistanceToNowStrict, differenceInCalendarDays } from "date-fns";
import { zhCN } from "date-fns/locale";

export function fmtDate(d: Date | string | null | undefined, pattern = "yyyy-MM-dd") {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  return format(date, pattern, { locale: zhCN });
}

export function fmtDateTime(d: Date | string | null | undefined) {
  return fmtDate(d, "yyyy-MM-dd HH:mm");
}

export function fromNow(d: Date | string | null | undefined) {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  return formatDistanceToNowStrict(date, { locale: zhCN, addSuffix: true });
}

/** 剩余天数（负数表示过期）；无日期返回 null */
export function daysUntil(d: Date | string | null | undefined): number | null {
  if (!d) return null;
  const date = typeof d === "string" ? new Date(d) : d;
  return differenceInCalendarDays(date, new Date());
}

export type DeadlineUrgency = "overdue" | "urgent" | "soon" | "normal" | "none";

export function deadlineUrgency(d: Date | string | null | undefined): DeadlineUrgency {
  const days = daysUntil(d);
  if (days === null) return "none";
  if (days < 0) return "overdue";
  if (days <= 1) return "urgent";
  if (days <= 3) return "soon";
  return "normal";
}

export function urgencyClass(u: DeadlineUrgency): string {
  switch (u) {
    case "overdue":
      return "text-red-600 bg-red-50 border-red-200";
    case "urgent":
      return "text-red-600 bg-red-50 border-red-200";
    case "soon":
      return "text-amber-600 bg-amber-50 border-amber-200";
    case "normal":
      return "text-slate-600 bg-slate-50 border-slate-200";
    default:
      return "text-slate-400";
  }
}
