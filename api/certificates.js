 import { neon } from "@neondatabase/serverless";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  const id = String(req.query?.id || "")
    .trim()
    .toUpperCase();

  if (!/^ALM-CON-\d{4}-\d{4,}$/.test(id)) {
    return res.status(400).json({
      error: "Invalid Certificate ID format"
    });
  }

  const databaseUrl =
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL ||
    process.env.STORAGE_URL;

  if (!databaseUrl) {
    return res.status(503).json({
      error: "Registry database is not configured"
    });
  }

  try {
    const sql = neon(databaseUrl);

    const rows = await sql`
      SELECT
        certificate_id,
        participant_name,
        issuer,
        area,
        topic,
        period_start,
        period_end,
        duration,
        work_format,
        issue_date,
        status,
        image_cid,
        metadata_cid,
        blockchain_network,
        contract_address,
        token_id,
        transaction_hash
      FROM certificates
      WHERE certificate_id = ${id}
      LIMIT 1
    `;

    if (!rows.length) {
      return res.status(404).json({
        error: "Certificate not found"
      });
    }

    const c = rows[0];

    const formatDate = (value) => {
      if (!value) return null;

      const d = new Date(value);

      return new Intl.DateTimeFormat("hr-HR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
      }).format(d);
    };

    return res.status(200).json({
      certificateId: c.certificate_id,
      status: c.status || "PENDING",
      participantName: c.participant_name,
      issuer: c.issuer,
      area: c.area,
      topic: c.topic,

      date:
        c.period_start && c.period_end
          ? `${formatDate(c.period_start)} – ${formatDate(c.period_end)}`
          : null,

      duration: c.duration,
      format: c.work_format,
      issueDate: formatDate(c.issue_date),

      imageCid: c.image_cid,
      metadataCid: c.metadata_cid,

      blockchain: {
        network: c.blockchain_network || null,
        contractAddress: c.contract_address || null,
        tokenId: c.token_id || null,
        txHash: c.transaction_hash || null
      }
    });

  } catch (error) {
    console.error("ALIMDAR registry error:", error);

    return res.status(500).json({
      error: "Registry unavailable"
    });
  }
}
