import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { ApplicationForm } from "@/components/forms/application-form";

export const dynamic = "force-dynamic";

export default async function EditApplicationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const app = await prisma.application.findUnique({ where: { id } });
  if (!app) notFound();

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Link
        href={`/applications/${id}`}
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-3"
      >
        <ArrowLeft className="size-3" /> 返回详情
      </Link>
      <h1 className="text-2xl font-semibold tracking-tight mb-1">编辑申请</h1>
      <p className="text-sm text-muted-foreground mb-6">{app.company} · {app.position}</p>
      <ApplicationForm mode="edit" initial={app} />
    </div>
  );
}
