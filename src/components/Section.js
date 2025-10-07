export default function Section({ title, subtitle, right, children }) {
  return (
    <section className="mt-8">
      <div className="flex items-end justify-between mb-3">
        <div>
          <h2 className="text-xl font-semibold">{title}</h2>
          {subtitle ? <p className="text-sm text-neutral-400">{subtitle}</p> : null}
        </div>
        {right ? <div className="flex items-center gap-2">{right}</div> : null}
      </div>
      {children}
    </section>
  );
}