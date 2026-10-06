import { neon } from "@neondatabase/serverless";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  // Dozvoljen je samo POST zahtjev.
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  // ADMINISTRATORSKA AUTORIZACIJA
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
    totalHours,
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

  // PROVJERA UKUPNOG FONDA SATI
  let normalizedTotalHours = null;

  if (
    totalHours !== null &&
    totalHours !== undefined &&
    totalHours !== ""
  ) {
    normalizedTotalHours = Number(totalHours);

    if (
      !Number.isFinite(normalizedTotalHours) ||
      normalizedTotalHours < 0
    ) {
      return res.status(400).json({
        error: "Ukupan fond sati nije ispravan."
      });
    }
  }

  // VALID potvrda mora imati stvarni fond sati.
  if (
    status === "VALID" &&
    normalizedTotalHours === null
  ) {
    return res.status(400).json({
      error:
        "Za VALID potvrdu obavezan je stvarni ukupan fond sati."
    });
  }

  // VALID potvrda mora imati datum izdavanja.
  if (
    status === "VALID" &&
    !issueDate
  ) {
    return res.status(400).json({
      error:
        "Za VALID potvrdu obavezan je datum izdavanja."
    });
  }

  // PENDING potvrda nema datum izdavanja.
  const finalIssueDate =
    status === "VALID"
      ? issueDate
      : null;

  try {

    const sql = neon(databaseUrl);

    // Baza automatski dodjeljuje sljedeći Certificate ID.
    const idRows = await sql`
      SELECT next_certificate_id() AS certificate_id
    `;

    if (!idRows.length || !idRows[0].certificate_id) {
      throw new Error(
        "Certificate ID nije generiran."
      );
    }

    const certificateId =
      idRows[0].certificate_id;

    // SPREMANJE POTVRDE U NEON
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
        total_hours,
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
        ${normalizedTotalHours},
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
      status: status,
      totalHours: normalizedTotalHours
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
