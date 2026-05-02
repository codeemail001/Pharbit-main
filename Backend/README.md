# Pharbit Backend

The Pharbit backend is an Express-based API and worker system that powers the application’s operational logic across authentication, medicines, batches, shipments, packaging, recalls, and blockchain synchronization.

It sits between:

- the `Frontend` React app
- Supabase for authentication and relational data
- Redis + BullMQ for background job processing
- the Pharbit smart contract through `ethers`

This backend does two kinds of work:

1. synchronous API handling for validation, data lookup, and lightweight writes
2. asynchronous worker processing for blockchain transactions and long-running flows

## Tech Stack

- Node.js
- Express
- Supabase JavaScript client
- BullMQ
- Redis
- Ethers v6
- Multer
- CSV Parse
- Dotenv

## Folder Structure

```text
Backend/
├── Database/                 Supabase service-layer logic
│   ├── Product/
│   ├── Transfer/
│   └── Users/
├── Middleware/Database/      Supabase client, auth helpers, encryption, uploads
├── Queue/                    BullMQ queues and Redis connection
├── Routes/                   Express route handlers
├── Workers/                  Background job consumers for blockchain and recall flows
├── abi/                      Contract ABI used by workers and redeem logic
├── uploads/                  Temporary CSV upload directory
├── package.json
├── server.js
└── README.md
```

## What The Backend Does

At a high level, the backend is responsible for:

- organization creation and wallet generation
- authentication using Supabase auth and cookie-based sessions
- employee invitation and onboarding
- medicine registration and verification
- batch mint registration and serial storage
- shipment creation, passing, receiving, redemption, and recall
- packaging uploads that bind serials to boxes and pallets
- freeze and recall coordination between database state and blockchain state

## Runtime Architecture

The backend has two execution surfaces:

### 1. API Server

The API server is started from `server.js` and mounts all route files directly at `/`.

Important server behavior:

- listens on port `4500`
- enables CORS for `http://localhost:5173`
- supports cookie-based auth
- parses JSON and URL-encoded form data

### 2. Queue Workers

The `Workers/` folder contains standalone BullMQ worker consumers.

These workers handle flows that should not run inside a normal request-response cycle, especially:

- blockchain minting
- on-chain shipment initiation
- on-chain freeze calls
- redeem processing
- recall return processing

Important note:

- the current `package.json` only starts `server.js`
- worker files are not automatically started by the API server
- in development or deployment, these worker processes need to be run explicitly

## Core Modules

### `Middleware/Database/DatabaseConnect.js`

Creates the Supabase service client using:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`

This is used throughout the backend for both auth and table access.

### `Middleware/Database/AuthUser.js`

Provides helper functions for:

- reading the `Pharbit_Token` cookie
- resolving the logged-in Supabase user
- resolving the employee profile
- resolving the linked organization and role

Key behavior:

- authenticated routes depend on the cookie token
- employee-to-organization linkage is resolved through the `employees` table

### `Middleware/Database/EncryptDecrypt.js`

Encrypts and decrypts organization wallet private keys using AES-256-GCM.

This powers:

- secure wallet storage during organization creation
- wallet decryption inside blockchain workers when transactions must be signed

Required env var:

- `MASTER_KEY`

### `Middleware/Database/uploadfiles.js`

Configures Multer with in-memory storage and a `50 MB` file size limit.

This is mainly used for:

- medicine document uploads

## Main Business Domains

### 1. Users and Organizations

Backend responsibilities in this area:

- create organizations with generated wallets
- create and authenticate auth users
- link employees to organizations
- invite employees with role-controlled access

Relevant folders:

- `Routes/Users/`
- `Database/Users/`

### 2. Medicines

Backend responsibilities in this area:

- register medicine metadata
- upload medical documents
- verify medicines
- fetch medicine inventory for organizations and admin review
- expose public medicine lookup endpoints

Relevant folders:

- `Routes/Medicine/`
- `Database/Product/Medicines/`

### 3. Batches

Backend responsibilities in this area:

- create database batch records after on-chain minting
- store and validate serial numbers
- fetch organization and global batches
- freeze and recall batches
- package serials into boxes and pallets

Relevant folders:

- `Routes/Batches/`
- `Database/Transfer/Batches/`
- `Database/Transfer/Packaging/`

### 4. Shipments

Backend responsibilities in this area:

- create shipment records after on-chain token escrow
- maintain shipment status transitions
- support current, source, destination, and incoming shipment views
- redeem shipment transfers
- pass shipments onward
- recall and return shipments

Relevant folders:

- `Routes/Transfer/`
- `Database/Transfer/Shipment/`

## Key Data Flows

### Medicine Registration Flow

1. Client submits medicine data and supporting files to `POST /addMeds`
2. Route authenticates the user and resolves their organization
3. `createMedicine(...)` normalizes array fields, uploads documents, validates uniqueness by `drug_code`, and inserts into `medicines`
4. Record is saved with:
   - `is_verified: false`
   - `verification_status: "pending"`

### Batch Mint Flow

1. Client submits `POST /auto-mint` with medicine info and optional serial CSV
2. Route authenticates, validates medicine ownership, parses serial numbers, and queues a mint job
3. `Workers/mintworker.js`:
   - decrypts organization wallet
   - calls `mintBatch(...)` on the smart contract
   - reads the `BatchMinted` event
   - persists the batch using `createBatch(...)`
4. `createBatch(...)` inserts:
   - a row in `batches`
   - serials in `batch_serials` in chunks

### Shipment Creation Flow

1. Client calls `POST /create-shipment`
2. Route validates the sender, batch, and receiver wallet
3. Route queues a shipment job
4. `Workers/shipmentWorker.js`:
   - decrypts the sender wallet
   - hashes courier payload
   - calls `sendTokens(...)` on-chain
   - reads the `TransferInitiated` event
   - writes the shipment to Supabase using `createShipment(...)`
5. `createShipment(...)` also:
   - deducts remaining quantity from the batch
   - creates a shipment record
   - locks serials
   - attaches shipment ids to serials, boxes, and pallets
   - creates a shipment log entry

### Freeze Flow

1. Client calls `POST /freeze-batch`
2. Route validates ownership and active batch state
3. Route queues a freeze job
4. `Workers/freezeWorker.js`:
   - decrypts organization wallet
   - calls `freezeBatch(...)` on-chain
   - updates the database through `Database/Transfer/Batches/FreezeBatch.js`

### Recall Return Flow

1. Client calls `POST /redeem-recall-batch`
2. Route queues a recall job
3. `Workers/recallWorker.js`:
   - resolves whether return should happen from escrow or an organization wallet
   - selects the appropriate signer
   - calls `returnFrozenTokens(...)` on-chain
   - coordinates shipment return logic in the database

### Packaging Flow

1. Client uploads a CSV to `POST /package-order`
2. Route parses rows containing:
   - `serial_number`
   - `box_code`
   - `pallet_code`
3. `createPackaging(...)`:
   - upserts pallets
   - upserts boxes
   - updates `batch_serials.box_id`

## API Routes

All routes are mounted at `/` from `server.js`.

### User and Auth Routes

#### `POST /auth/signup`

Creates a user account in Supabase auth and auto-logs them in.

Expected body:

```json
{
  "email": "user@example.com",
  "password": "secret",
  "firstName": "Jane",
  "lastName": "Doe"
}
```

#### `POST /auth/login`

Logs in a user and sets the `Pharbit_Token` cookie.

Expected body:

```json
{
  "email": "user@example.com",
  "password": "secret"
}
```

#### `POST /auth/logout`

Clears the auth cookie and signs out the Supabase session.

#### `GET /auth/me`

Returns the authenticated user’s linked employee details.

#### `POST /auth/accept-invite`

Accepts an employee invitation token and creates the employee account.

Expected body:

```json
{
  "token": "invite-token",
  "password": "secret"
}
```

### Organization Routes

#### `POST /organization`

Creates an organization and generates a blockchain wallet.

Expected body:

```json
{
  "registrationId": "ORG-001",
  "organizationName": "Acme Pharma",
  "type": "manufacturer"
}
```

Important note:

- the current implementation returns the generated private key in the response
- this is useful for development but should be treated as highly sensitive

#### `GET /organization`

Returns all organizations.

### Employee Routes

#### `POST /org/invite`

Invites an employee into the authenticated organization.

#### `POST /auth/accept-invite`

Completes employee registration from an invite token.

### Medicine Routes

#### `POST /addMeds`

Creates a medicine record with optional uploaded documents.

Request format:

- multipart form-data
- supports `medicineDocuments`

#### `PUT /verifyMeds?id=...&status=...`

Admin-only route for approving or rejecting medicines.

#### `GET /medicines?status=pending|accepted|rejected|approved`

Fetches medicines by verification status.

#### `GET /Orgmeds`

Fetches medicines for the authenticated organization.

Employee behavior:

- employee users may get filtered results based on `verified_by`

#### `GET /NearbyBatches?id=<medicineId>`

Public-facing route used to find retailer-visible medicine availability.

#### `GET /allmeds`

Returns a minimal medicine list for public search.

### Batch Routes

#### `GET /OrgBatches`

Returns batches owned by the authenticated organization.

#### `GET /FetchBatches`

Returns globally fetchable active batches.

#### `GET /FetchBatch/:id`

Returns a single batch by database id.

#### `GET /TransferedBatch`

Returns transferred batch records for the authenticated organization.

#### `POST /freeze-batch`

Queues a blockchain and database freeze for an owned batch.

Expected body:

```json
{
  "batchId": "db-batch-id",
  "medicineId": "medicine-id",
  "recallReason": "Quality issue"
}
```

#### `POST /redeem-recall-batch`

Queues a recall return flow.

Expected body:

```json
{
  "shipment_id": "shipment-id",
  "tracking_code": "tracking-uuid"
}
```

#### `POST /package-order`

Uploads a packaging CSV that assigns serials to boxes and pallets.

Request format:

- multipart form-data
- file field: `packaging_csv`

### Shipment Routes

#### `POST /create-shipment`

Queues shipment creation and on-chain escrow transfer.

Expected body:

```json
{
  "batch_id": "batch-id",
  "amount": 100,
  "receiver_org_id": "org-id",
  "pricePerToken": 10
}
```

#### `GET /shipments/current`

Returns shipments where the authenticated organization is the current holder.

#### `GET /shipments/next`

Returns shipments expected to be received next by the authenticated organization.

#### `GET /shipments/source`

Returns shipments where the authenticated organization is the source.

#### `GET /shipments/destination`

Returns shipments where the authenticated organization is the destination.

#### `POST /pass-shipment`

Advances a shipment to the next holder or continues the chain.

Expected body:

```json
{
  "shipment_id": "shipment-id",
  "batch_id": "batch-id",
  "next_holder_org_id": "next-org-id",
  "temperature": "2C-8C"
}
```

#### `POST /recall-shipment`

Runs recall logic for a shipment already in the transfer chain.

#### `POST /redeem-shipment`

Queues a shipment redeem flow.

Expected body:

```json
{
  "shipment_id": "shipment-id"
}
```

#### `POST /scan-shipment`

Scans a tracking code to update shipment state.

Expected body:

```json
{
  "tracking_code": "tracking-uuid"
}
```

## Queue System

Defined in `Queue/queue.js`:

- `mintQueue`
- `shipmentQueue`
- `redeemQueue`
- `freezeQueue`
- `recallQueue`

Redis configuration in `Queue/redis.js`:

- host: `127.0.0.1`
- port: `6379`

The API uses these queues to offload slow or failure-prone blockchain operations from normal HTTP requests.

## Worker Processes

### `Workers/mintworker.js`

Consumes `mintQueue` jobs and:

- loads medicine data
- decrypts org wallet
- calls `mintBatch(...)`
- parses `BatchMinted`
- writes batch data into Supabase

### `Workers/shipmentWorker.js`

Consumes `shipmentQueue` jobs and:

- decrypts sender wallet
- calls `sendTokens(...)`
- parses `TransferInitiated`
- creates shipment records and logs

### `Workers/redeemWorker.js`

Consumes `redeemQueue` jobs and:

- runs shipment redeem database logic

### `Workers/freezeWorker.js`

Consumes `freezeQueue` jobs and:

- decrypts org wallet
- calls `freezeBatch(...)`
- updates batch state in Supabase

### `Workers/recallWorker.js`

Consumes `recallQueue` jobs and:

- runs shipment return logic
- uses either admin or organization signing keys
- calls `returnFrozenTokens(...)`

## Environment Variables

The backend uses the following environment variables.

### Required

- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`
- `MASTER_KEY`
- `CONTRACT_ADDRESS`
- `SEPOLIA_RPC_URL`

### Required For Specific Flows

- `ADMIN_PRIVATE_KEY`
  Used by recall return processing when escrowed tokens must be returned from the admin-controlled context.

### Optional / Runtime

- `NODE_ENV`

## Local Development

### Install Dependencies

```bash
cd Backend
npm install
```

### Start The API Server

```bash
npm run dev
```

or:

```bash
npm start
```

### Start Redis

BullMQ requires Redis on:

- `127.0.0.1:6379`

### Run Worker Processes

The current repo does not define worker start scripts in `package.json`, so workers should be started explicitly while developing or deploying.

Typical examples:

```bash
node Workers/mintworker.js
node Workers/shipmentWorker.js
node Workers/redeemWorker.js
node Workers/freezeWorker.js
node Workers/recallWorker.js
```

If you want a smoother developer experience, adding dedicated npm scripts for these workers would be a very good next step.

## Authentication Model

The backend uses cookie-based auth with Supabase.

Current behavior:

- login sets `Pharbit_Token`
- authenticated routes read the cookie and resolve the user through Supabase auth
- most dashboard routes expect `credentials: "include"` from the frontend

Cookie behavior differs slightly between login and signup:

- login currently uses `sameSite: "lax"` and `secure: false`
- signup/logout use `process.env.NODE_ENV === "production"` for `secure`

## File Uploads and CSV Inputs

The backend currently supports:

- medicine documents through `POST /addMeds`
- serial number CSV uploads through `POST /auto-mint`
- packaging CSV uploads through `POST /package-order`

CSV handling is used for:

- batch serial ingestion
- packaging layout ingestion

## Notable Implementation Details

A few important backend characteristics are worth knowing before extending the system:

- routes are mounted directly at `/`, so endpoint naming consistency matters
- Supabase is used for both auth and application data
- background workers are essential for full functionality
- organization private keys are encrypted in storage and decrypted only when transactions must be signed
- several business flows depend on blockchain event parsing to sync database records
- the backend mixes purely synchronous DB routes with eventually consistent worker-backed operations

## Current Operational Risks And Caveats

These are not blockers to using the backend, but they matter for maintainers:

- worker startup is manual right now because there are no dedicated npm scripts
- `POST /organization` currently returns the raw generated private key, which is dangerous outside controlled development
- some multi-step DB flows do partial rollback rather than full transactional handling
- several critical operations depend on contract events being emitted and parsed successfully
- Redis availability is required for mint, shipment, freeze, redeem, and recall queue-based flows

## Important Files

- `server.js`
- `package.json`
- `Middleware/Database/DatabaseConnect.js`
- `Middleware/Database/AuthUser.js`
- `Middleware/Database/EncryptDecrypt.js`
- `Queue/queue.js`
- `Queue/redis.js`
- `Routes/Users/Auth.js`
- `Routes/Users/Organization.js`
- `Routes/Medicine/MintingMedicine.js`
- `Database/Transfer/Batches/CreateBatch.js`
- `Database/Transfer/Batches/FreezeBatch.js`
- `Database/Transfer/Shipment/CreateShipment.js`
- `Database/Transfer/Packaging/CreatePackagedOrder.js`
- `Workers/mintworker.js`
- `Workers/shipmentWorker.js`
- `Workers/freezeWorker.js`
- `Workers/redeemWorker.js`
- `Workers/recallWorker.js`

## Recommended Next Improvements

The next most valuable backend improvements would be:

1. add npm scripts for all workers
2. add a health check route and queue health visibility
3. document the Supabase schema and relationships
4. unify error response shapes across all routes
5. harden secret-handling around organization wallet creation
6. add transactional guarantees where multi-step DB updates can partially succeed
