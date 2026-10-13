# Handoff: get nadeanlane.art serving the GitHub Pages site

Paste this into a local Claude Code session (run from the `nadean-portfolio` clone) as the first message.

## Goal

`https://nadeanlane.art` (and `www.`) should serve the portfolio from GitHub Pages
(repo `MaxmaxxamxaM/nadean-portfolio`, branch `main`, root folder). Netlify is no longer
used for hosting. It only still holds the domain registration and DNS.

## What's already true (verified 2026-10-13)

- **GitHub Pages**: enabled, deploying `main` / root, custom domain `nadeanlane.art`
  (`CNAME` file in repo), Enforce HTTPS ticked. Shows "DNS check unsuccessful
  (NotServedByPagesError)" because the bare domain doesn't resolve yet.
- **Netlify site**: deleted. The account is paused on "operational credits" (deploys
  paused, DNS should be unaffected).
- **Registrar**: domain bought through Netlify, auto-renews Sep 7, 2027.
- **Nameservers**: correct and consistent. The `.art` registry (`a.nic.art`), Google
  (8.8.8.8) and Netlify all agree on `dns1-4.p03.nsone.net`.
- **Netlify DNS zone** `nadeanlane.art`, zone id `6acb4f8fb0b5a01015433747`, created
  2026-10-11. Correct records exist (original set):
  - `A nadeanlane.art` → 185.199.108.153 / .109.153 / .110.153 / .111.153
  - `CNAME www.nadeanlane.art` → `maxmaxxamxam.github.io`
- **`www.nadeanlane.art` resolves correctly** at `dns1.p03.nsone.net` (CNAME to GitHub).
- **The problem**: the bare `nadeanlane.art` returns NODATA (only an SOA) for type A at
  `dns1.p03.nsone.net`, even though the zone holds the four A records. Likely a stuck
  Netlify apex record (NETLIFY/ALIAS) left over from when the domain was attached to
  the Netlify site. Note the SOA lists `dns1.p01.nsone.net` as primary, while delegation
  is `p03`.

## Possibly still pending

- **Duplicate records**: a second set of 4 A records and 1 CNAME was added by mistake.
  Their ids are `6acde5ba85ce24e3416a7c35`, `6acde5bb2cb390101f953b16`,
  `6acde5bca6e60ec71652b339`, `6acde5bd4ba4dd836e0a0d1a`, `6acde5bedf9c28af7da1c2fa`.
  Check whether they've been deleted yet; delete them if not.
- **Token**: the Netlify personal access token used earlier was exposed in chat. It must
  be revoked (Netlify → User settings → Applications → Personal access tokens). Use a
  fresh one, entered with `Read-Host -AsSecureString` or set as an env var. Never echo it.

## Next steps

1. Check current state (Windows, PowerShell):
   ```powershell
   Resolve-DnsName nadeanlane.art -Type A -Server dns1.p03.nsone.net
   Resolve-DnsName www.nadeanlane.art -Server dns1.p03.nsone.net
   Resolve-DnsName nadeanlane.art -Type A -Server 8.8.8.8
   ```
   Netlify API (needs a fresh token in `$env:NETLIFY_TOKEN`). Note that the list endpoint
   comes back wrapped, so use `.value` or `ConvertTo-Json`:
   ```powershell
   $h = @{ Authorization = "Bearer $env:NETLIFY_TOKEN" }
   $api = "https://api.netlify.com/api/v1"
   $zid = "6acb4f8fb0b5a01015433747"
   (Invoke-RestMethod "$api/dns_zones/$zid/dns_records" -Headers $h) | ConvertTo-Json -Depth 5
   ```
2. If the bare domain now returns the four 185.199.x.153 addresses, click
   **Check again** in GitHub → Settings → Pages, then wait for HTTPS. Done.
3. If it still returns NODATA, move DNS off Netlify to Cloudflare (free):
   - Add `nadeanlane.art` at cloudflare.com (Free plan).
   - Records, all **DNS only** (grey cloud): 4 × `A @` → 185.199.108–111.153,
     `CNAME www` → `maxmaxxamxam.github.io`.
   - In Netlify → Domains → `nadeanlane.art`, change the nameservers to Cloudflare's two.
   - Verify with `Resolve-DnsName nadeanlane.art -Type NS -Server 8.8.8.8`, then check the
     A record, then **Check again** in GitHub Pages.
   - Alternative: ask Netlify support: "Zone nadeanlane.art has A records at the apex but
     NS1 returns NODATA for them."
4. Optional stopgap: set the GitHub Pages custom domain to `www.nadeanlane.art`, which
   works now. Switch it back once the bare domain resolves.

## Repo follow-up (after the domain works)

- `README.md` still describes Netlify hosting (setup steps 2–3). Update it to GitHub
  Pages + DNS, and say where the DNS ends up living.
- `netlify.toml` is unused and can be removed. `_headers` is for Cloudflare Pages, which
  isn't used either; keep or remove it to match the final hosting.
- Site editing is via Pages CMS at https://app.pagescms.org (`.pages.yml`). This is
  unaffected by the hosting move.
