"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { AgreementCard } from "@/components/agreement-card";
import { DashboardEmpty } from "@/components/dashboard-empty";
import { stripHtml } from "@/lib/search";
import type { Agreement } from "@/types/database";
import { useTranslations } from "next-intl";
import { Search, ArrowUpDown, Loader2 } from "lucide-react";

type SortOrder = "newest" | "oldest";
type MatchMap = Record<string, string[]>;

export function DashboardContent({
  agreements,
}: {
  agreements: Agreement[];
}) {
  const t = useTranslations();
  const [query, setQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");
  const [searching, setSearching] = useState(false);
  const [matchMap, setMatchMap] = useState<MatchMap>({});
  const [hasSearched, setHasSearched] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doSearch = useCallback(
    async (q: string) => {
      if (!q.trim()) {
        setMatchMap({});
        setHasSearched(false);
        return;
      }

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setSearching(true);
      try {
        const items = agreements.map((a) => ({
          id: a.id,
          title: a.title,
          content: stripHtml(a.content),
        }));

        const res = await fetch("/api/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: q.trim(), items }),
          signal: controller.signal,
        });

        if (!res.ok) throw new Error();

        const data = await res.json();
        const map: MatchMap = {};
        for (const match of data.results ?? []) {
          map[match.id] = match.matchedWords;
        }
        setMatchMap(map);
        setHasSearched(true);
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
        setMatchMap({});
        setHasSearched(true);
      } finally {
        setSearching(false);
      }
    },
    [agreements],
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setMatchMap({});
      setHasSearched(false);
      return;
    }
    debounceRef.current = setTimeout(() => doSearch(query), 600);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, doSearch]);

  const sorted = useMemo(() => {
    let items: { agreement: Agreement; matchedWords: string[] }[];

    if (hasSearched && query.trim()) {
      items = agreements
        .filter((a) => a.id in matchMap)
        .map((a) => ({ agreement: a, matchedWords: matchMap[a.id] ?? [] }));
    } else {
      items = agreements.map((a) => ({
        agreement: a,
        matchedWords: [],
      }));
    }

    return [...items].sort((a, b) => {
      const dateA = new Date(a.agreement.createdAt).getTime();
      const dateB = new Date(b.agreement.createdAt).getTime();
      return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });
  }, [agreements, matchMap, hasSearched, query, sortOrder]);

  if (agreements.length === 0) {
    return <DashboardEmpty />;
  }

  return (
    <div className="flex flex-col gap-4 min-w-0 overflow-hidden">
      <div className="flex gap-2">
        <div className="relative flex-1">
          {searching ? (
            <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
          ) : (
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          )}
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("dashboard.searchPlaceholder")}
            className="w-full pl-9 pr-3 py-2 border rounded-md bg-background text-sm"
          />
        </div>
        <button
          onClick={() =>
            setSortOrder((o) => (o === "newest" ? "oldest" : "newest"))
          }
          className="flex items-center gap-1.5 px-3 py-2 border rounded-md text-sm hover:bg-accent transition-colors shrink-0"
        >
          <ArrowUpDown className="h-4 w-4" />
          {sortOrder === "newest"
            ? t("dashboard.sortNewest")
            : t("dashboard.sortOldest")}
        </button>
      </div>

      {hasSearched && sorted.length === 0 ? (
        <p className="text-muted-foreground text-sm py-8 text-center">
          {t("dashboard.noResults")}
        </p>
      ) : (
        <div className="grid gap-4 min-w-0 overflow-hidden">
          {sorted.map((result) => (
            <AgreementCard
              key={result.agreement.id}
              agreement={result.agreement}
              highlightWords={result.matchedWords}
            />
          ))}
        </div>
      )}
    </div>
  );
}
