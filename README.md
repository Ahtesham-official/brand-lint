# BrandLint

> **“ESLint for brand content, with evidence and human approval”**  
> *v1.0 — Hackathon Round 2 Prototype*

BrandLint is an AI-assisted brand-governance platform that turns a brand's guideline document into a machine-readable, cited rulebook, lints submitted content (captions + poster images) against those rules and an approved Fact Vault, and returns an evidence-backed issue report with severity, confidence, citations, and one-click fix suggestions.

**Core Principle:** *AI detects and explains. Humans decide and approve. This is the compiler for brand content.*

---

## 🚀 Key Features

1. **Guideline Ingestion & Rulebook Extraction (Admin)**
   - Upload PDF guideline or paste raw text.
   - LLM extraction with strict JSON schema into atomic rules (`banned_term`, `required_disclaimer`, `tone`, `messaging`, `claim_policy`, `visual_colour`, `visual_contrast`).
   - Every rule contains a verbatim source citation and confidence score. Rules with confidence `< 0.6` are visually flagged as **“Needs confirmation”**.
   - Admin can edit, add, or delete rules, then click **“Confirm Guideline”** to make them active.

2. **Fact Vault (Approved Claims Database)**
   - Single source of truth for marketing claims, source documents, source URLs, and expiry dates.
   - Real-time expiry highlighting (expired records in red badge).
   - Brand-scoped verification.

3. **Sequential Pre-Flight Check Engine (Creator)**
   - **Deterministic Checks (No LLM, 100% reliable):**
     - Banned-term regex matching against confirmed rules.
     - Required disclaimer validation (mandated legal phrases).
     - Color palette compliance via ΔE color distance against approved & forbidden brand swatches.
     - WCAG AA contrast ratio calculation (minimum 4.5:1 requirement).
   - **AI Checks (with deterministic fallback):**
     - Tone of voice analysis (hype, clickbait, exclamation mark pressure).
     - Claim extraction & Fact Vault cross-checking (detects unsupported claims & direct contradictions).

4. **Cited Issue Report (“The Wow Screen”)**
   - **Overall Brand Risk Score**: Weighted aggregate (`severity × confidence`, scaled 0–100).
   - **Interactive Highlighted Text Spans**: Visual spans linked to corresponding issue cards.
   - **Expandable “Why this flag?” Evidence Panel**: Verbatim citation quote, confidence %, and structured evidence chain for **100% of issues**.
   - **One-Click Fix Suggestions with Visual Diff**: Side-by-side / inline diff modal showing original vs suggested text. Accepting the fix updates copy live and immediately recalculates the risk score!

5. **Authoritative Reviewer Workflow (Reviewer)**
   - Review queue of analyzed submissions.
   - Comment box and one-click **Approve** or **Request Changes** decisions.
   - Minimal audit event trail (`submitted` → `analyzed` → `fix_applied` → `reviewed`).

6. **Interactive Demo Script (2m 45s Walkthrough)**
   - Top banner **“Demo Script (2m 45s)”** modal walking through each beat of Section 17.2 of the PRD.
   - Instant Demo Role Switcher (`DEMO_MODE=true`): Admin, Creator, Reviewer in `<10 seconds`.

---

## 🛠 Tech Stack

- **Frontend & Fullstack API**: Next.js 14, React 18, TypeScript, Tailwind CSS, Lucide Icons
- **Check Engine**: Pure TypeScript sequential pipeline + color science algorithms (ΔE color distance, relative luminance, WCAG contrast)
- **State Management**: Reactive in-memory store with `localStorage` persistence
- **Deployable**: Vercel / Render / Railway

---

## 🏁 Quickstart

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Production Build & Start
```bash
npm run build
npm start
```

---

## 🎬 2m 45s Demo Walkthrough (PRD Section 17.2)

1. **Problem Framing (0:00 - 0:15)**: Open app header showing BrandLint tagline and Apex Audio brand profile.
2. **Admin Guideline Review (0:15 - 0:40)**: In **Admin** role, inspect extracted rules with citations and confidence scores. Notice rule `< 0.6` marked *"Needs confirmation"*. Click **Confirm Rules**.
3. **Fact Vault (0:40 - 0:55)**: Switch to Fact Vault tab. Point to *"12-month standard manufacturer warranty"* (active) and expired sustainability claim (red).
4. **Creator Submission (0:55 - 1:25)**: Switch to **Creator** role. Click **“Load PRD Demo Case”** to populate `"India's #1 — 24-month warranty!"` with off-palette poster. Click **Run BrandLint Check**.
5. **Cited Issue Report (1:25 - 2:10)**: Risk score jumps to **100/100 (Critical)**. See cited flags:
   - Superlative *"India's #1"* (banned term)
   - Superlative *"unbeatable"* (banned term)
   - Contradicted claim: *"24-month warranty"* vs Fact Vault FV-101 (*"12-month standard manufacturer warranty"*)
   - Tone mismatch: aggressive hype & exclamation spam
   - Missing required disclaimer: *"Terms & conditions apply. See website for details."*
   - Off-palette color `#E11D48` (ΔE: 48.6)
   - WCAG contrast failure (2.8:1 vs 4.5:1 required)
6. **“Why this flag?” (2:10 - 2:30)**: Expand the warranty contradiction card. Show verbatim citation and 98% confidence.
7. **Apply Fix (2:30 - 2:45)**: Click **Apply Fix** → visual diff opens → click **Accept Fix**. Caption updates live to 12-month warranty!
8. **Reviewer Decision (2:45 - 3:00)**: Switch to **Reviewer** role → open submission → click **Decide** → leave comment → **Approve Submission**. Event logged in audit log!
9. **Close (3:00 - 3:05)**: *“AI detects and explains. Humans decide and approve. This is the compiler for brand content.”*

---

## 📡 API Surface (v1)

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/auth/me` | Current user + role |
| `POST` | `/api/auth/demo-login` | Fast seeded role switch |
| `POST` | `/api/auth/magic-link` | Magic link simulation |
| `GET` | `/api/brands/[id]` | Brand profile & palette |
| `PATCH` | `/api/brands/[id]` | Update palette / logo |
| `GET` | `/api/guidelines` | List guidelines |
| `POST` | `/api/guidelines` | Upload guideline (PDF or text) |
| `POST` | `/api/guidelines/[id]/extract` | Run rule extraction |
| `GET` | `/api/guidelines/[id]/rules` | List guideline rules |
| `POST` | `/api/guidelines/[id]/confirm` | Confirm all rules |
| `PATCH` | `/api/rules/[id]` | Edit rule |
| `DELETE` | `/api/rules/[id]` | Delete rule |
| `GET` / `POST` | `/api/facts` | Fact Vault CRUD |
| `PATCH` / `DELETE`| `/api/facts/[id]` | Fact Vault item edit / delete |
| `POST` | `/api/submissions` | Create submission (caption + image) |
| `GET` | `/api/submissions` | List submissions |
| `GET` | `/api/submissions/[id]` | Submission detail + issues |
| `POST` | `/api/submissions/[id]/analyze` | Run check engine |
| `GET` | `/api/submissions/[id]/issues` | Issue report |
| `POST` | `/api/issues/[id]/apply-fix` | Apply one-click fix suggestion |
| `POST` | `/api/submissions/[id]/review` | Reviewer decision (approve/request changes) |
| `GET` | `/api/audit-logs` | Minimal event log trail |
