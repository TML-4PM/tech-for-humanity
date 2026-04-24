// GET /api/research-csv  → 810-row CSV of research_asset_register
export default async function handler(req, res) {
  const SB = "https://lzfgigiyqpuuxslsygjt.supabase.co";
  const ANON = process.env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6ZmdpZ2l5cXB1dXhzbHN5Z2p0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ0MTc0NjksImV4cCI6MjA1OTk5MzQ2OX0.qUNzDEr2rxjRSClh5P4jeDv_18_yCCkFXTizJqNYSgg";
  const cols = "asset_code,area_code,area_name,subgroup_code,subgroup_name,asset_type,title,status,premium_flag,price_aud,maturity_score,evidence_uri,stripe_product_id,last_verified,published_at,sort_order,notes,created_at,updated_at";
  try {
    const r = await fetch(`${SB}/rest/v1/research_asset_register?select=${cols}&order=area_code,subgroup_code,asset_type`, {
      headers: { apikey: ANON, Authorization: `Bearer ${ANON}`, Prefer: "count=exact" }
    });
    if (!r.ok) {
      res.status(502).json({error: await r.text()}); return;
    }
    const rows = await r.json();
    const header = cols.split(",");
    const esc = v => {
      if (v === null || v === undefined) return "";
      const s = String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g,'""')}"` : s;
    };
    const csv = [header.join(",")].concat(rows.map(row => header.map(c => esc(row[c])).join(","))).join("\n");
    res.setHeader("Content-Type","text/csv; charset=utf-8");
    res.setHeader("Content-Disposition",`attachment; filename="research_asset_register_${new Date().toISOString().slice(0,10)}.csv"`);
    res.setHeader("Cache-Control","public, max-age=60");
    res.status(200).send(csv);
  } catch(e) {
    res.status(500).json({error: e.message});
  }
}
