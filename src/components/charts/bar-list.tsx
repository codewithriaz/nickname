import { compactNumber } from "@/lib/utils";
import { SINGLE } from "./palette";

/** Ranked horizontal bars (single series): label + value, thin bars with rounded data-end. */
export function BarList({ items, empty = "No data yet", formatValue = compactNumber }: { items: { name: string; count: number }[]; empty?: string; formatValue?: (n: number) => string }) {
  const max = Math.max(1, ...items.map((i) => i.count));
  const total = items.reduce((a, i) => a + i.count, 0);
  if (!items.length) return <p className="py-6 text-center text-sm text-muted-foreground">{empty}</p>;
  return (
    <ul className="space-y-2.5" role="table">
      {items.map((item) => (
        <li key={item.name} role="row" title={`${item.name}: ${item.count} (${total ? Math.round((item.count / total) * 100) : 0}%)`}>
          <div className="mb-1 flex items-center justify-between gap-3 text-sm">
            <span className="truncate text-foreground" role="cell">
              {item.name}
            </span>
            <span className="tabular-nums text-muted-foreground" role="cell">
              {formatValue(item.count)}
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-muted">
            <div className="h-2 rounded-r-full rounded-l-sm" style={{ width: `${(item.count / max) * 100}%`, background: SINGLE }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
