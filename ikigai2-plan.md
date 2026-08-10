# Ikigai2 — Master Architecture Plan (V2 Native Update)

> [!CAUTION]
> **LEGACY PLAN DEPRECATED**
> The implementation plan detailed below (from Phase 1 to Phase 10) was the original strategy to sync databases between `ikigai` and `ikigai2`. **This approach was abandoned.** We performed a complete hard-reset of the codebase and rebuilt the platform to operate entirely natively on the `ikigai2` database.
> The original plan is retained below strictly for historical record.

## What We Actually Built (Current Native V2 Architecture)
- **Stack**: MERN (MongoDB, Express, React, Node.js) with Vite and TailwindCSS v4.
- **Database**: Single Source of Truth is the `ikigai2` database. No cross-database synchronization.
- **Authentication**: JWT-based. All users (Admins, Evaluators, Judges, Team Leaders) authenticate exclusively via a unified `users` collection.
- **Data Models**:
  - **Team (`teams`)**: Stores all participant details natively. Embeds an `assessments` array to store evaluation scores directly on the team document.
  - **Event (`events`)**: Represents physical hackathon events. Natively embeds a copy of `selectedTracks` to isolate tracks per-event and prevent cross-contamination bugs.
- **Frontend Paradigms**:
  - **Mobile-First Design**: Bottom Navigation Bars for mobile, Sidebars/Top Tabs for desktop.
  - **Premium UI**: Pink/Purple rich gradients utilizing Ikigai 1 design tokens found in `index.css`.
  - **Global Auth**: Managed via `AuthContext.jsx`. The API wrapper (`config/api.js`) automatically attaches the `ikigai_token`.
- **Key Dashboards Built**:
  - **Admin Progress**: Complex UI rendering Event Picker -> Horizontal Track Selector -> Nested Evaluator Sidebar -> Evaluator Task Details.
  - **Evaluator Console**: Evaluators submit range-based scores (0-10) for 5 criteria, aggregating into a `totalScore` directly patched to the Team's `assessments` array.

---
*(Below is the original, deprecated implementation plan)*

# Ikigai2 — Complete Implementation Plan (LEGACY)

## Background & Context

**Ikigai** is a hackathon management platform for CSIT. `ikigai1` (Round 1) is already deployed and in production. `ikigai2` (Round 2) is a **brand new codebase** that must:

1. **Reuse the exact UI aesthetics** from ikigai1 (color palette, component styling, layout patterns)
2. **Re-implement 4 admin tabs identically: Events, Progress, Users, and the new Mailing Service**
3. **Add 2 new admin sidebar items**: "Sessions" and "Inventory" (plus a placeholder for refreshment sessions — name TBD, see below)
4. **Reuse evaluator assessment UI** from ikigai1 (as-is for now; future enhancements planned)
5. **Add a student coordinator role** (placeholder only — no features yet)
6. **Adopt ikigai1's features but NOT its architecture** — ikigai2 must be properly structured for production scalability
7. **Use the same MongoDB Atlas cluster** but target the `ikigai2` database instead of `ikigai` 
8. **Fix the track-save cross-contamination bug** from ikigai1

> [!IMPORTANT]
> ### Open Questions Resolved
> 1. **Mailing Service**: We will port the dedicated `AdminMailingService` and `mailing.routes.js` that was recently added to ikigai1. However, the logic will be updated to *only* query the new Round 2 `Team` collection in the ikigai2 database, ignoring the legacy Round 1 collections (`Shortlisted`, `Participant`).
> 2. **Refreshment Sessions**: Named "Refreshments". Added as a placeholder in the sidebar.
> 3. **Evaluator vs Judge distinction**: Implemented a single `evaluator` role fully. A `judge` role will also be explicitly stubbed out with its own model, backend route file, and frontend route placeholder to prepare for future feature differentiation.
> 4. **Team Leader portal**: Not included in the initial build.
> 5. **Legacy Admin Tabs**: "Shortlist", "Round 2", and "Close Registration" removed entirely from the sidebar.
> 6. **Assets**: Reusing `ikigai.png` from ikigai1.
> 7. **Tailwind Colors**: The legacy `green-*` colors that render as pink/purple will be globally renamed to `primary-*` to avoid confusion.
> 8. **Excluded Libraries**: `@dnd-kit`, `react-qr-code`, `react-pdf`, and `papaparse` have been restored to the package.json as they will be needed later.
> 9. **Custom Report Builder**: Skipped for the initial build.
> 10. **Database Mapping**: Evaluators and Events will start fresh in `ikigai2`. The `TeamLeader` model will map strictly to the existing `teams` collection which holds the Round 2 registrations. We will maintain separated collections for roles (e.g. `sessionchairs`, `studentcoordinators`) identical to ikigai1 to prevent auth manipulation bugs.
> 11. **Assessments Schema & Flow**: Evaluators will be independent of the teams they evaluate to prevent wrong-room errors. The `teams` schema will embed an `assessments` object with arrays grouped by role (`evaluator`, `judge`) to handle multiple reviews per team seamlessly.

---

## Proposed Changes

### Overview of Architecture Differences (ikigai1 → ikigai2)

| Aspect | ikigai1 (Problems) | ikigai2 (Target) |
|---|---|---|
| Backend `server.js` | 3022 lines, all schemas + routes inline | ~80 line orchestrator; models, routes, middleware in separate files |
| Frontend `App.jsx` | 5151 lines, all components inline | ~100 line router; pages and components in organized directories |
| Auth | `sessionStorage` with `care_*` keys, no JWT on requests | JWT in `localStorage` as `ikigai_token`, `authFetch()` wrapper |
| DB connection | Connects to `ikigai` database | Connects to `ikigai2` database on same Atlas cluster |
| WebSocket | None (polling-based refresh) | Socket.io for real-time updates |
| Caching | None | In-memory LRU cache for hot queries |
| API protection | None (all routes public) | `requireAuth(...roles)` middleware on every route |
| CSS Semantics | Pink/purple colors named `green-*` | Pink/purple colors renamed to `primary-*` |

---

### Phase 1 — Project Scaffolding

#### [NEW] Project root structure

Create the full ikigai2 project skeleton:

```
ikigai2/
├── backend/
│   ├── server.js                    (~80 lines: imports, middleware, mount, listen)
│   ├── middleware/
│   │   └── auth.js                  (requireAuth with JWT verification)
│   ├── models/
│   │   ├── Event.js                 (Event + embedded Track schema)
│   │   ├── SessionChair.js          (Evaluator model)
│   │   ├── Judge.js                 (Judge model - empty placeholder)
│   │   ├── StudentCoordinator.js
│   │   └── TeamLeader.js            (Round 2 Team registrations)
│   ├── routes/
│   │   ├── auth.routes.js           (login, OTP, password change)
│   │   ├── admin.routes.js          (events CRUD, tracks, evaluators, users)
│   │   ├── mailing.routes.js        (dedicated mailing service)
│   │   ├── evaluator.routes.js      (session data, assessment)
│   │   ├── judge.routes.js          (empty placeholders for now)
│   │   └── student.routes.js        (empty placeholders for now)
│   ├── utils/
│   │   ├── hash.js                  (password hashing)
│   │   ├── otp.js                   (OTP generation + store)
│   │   ├── mailer.js                (Brevo email sender)
│   │   └── cache.js                 (LRU in-memory cache)
│   ├── .env
│   ├── package.json
│   └── .gitignore
├── frontend/
│   ├── index.html
│   ├── vite.config.js
│   ├── postcss.config.js
│   ├── eslint.config.js
│   ├── .env
│   ├── package.json
│   └── src/
│       ├── main.jsx
│       ├── App.jsx                  (~100 lines: BrowserRouter + route definitions)
│       ├── index.css                (Tailwind + ikigai color palette)
│       ├── config/
│       │   ├── api.js               (API_BASE, authHeaders(), authFetch())
│       │   └── constants.js         (ASSESSMENT_CRITERIA, role labels)
│       ├── components/
│       │   ├── shared/
│       │   │   ├── Header.jsx
│       │   │   ├── ChangePasswordModal.jsx
│       │   │   └── ConfirmDeleteModal.jsx
│       │   ├── admin/
│       │   │   ├── EventCard.jsx
│       │   │   ├── TrackItem.jsx
│       │   │   ├── TrackList.jsx
│       │   │   ├── EvaluatorList.jsx
│       │   │   ├── DefineCriteriaModal.jsx
│       │   │   └── AssignTeamsModal.jsx
│       │   └── evaluator/
│       │       └── SlideViewer.jsx
│       ├── pages/
│       │   ├── Login.jsx
│       │   ├── UpdatePassword.jsx
│       │   ├── admin/
│       │   │   ├── AdminLayout.jsx  (sidebar + outlet)
│       │   │   ├── EventsView.jsx
│       │   │   ├── ProgressView.jsx
│       │   │   ├── UsersView.jsx
│       │   │   ├── SessionsView.jsx        (empty placeholder)
│       │   │   ├── InventoryView.jsx        (empty placeholder)
│       │   │   ├── RefreshmentsView.jsx     (empty placeholder)
│       │   │   └── AdminMailingService.jsx  (Ported from ikigai1)
│       │   ├── evaluator/
│       │   │   └── EvaluatorConsole.jsx
│       │   ├── judge/
│       │   │   └── JudgeDashboard.jsx       (empty placeholder)
│       │   └── student/
│       │       └── StudentDashboard.jsx     (empty placeholder)
│       └── assets/
│           └── ikigai.png           (copied from ikigai1)
└── .gitignore
```

---

### Phase 2 — Backend Foundation

#### [NEW] `backend/package.json`

Dependencies (same versions as ikigai1 where applicable, adding `jsonwebtoken` and `socket.io`):

```json
{
  "dependencies": {
    "cors": "^2.8.5",
    "dotenv": "^17.2.3",
    "express": "^4.22.2",
    "jsonwebtoken": "^9.0.2",
    "mongoose": "^8.19.3",
    "socket.io": "^4.8.1",
    "crypto": "^1.0.1",
    "sib-api-v3-sdk": "^8.5.0",
    "multer": "^1.4.5-lts.1",
    "cloudinary": "^1.41.0"
  },
  "devDependencies": {
    "jest": "^30.4.2",
    "mongodb-memory-server": "^11.2.0",
    "supertest": "^7.2.2"
  }
}
```

#### [NEW] `backend/.env`

```env
ADMIN_EMAIL=admin@csit.in
ADMIN_PASS=admin123
PORT=5000
BREVO_API_KEY=<from ikigai1>
CLOUDINARY_CLOUD_NAME=<from ikigai1>
CLOUDINARY_API_KEY=<from ikigai1>
CLOUDINARY_API_SECRET=<from ikigai1>
MAIL_USER=<from ikigai1>
MAIL_PASS=<from ikigai1>
JWT_SECRET=<generate new secret>
MONGO_URI=mongodb+srv://<user>:<password>@cluster0.mongodb.net/ikigai2?retryWrites=true&w=majority
GEMINI_API_KEY=<from ikigai1>
```

> Note: The URI points to `/ikigai2?` (not `/ikigai?`). This is the critical database change.

#### [NEW] `backend/middleware/auth.js`

```js
// requireAuth(...allowedRoles)
// - Reads Authorization: Bearer <token>
// - Verifies JWT with JWT_SECRET
// - Attaches req.user = { email, role, name }
// - Returns 401 if missing/invalid, 403 if role not in allowedRoles
// - If allowedRoles is empty array, any authenticated user passes
// - Accepts any role string (judge, evaluator, etc.) — zero changes needed for new roles
```

#### [NEW] `backend/models/` — 5 model files

Each model file is extracted from ikigai1's codebase:

| File | Key Details |
|---|---|
| `Event.js` | `EventSchema` + embedded `TrackSchema`. |
| `SessionChair.js` | Evaluator model. Compound index: `{email, trackId, eventId}` unique. |
| `Judge.js` | Placeholder Judge model. Mirroring SessionChair schema structure initially. |
| `StudentCoordinator.js` | Compound index: `{email, trackId, eventId}` unique. |
| `TeamLeader.js` | Renamed logic from `TeamModel` in ikigai1 Round 2 routes. **Mapped to the `teams` collection.** Adds an embedded `assessments` field grouped by role. |

#### [NEW] `backend/routes/auth.routes.js`

Extracted from server.js:
- `POST /api/login` (lines 569–640) — **enhanced to return JWT token**
- `POST /api/auth/send-otp` (lines 642–691)
- `POST /api/auth/verify-otp` (lines 738–786) — **enhanced to return JWT token**
- `POST /api/auth/change-password-direct` (from server.js)
- `PUT /api/auth/update-password` (from UpdatePassword flow)

All login responses now include `{ success, role, email, name, token }`.

#### [NEW] `backend/routes/admin.routes.js`

All routes from server.js that start with `/api/admin/`:
- Events CRUD (`POST /events`, `GET /events`, `GET /events/:id`, `PUT /events/:id`, `DELETE /events/:id`)
- Tracks CRUD (`POST /events/:id/tracks`, `PUT /events/:id/tracks/:trackId`, `DELETE /events/:id/tracks/:trackId`)
- Track lock toggle (`POST /tracks/:eventId/:trackId/lock`)
- Criteria (`PUT /events/:id/criteria`)
- Evaluators (`POST /evaluators`, `PUT /evaluators/:id`, `DELETE /evaluators/:id`, `GET /evaluators/all`, `GET /session-chairs/:eventId`)
- Student coordinators (global CRUD)
- Team leaders (`GET /team-leaders/all`, `POST /team-leaders/send-mail`)
- Participants stats, counts, bulk-assign
- Shortlisted CRUD
- Invite sending (individual, bulk, selected)

All protected with `requireAuth('admin')`.

**Public exception**: `GET /api/admin/events` (needed for data loading before auth).

#### [NEW] `backend/routes/mailing.routes.js`

Ported from ikigai1's recent commit, but updated to **only** query the `TeamLeader` (Round 2 Team) collection in `ikigai2`. Legacy queries to `Shortlisted` and `Participant` are removed.
- `GET /api/admin/mailing/participants` (filtered queries)
- `POST /api/admin/mailing/send` (uses `mailer.js` Brevo integration)

Protected with `requireAuth('admin')`.

Evaluator (session chair) routes:
- `GET /api/session/:email` — load session data
- `GET /api/session/participants` — load assigned participants
- `GET /api/session/track-status` — check lock status
- `PATCH /api/session/participants/:id/assessment` — submit assessment
- `GET /api/participants/by-track` — participants filtered by track + evaluator

Protected with `requireAuth('evaluator')`. (Note: role renamed from `sessionChair` → `evaluator` in ikigai2.)

#### [NEW] `backend/routes/judge.routes.js`

Judge routes. As requested, these routes will be created but left as **empty stubs** for now since judge-specific features will be detailed later.

Protected with `requireAuth('judge')`.

#### [NEW] `backend/routes/student.routes.js`

Student coordinator routes (from server.js). As requested, these routes will be created but left as **empty stubs** for now since changes are coming.

Protected with `requireAuth('studentCoordinator')`.

#### [NEW] `backend/server.js` (~80 lines)

```js
// 1. Import dotenv, express, mongoose, cors, http, socket.io
// 2. Import all route files
// 3. Configure CORS (origin whitelist for ikigai2 domains)
// 4. app.use(express.json({ limit: '25mb' }))
// 5. Mount routes:
//    app.use('/api', authRoutes)
//    app.use('/api', adminRoutes)
//    app.use('/api', evaluatorRoutes)
//    app.use('/api', studentRoutes)
// 6. Health routes (/, /health, /favicon.ico)
// 7. MongoDB connect (to MONGO_URI which points to ikigai2 db)
// 8. Socket.io setup with CORS
// 9. app.listen (with PORT fallback and 0.0.0.0 binding for Railway)
// 10. Export app for testing
```

#### [NEW] `backend/utils/cache.js`

Simple in-memory LRU cache for hot queries (events list, participant counts):

```js
// Map-based cache with TTL (configurable, default 30s)
// cache.get(key), cache.set(key, value, ttlMs), cache.invalidate(key), cache.clear()
// Used in admin routes for GET /events, GET /participant-counts etc.
```

#### [NEW] `backend/utils/hash.js`

Extracted from server.js (lines 361–362):
```js
export const hashPassword = (password) => crypto.createHash('sha256').update(password).digest('hex');
export const generateSimplePassword = (name) => { /* ... */ };
export const generateTempPassword = (fullName) => { /* ... */ };
```

#### [NEW] `backend/utils/otp.js`

OTP generation and in-memory store (extracted from server.js):
```js
export const otpStore = new Map(); // email -> { otp, expiresAt }
export const generateOTP = () => Math.floor(1000 + Math.random() * 9000).toString();
```

#### [NEW] `backend/utils/mailer.js`

Copied from ikigai1's `mailer.js` (Brevo integration).

---

### Phase 3 — Frontend Foundation

> [!TIP]
> **Global Frontend Architecture Rule**: Monolithic files (e.g. 400-800+ lines) are strictly prohibited in ikigai2. Every large UI view ported from ikigai1 MUST be aggressively broken down into small, single-responsibility React components (e.g. modals, list views, cards) residing in organized subfolders.

#### [NEW] `frontend/package.json`

Includes all ikigai1 dependencies (including recently added ones and those initially excluded):
```json
{
  "dependencies": {
    "lucide-react": "^1.26.0",
    "react": "^19.1.1",
    "react-dom": "^19.1.1",
    "react-router-dom": "^6.30.1",
    "xlsx": "^0.18.5",
    "jspdf": "^4.0.0",
    "jspdf-autotable": "^5.0.7",
    "@dnd-kit/core": "^6.1.0",
    "@dnd-kit/sortable": "^8.0.0",
    "@dnd-kit/utilities": "^3.2.2",
    "papaparse": "^5.4.1",
    "react-pdf": "^7.7.1",
    "react-qr-code": "^2.1.2",
    "react-quill-new": "^3.3.3"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4.1.16",
    "@tailwindcss/vite": "^4.1.16",
    "@vitejs/plugin-react": "^5.0.4",
    "tailwindcss": "^4.1.16",
    "vite": "^7.1.7"
  }
}
```

#### [NEW] `frontend/src/index.css` — Exact color palette from ikigai1

```css
@import "tailwindcss";
@reference tailwindcss;

@theme {
  --color-primary-50: #fcf2ef;
  --color-primary-100: #fae4ea;
  --color-primary-200: #f5c7d8;
  --color-primary-300: #f09cb8;
  --color-primary-400: #eb749a;
  --color-primary-500: #e34e89;
  --color-primary-600: #ba3b78;
  --color-primary-700: #753a99;
  --color-primary-800: #582678;
  --color-primary-900: #42185c;
  --color-primary-950: #290a3d;
}

body {
  background: linear-gradient(to bottom right, #fcf2ef, #fae4ea, #f5c7d8);
  font-family: system-ui, sans-serif;
  color: #1f2937;
}
```

This is the **exact** pink-to-purple gradient palette from ikigai1. We have renamed `green-*` to `primary-*` to correct the legacy quirk. All JSX components ported over will have their `bg-green-*`, `text-green-*`, etc. classes globally replaced with `primary-*`.

#### [NEW] `frontend/src/config/api.js`

```js
export const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

export function authHeaders() {
  const token = localStorage.getItem('ikigai_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function authFetch(url, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...authHeaders(),
    ...(options.headers || {}),
  };
  return fetch(url, { ...options, headers });
}
```

#### [NEW] `frontend/src/config/constants.js`

```js
export const ASSESSMENT_CRITERIA = [
  "Innovation & Creativity",
  "Technical Complexity",
  "UI/UX & Design",
  "Feasibility & Impact",
  "Presentation & Q&A",
];

export const ROLE_LABELS = {
  admin: "Admin",
  evaluator: "Evaluator",
  judge: "Judge",
  studentCoordinator: "Student Coordinator",
  teamLeader: "Team Leader",
};
```

---

### Phase 4 — Frontend Admin Console (Exact Reuse)

#### [NEW] `frontend/src/pages/admin/AdminLayout.jsx`

Direct port from ikigai1's [AdminLayout.jsx](file:///home/archani/Projects/ikigai1/frontend/src/AdminLayout.jsx) with these changes:

1. **Sidebar items updated**:
   - Events (keep)
   - Progress (keep)
   - Users (keep)
   - Sessions (NEW — empty placeholder page)
   - Refreshments (NEW — empty placeholder page)
   - Inventory (NEW — empty placeholder page)
   - Mailing Service (NEW - empty placeholder page)
2. **Remove**: Shortlist, Round 2, Close Registration (Round-1-specific)
3. **Color scheme unchanged**: Purple/pink sidebar active state, same icon styles

#### [NEW] `frontend/src/pages/admin/EventsView.jsx`

**Exact port** from ikigai1's [AdminConsole.jsx EventsView](file:///home/archani/Projects/ikigai1/frontend/src/AdminConsole.jsx#L564-L645).

Changes:
- Import `{ API_BASE, authFetch }` from `config/api.js` instead of inline `API_BASE`
- All `fetch()` calls → `authFetch()` calls

#### [NEW] `frontend/src/pages/admin/ProgressView.jsx`

**Exact port** from ikigai1's [AdminConsole.jsx ProgressView](file:///home/archani/Projects/ikigai1/frontend/src/AdminConsole.jsx#L647-L685).

#### [NEW] `frontend/src/pages/admin/UsersView.jsx`

This page was ~800 lines in ikigai1. We will **refactor this into smaller modular components** (e.g., `EvaluatorList.jsx`, `CoordinatorList.jsx`) to keep the codebase clean, maintainable, and prevent monolithic bloat. It will still look identical to the user.

Changes:
- `fetch()` → `authFetch()`
- Remove team-leader-specific send-mail (ikigai2 team leaders are handled differently)

#### [NEW] Admin sub-components (extracted from ikigai1)

Each of these is extracted from the inline definitions in [AdminConsole.jsx](file:///home/archani/Projects/ikigai1/frontend/src/AdminConsole.jsx):

| Component | Source Lines | Purpose |
|---|---|---|
| `ConfirmDeleteModal.jsx` | L9–L39 | Type-to-confirm deletion modal |
| `DefineCriteriaModal.jsx` | L41–L171 | Define assessment criteria per event |
| `EvaluatorList.jsx` | L173–L326 | CRUD evaluators within a track |
| `TrackItem.jsx` | L328–L438 | Expandable track with edit/delete/lock |
| `TrackList.jsx` | L441–L498 | List of tracks with create form |
| `EventCard.jsx` | L500–L560 | Expandable event card with actions |
| `AssignTeamsModal.jsx` | From [AssignTeamsModal.jsx](file:///home/archani/Projects/ikigai1/frontend/src/components/admin/AssignTeamsModal.jsx) | Multi-select team-to-evaluator assignment |

All ported with `authFetch()` and identical styling.

#### [NEW] `frontend/src/pages/admin/AdminMailingService.jsx`

Ported from ikigai1's recent changes. Contains the ReactQuill composer, granular filters, and bulk/selected participant emailing functionality. Updated to align with `primary-*` color scheme.

#### [NEW] Placeholder pages

```jsx
// SessionsView.jsx
export default function SessionsView() {
  return (
    <div className="animate-fade-in w-full max-w-7xl mx-auto px-6 py-8 md:px-10">
      <h2 className="text-3xl font-extrabold text-gray-800 tracking-tight mb-2">Sessions</h2>
      <p className="text-gray-500">Coming soon — manage food sessions, evaluator sessions etc.</p>
    </div>
  );
}

// InventoryView.jsx — same pattern
// RefreshmentsView.jsx — same pattern
// MailingView.jsx — same pattern
```

---

### Phase 5 — Frontend Shared Components

#### [NEW] `frontend/src/components/shared/Header.jsx`

**Exact port** from ikigai1's [App.jsx Header](file:///home/archani/Projects/ikigai1/frontend/src/App.jsx#L142-L248).

Changes:
- `sessionStorage.getItem("care_*")` → `localStorage.getItem("ikigai_*")` for token, `sessionStorage` for role/email/name remains
- Updated role display: `sessionChair` → `evaluator` label mapping
- Import logo from `assets/ikigai.png`

#### [NEW] `frontend/src/components/shared/ChangePasswordModal.jsx`

**Exact port** from ikigai1's [App.jsx ChangePasswordModal](file:///home/archani/Projects/ikigai1/frontend/src/App.jsx#L46-L140) with `authFetch()`.

#### [NEW] `frontend/src/components/shared/ConfirmDeleteModal.jsx`

Extracted from AdminConsole (reused across pages).

---

### Phase 6 — Frontend Auth & Routing

#### [NEW] `frontend/src/pages/Login.jsx`

**Port from** ikigai1's [Login.jsx](file:///home/archani/Projects/ikigai1/frontend/src/Login.jsx).

Changes:
- On login success, store JWT: `localStorage.setItem("ikigai_token", data.token)`
- Session keys: `ikigai_role`, `ikigai_email`, `ikigai_name` (replacing `care_*`)
- Role routing: `sessionChair` → `evaluator` in route paths
- Copyright footer: keep "IKIGAI 2026" branding

#### [NEW] `frontend/src/App.jsx` (~100 lines)

```jsx
// Routing structure:
// / → redirect to /login
// /login → Login
// /update-password → UpdatePassword

// ADMIN (requireRole: admin)
//   /dashboard → EventsView
//   /progress → ProgressView
//   /users → UsersView
//   /sessions → SessionsView (empty)
//   /refreshments → RefreshmentsView (empty)
//   /inventory → InventoryView (empty)
//   /mailing → AdminMailingService (Ported from ikigai1)

// EVALUATOR (requireRole: evaluator)
//   /evaluator → EvaluatorConsole

// JUDGE (requireRole: judge)
//   /judge → JudgeDashboard (empty placeholder)

// STUDENT COORDINATOR (requireRole: studentCoordinator)
//   /student → StudentDashboard (empty placeholder)

// * → redirect to /login
```

#### [NEW] `ProtectedRoute` component

```jsx
// Reads ikigai_role from sessionStorage
// If not logged in → redirect to /login
// If role not in allowedRoles → redirect to /login
// Otherwise → render <Outlet />
```

---

### Phase 7 — Evaluator Console (Reuse from ikigai1)

#### [NEW] `frontend/src/pages/evaluator/EvaluatorConsole.jsx`

**Port from** ikigai1's [App.jsx SessionChairConsole](file:///home/archani/Projects/ikigai1/frontend/src/App.jsx#L4571-L4975).

This was a ~400-line monolithic component in ikigai1. Following our global frontend rule, we will **break this down into focused sub-components**:
- `EvaluatorProfile.jsx` (Profile card)
- `AssignedTeamsList.jsx` (List of teams assigned to them)
- `AssessmentModal.jsx` (Criteria/total grading UI)
- `AssessmentSummary.jsx` (Historical views)

Changes:
- Rename feature from `SessionChairConsole` → `EvaluatorConsole`
- `sessionStorage.getItem("care_email")` → `sessionStorage.getItem("ikigai_email")`
- `fetch()` → `authFetch()`
- Role references: `sessionChair` → `evaluator`

> [!NOTE]
> Future evaluator enhancements (marks + normalized comments, tasks for team leaders) are **deferred** per the prompt. The current assessment UI is reused as-is.

---

### Phase 8 — Track Save Bug Fix

> [!WARNING]
> **Bug Description**: When creating a track 'A' in Event 1 while Event 2 has track 'B', clicking "Save Track" would save track 'B' in Event 2 *again* AND save track 'A' in Event 1. This is a cross-contamination bug.

#### Root Cause Analysis

After examining the code:

1. **Frontend TrackList** ([AdminConsole.jsx L441-L498](file:///home/archani/Projects/ikigai1/frontend/src/AdminConsole.jsx#L441-L498)) correctly sends `POST /api/admin/events/${event._id}/tracks` — it uses the correct event ID from props.

2. **Backend Track POST** ([server.js L2438-L2461](file:///home/archani/Projects/ikigai1/backend/server.js#L2438-L2461)) correctly uses `req.params.id` to find the event.

3. **The likely culprit** is the `persistEditEvent()` auto-save in the CreateEvent/Edit wizard ([App.jsx L472-L484](file:///home/archani/Projects/ikigai1/frontend/src/App.jsx#L472-L484)). When editing an event:
   - The wizard auto-saves tracks whenever step 2 is active
   - If a user has **two browser tabs open** (one editing Event 1, one editing Event 2), or navigates between events, stale local `event` state could be persisted to the wrong event
   - The `PUT /api/admin/events/:id` route at [server.js L843](file:///home/archani/Projects/ikigai1/backend/server.js#L843) accepts a `tracks` array in the body and **overwrites the entire tracks array**, meaning stale data from one event's local state could persist onto another

4. **Another vector**: `refreshEvents()` is called after track creation, which re-fetches all events. If the events array is shared state (it is — passed as prop from `App`) and EventCard components re-render with stale closures, the edit wizard could save tracks from the wrong event.

#### Fix (implemented in ikigai2's architecture)

1. **Remove auto-save pattern entirely** — In ikigai2, track CRUD goes through dedicated `POST/PUT/DELETE /events/:id/tracks/:trackId` endpoints (not the full event PUT), eliminating the possibility of cross-contamination
2. **Each component receives its event by ID**, not by reference to a shared mutable array
3. **No CreateEvent wizard with auto-persist** — tracks are managed inline within EventCard, scoped to their specific event ID
4. **Backend track routes** use `Event.findById(req.params.id)` and `event.tracks.find()`, never accepting a full tracks array override

---

### Phase 9 — Database Setup

#### MongoDB URI Configuration

```
ikigai1 URI: .../ikigai?ssl=true&...
ikigai2 URI: .../ikigai2?ssl=true&...
```

Same Atlas cluster, different database name. The `ikigai2` database will be auto-created by MongoDB when the first document is inserted.

#### Collections to be created (auto by Mongoose)

| Collection | Model | Purpose |
|---|---|---|
| `events` | Event | Events with embedded tracks (Starts empty in ikigai2) |
| `sessionchairs` | SessionChair | Evaluators (Starts empty in ikigai2) |
| `studentcoordinators` | StudentCoordinator | Student coordinators |
| `teams` | TeamLeader | Round 2 registered teams (Contains existing registrations) |

#### Admin Seed

On first boot, if no admin exists, create one from `ADMIN_EMAIL` / `ADMIN_PASS` env vars (same pattern as ikigai1).

---

### Phase 10 — WebSocket Integration

#### [NEW] Socket.io setup in `server.js`

```js
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';

const httpServer = createServer(app);
const io = new SocketServer(httpServer, {
  cors: { origin: allowedOrigins, methods: ['GET', 'POST'] }
});

// Make io available to route handlers
app.set('io', io);

io.on('connection', (socket) => {
  socket.on('join-event', (eventId) => socket.join(`event:${eventId}`));
  socket.on('join-track', ({ eventId, trackId }) => socket.join(`track:${eventId}:${trackId}`));
});
```

#### WebSocket Events

> **NOTE:** WebSockets are only implemented for **tracks** for now.

**Emitted events (from backend):**
| Event | When | Data |
|---|---|---|
| `track_created` | Admin creates a track | `{ eventId, track }` |
| `track_updated` | Admin edits a track | `{ eventId, track }` |
| `track_deleted` | Admin deletes a track | `{ eventId, trackId }` |
| `assessment-saved` | Evaluator saves assessment | `{ eventId, trackId, participantId }` |
| `lock-toggled` | Admin toggles track lock | `{ eventId, trackId, locked }` |

This replaces ikigai1's polling-based refresh with instant updates.

---

## Verification Plan

### Automated Tests

```bash
# Backend: unit + integration tests
cd backend && npm test

# Frontend: build check
cd frontend && npm run build
```

Tests to write:
1. **Auth middleware** — token validation, role checks, 401/403 responses
2. **Admin routes** — events CRUD, tracks CRUD, evaluator CRUD
3. **Track isolation** — create track in Event A, verify Event B is unmodified (bug fix verification)
4. **Login flow** — verify JWT is returned in response

### Manual Verification

1. **Visual comparison**: Open ikigai1 and ikigai2 side-by-side, verify:
   - Login page is visually identical
   - Admin sidebar looks the same (with new items added)
   - Events, Progress, Users tabs are visually identical
   - Color palette matches throughout
2. **Auth flow**: Login as admin → verify JWT stored → verify protected routes work
3. **CRUD flow**: Create event → add track → add evaluator → verify correct scoping (no cross-contamination)
4. **Evaluator view**: Login as evaluator → verify session loads → verify assessment UI works
5. **New sidebar items**: Click Sessions, Refreshments, Inventory → verify empty placeholder pages render
6. **Database**: Verify data is in `ikigai2` database, not `ikigai`

---

## Implementation Order & Estimates

| Phase | Description | Est. Time |
|---|---|---|
| 1 | Project scaffolding (all directories + configs) | 30 min |
| 2 | Backend foundation (server, models, routes, middleware, utils) | 3 hours |
| 3 | Frontend foundation (Vite setup, CSS, config) | 30 min |
| 4 | Admin console (EventsView, ProgressView, UsersView + sub-components) | 3 hours |
| 5 | Shared components (Header, modals) | 1 hour |
| 6 | Auth & routing (Login, App.jsx, ProtectedRoute) | 1 hour |
| 7 | Evaluator console | 1.5 hours |
| 8 | Track save bug fix (architecture prevents it; verify) | 30 min |
| 9 | Database setup + verify | 15 min |
| 10 | WebSocket integration | 1 hour |
| — | **Total** | **~12 hours** |
