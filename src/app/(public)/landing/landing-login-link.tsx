"use client";

import Link, { useLinkStatus } from "next/link";

function LoginLabel() {
  const { pending } = useLinkStatus();

  return <span aria-live="polite">{pending ? "확인 중…" : "로그인"}</span>;
}

export function LandingLoginLink({ className }: { className?: string }) {
  return (
    <Link className={className} href="/chat" prefetch={false}>
      <LoginLabel />
    </Link>
  );
}
