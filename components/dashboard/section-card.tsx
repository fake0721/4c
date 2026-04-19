type SectionCardProps = {
  eyebrow: string;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
};

export function SectionCard({
  eyebrow,
  title,
  description,
  children,
  className,
}: SectionCardProps) {
  return (
    <section
      className={`dashboard-panel rounded-[30px] border border-[#dce4ee] bg-white p-5 shadow-[0_14px_40px_rgba(31,42,55,0.1)] ${className ?? ""}`}
    >
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#5b8fb9]">
          {eyebrow}
        </p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[#1f2a37]">
          {title}
        </h2>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#5f6b7a]">
            {description}
          </p>
        ) : null}
      </div>
      {children}
    </section>
  );
}
