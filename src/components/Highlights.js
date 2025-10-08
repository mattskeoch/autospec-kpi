export default function Highlights({ data }) {
  if (!data) return null;

  const money = (n) =>
    new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      maximumFractionDigits: 0,
    }).format(Number(n || 0));

  const Card = ({ emoji, label, text }) => (
    <div className="rounded-xl bg-neutral-900/70 border border-white/10 p-4">
      <div className="text-sm text-neutral-400 flex items-center gap-2">
        <span className="text-base">{emoji}</span>
        <span>{label}</span>
      </div>
      <div className="mt-1 text-lg font-semibold">{text}</div>
    </div>
  );

  const ls = data.largest_sale_mtd || {};
  const ld = data.largest_deposits_mtd || {};
  const mc = data.most_sales_count_mtd || {};
  const fy = data.highest_sales_fy || {};

  return (
    <div className="rounded-2xl bg-neutral-900/70 border border-white/10 p-4 sm:p-5">
      {/* 1 col mobile, 2 col tablet, 4 col desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Card
          emoji="🐋"
          label="Largest Sale"
          text={`${ls.rep || '—'}: ${money(ls.amount)}`}
        />
        <Card
          emoji="🏦"
          label="Most Deposits"
          text={`${ld.rep || '—'}: ${money(ld.amount)}`}
        />
        <Card
          emoji="🔥"
          label="Most Sales"
          text={`${mc.rep || '—'}: ${Number(mc.count || 0)}`}
        />
        <Card
          emoji="📈"
          label="Highest Sales FY"
          text={`${fy.rep || '—'}: ${money(fy.amount)}`}
        />
      </div>
    </div>
  );
}
