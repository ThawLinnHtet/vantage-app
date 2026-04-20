# Vantage - Collaborative Travel War Room

## Project Overview

A high-performance collaborative travel planning platform enabling real-time group trip coordination through synchronized map/manual entry, voting-based decision making, and multi-currency budget management.

## Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19 + TypeScript + Vite 5 |
| Backend | Express.js 4.x + TypeScript + Node.js |
| Database | MongoDB Atlas (free tier) |
| Real-time | Socket.io |
| Maps | Leaflet + OpenStreetMap (tiles) |
| Geocoding | Nominatim (free) |
| Auth | JWT + bcrypt |
| Currency | open.er-api.com + Frankfurter (free, no API key) |
| Animations | Framer Motion |
| State | Zustand |
| HTTP | Axios + React Query |
| Styling | Tailwind CSS 3.4 |

---

## Design System

### Color Palette

```
--color-primary: #1c1c1e (near-black text)
--color-surface: #ffffff (white background)
--color-interactive: #5b76fe (Blue 450)
--color-interactive-pressed: #2a41b6
--color-success: #00b473
--color-border: #c7cad5
--color-ring: rgb(224,226,232)

Pastel Accents (Light/Dark):
--coral: #ffc6c6 / #600000
--rose: #ffd8f4 / #b84d7a
--teal: #c3faf5 / #187574
--orange: #ffe6cd / #8c5a2a
--yellow: #fff8c6 / #746019
--moss: #d4f5d9 / #187574
```

### Typography

| Role | Font | Size | Weight | Line Height | Letter Spacing |
|------|------|------|--------|-----------|----------------|
| Display Hero | DM Sans | 56px | 400 | 1.15 | -1.68px |
| Section Heading | DM Sans | 48px | 400 | 1.15 | -1.44px |
| Card Title | DM Sans | 24px | 400 | 1.15 | -0.72px |
| Sub-heading | Noto Sans | 22px | 400 | 1.35 | -0.44px |
| Body | Noto Sans | 18px | 400 | 1.45 | normal |
| Body Standard | Noto Sans | 16px | 400 | 1.50 | -0.16px |
| Button | DM Sans | 17.5px | 700 | 1.29 | 0.175px |
| Caption | DM Sans | 14px | 400 | 1.71 | normal |
| Small | DM Sans | 12px | 400 | 1.15 | -0.36px |

Note: Using DM Sans as free alternative to Roobert PRO (commercial font). Both are geometric sans-serifs with similar aesthetics.

### Responsive Breakpoints

| Breakpoint | Width | Target |
|------------|-------|--------|
| sm: | 640px | Mobile landscape |
| md: | 768px | Tablet |
| lg: | 1024px | Laptop |
| xl: | 1280px | Desktop |
| 2xl: | 1536px | Large desktop |

### Component Styling

- **Buttons**: 8px radius, outlined (1px #c7cad5), blue primary (#5b76fe)
- **Cards**: 12-24px radius, pastel backgrounds
- **Inputs**: white bg, 1px solid #e9eaef, 8px radius, 16px padding
- **Ring shadow**: rgb(224,226,232) 0px 0px 0px 1px

### Spacing & Radius

- **Radius**: 8px (buttons), 10-12px (cards), 20-24px (panels), 40-50px (containers)
- **Spacing**: 1-24px base scale

### Breakpoints

425px, 576px, 768px, 896px, 1024px, 1200px, 1280px, 1366px, 1700px, 1920px

---

## Feature Specification

### 1. Map Integration (Leaflet + OpenStreetMap)
- Interactive map with POI markers
- Click-to-add POI from map position
- Reverse geocoding for map clicks
- Custom marker icons with category colors
- Animated marker scaling for confirmed POIs
- User location centering with permission prompt
- Map tiles: OpenStreetMap standard

### 2. POI Management (2-Way Sync)
- **Map-first**: Click map → reverse geocode → auto-populate address
- **Manual-first**: Search place → Nominatim geocode → auto-pin on map
- Both sync via Socket.io to all participants
- Categories: restaurant, hotel, activity, transport, attractions, other

### 3. Global Budget Meter
- Display: spent / total with percentage
- Multi-currency conversion via ExchangeRate-API
- Visual progress: green → yellow → red thresholds
- Cached rates (1 hour TTL)

### 4. Active Decision Engine
- POI suggestions can be voted on
- Default threshold: 60% consensus
- On threshold met: auto-promote to confirmed itinerary
- Trigger animation on promotion
- Confirmed POIs: larger markers, priority display

### 5. Secure Shared System
- 6-character alphanumeric invite code
- Join via link: `/trip/join/:code`
- Live presence counter in header
- Permission: only trip creator can delete

### 6. Real-time Sync
- Socket.io rooms per trip
- Immediate POI CRUD broadcast
- Presence tracking (join/leave)
- Optimistic UI updates

---

## Database Schema

### User
```typescript
{
  _id: ObjectId,
  email: string (unique),
  password: string (hashed),
  name: string,
  avatar?: string,
  createdAt: Date
}
```

### Trip
```typescript
{
  _id: ObjectId,
  name: string,
  description?: string,
  destination: { name: string, lat: number, lng: number },
  startDate: Date,
  endDate: Date,
  budget: { total: number, currency: string },
  createdBy: ObjectId (ref: User),
  inviteCode: string (unique, 6-char),
  members: [{ user: ObjectId, role: 'admin'|'member', joinedAt: Date }],
  pois: [{
    _id: ObjectId,
    name: string,
    description?: string,
    lat: number, lng: number,
    category: string,
    cost?: number,
    currency?: string,
    addedBy: ObjectId,
    status: 'suggestion'|'confirmed',
    votes: ObjectId[],
    createdAt: Date
  }],
  createdAt: Date,
  updatedAt: Date
}
```

---

## API Endpoints

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Trips
- `POST /api/trips` (create)
- `GET /api/trips` (list user's trips)
- `GET /api/trips/:id`
- `PUT /api/trips/:id` (update)
- `DELETE /api/trips/:id` (admin only)
- `POST /api/trips/:id/join` (via code)
- `GET /api/trips/by-code/:code`

### POIs
- `POST /api/trips/:id/pois` (add)
- `PUT /api/trips/:id/pois/:poiId`
- `DELETE /api/trips/:id/pois/:poiId`
- `POST /api/trips/:id/pois/:poiId/vote`
- `POST /api/trips/:id/pois/:poiId/confirm`

### Geocoding
- `GET /api/geocode/search?q=...`
- `GET /api/geocode/reverse?lat=...&lng=...`

### Currency
- `GET /api/currency/rates` (cached)

---

## Socket.io Events

### Client → Server
- `join-trip` | `leave-trip`
- `poi:add` | `poi:update` | `poi:delete` | `poi:vote`
- `presence:update`

### Server → Client
- `trip:updated`
- `poi:added` | `poi:updated` | `poi:deleted` | `poi:promoted`
- `member:joined` | `member:left` | `presence:count`

---

## Deployment

### Vercel (Frontend)
- Vite build output
- API proxy to Render backend
- Environment: `VITE_API_URL`

### Render (Backend)
- Node.js service
- Environment: `MONGODB_URI`, `JWT_SECRET`, `NODE_ENV`
- Start: `npm run start`

---

## Implementation Phases

### Phase 1: Project Setup (COMPLETE)
- [x] SPEC.md specification file
- [x] Initialize client + server
- [x] Configure TypeScript
- [x] Set up Tailwind

### Phase 2: Auth System (COMPLETE)
- [x] User registration/login with HTTP-only cookie
- [x] JWT middleware with cookie-parser
- [x] Global error handler middleware
- [x] React Router (/, /login, /signup, /register, /trips)

### Phase 3: Trip CRUD (COMPLETE)
- [x] Create/read/update/delete trips
- [x] Invite code generation (6-char alphanumeric)
- [x] Member management
- [x] Trip model with POI subdocuments

### Phase 4: Map Integration (COMPLETE)
- [x] Leaflet map setup
- [x] Geocoding + reverse geocoding (Nominatim implemented)
- [x] POI CRUD with 2-way sync
- [x] Destination auto-geocoding on trip create/update
- [x] POI address search with autocomplete
- [x] Map-first and manual address search for POI

### Phase 5: Budget (COMPLETE)
- [x] Currency conversion API
- [x] Budget meter UI

### Phase 6: Voting & Decisions (COMPLETE)
- [x] Vote system
- [x] Threshold promotion
- [x] Animations

### Phase 7: Presence & Sharing (COMPLETE)
- [x] Live presence
- [x] Sharing UI
- [x] Real-time member join notifications
- [x] Delete trip functionality (owner only)

### Phase 8: Polish & Deploy (IN PROGRESS)
- [x] Fixes for edit/delete buttons
- [x] Voting system fixes
- [x] Date validation
- [x] Currency fallbacks
- [ ] Deploy to Vercel + Render

---

## Implementation Status (as of April 2026)

### Completed Features:
| Feature | Status | Notes |
|---------|--------|-------|
| Project Setup | ✅ | React 19 + Vite 5 + TS client, Express 4.x + TS server |
| MongoDB Atlas | ✅ | Connected cluster0 |
| Auth System | ✅ | HTTP-only cookie JWT |
| Auth Pages | ✅ | Login, Signup with responsive design |
| Trips Page | ✅ | List + Create modal with responsive design |
| Trip CRUD API | ✅ | Full server-side implementation |
| Invite Code System | ✅ | 6-char alphanumeric, auto-generated |
| Geocoding API | ✅ | Nominatim with caching (24h TTL) |
| Currency API | ✅ | open.er-api.com with 120+ currencies |
| MMK Currency | ✅ | Myanmar Kyat supported |
| Global Error Handler | ✅ | asyncHandler middleware |
| React Router | ✅ | /, /login, /signup, /trips |
| Responsive Design | ✅ | Mobile-first with sm/md/lg breakpoints |
| Toast Notifications | ✅ | Zustand + Framer Motion |
| Page Transitions | ✅ | AnimatePresence with slide/fade |
| Date Validation | ✅ | End > start, no past dates |
| Package Updates | ✅ | All packages updated to latest |
| Trip Detail Page | ✅ | Map + POI list + budget meter |
| Leaflet Maps | ✅ | OpenStreetMap tiles with custom markers |
| POI Management | ✅ | Add/Edit/Delete via map click or search |
| POI Address Search | ✅ | Autocomplete with Nominatim API |
| Destination Geocoding | ✅ | Auto-geocode destination on create/update |
| Budget Meter | ✅ | Spent/total with currency conversion |
| Voting System | ✅ | Vote/confirm POIs with threshold |
| Real-time Sync | ✅ | Socket.io for all POI operations |
| Member Join Notifications | ✅ | Toast when new member joins |
| Delete Trip | ✅ | Owner only, hard delete, confirmation modal |
| Map-First + Manual-Entry | ✅ | Two-way POI creation (map click or search) |

### Pages:
- `/` - Landing page with hero + features (responsive)
- `/login` - Login page (white-blue gradient, responsive)
- `/signup` - Signup page (white-blue gradient, responsive)
- `/trips` - Trips list with create modal (responsive)

### Form Validation Rules:
| Field | Login Validation | Signup Validation | Create Trip Validation |
|-------|------------------|-------------------|------------------------|
| Name | - | Required, min 2 chars | Required |
| Email | Required, valid format | Required, valid format | - |
| Password | Required, min 6 chars | Required, min 8 chars | - |
| Destination | - | - | Required |
| Start Date | - | - | Required, today or future |
| End Date | - | - | Required, after start date |
| Budget | - | - | Required, greater than 0 |
| Currency | - | - | Default USD (15 options) |

### Server Routes:
Auth:
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

Trips:
- `POST /api/trips` - Create trip (auto-geocode destination)
- `GET /api/trips` - List user's trips
- `GET /api/trips/:id` - Get trip details
- `PUT /api/trips/:id` - Update trip (auto-regeocode if destination changed)
- `DELETE /api/trips/:id` - Delete trip (owner only, hard delete)
- `POST /api/trips/:id/join` - Join via code
- `GET /api/trips/by-code/:code` - Lookup by code

POIs:
- `POST /api/trips/:id/pois` - Add POI
- `PUT /api/trips/:id/pois/:poiId` - Update POI
- `DELETE /api/trips/:id/pois/:poiId` - Delete POI
- `POST /api/trips/:id/pois/:poiId/vote` - Vote on POI
- `POST /api/trips/:id/pois/:poiId/confirm` - Confirm POI

Utility:
- `GET /api/geocode/search?q=` - Search places
- `GET /api/geocode/reverse?lat=&lng=` - Reverse geocode
- `GET /api/currency/rates?base=` - Exchange rates
- `GET /api/currency/currencies` - List currencies

### Design System Applied:
| Element | Value |
|---------|-------|
| Primary Text | #1c1c1e |
| Interactive | #5b76fe |
| Error Text | #c53030 |
| Error Background | #fbd4d4 |
| Input Border | #e9eaef |
| Auth Card | White-blue gradient |

### Supported Currencies:
USD, EUR, GBP, JPY, AUD, CAD, MMK, THB, VND, IDR, MYR, PHP, SGD, KRW, CNY, INR (+ 100+ more)

### POI Currency Behavior:
- POIs inherit currency from the trip's budget currency
- Fallback: MMK (for Myanmar users as default)
- Socket.io and HTTP API both use trip.budget.currency as default

### Session Fixes (April 2026):
| # | Fix | Description |
|----|-----|-------------|
| 1 | Edit/Delete buttons | Fixed ownership check for POI cards |
| 2 | Socket.io auth | Pass userId for authenticated POI operations |
| 3 | Voting | 1 vote per user, toggle on/off |
| 4 | Vote button UI | Visual feedback (blue when voted) |
| 5 | Marker popup | Expanded with cost, votes, date |
| 6 | Date validation | Block past dates in trip create |
| 7 | Currency fallback | POI defaults to trip's budget currency |

### UI Fixes (April 2026):
| # | Fix | Description |
|----|-----|-------------|
| 1 | Scrollbar hiding | Modern CSS (scrollbar-width: none, -ms-overflow-style, ::-webkit-scrollbar) |
| 2 | Modal rounded corners | overflow: hidden on modal to clip content to rounded corners |
| 3 | Desktop modal height | Increased max-height from 60vh to 85vh (no scroll needed) |

### Pending Features:
- Trip details page (view/edit/delete) ✅ COMPLETE
- POI Management (map integration) ✅ COMPLETE
- Leaflet Maps ✅ COMPLETE
- Voting System UI ✅ COMPLETE
- Budget Meter UI ✅ COMPLETE
- Real-time Socket.io sync ✅ COMPLETE
- Deployment