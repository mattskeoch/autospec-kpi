export default function Highlights({ data, variant = 'plain', className = '' }) {
  if (!data) return null;

  const money = (n) =>
    new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      maximumFractionDigits: 0,
    }).format(Number(n || 0));

  // Compact circular icon badge (matches podium badges)
  function IconBadge({ name, title, className = '' }) {
    return (
      <span
        className={`grid h-8 w-8 sm:h-9 sm:w-9 justify-start ${className}`}
        aria-hidden="true"
        title={title}
      >
        <i className={`${name} text-base sm:text-lg text-neutral-400`} />
      </span>
    );
  }

  // Borderless, transparent tile (section provides the bg)
  function Tile({ icon, label, text }) {
    return (
      <div className="p-4 sm:p-6 flex flex-col items-start">
        <IconBadge name={icon} title={label} className="self-start" />
        <div className="text-sm text-neutral-400">{label}</div>
        <div className="text-lg font-semibold">{text}</div>
      </div>
    );
  }

  const ls = data.largest_sale_mtd || {};
  const ld = data.largest_deposits_mtd || {};
  const mc = data.most_sales_count_mtd || {};
  const fy = data.highest_sales_fy || {};

  // Optional outer shell when variant="card"
  const wrapperClass =
    variant === 'card'
      ? 'rounded-2xl bg-neutral-900/70 p-4 sm:p-5'
      : '';

  return (
    <div className={`${wrapperClass} ${className}`}>
      {/* 1 col mobile, 2 col tablet, 4 col desktop */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Tile
          icon="ri-money-dollar-circle-line"
          label="Largest Sale"
          text={`${ls.rep || '—'}: ${money(ls.amount)}`}
        />
        <Tile
          icon="ri-bank-line"
          label="Most Deposits"
          text={`${ld.rep || '—'}: ${money(ld.amount)}`}
        />
        <Tile
          icon="ri-fire-line"
          label="Most Sales"
          text={`${mc.rep || '—'}: ${Number(mc.count || 0)}`}
        />
        <Tile
          icon="ri-line-chart-line"
          label="Highest Sales FY"
          text={`${fy.rep || '—'}: ${money(fy.amount)}`}
        />
      </div>
    </div>
  );
}
