import { BigQuery } from '@google-cloud/bigquery';

// Read creds from .env.local
const projectId = process.env.GCP_PROJECT_ID;
const clientEmail = process.env.GCP_CLIENT_EMAIL;
const privateKey = process.env.GCP_PRIVATE_KEY?.replace(/\\n/g, '\n'); // handle escaped \n

const bq = new BigQuery({
  projectId,
  credentials: { client_email: clientEmail, private_key: privateKey },
});

function monthStartAWST() {
  const now = new Date();               // local time is fine; we only need Y/M
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
    const monthStart = ymd(monthStartAWST());
    const sql = `
      WITH base AS (
        SELECT
          order_total_net,
          store_region,
          REGEXP_CONTAINS(LOWER(IFNULL(tags,'')), r'\\bonline\\s*store\\b') AS is_online_tag
        FROM \`reports-472223.shopify.orders_for_sheets_live_v2\`
        WHERE date_utc >= DATE '${monthStart}'
      )
      SELECT
        SAFE_CAST(SUM(order_total_net) AS NUMERIC) AS total_mtd,
        SAFE_CAST(SUM(IF(store_region='East' AND NOT is_online_tag, order_total_net, 0)) AS NUMERIC) AS east_mtd,
        SAFE_CAST(SUM(IF(store_region='West' AND NOT is_online_tag, order_total_net, 0)) AS NUMERIC) AS west_mtd
      FROM base
    `;

    const [rows] = await bq.query({ query: sql, useLegacySql: false });
    const r = rows?.[0] || {};
    const payload = {
      total_mtd: Number(r.total_mtd || 0),
      east_mtd: Number(r.east_mtd || 0),
      west_mtd: Number(r.west_mtd || 0),
      as_of: new Date().toISOString(),
    };

    return new Response(JSON.stringify(payload), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (e) {
    return new Response(String(e?.message || e), { status: 500 });
  }
}
