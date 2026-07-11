import { APP_BASE, SOURCE_LABELS, SOURCE_LOGO } from "@/lib/constants";
import type { AppLogoId, Source } from "@/lib/types";

const EXTRA_LOGO: Record<Exclude<AppLogoId, Source>, string> = {
  windsurf: "windsurf.svg",
  gemini: "gemini.svg",
  supermemory: "supermemory-mark.svg",
};

const EXTRA_LABEL: Record<Exclude<AppLogoId, Source>, string> = {
  windsurf: "Windsurf",
  gemini: "Gemini",
  supermemory: "Supermemory",
};

function logoFile(id: AppLogoId): string {
  if (id in SOURCE_LOGO) return SOURCE_LOGO[id as Source];
  return EXTRA_LOGO[id as Exclude<AppLogoId, Source>];
}

function logoLabel(id: AppLogoId): string {
  if (id in SOURCE_LABELS) return SOURCE_LABELS[id as Source];
  return EXTRA_LABEL[id as Exclude<AppLogoId, Source>];
}

interface AppLogoProps {
  id: AppLogoId;
  size?: number;
  showLabel?: boolean;
  label?: string;
  className?: string;
  invert?: boolean;
  variant?: "icon" | "wordmark";
}

export function AppLogo({
  id,
  size = 20,
  showLabel = false,
  label,
  className = "",
  invert = false,
  variant = "icon",
}: AppLogoProps) {
  const wordmark = id === "supermemory" && variant === "wordmark";
  const src = wordmark
    ? `${APP_BASE}/logos/supermemory.svg`
    : `${APP_BASE}/logos/${logoFile(id)}`;
  const shouldInvert = invert || wordmark;

  return (
    <span className={`source-logo${wordmark ? " source-logo-wordmark" : ""}${className ? ` ${className}` : ""}`}>
      <img
        src={src}
        alt=""
        width={wordmark ? undefined : size}
        height={size}
        className={`source-logo-img${shouldInvert ? " logo-invert" : ""}${wordmark ? " source-logo-wordmark-img" : ""}`}
        style={wordmark ? { height: size, width: "auto" } : { width: size, height: size }}
      />
      {showLabel ? (
        <span className="source-logo-label">{label ?? logoLabel(id)}</span>
      ) : null}
    </span>
  );
}