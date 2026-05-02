# Pharbit Frontend

This frontend is the user-facing React application for Pharbit. It provides:

- authentication flows for users and invited employees
- an organization dashboard for medicines, batches, shipments, and transfer actions
- admin review screens for pending medicine approvals
- a public medicine search and availability view with map-based location display

The app is built with React, Vite, React Router, Tailwind tooling, and a custom CSS-heavy component system.

## Tech Stack

- React 19
- Vite 7
- React Router
- Tailwind CSS tooling
- Lucide React icons
- React Hot Toast
- Leaflet and React Leaflet for map views

## Frontend Responsibilities

The frontend is responsible for:

- handling login, signup, and invite-based employee activation
- rendering dashboard navigation and operational views
- submitting medicine registration forms and support documents
- initiating batch minting with optional serial CSV upload
- initiating batch freezing and shipment creation
- receiving, passing, redeeming, and recalling shipments
- exposing a public medicine lookup flow for stock visibility across organizations

Heavy blockchain operations are not performed directly in the browser. The UI talks to the backend API, which queues BullMQ jobs and performs on-chain work in backend workers.

## Folder Structure

```text
Frontend/
├── src/
│   ├── App.jsx
│   ├── main.jsx
│   ├── Pages/
│   │   ├── Admin/
│   │   ├── Dashboard/
│   │   └── Home/
│   ├── Layout/
│   │   └── Dashboard/
│   ├── Components/
│   │   ├── Admin/
│   │   └── Dashboard/
│   ├── Styles/
│   └── assets/
├── package.json
├── vite.config.js
└── README.md
```

## App Entry and Routing

Main entry files:

- `src/main.jsx`: wraps the app in `BrowserRouter`
- `src/App.jsx`: defines public and dashboard routes

### Public Routes

- `/` : public homepage and medicine search
- `/Home/:id` : medicine availability and location map
- `/Auth` : login, signup, and employee invite activation
- `/Pending` : admin-facing pending medicine review page
- `/Form` : medicine creation form

### Dashboard Routes

The dashboard is rendered through `src/Layout/Dashboard/profiledashboard.jsx` and uses `Outlet`-based nested routing.

- `/Dashboard`
- `/Dashboard/products`
- `/Dashboard/add-product`
- `/Dashboard/Batches`
- `/Dashboard/Shipments`
- `/Dashboard/Requests`
- `/Dashboard/Passing`
- `/Dashboard/Transfer/Batches`

## Main Pages

### `src/Pages/Auth.jsx`

Handles three auth flows:

- login
- user signup
- employee activation with invite token

Behavior:

- reads `token` from the URL for invite-based activation
- uses `react-hot-toast` for feedback
- sends cookie-enabled auth requests to the backend

Backend routes used:

- `POST /auth/login`
- `POST /auth/signup`
- `POST /auth/accept-invite`

### `src/Layout/Dashboard/MedicalForm.jsx`

This is the medicine registration screen. It uses a four-step form flow:

1. Basic identification
2. Medical specifications
3. Safety and storage
4. Compliance and pricing

Key features:

- array-style inputs for composition, warnings, side effects, storage, and category
- multi-file upload support for supporting documents
- live preview panel
- review modal before submit

Backend route used:

- `POST /addMeds`

### `src/Pages/Dashboard/Products.jsx`

Shows the organization medicine inventory.

Features:

- search
- client-side sort and filtering
- localStorage caching
- medicine detail modal
- actions from the shared dashboard header

From this screen users can:

- inspect medicine details
- open mint flow through `ViewModal`
- create shipment
- freeze batch
- invite employee

Backend route used:

- `GET /Orgmeds`

### `src/Components/Dashboard/ViewModal.jsx`

This modal shows medicine details and unlocks batch minting when the medicine is approved.

Mint form fields:

- supply
- manufacturing date
- expiry date
- warehouse location
- optional serial CSV

Backend route used:

- `POST /auto-mint`

### `src/Pages/Dashboard/Batches.jsx`

Displays batches owned by the logged-in organization.

Features:

- search by medicine or mint id
- filter active vs inactive batches
- sort by name, quantity, or date
- batch detail modal

Backend route used:

- `GET /OrgBatches`

### `src/Pages/Dashboard/Shipment.jsx`

Displays outgoing or source-side shipment records.

Features:

- status filtering
- shipment detail modal
- tracking visibility
- local pagination

Backend route used:

- `GET /shipments/source`

### `src/Pages/Dashboard/Requests.jsx`

Displays incoming shipment requests for the logged-in organization.

Main action:

- receive shipment through `ReceiveShipmentModal`

Backend routes used:

- `GET /shipments/next`
- `POST /scan-shipment`

### `src/Pages/Dashboard/Passing.jsx`

Displays shipments currently in custody.

Main actions:

- pass shipment to the next organization
- trigger recall-related handling for frozen batches

Backend routes used:

- `GET /shipments/current`
- `POST /pass-shipment`
- `POST /redeem-recall-batch`

### `src/Pages/Dashboard/Transferred.jsx`

Displays transferred or incoming batches associated with the organization.

Main action:

- open transfer detail modal

Backend route used:

- `GET /TransferedBatch`

### `src/Pages/Admin/PendingRequest.jsx`

Admin view for pending medicine approval requests.

Features:

- search
- tab filters
- price and date filters
- CSV export
- card-based moderation UI

Backend route used:

- `GET /medicines?status=pending`

Moderation action used in `RequestCard`:

- `PUT /verifyMeds`

### `src/Pages/Home/home.jsx`

Public landing page for medicine search.

Features:

- live medicine filtering
- simple dropdown suggestions
- navigation into medicine-specific availability pages

Backend route used:

- `GET /allmeds`

### `src/Pages/Home/MedsLocate.jsx`

Public medicine location page with Leaflet map rendering.

Features:

- medicine detail card
- stock visibility by organization
- low-stock highlighting
- map markers and popups

Backend route used:

- `GET /NearbyBatches?id=...`

## Shared Dashboard UI

### `src/Components/Dashboard/Header.jsx`

The shared top header handles:

- search input
- user profile display
- open create shipment modal
- open freeze batch modal
- open invite employee modal
- navigate to add product

Backend route used:

- `GET /auth/me`

### `src/Components/Dashboard/Sidebar.jsx`

The sidebar provides dashboard navigation and a collapse/expand interaction.

Sections linked:

- Dashboard
- Inventory
- Batches
- Add Products
- Requests
- Passing
- Track Shipments
- Incoming Batch

## Important Modals

The dashboard relies heavily on modal-based workflows.

Key modal components:

- `MedicalFormModal.jsx`
- `ViewModal.jsx`
- `BatchViewModal.jsx`
- `CreateShipmentModal.jsx`
- `FreezeBatchModal.jsx`
- `PassingModal.jsx`
- `ReceiveShipmentModal.jsx`
- `ShipDetailModal.jsx`
- `TransferredModal.jsx`
- `InviteEmployeeModal.jsx`

These modals handle most of the action-oriented operations without forcing route changes.

## API Integration

### Primary API Base URL

Most authenticated frontend requests use:

```env
VITE_API_URL=...
```

This variable is read through `import.meta.env.VITE_API_URL`.

### Cookie-Based Auth

Many requests include:

```js
credentials: "include"
```

That means the backend must:

- allow credentials in CORS
- set auth cookies correctly
- run on an origin compatible with the frontend dev server

## Current Integration Notes

There is one important implementation detail in the current frontend:

- most pages use `VITE_API_URL`
- some screens still use hardcoded URLs like `http://localhost:6090`

Examples of hardcoded usage currently present:

- `src/Pages/Home/home.jsx`
- `src/Pages/Home/MedsLocate.jsx`
- `src/Components/Dashboard/InviteEmployeeModal.jsx`

For cleaner deployment and environment portability, these should eventually be normalized to `VITE_API_URL`.

## Styling Approach

The frontend uses a mixed styling setup:

- custom CSS modules by feature folder under `src/Styles`
- Tailwind toolchain in the project config
- icon-based visual system using `lucide-react`

Main style areas:

- `src/Styles/Pages/*`
- `src/Styles/Components/*`
- `src/Styles/Layout/*`
- `src/Styles/Home/*`
- `src/Styles/Admin/*`

The visual style leans on:

- glassmorphism-inspired tables and cards
- dashboard-oriented list views
- modal-driven actions
- branded public home and map views

## State and Data Patterns

The frontend currently uses local React state rather than a centralized state library.

Common patterns in the code:

- `useState` and `useEffect` for page data loading
- localStorage caching for short-lived API results
- modal-driven local UI state
- client-side pagination, search, and filtering

There is no global API client abstraction yet. Most pages call `fetch(...)` directly.

## Local Development

### Install

```bash
cd Frontend
npm install
```

### Run Dev Server

```bash
npm run dev
```

Vite will typically start on:

- `http://localhost:5173`

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Environment Setup

Create a frontend `.env` file with at least:

```env
VITE_API_URL=http://localhost:4500
```

Use the actual backend origin your local environment exposes.

## Expected Backend Dependencies

For the frontend to work correctly, the following backend services need to be running:

- Express API
- Supabase-backed auth and data layer
- Redis for background queue support
- backend workers for minting, shipment, freeze, redeem, and recall operations

Some UI actions only queue a request, so results may appear after backend processing completes.

## Known Frontend Characteristics

A few current codebase characteristics are worth knowing when working on this app:

- route naming mixes lowercase and capitalized dashboard segments
- some pages use cached API responses with short TTLs
- logout in the sidebar currently navigates to `/` and does not directly call `/auth/logout`
- the app is component-rich but does not yet use a dedicated data-fetching library like React Query
- the public pages and dashboard pages share the same app, but they behave like two distinct product surfaces

## Useful Files

- `src/App.jsx`
- `src/main.jsx`
- `src/Layout/Dashboard/profiledashboard.jsx`
- `src/Layout/Dashboard/MedicalForm.jsx`
- `src/Pages/Auth.jsx`
- `src/Pages/Dashboard/Products.jsx`
- `src/Pages/Dashboard/Batches.jsx`
- `src/Pages/Dashboard/Shipment.jsx`
- `src/Pages/Dashboard/Requests.jsx`
- `src/Pages/Dashboard/Passing.jsx`
- `src/Pages/Dashboard/Transferred.jsx`
- `src/Pages/Admin/PendingRequest.jsx`
- `src/Pages/Home/home.jsx`
- `src/Pages/Home/MedsLocate.jsx`

## Suggested Next Improvements

If you want to keep improving the frontend docs, the next helpful additions would be:

1. a screen-by-screen product guide with screenshots
2. a dedicated API contract document for frontend payloads
3. a component map for the dashboard modals
4. a cleanup pass to replace hardcoded backend URLs with `VITE_API_URL`
