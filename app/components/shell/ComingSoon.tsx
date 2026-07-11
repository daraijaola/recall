import Link from "next/link";
import { AppShell } from "@/components/shell/AppShell";
import { LANDING_URL } from "@/lib/constants";

interface ComingSoonProps {
  title: string;
  description: string;
}

export function ComingSoon({ title, description }: ComingSoonProps) {
  return (
    <AppShell>
      <div className="soon-page">
        <h1>{title}</h1>
        <p>{description}</p>
        <p className="muted">We&apos;re building pages one at a time. Dashboard is live — this is next.</p>
        <div className="btn-row">
          <Link href="/" className="btn primary">Back to Home</Link>
          <a href={LANDING_URL} className="btn ghost">About RECALL</a>
        </div>
      </div>
    </AppShell>
  );
}