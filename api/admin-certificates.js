import { neon } from "@neondatabase/serverless";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const adminKey = process.env.ADMIN_API_KEY;
  const suppliedKey = req.headers["x-admin-key"];

  if (!adminKey || suppliedKey !== adminKey) {
    return res.status(401).json({ error: "Unauthorized" });
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

  const {
    participantName,
    area,
    topic,
    periodStart,
    periodEnd,
    duration,
    workFormat,
    issueDate,
    status,
    blockchainNetwork,
    contractAddress,
    tokenId,
    transactionHash
  } = req.body || {};

  if (
    !participantName ||
    !area ||
    !topic ||
    !periodStart ||
    !periodEnd
  ) {
    return res.status(400).json({
      error: "Nedostaju obavezni podaci."
    });
  }

  const allowedStatuses = ["PENDING", "VALID", "REVOKED"];

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({
      error: "Neispravan status."
    });
  }

  try {
    const sql = neon(databaseUrl);

    // Baza sama generira sljedeći broj potvrde.
    const idRows = await sql`
      SELECT next_certificate_id() AS certificate_id
    `;

    const certificateId = idRows[0].certificate_id;

    await sql`
      INSERT INTO certificates (
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
        blockchain_network,
        contract_address,
        token_id,
        transaction_hash
      )
      VALUES (
        ${certificateId},
        ${participantName},
        'Uslužni obrt Alimdar',
        ${area},
        ${topic},
        ${periodStart},
        ${periodEnd},
        ${duration || null},
        ${workFormat || null},
        ${issueDate || null},
        ${status},
        ${blockchainNetwork || null},
        ${contractAddress || null},
        ${tokenId || null},
        ${transactionHash || null}
      )
    `;

    return res.status(201).json({
      success: true,
      certificateId
    });

  } catch (error) {
    console.error("ALIMDAR admin registry error:", error);

    return res.status(500).json({
      error: "Spremanje potvrde nije uspjelo."
    });
  }
}
