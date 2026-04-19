import { StatusPill } from "@/components/dashboard/status-pill";

type MetricCardProps = {
  label: string;
  value: string;
  change: string;
  description: string;
  tone: "success" | "warning" | "info";
};

export function MetricCard({
  label,
  value,
  change,
  description,
  tone,
}: MetricCardProps) {
  return (
    <article className="rounded-[28px] border border-white/10 bg-white/6 p-5 shadow-[0_18px_55px_rgba(2,8,18,0.32)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-400">{label}</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-white">
            {value}
          </p>
        </div>
        <StatusPill label={change} tone={tone} />
      </div>
      <p className="mt-4 text-sm leading-6 text-slate-400">{description}</p>
    </article>
  );
}
