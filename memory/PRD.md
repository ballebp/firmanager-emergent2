# Firmanager PRD (Product Requirements Document)

## Opprinnelig problemstilling
Serviceadministrasjonsapplikasjon for håndtering av kundeadministrasjon, fakturering, ruteplanlegging, HMS, produktkatalog, økonomi og resultatrapportering.

## Teknisk stack
- **Backend:** FastAPI (Python)
- **Frontend:** React
- **Database:** MongoDB
- **Autentisering:** JWT
- **Styling:** TailwindCSS

## Implementert funksjonalitet

### ✅ Fullført (Januar 2026)
- [x] **Navn endret** fra ServicePro til **Firmanager**
- [x] **Dashboard** med månedsoppsummering, kommende oppgaver, siste aktivitet
- [x] **Kunder** med 1072 importerte kunder fra Excel, flervalg/slett, søk, expand/collapse
- [x] **Produktkatalog** med bildestøtte (URL og fil-opplasting), flervalg/slett
- [x] **Fakturagrunnlag** med scroll på modal, flervalg/slett
- [x] **Intern side** med rediger/slett funksjonalitet
- [x] **Ruteplanlegger** med:
  - Områdefilter (postnr/poststed/kommune)
  - **Lim inn anleggsnr** modus for paste av liste
  - Geo-optimalisering basert på postnr og adresse
  - Kjøreseddel med print-funksjon
- [x] **Økonomi** med:
  - Roller (ansatte med satser)
  - Tjenester med import fra Excel (58 tjenester)
  - **Produsent** (tidligere Leverandør) - støtte for flere produsenter med navn og satser
  - Kobling mellom tjeneste og produsent
- [x] **Resultater** med 3 kategorier:
  - Intern Resultater (intern timesats × timer)
  - PA Resultater (alle ansatt-satser)
  - **Bedrift Inntjening** (tjenester + produsent-satser per tjeneste)
  - **FIKSET:** Koblingen kunde.typenr → service.tjenestenr fungerer nå korrekt
  - Fordelt per Produsent breakdown
- [x] **HMS** med risikovurdering, hendelser, opplæring, utstyr
- [x] **Kjøreseddel** med tekniske målefelt for utfylling

### 📋 Backlog
- [ ] **(P2)** Ekte geo-optimalisering via ekstern kartleggings-API (Google Maps, etc.)
- [ ] **(P2)** Refaktorering av Economy.js til mindre komponenter
- [ ] **(P3)** Rapporter og eksport (PDF, Excel)

## Teststatus
- ✅ Testing iteration 1-6: Alle tester bestått
- ✅ Backend: 17/17 tests passed
- ✅ Frontend: 100%

## Testinformasjon
- **Email:** test@test.com
- **Password:** test
- **Eksempel anleggsnr:** 63798, 63856, 63966, 66340, 66120

## Database-skjema

### users
```json
{
  "id": "uuid",
  "email": "string",
  "name": "string",
  "role": "user|admin|manager",
  "password_hash": "string",
  "created_at": "datetime"
}
```

### customers
```json
{
  "id": "uuid",
  "anleggsnr": "string",
  "kundennr": "string",
  "kundnavn": "string",
  "typenr": "string",
  "typenavn": "string",
  "kommune": "string",
  "adresse": "string",
  "postnr": "string",
  "poststed": "string",
  "service_intervall": "string",
  "uke": "string",
  "serviceansvarlig": "string",
  "telefon1": "string",
  "telefon2": "string",
  "epost": "string",
  "startdato": "string",
  "styreenhet": "string",
  "kommentar": "string",
  "kundeinfo": "string",
  "tjeneste_nr": "string",
  "created_at": "datetime"
}
```

### employees
```json
{
  "id": "uuid",
  "initialer": "string",
  "navn": "string",
  "epost": "string",
  "telefon": "string",
  "stilling": "string",
  "intern_sats": "float",
  "faktura_sats": "float",
  "pa_service_sats": "float",
  "pa_montering_sats": "float",
  "pa_timesats": "float",
  "pa_kjoresats": "float",
  "pa_km_sats": "float",
  "created_at": "datetime"
}
```

### products
```json
{
  "id": "uuid",
  "produktnr": "string",
  "navn": "string",
  "beskrivelse": "string",
  "kategori": "string",
  "kundepris": "float",
  "pa_lager": "int",
  "image_url": "string (URL eller /api/uploads/products/...)",
  "created_at": "datetime"
}
```

### services
```json
{
  "id": "uuid",
  "tjenestenr": "string",
  "tjeneste_navn": "string",
  "beskrivelse": "string",
  "leverandor": "string",
  "produsent_id": "uuid (kobling til supplier_pricing)",
  "pris": "float (fast pris)",
  "t1_ekstraservice": "float",
  "t2_ekstraservice_50": "float",
  "t3_ekstraservice_100": "float",
  "t4_ekstraarbeid": "float",
  "t5_kjoretid": "float",
  "t6_km_godtgjorelse": "float",
  "created_at": "datetime"
}
```

### supplier_pricing (Produsent)
```json
{
  "id": "uuid",
  "name": "string (produsent navn)",
  "arbeidstid_rate": "float",
  "kjoretid_rate": "float",
  "km_rate": "float",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

### work_orders
```json
{
  "id": "uuid",
  "customer_id": "uuid",
  "employee_id": "uuid",
  "date": "datetime",
  "order_type": "service|ekstra|montering",
  "status": "planlagt|fullført|avbrutt",
  "description": "string",
  "arbeidstid": "float",
  "kjoretid": "float",
  "kjorte_km": "float",
  "created_at": "datetime"
}
```

### internal_orders
```json
{
  "id": "uuid",
  "avdeling": "string",
  "date": "datetime",
  "employee_id": "uuid",
  "beskrivelse": "string",
  "arbeidstid": "float",
  "task_type": "kontor|ekstra|montering|soknad|vedlikehold|diverse",
  "kommentar": "string",
  "created_at": "datetime"
}
```

### routes
```json
{
  "id": "uuid",
  "date": "datetime",
  "anleggsnr_list": ["string"],
  "optimized": "boolean",
  "created_at": "datetime"
}
```

## API-endepunkter

### Autentisering
- `POST /api/auth/register` - Registrer bruker
- `POST /api/auth/login` - Logg inn
- `GET /api/auth/me` - Hent innlogget bruker

### Kunder
- `GET /api/customers` - Hent alle kunder
- `POST /api/customers` - Opprett kunde
- `PUT /api/customers/{id}` - Oppdater kunde
- `DELETE /api/customers/{id}` - Slett kunde
- `POST /api/customers/import` - Importer fra Excel
- `GET /api/customers/{anleggsnr}/service-pricing` - Hent tjenestepris for kunde

### Produkter
- `GET /api/products` - Hent alle produkter
- `POST /api/products` - Opprett produkt
- `PUT /api/products/{id}` - Oppdater produkt
- `DELETE /api/products/{id}` - Slett produkt
- `POST /api/products/{id}/upload-image` - Last opp produktbilde
- `GET /api/uploads/products/{filename}` - Hent produktbilde

### Ruter
- `GET /api/routes` - Hent alle ruter
- `POST /api/routes` - Opprett rute (geo-optimalisert)

### Økonomi
- `GET /api/economy/services` - Hent alle tjenester
- `POST /api/economy/services` - Opprett tjeneste
- `PUT /api/economy/services/{id}` - Oppdater tjeneste
- `DELETE /api/economy/services/{id}` - Slett tjeneste
- `POST /api/economy/services/import` - Importer tjenester fra Excel
- `GET /api/economy/supplier-pricing` - Hent alle produsenter
- `POST /api/economy/supplier-pricing` - Opprett produsent
- `PUT /api/economy/supplier-pricing/{id}` - Oppdater produsent
- `DELETE /api/economy/supplier-pricing/{id}` - Slett produsent

### Dashboard
- `GET /api/dashboard/stats` - Hent statistikk

## Filstruktur
```
/app/
├── backend/
│   ├── .env
│   ├── requirements.txt
│   ├── server.py
│   ├── seed_data.py
│   ├── import_customers.py
│   └── uploads/
│       └── products/
└── frontend/
    ├── .env
    ├── package.json
    └── src/
        ├── components/ui/
        ├── contexts/
        ├── pages/
        │   ├── Customers.js
        │   ├── Dashboard.js
        │   ├── Economy.js
        │   ├── HMS.js
        │   ├── Internal.js
        │   ├── Invoicing.js
        │   ├── Login.js
        │   ├── Products.js
        │   ├── Results.js
        │   └── Routes.js
        ├── services/
        │   └── api.js
        ├── App.js
        └── index.js
```
