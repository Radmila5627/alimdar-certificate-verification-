# ALIMDAR Certificate Verification V4 — Production

Službeni javni frontend za provjeru ALIMDAR potvrda o sudjelovanju u stručnom savjetovanju.

## Važno
Ovaj paket NE sadrži izmišljene certifikate, demo klijente niti stvarne osobne podatke.
Javni frontend nikada ne treba sadržavati privatnu bazu klijenata.

## Funkcije
- Certificate ID format: `ALM-CON-YYYY-NNNN`
- direktni QR/URL ulaz: `https://VAŠA-DOMENA.vercel.app/?id=ALM-CON-2026-0001`
- status `VALID` / `REVOKED`
- javno dopušteni podaci certifikata
- Blockchain Verification: Network, Contract Address, Token ID, Transaction Hash
- ako blockchain podatak ne postoji: `Nije evidentirano`
- originalni ALIMDAR logo
- responsive dizajn
- serverless API proxy s allowlistom javnih polja
- nema javnog OIB-a ni adrese

## Prije stvarnog izdavanja prvog certifikata
Potrebno je povezati privatni registar/bazu. U Vercel Environment Variables postaviti:
- `CERTIFICATE_API_URL`
- `CERTIFICATE_API_KEY`

Dok baza nije povezana, sustav namjerno vraća "Certificate not found". To je sigurnije nego prikazivati izmišljene podatke.

## GitHub → Vercel
1. Kreirajte novi GitHub repository, preporučeni naziv:
   `alimdar-certificate-verification`
2. Uploadajte SAV sadržaj ove mape u root repozitorija.
3. U Vercelu: Add New → Project → Import Git Repository.
4. Framework preset može ostati `Other`.
5. Deploy.
6. Nakon što dobijete konačnu Vercel domenu, tek tada generirajte QR poveznice.

## QR pravilo
QR za pojedini certifikat treba sadržavati samo javni verification URL, npr.:
`https://KONACNA-DOMENA/?id=ALM-CON-2026-0001`

Nemojte u QR direktno zapisivati ime, e-mail, OIB, adresu ili druge osobne podatke.

## Javni kontakt
Uslužni obrt Alimdar
alimdarweb3@gmail.com
https://alimdarblog.wordpress.com

## Pravna napomena
Ova potvrda evidentira sudjelovanje navedene osobe u stručnom savjetovanju koje je proveo Uslužni obrt Alimdar. Ne predstavlja javnu ispravu, diplomu, formalnu kvalifikaciju niti dokaz stručne spreme.
