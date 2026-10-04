const form = document.getElementById("verifyForm");
const input = document.getElementById("certificateId");
const result = document.getElementById("result");

const esc = (v="") => String(v).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
const show = html => { result.innerHTML = html; result.classList.remove("hidden"); result.scrollIntoView({behavior:"smooth",block:"nearest"}); };
const value = v => v ? esc(v) : "Nije evidentirano";

async function verify(id){
  id = id.trim().toUpperCase();
  if(!/^ALM-CON-\d{4}-\d{4,}$/.test(id)){
    show(`<span class="status notfound">NEISPRAVAN FORMAT</span><h2>Provjerite Certificate ID</h2><p>Očekivani format je ALM-CON-YYYY-NNNN.</p>`);
    return;
  }
  show(`<span class="status notfound">PROVJERA...</span><h2>${esc(id)}</h2>`);
  try{
    const r = await fetch(`/api/certificates?id=${encodeURIComponent(id)}`, {headers:{"Accept":"application/json"}});
    if(r.status === 404){
      show(`<span class="status notfound">NIJE PRONAĐEN</span><h2>${esc(id)}</h2><p>Za navedeni identifikator nije pronađen javni zapis.</p>`);
      return;
    }
    if(!r.ok) throw new Error("server");
    const c = await r.json();
    const revoked = c.status === "REVOKED";
    show(`
      <span class="status ${revoked?"revoked":"valid"}">${revoked?"REVOKED":"VALID"}</span>
      <h2>${value(c.certificateId)}</h2>
      <div class="data-grid">
        <div><small>Ime i prezime</small><strong>${value(c.participantName)}</strong></div>
        <div><small>Izdavatelj</small><strong>${value(c.issuer)}</strong></div>
        <div><small>Područje savjetovanja</small><strong>${value(c.area)}</strong></div>
        <div><small>Tema</small><strong>${value(c.topic)}</strong></div>
        <div><small>Datum savjetovanja</small><strong>${value(c.date)}</strong></div>
        <div><small>Trajanje</small><strong>${value(c.duration)}</strong></div>
      </div>
      <div class="blockchain"><h3>BLOCKCHAIN VERIFICATION</h3>
        <div class="data-grid">
          <div><small>Network</small><strong>${value(c.blockchain?.network)}</strong></div>
          <div><small>Token ID</small><strong>${value(c.blockchain?.tokenId)}</strong></div>
          <div><small>Contract Address</small><strong>${value(c.blockchain?.contractAddress)}</strong></div>
          <div><small>Transaction Hash</small><strong>${value(c.blockchain?.txHash)}</strong></div>
        </div>
      </div>`);
  }catch(e){
    show(`<span class="status revoked">GREŠKA</span><h2>Provjera trenutačno nije dostupna</h2><p>Pokušajte ponovno kasnije ili kontaktirajte ALIMDAR.</p>`);
  }
}

form.addEventListener("submit", e => {e.preventDefault(); const id=input.value.trim(); history.replaceState(null,"",`/?id=${encodeURIComponent(id)}`); verify(id);});
const params = new URLSearchParams(location.search);
if(params.get("id")){ input.value=params.get("id").toUpperCase(); verify(input.value); }
