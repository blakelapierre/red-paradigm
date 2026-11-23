import { useEffect, useRef, useState } from "react";
import { MANUAL, entryByTitle, type ManualEntry } from "@/lib/yard/manual";

function matches(entry: ManualEntry, needle: string): boolean {
  if (!needle) return true;
  const hay = `${entry.group} ${entry.title} ${entry.does} ${entry.costs} ${entry.refuses} ${entry.doesNot}`.toLowerCase();
  return hay.includes(needle);
}

export function FieldManual({ title }: { title: string }) {
  const rootRef = useRef<HTMLElement>(null);
  const [query, setQuery] = useState("");
  const [id, setId] = useState(() => entryByTitle(title)?.id ?? "first");
  const needle = query.trim().toLowerCase();
  const shown = MANUAL.filter((entry) => matches(entry, needle));
  const selected = MANUAL.find((entry) => entry.id === id) ?? shown[0];

  useEffect(() => {
    const found = entryByTitle(title);
    if (found) setId(found.id);
    rootRef.current?.scrollIntoView({ block: "start" });
  }, [title]);

  let group = "";
  return (
    <section ref={rootRef} className="rounded-sm border border-line bg-surface" aria-label="Field manual">
      <div className="border-b border-line p-3">
        <label className="block text-xs text-muted" htmlFor="manual-search">
          Search the manual
        </label>
        <input
          id="manual-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="dig, fines, storm, breathable"
          className="mt-1 min-h-11 w-full rounded-sm border border-line bg-bg px-3 text-sm text-fg"
        />
      </div>
      <div className="grid md:grid-cols-[14rem_minmax(0,1fr)]">
        <ul className="max-h-80 overflow-y-auto border-b border-line md:max-h-[32rem] md:border-b-0 md:border-r">
          {shown.map((entry) => {
            const head = entry.group !== group;
            group = entry.group;
            const on = entry.id === selected?.id;
            return (
              <li key={entry.id}>
                {head ? <p className="px-3 pt-3 text-xs text-muted">{entry.group}</p> : null}
                <button
                  type="button"
                  onClick={() => setId(entry.id)}
                  className={`min-h-11 w-full px-3 text-left text-sm ${on ? "bg-surface-2 text-frost" : "text-fg"}`}
                >
                  {entry.title}
                </button>
              </li>
            );
          })}
          {shown.length === 0 ? <li className="px-3 py-3 text-sm text-muted">No entry.</li> : null}
        </ul>
        {selected ? (
          <article className="p-4">
            <p className="text-xs text-muted">{selected.group}</p>
            <h2 className="mt-1 text-lg font-medium text-fg">{selected.title}</h2>
            <p className="mt-3 whitespace-pre-line text-sm text-fg">{selected.does}</p>
            <dl className="mt-4 flex flex-col gap-3 text-sm">
              <div>
                <dt className="text-xs text-muted">Costs</dt>
                <dd className="mt-1 whitespace-pre-line text-fg">{selected.costs}</dd>
              </div>
              <div>
                <dt className="text-xs text-oxide">Refuses</dt>
                <dd className="mt-1 whitespace-pre-line text-fg">{selected.refuses}</dd>
              </div>
              <div>
                <dt className="text-xs text-frost">Does not</dt>
                <dd className="mt-1 whitespace-pre-line text-fg">{selected.doesNot}</dd>
              </div>
            </dl>
          </article>
        ) : (
          <p className="p-4 text-sm text-muted">No entry.</p>
        )}
      </div>
    </section>
  );
}
