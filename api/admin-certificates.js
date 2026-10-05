 import { neon } from "@neondatabase/serverless";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  // Dozvoljen je samo POST zahtjev.
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  // ADMIN AUTORIZACIJA
  const adminKey = process.env.ADMIN_API_KEY;

  const authHeader =
    String(req.headers.authorization || "");

  const suppliedKey =
    authHeader.startsWith("Bearer ")
      ? authHeader.slice(7).trim()
      : "";

  if (!adminKey || suppliedKey !== adminKey) {
    return res.status(401).json({
      error: "Unauthorized"
    });
  }

  // DATABASE
  const databaseUrl =
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL ||
    process.env.STORAGE_URL;

  if (!databaseUrl) {
    return res.status(503).json({
      error: "Registry database is not configured"
    });
  }

  // PODACI IZ ADMIN OBRASCA
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

  // OBAVEZNA POLJA
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

  // PROVJERA DATUMA
  if (periodEnd < periodStart) {
    return res.status(400).json({
      error:
        "Datum završetka ne može biti prije datuma početka."
    });
  }

  // DOZVOLJENI STATUSI
  const allowedStatuses = [
    "PENDING",
    "VALID",
    "REVOKED"
  ];

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({
      error: "Neispravan status."
    });
  }

  // PENDING NE SMIJE IMATI DATUM IZDAVANJA
  const finalIssueDate =
    status === "VALID"
      ? (issueDate || null)
      : null;

  try {
    const sql = neon(databaseUrl);

    // Automatski generira sljedeći Certificate ID.
    // Martina već ima ALM-CON-2026-0001,
    // pa će sljedeći stvarni zapis dobiti 0002.
    const idRows = await sql`
      SELECT next_certificate_id() AS certificate_id
    `;

    const certificateId =
      idRows[0].certificate_id;

    // SPREMANJE U NEON
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
        ${participantName.trim()},
        'Uslužni obrt Alimdar',
        ${area.trim()},
        ${topic.trim()},
        ${periodStart},
        ${periodEnd},
        ${duration?.trim() || null},
        ${workFormat?.trim() || null},
        ${finalIssueDate},
        ${status},
        ${blockchainNetwork?.trim() || null},
        ${contractAddress?.trim() || null},
        ${tokenId?.trim() || null},
        ${transactionHash?.trim() || null}
      )
    `;

    return res.status(201).json({
      success: true,
      certificateId: certificateId,
      status: status
    });

  } catch (error) {
    console.error(
      "ALIMDAR admin registry error:",
      error
    );

    return res.status(500).json({
      error:
        "Spremanje potvrde nije uspjelo."
    });
  }
}
