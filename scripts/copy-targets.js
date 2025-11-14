#!/usr/bin/env node

/**
 * Script to copy targets from one month to another
 * Usage: node scripts/copy-targets.js [fromMonth] [toMonth]
 * Example: node scripts/copy-targets.js 2025-10 2025-11
 *
 * Set ADMIN_KEY environment variable or pass it as --key flag
 */

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://kpi-api-464127418524.australia-southeast1.run.app';

async function copyTargets(fromMonth, toMonth, adminKey) {
  console.log(`Copying targets from ${fromMonth} to ${toMonth}...`);

  // Fetch source month targets
  const getUrl = `${API_BASE}/targets?month=${fromMonth}`;
  console.log(`Fetching from: ${getUrl}`);

  const response = await fetch(getUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch targets: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  console.log(`Found ${data.rows.length} target rows for ${fromMonth}`);

  if (data.rows.length === 0) {
    console.log('No targets to copy!');
    return;
  }

  // Display what we're copying
  console.log('\nTargets to copy:');
  console.table(data.rows.map(r => ({
    scope: r.scope,
    key: r.key,
    metric: r.metric,
    target: r.target
  })));

  // Prepare items for new month
  const items = data.rows.map(row => ({
    scope: row.scope,
    key: row.key,
    metric: row.metric,
    target: row.target
  }));

  // Upsert to new month
  const upsertUrl = `${API_BASE}/targets/upsert`;
  console.log(`\nUpserting to ${toMonth}...`);

  const upsertResponse = await fetch(upsertUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-Key': adminKey
    },
    body: JSON.stringify({
      month: toMonth,
      updated_by: 'admin',
      items: items
    })
  });

  if (!upsertResponse.ok) {
    const errorText = await upsertResponse.text();
    throw new Error(`Failed to upsert targets: ${upsertResponse.status} ${errorText}`);
  }

  const result = await upsertResponse.json();
  console.log('\n✅ Success!');
  console.log(result);
}

// Parse command line args
const args = process.argv.slice(2);
let fromMonth = args[0];
let toMonth = args[1];
let adminKey = process.env.ADMIN_KEY;

// Check for --key flag
const keyIndex = args.indexOf('--key');
if (keyIndex !== -1 && args[keyIndex + 1]) {
  adminKey = args[keyIndex + 1];
}

// Default to October -> November 2025 if not specified
if (!fromMonth) fromMonth = '2025-10';
if (!toMonth) toMonth = '2025-11';

// Validate admin key
if (!adminKey) {
  console.error('❌ Error: ADMIN_KEY environment variable is not set');
  console.error('\nUsage:');
  console.error('  ADMIN_KEY=your_key node scripts/copy-targets.js [fromMonth] [toMonth]');
  console.error('  or');
  console.error('  node scripts/copy-targets.js [fromMonth] [toMonth] --key your_key');
  console.error('\nExample:');
  console.error('  ADMIN_KEY=abc123 node scripts/copy-targets.js 2025-10 2025-11');
  process.exit(1);
}

// Run
copyTargets(fromMonth, toMonth, adminKey)
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  });
