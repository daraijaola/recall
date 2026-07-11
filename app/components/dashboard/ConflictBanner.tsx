import type { ContradictionCard } from "@/lib/types";
import { SOURCE_LABELS } from "@/lib/constants";

interface ConflictBannerProps {
  contradiction: ContradictionCard;
  onInspect: () => void;
}

export function ConflictBanner({ contradiction, onInspect }: ConflictBannerProps) {
  return (
    <div className="conflict-banner" role="status">
      <div className="conflict-banner-pulse" aria-hidden="true" />
      <div className="conflict-banner-copy">
        <span className="conflict-banner-tag">Open conflict</span>
        <p>
          {SOURCE_LABELS[contradiction.oldMemory.source]} vs {SOURCE_LABELS[contradiction.newMemory.source]}
          {" — "}
          {contradiction.explanation}
        </p>
      </div>
      <button type="button" className="btn conflict-banner-btn" onClick={onInspect}>
        Inspect
      </button>
    </div>
  );
}