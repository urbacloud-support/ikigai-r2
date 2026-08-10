# Ikigai2 — Progress Log

*Project hard-reset on 2026-08-11 to align natively with the ikigai2 database.*

## Completed Tasks

### Phase 1: Clean Slate & Scaffolding
- Deleted legacy `frontend` and `backend` folders to eradicate Round 1 codebase artifacts.
- Generated new scalable `backend/src/` folder skeleton (MVC structure).
- Initialized `package.json` with required dependencies (Express, Mongoose, Socket.io, JWT).
- Pointed `MONGO_URI` directly to the `ikigai2` database on the live cluster.

### Phase 2: Backend Models
- Created `Team.js` natively mapping to the `teams` collection, embedding `assessments`.
- Created `User.js` mapping to `users` collection as the single source of truth for auth.
- Created `Track.js` mapping to the global `tracks` collection.
- Created `Event.js` mapping to `events` collection, embedding selected tracks array for isolation.
- Fixed `.env` to include missing 3rd-party API keys (Brevo, Cloudinary, Gemini).

### Phase 3: Backend Config & Auth Routing
- Created `config/db.js` for MongoDB connection via Mongoose.
- Created `middleware/auth.js` for strict JWT verification and role-based route protection.
- Created `controllers/auth.controller.js` & `routes/auth.routes.js` with unified login.
- Added `utils/hash.js` to perform SHA-256 hashing to correctly verify legacy passwords from the DB.

### Phase 4: Backend Admin & Evaluator Routing
- Created `admin.controller.js` and `admin.routes.js` to fetch Events, Users, and global Tracks.
- Implemented global Track embedding logic during Event creation to prevent ikigai1 cross-contamination bug.
- Created `evaluator.controller.js` and `evaluator.routes.js` with `PATCH` logic to append scores into the `assessments` array on `teams`.
- Configured `server.js` with Socket.io stub (`io.emit('assessment-saved')`) and mounted all routes.

### Phase 5: Frontend Scaffolding
- Initialized a brand new React project using Vite.
- Installed and configured Tailwind CSS v4.
- Ported over the exact pink/purple gradient design system to `index.css` to match legacy aesthetics.
- Created `config/api.js` wrapper to seamlessly inject the `ikigai_token` JWT into all backend requests.
- Created `config/constants.js` to standardize UI labels and criteria.




