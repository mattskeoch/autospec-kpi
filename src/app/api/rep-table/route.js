import { BigQuery } from '@google-cloud/bigquery';

const projectId = process.env.GCP_PROJECT_ID;
const clientEmail = process.env.GCP_CLIENT_EMAIL;
const privateKey = process.env.GCP_PRIVATE_KEY?.replace(/\\n/g, '\n');

const bq = new BigQuery({
  projectId,
  credentials: { client_email: clientEmail, private_key: privateKey },
});

// Month start (AWST month window is determined by date_utc in BQ)
function monthStart() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}
function ymd(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export async function GET() {
  try {
    const monthStartStr = ymd(monthStart());

    const sql = `
      WITH base AS (
        SELECT
          order_id,
          order_total_net,
          amount_paid,
          TRIM(salesperson) AS salesperson,
          REGEXP_CONTAINS(LOWER(IFNULL(tags,'')), r'\\bonline\\s*store\\b') AS is_online_tag
        FROM \`reports-472223.shopify.orders_for_sheets_live_v2\`
        WHERE date_utc >= DATE '${monthStartStr}'
      ),
      filtered AS (
        SELECT * FROM base WHERE NOT is_online_tag
      ),
      agg AS (
        SELECT
          IFNULL(NULLIF(salesperson,''), 'Unassigned') AS rep,
          SAFE_CAST(SUM(order_total_net) AS NUMERIC) AS sales,
          SAFE_CAST(SUM(amount_paid) AS NUMERIC) AS deposits,
          COUNT(DISTINCT order_id) AS sales_count
        FROM filtered
        GROUP BY 1
      )
      SELECT rep, sales, deposits, sales_count
      FROM agg
      ORDER BY sales DESC
    `;

    const [rows] = await bq.query({ query: sql, useLegacySql: false });
    const out = (rows || []).map(r => {
      const sales = Number(r.sales || 0);
      const cnt = Number(r.sales_count || 0);
      return {
        rep: r.rep || 'Unassigned',
        sales,
        deposits: Number(r.deposits || 0),
        salesCount: cnt,
        // targets/progress will be added later when we move targets into BQ
        salesTarget: 0,
        depositTarget: 0,
        salesProgress: 0,
        depositProgress: 0,
        aov: cnt ? sales / cnt : 0,
      };
    });

    return new Response(JSON.stringify({ rows: out, as_of: new Date().toISOString() }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (e) {
    return new Response(String(e?.message || e), { status: 500 });
  }
}
