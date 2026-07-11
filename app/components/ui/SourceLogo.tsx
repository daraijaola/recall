import { AppLogo } from "@/components/ui/AppLogo";
import type { Source } from "@/lib/types";

interface SourceLogoProps {
  source: Source;
  size?: number;
  showLabel?: boolean;
  className?: string;
}

export function SourceLogo({ source, size = 20, showLabel = false, className = "" }: SourceLogoProps) {
  return <AppLogo id={source} size={size} showLabel={showLabel} className={className} />;
}