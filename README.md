# Palato Operations Framework
**v1.1 · Internal · Based on Palato Daily Operations Framework**

Multi-site food business operations platform covering Opening, Closing, Production/Dispatch, Waste, Close Gate, and Management dashboards.

---

## Stack
| Layer | Tech |
|---|---|
| Backend API | Laravel 11 + Sanctum |
| Admin Panel | Filament v3 |
| Frontend | Next.js 14 (App Router) + TypeScript |
| Styling | Tailwind CSS |
| Database | MySQL 8.0 |
| Queue/Cache | Redis |
| Reverse Proxy | Nginx + Certbot SSL |
| Containers | Docker Compose |
| Storage | DigitalOcean Spaces (S3-compatible) |
| Notifications | WhatsApp via Vonage + Email |

---

## Sites
- Café Malé (Retail)
- Hulhumalé (Retail)
- Central Production Kitchen (Production)
- Bakehouse (Production + Retail)

## Roles
| Role | Access |
|---|---|
| `shift_manager` | Opening, Closing, Close Gate, Cash Recon, Waste, Receive |
| `production_lead` | Opening (kitchen), Dispatch create, Production plan, Waste |
| `operations_head` | All of above + override approvals + daily review dashboard |
| `finance` | Cash verification + monthly reconciliation |
| `owner` | Full read + Red incidents + weekly dashboard |

---

## Local Development

### 1. Clone and configure
```bash
git clone <repo> Palato
cd Palato
cp .env.example .env
# Fill in DB_PASSWORD, APP_KEY, VONAGE_KEY, S3 credentials
```

### 2. Start containers
```bash
docker-compose up -d
```

### 3. Bootstrap Laravel
```bash
docker exec palato_api php artisan key:generate
docker exec palato_api php artisan migrate --seed
docker exec palato_api php artisan storage:link
```

### 4. Install frontend deps
```bash
cd frontend
npm install
npm run dev
```

### 5. Access
- Frontend: http://localhost:3000
- API: http://localhost:8000
- Default login: `aisha@palato.mv` / `changeme`

---

## Production Deployment (DigitalOcean)

### SSL certificates
```bash
# First run (HTTP only, before HTTPS enabled):
docker-compose run --rm certbot certonly --webroot \
  -w /var/www/certbot \
  -d api.palato.mv \
  -d app.palato.mv \
  --email ops@palato.mv --agree-tos
```

### Deploy
```bash
git pull
docker-compose build api frontend
docker-compose up -d
docker exec palato_api php artisan migrate --force
docker exec palato_api php artisan config:cache
docker exec palato_api php artisan route:cache
```

---

## Architecture

```
Palato/
├── backend/                   # Laravel 11 API
│   ├── app/
│   │   ├── Http/Controllers/Api/
│   │   │   ├── AuthController.php
│   │   │   ├── DashboardController.php   # Owner daily + weekly
│   │   │   ├── OpeningController.php
│   │   │   ├── ClosingController.php
│   │   │   ├── DispatchController.php    # 3-confirmation protocol
│   │   │   ├── WasteController.php
│   │   │   ├── CloseGateController.php
│   │   │   ├── IncidentController.php
│   │   │   └── CashReconciliationController.php
│   │   ├── Models/
│   │   │   ├── User.php
│   │   │   ├── Site.php
│   │   │   ├── OpeningLog.php
│   │   │   ├── DispatchRecord.php
│   │   │   ├── WasteEntry.php
│   │   │   ├── CloseGateSubmission.php
│   │   │   ├── CashReconciliation.php
│   │   │   ├── TemperatureLog.php
│   │   │   ├── Incident.php
│   │   │   └── SkuCost.php
│   │   ├── Services/
│   │   │   ├── EscalationService.php     # GREEN/AMBER/RED logic
│   │   │   └── CloseGateService.php      # Override + segregation
│   │   └── Notifications/
│   │       ├── RedIncidentNotification.php
│   │       └── AmberIncidentNotification.php
│   ├── database/migrations/   # Full schema
│   └── routes/api.php
│
├── frontend/                  # Next.js 14
│   └── src/
│       ├── app/               # App Router pages
│       ├── lib/
│       │   ├── api.ts         # Typed API client
│       │   └── store.ts       # Zustand auth store
│       └── components/        # Shared UI
│
├── nginx/conf.d/palato.conf   # Reverse proxy + SSL
├── docker-compose.yml
└── .env.example
```

---

## Module Status

| Module | Backend | Frontend | Notes |
|---|---|---|---|
| Auth | ✅ Routes defined | ✅ Store ready | Implement controllers |
| Opening Checklist | ✅ Migration | 🔲 Page needed | |
| Close Gate (13 checks) | ✅ Migration + Service | 🔲 Page needed | |
| Dispatch (3-confirm) | ✅ Full controller | 🔲 Page needed | |
| Waste Register | ✅ Migration | 🔲 Page needed | |
| Cash Reconciliation | ✅ Migration | 🔲 Page needed | |
| Temperature Logs | ✅ Migration | 🔲 Page needed | |
| Incidents + Escalation | ✅ EscalationService | 🔲 Page needed | |
| Owner Dashboard | ✅ DashboardController | 🔲 Page needed | |
| Filament Admin | 🔲 Not started | — | Week 3 |
| WhatsApp Notifications | 🔲 Not started | — | Week 4 |

---

## Escalation Rules (implemented in EscalationService)

| Variance | GREEN | AMBER | RED |
|---|---|---|---|
| Cash | ≤ MVR 50 | MVR 51–500 | > MVR 500 or suspected theft |
| Temperature | Within range | Out of range, corrected | Overnight breach |
| Dispatch | 0 variance | 1 unit, low value | > 1 unit or high-value item |
| Waste | Below threshold | Threshold breach | Concealment or major batch |

---

*v1.1 — Build against pilot data. Thresholds to be revised after Week 4.*

---

## Build Complete — Module Status (Updated)

| Module | Backend | Frontend | Notes |
|---|---|---|---|
| Auth | ✅ AuthController | ✅ Login page | Sanctum tokens |
| Opening Checklist | ✅ OpeningController | ✅ Multi-phase wizard | Auto temp escalation |
| Closing Checklist | ✅ ClosingController | ✅ 5-phase wizard | Cash variance auto-raises |
| Close Gate (13 checks) | ✅ CloseGateService | ✅ Full checklist + override | Segregation of duties |
| Dispatch (3-confirm) | ✅ DispatchController | ✅ Full log + inline receive | Pack→Driver→Outlet |
| Waste Register | ✅ WasteController | ✅ Form + log + summary | SKU cost lookup |
| Cash Reconciliation | ✅ CashReconController | ✅ Submit + Finance verify | Variance thresholds |
| Temperature Logs | ✅ TemperatureController | ✅ Log + breach tracking | Auto AMBER/RED |
| Incidents | ✅ IncidentController | ✅ List + resolve flow | Role-gated resolve |
| Owner Dashboard | ✅ DashboardController | ✅ Full KPI view | 60s auto-refresh |
| Role Middleware | ✅ RoleMiddleware | ✅ Zustand + route guard | 5 roles |
| WhatsApp Notify | ✅ Notifications | ⏳ Vonage keys needed | RED + AMBER |
| Filament Admin | ⏳ Next sprint | — | Week 3-4 |
