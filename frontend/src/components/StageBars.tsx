import { STAGES, type Stage } from "../lib/offer";

export default function StageBars({
  counts,
}: {
  counts: Record<Stage, number>;
}) {
  const max = Math.max(1, ...STAGES.map((stage) => counts[stage] ?? 0));

  return (
    <ul className="space-y-3">
      {STAGES.map((stage) => {
        const count = counts[stage] ?? 0;
        return (
          <li key={stage} className="flex items-center gap-3 text-sm">
            <span className="w-20 shrink-0 text-slate-600">{stage}</span>
            <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-blue-700"
                style={{ width: `${(count / max) * 100}%` }}
              />
            </div>
            <span className="w-6 text-right font-medium text-slate-900">
              {count}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
