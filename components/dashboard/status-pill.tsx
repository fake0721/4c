const toneClasses = {
  success: "bg-[#eaf3fc] text-[#1f4e79] ring-1 ring-[#bfd0e4]",
  warning: "bg-[#f7f1e4] text-[#8b6a1f] ring-1 ring-[#e1d0a6]",
  danger: "bg-[#f9e9e9] text-[#a84a4a] ring-1 ring-[#e9c3c3]",
  info: "bg-[#eaf1fa] text-[#2f5f8e] ring-1 ring-[#c4d2e3]",
  neutral: "bg-[#f2f5f9] text-[#5f6b7a] ring-1 ring-[#d6dee8]",
} as const;

type StatusPillProps = {
  label: string;
  tone: keyof typeof toneClasses;
};

export function StatusPill({ label, tone }: StatusPillProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${toneClasses[tone]}`}
    >
      {label}
    </span>
  );
}
