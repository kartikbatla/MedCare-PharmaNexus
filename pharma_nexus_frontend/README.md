# PharmaNexus — Pharma Supply Chain & Retail Portal

A premium, enterprise-grade React frontend with two separated experiences:

1. **Admin / Distributor** — an end-to-end pharmaceutical supply chain and
   procure-to-pay command center.
2. **Retailer** — a B2B medicine-ordering platform where pharmacies browse the
   PharmaNexus catalogue, build B2B carts, and check out through a 4-step flow.
   Retail orders flow back into the admin portal as material requests.

Built as an interactive hackathon demo — all operational, pricing, stock and
delivery data is **simulated and clearly labeled** as demo/indicative.

## Stack

- **Vite 8** + **React 19** + **TypeScript**
- **Tailwind CSS v3** (custom brand palette, see `tailwind.config.js`)
- **Recharts 3** (demand / inventory analytics)
- **react-router-dom v7** (HashRouter for zero-config static hosting)
- **lucide-react** icons

## Getting started

```bash
npm install
npm run dev          # start dev server (http://localhost:5173)
npm run build        # type-check + production build → dist/
npm run preview      # serve the production build
npm run lint         # oxlint
```

## Sign in

The app is auth-gated and opens on a **portal selection** screen.

- **`/#/login`** — landscape "Choose Your Portal" (Admin / Retailer) with quick
  demo access for each portal.
- **`/#/signup`** — enterprise registration (personal → organization → account + terms).
- Auth state persists to `localStorage` (`pharmanexus-auth`); logout is available
  from each portal's profile page.
- Demo logins: `anita.sharma@pharmanexus.in` (Admin) and
  `rahul@carepluspharmacy.in` (Retailer).

## Admin portal (routes under `/#/`)

| Route                    | Page                                    |
| ------------------------ | --------------------------------------- |
| `/#/`                    | Dashboard (control center)              |
| `/#/medicine-catalogue`  | Medicine Catalogue (200-medicine master)|
| `/#/medicine-catalogue/:id` | Medicine record + operational detail |
| `/#/demand-inventory`    | Demand & Inventory                      |
| `/#/replenishment`       | Replenishment (P1)                      |
| `/#/expiry`              | Expiry Management (FEFO)                |
| `/#/material-requests`   | Material Requests                       |
| `/#/suppliers`           | Verified Suppliers                      |
| `/#/purchase-orders`     | Purchase Orders + Material Receipt + 3-Way Matching |
| `/#/payments`            | Payment Approval                        |
| `/#/retailers`           | Retailer Management (onboarding dashboard) |
| `/#/retailers/onboard`   | Onboard New Retailer (6-step wizard)    |
| `/#/retailers/:id`       | Retailer Application review & approval  |
| `/#/migration`           | Data Migration (ELT workflow + OCR)     |
| `/#/migrations`          | Migrations (dashboard)                  |
| `/#/analytics`           | P2P Analytics                           |
| `/#/ai-assistant`        | Assistant                               |
| `/#/notifications`       | Notifications                           |
| `/#/profile`             | Profile                                 |

The admin sidebar is organized as **Overview · Inventory · Procurement ·
Finance · Retailer Management · Analytics · Automation**. The dashboard is a
decluttered control center that follows the hierarchy **KPI row → Procurement
Recommendations → Inventory Summary → Recent Activity**: recommendations are
computed from live inventory (stock vs safety level vs forecast demand), the top
2 show inline with a "View all (N)" progressive-disclosure button that opens a
side drawer, and each card deep-links to a pre-filled Material Request.

## Retailer portal (routes under `/#/retailer`)

| Route                          | Page                                   |
| ------------------------------ | -------------------------------------- |
| `/#/retailer`                  | Retailer dashboard (recently ordered, quick reorder, popular) |
| `/#/retailer/application`      | Your Retailer Application (onboarding status gate) |
| `/#/retailer/medicines`        | Medicines (search + filter drawer)     |
| `/#/retailer/medicines/:id`    | Medicine detail + order panel          |
| `/#/retailer/categories`       | Categories grid                        |
| `/#/retailer/quick-reorder`    | Quick Reorder                          |
| `/#/retailer/cart`             | B2B cart                               |
| `/#/retailer/checkout`         | 4-step checkout                        |
| `/#/retailer/orders`           | My Orders (status flow + reorder)      |
| `/#/retailer/payments`         | Payments                               |
| `/#/retailer/ai-assistant`     | Retailer assistant                     |
| `/#/retailer/notifications`    | Notifications                          |
| `/#/retailer/help`             | Help & Support                         |
| `/#/retailer/profile`          | Profile                                |

Retailer orders follow the flow **Submitted → Under Review → Approved → Shipped →
Delivered** (+ Cancelled), with one-tap Reorder and a 4-step checkout
(Order Details → Delivery Details → Payment → Review) that ends on a trackable
confirmation page. Every placed order automatically creates a **material request**
in the admin portal (marked "Under Review" until fulfilled). The payment step is
labeled a **Demo Payment** environment.

## Master dataset

- The catalogue is sourced from the **PharmaNexus 200-medicine master dataset**
  (`src/data/medicines.ts`): 200 medicines · 20 therapeutic categories · 42
  suppliers · 4 dosage forms, with columns Medicine ID, Medicine Name, Generic
  Name, Therapeutic Category, Dosage Form, Strength, Pack Size, Supplier.
- The dataset contains **no real prices** — the app derives deterministic
  **"Indicative Price (Demo)"** values, always labeled as such.
- Medicine strengths are **representative** and are not prescribing
  recommendations.

## Demo highlights

- **Portal selection** — landscape two-card entry (Admin / Retailer) with tags and
  full PharmaNexus branding on the login page.
- **Admin dashboard** — KPI row → Procurement Recommendations (live inventory,
  top 2 + "View all" drawer, one-click Material Request) → Inventory Summary →
  Recent Activity, with a live "Pending Requests" count.
- **Material Request filters** — a 6-filter bar (Request No., Medicine, Location,
  Priority, Status, Requested by) that combines and clears cleanly; the page
  honors deep-link params (`?open=1&material=…&qty=…&priority=…`) to open a
  pre-filled request modal straight from a recommendation.
- **Notification Center folders** — alerts grouped into Critical / Warning /
  Action Required / Informational with per-folder counts and unread badges,
  severity-coded cards, message references (medicine, PO/invoice, application),
  Open deep-links, and Mark-all-read.
- **Reusable pagination** — every large dataset (200-medicine catalogue, 45
  suppliers, material requests, POs, payments, retailers) pages at 10 rows with
  "Showing X–Y of Z", Prev/Next and windowed page numbers; pages reset to 1 when
  filters change.
- **Retailer AI Assistant** — a single "AI Assistant" button top-right of the
  retailer dashboard opens the assistant in a right-side closable drawer.
- **Admin medicine catalogue** — full 200-medicine master table with filters
  (category, form, strength, pack, supplier) and per-medicine operational detail
  (simulated stock, warehouse, replenishment, stock-out risk, expiry, POs).
- **One-click procurement** — every recommendation carries an action: "Procure
  Now" deep-links to Purchase Orders with the PO pre-filled and a "recommended
  order" banner → user reviews → approves.
- **Supplier intelligence** — suppliers ranked by a transparent supplier score,
  a multi-select location filter (states + union territories), and a "Recommended
  Supplier" selection rationale.
- **Purchase Orders with partial fulfillment** — a PO commits the full order;
  material receipts and invoices follow the quantity actually delivered. Statuses
  run Draft → Approved → Partially Fulfilled → Fully Fulfilled, with fulfillment
  tracking inside each PO's detail panel.
- **3-Way Matching** — PO · Material Receipt · Invoice compared inside each PO
  (ordered vs received vs invoiced) with MATCHED / PARTIAL MATCH / MISMATCH
  verdicts. A partial delivery generates an invoice for the delivered quantity
  only; a second delivery produces a second invoice until the PO is fully matched.
- **Payment Approval** — supplier payment review with release status, a
  downloadable payment receipt, and an approval trail (approver, method, date).
  Each request shows a clickable **3 Way Match** summary (PO + GRN + Invoice)
  that opens a **3 Way Match Details** side drawer with the matched PO line item,
  goods receipt (received vs ordered with remaining units), the invoice used for
  the match (subtotal / GST / logistics / total), a side-by-side **Match
  Comparison** (PO vs GRN vs Invoice) with **✓ Valid Partial Match** /
  **⚠ Mismatch Detected** verdicts and reasons, the financial amount being
  approved, and approve / reject / request-review actions — payments are based
  on the quantity received and invoiced, not the full PO value.
- **Retailer Onboarding & Verification** — an admin-side retailer management
  section: a KPI dashboard with status filters (Pending · Under Review ·
  Documents Required · Verified · Approved · Active · Rejected), a 6-step Onboard
  wizard (Business Details → Documents → Authorized Signatories → Agreement →
  Verification → Review & Approval), and a per-application review page with
  document/signatory/agreement verification, reject-with-reason, request changes,
  approve and activate, plus an audit trail. **Only Active retailers can place
  orders** — unapproved retailers see a "Your Retailer Application" status page
  with a progress stepper and one-tap re-upload for rejected documents.
  Seed data is persisted to `localStorage` (`pharmanexus-retailers-v1`);
  demo retailer logins include `abc@abchealthcare.com` (under review) and
  `rahul@carepluspharmacy.in` (active).
- **Data Migration (ELT)** — a stepwise migration engine for transitioning from
  legacy ERP / spreadsheets / paper records: 6 stages (Setup → Extract → Load →
  Transform → Verify → Finalize) with dry-run, row counts and validation stats,
  an OCR extractor (upload invoice/PO scans and parse fields), field mapping
  review with record previews, duplicate and fuzzy-match handling, and a
  migration status dashboard (`/#/migrations`). Runs fully in-browser and is
  seeded into the retailer onboarding status flow.
- **Inline explanations** — "Selection rationale", "Why did matching fail?",
  "Why was this invoice flagged?" — no black box.
- **Help & Support** — admin and retailer help pages with FAQs, official contact
  placeholders, and a query form.
- **Retailer catalogue** — search across name/generic/category/supplier/form, a
  filter drawer (including indicative price range), and minimal medicine cards
  with indicative pricing.
- **B2B cart & 4-step checkout** — business-style cart table, delivery details,
  demo payment options (UPI / Card / Net Banking / Business Account / Credit
  Invoice), review, confirmation with status timeline, and auto-created material
  requests in the admin portal.
- **Multilingual assistant (admin)** — answers in English, हिन्दी, తెలుగు,
  தமிழ், ಕನ್ನಡ, മലയാളം, বাংলা, मराठी from live platform data with action buttons.

## Data honesty

- **Suppliers are real** companies with verified official contact details;
  performance metrics (price, delivery, quality) are simulated and marked "demo".
- **Medicine prices are indicative** demo values derived deterministically from
  the dataset — never presented as real quotations.
- Every simulated value carries a **"Demo · simulated data"** label on the
  dashboard and a demo-environment note in the sidebar.

## Brand

- Deep Navy `#0F223A`, Muted Blue `#2F466F`, Warm Grey `#EDEAE6`, Charcoal `#1C1C1C`
- Semantic status colors only (success/warning/danger) for state, never decoration.
