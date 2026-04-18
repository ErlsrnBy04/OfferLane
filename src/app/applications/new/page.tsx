import { ApplicationForm } from "@/components/forms/application-form";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NewApplicationPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Link
        href="/applications"
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-3"
      >
        <ArrowLeft className="size-3" /> 返回看板
      </Link>
      <h1 className="text-2xl font-semibold tracking-tight mb-1">新建申请</h1>
      <p className="text-sm text-muted-foreground mb-6">
        记录一次投递，后续可在看板上跟踪进度
      </p>
      <ApplicationForm mode="create" />
    </div>
  );
}
