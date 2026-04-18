import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] grid place-items-center p-6">
      <div className="text-center space-y-3">
        <div className="text-6xl">🧭</div>
        <h1 className="text-xl font-semibold">页面不存在</h1>
        <p className="text-sm text-muted-foreground">
          你访问的路径没有对应内容。
        </p>
        <Link
          href="/"
          className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          回到首页
        </Link>
      </div>
    </div>
  );
}
