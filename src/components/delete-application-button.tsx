"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { deleteApplication } from "@/actions/applications";

export function DeleteApplicationButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onClick() {
    if (!confirm("确定删除这条申请？所有流转记录和面试复盘都会一并删除。")) {
      return;
    }
    startTransition(async () => {
      const res = await deleteApplication(id);
      if (res.ok) {
        toast.success("已删除");
        router.push("/applications");
        router.refresh();
      } else {
        toast.error("删除失败");
      }
    });
  }

  return (
    <Button variant="destructive" size="sm" onClick={onClick} disabled={pending}>
      <Trash2 className="size-3.5" />
      删除
    </Button>
  );
}
