// ALIMDAR production API endpoint.
// IMPORTANT: No client certificate data is hardcoded here.
// Configure a private database/API using environment variables before issuing certificates.

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  const id = String(req.query?.id || "").trim().toUpperCase();

  if (!/^ALM-CON-\d{4}-\d{4,}$/.test(id)) {
    return res.status(400).json({ error: "Invalid Certificate ID format" });
  }

  const apiUrl = process.env.CERTIFICATE_API_URL;
  const apiKey = process.env.CERTIFICATE_API_KEY;

  if (!apiUrl || !apiKey) {
    // Safe production behavior: never invent or expose a certificate.
    return res.status(404).json({ error: "Certificate not found" });
  }

  try {
    const upstream = await fetch(`${apiUrl.replace(/\/$/, "")}/${encodeURIComponent(id)}`, {
      headers: { "Authorization": `Bearer ${apiKey}`, "Accept": "application/json" }
    });

    if (upstream.status === 404) return res.status(404).json({ error: "Certificate not found" });
    if (!upstream.ok) return res.status(502).json({ error: "Registry unavailable" });

    const c = await upstream.json();

    // Explicit public allowlist: only these fields can reach the browser.
    return res.status(200).json({
      certificateId: c.certificateId,
      status: c.status === "REVOKED" ? "REVOKED" : "VALID",
      participantName: c.participantName,
      issuer: "Uslužni obrt Alimdar",
      area: c.area,
      topic: c.topic,
      date: c.date,
      duration: c.duration,
      blockchain: {
        network: c.blockchain?.network || null,
        contractAddress: c.blockchain?.contractAddress || null,
        tokenId: c.blockchain?.tokenId || null,
        txHash: c.blockchain?.txHash || null
      }
    });
  } catch {
    return res.status(502).json({ error: "Registry unavailable" });
  }
}
