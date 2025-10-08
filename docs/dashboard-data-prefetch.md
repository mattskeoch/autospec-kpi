# Dashboard initial data loading architecture

The dashboard previously rendered a client component that fetched data on the
client after hydration. That meant the first paint of the page was empty while
the browser performed four API requests (`kpis/mtd`, `rep-table`,
`kpis/highlights`, and `targets`). Users reported that the initial load felt
slow because they had to wait for all four requests to settle before seeing any
data.

To address that, the page now prefetches the same API responses on the server
and passes the results into the dashboard client component as props.

## How the request flow works now

1. The server evaluates `loadInitialData()` during the initial request. The
   helper uses `Promise.all` to execute the existing API calls in parallel.
2. The resolved JSON payloads (or an error message) are passed into the
   `DashboardPage` client component as `initial*` props.
3. The client component hydrates immediately with the server data so the first
   paint is fully populated. If the server failed to fetch, the component still
   renders and triggers the existing client-side fetching logic as a fallback.
4. The refresh button continues to reuse the shared `load()` hook that executes
   the same API calls from the browser when the user wants to refresh.

## Edge runtime configuration

Cloudflare Pages expects the `/index` route to run on the Edge runtime. The page
now exports `export const runtime = 'edge';`, which tells Next.js to compile the
route for the Edge environment. Without that export the Cloudflare build would
fail.

## Error handling

* If any of the prefetch requests fail, the server logs the failure and passes a
  best-effort `initialError` message into the client component.
* The client component renders the error banner and immediately falls back to
  its existing client-side `load()` call so the user can still see data once the
  APIs become available.

## Summary

* Server-prefetch all dashboard API calls and hydrate the client component with
  the results so the first render is populated.
* Keep the client-side fetching logic to power the refresh button and provide a
  fallback when server fetching fails.
* Declare the Edge runtime so Cloudflare Pages can build and deploy the route.
