import { Suspense } from "react";
import { SearchClient } from "@/components/search/SearchClient";

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="search-page muted" style={{ padding: 24 }}>Loading search…</div>}>
      <SearchClient />
    </Suspense>
  );
}
