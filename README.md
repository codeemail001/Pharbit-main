# Pharbit

Pharbit is a blockchain-backed pharmaceutical supply chain project with three main parts:

- `Frontend`: a React + Vite dashboard and public tracking UI
- `Backend`: an Express API backed by Supabase, BullMQ, Redis, and Ethers
- `Contract`: a Hardhat-based ERC-1155 smart contract for batch minting, transfer escrow, redemption, and freezing

The codebase models the lifecycle of a medicine batch from registration, verification, and blockchain minting through shipment transfer, redemption, recall, and packaging.

## Project Structure

```text
Pharbit/
├── Backend/     Express API, Supabase access, workers, queues
├── Frontend/    React + Vite UI
├── Contract/    Solidity contract + Hardhat config
└── README.md    Project overview
```

## High-Level Architecture

### 1. Frontend

The frontend is a Vite React application that provides:

- authentication
- dashboard pages for products, batches, shipments, transfer requests, and passing flows
- admin pending request views
- public medicine lookup / location pages

Relevant files:

- `Frontend/src/App.jsx`
- `Frontend/src/Pages/Dashboard/*`
- `Frontend/src/Components/Dashboard/*`
- `Frontend/src/Pages/Home/*`

### 2. Backend

The backend is an Express server in `Backend/server.js`. It:

- authenticates users through Supabase auth
- stores business data in Supabase tables
- queues blockchain-heavy tasks into BullMQ workers
- coordinates database state with on-chain state

Main backend areas:

- `Routes/`: HTTP endpoints
- `Database/`: service-layer logic for Supabase operations
- `Workers/`: background jobs that interact with the contract
- `Queue/`: BullMQ queue definitions and Redis connection
- `Middleware/Database/`: Supabase client, auth helpers, encryption helpers, upload helpers

### 3. Smart Contract

The contract in `Contract/contracts/Pharbit.sol` is an `ERC1155`-based system where:

- each batch is represented as a token id
- batch minting creates on-chain supply
- shipments move tokens into contract escrow
- redemption releases escrowed tokens to the receiver
- freeze disables a batch
- frozen tokens can be returned to the original company

## Main Product Flows

### Organization and User Flow

1. Create an organization and wallet through `POST /organization`
2. Sign up or log in through the auth routes
3. Invite employees with role-based access
4. Employees accept invite tokens and become linked to the organization

### Medicine Flow

1. A manager uploads a medicine record and documents
2. An admin verifies the medicine
3. The medicine becomes available for batch minting and downstream logistics

### Batch Minting Flow

1. Frontend calls `POST /auto-mint` with batch data and an optional CSV of serial numbers
2. The route authenticates the user, validates ownership, parses the CSV, and adds a BullMQ job
3. `Backend/Workers/mintworker.js`:
   - loads the medicine
   - decrypts the organization wallet
   - calls `mintBatch(...)` on the smart contract
   - reads the `BatchMinted` event from the receipt
   - saves the new batch in Supabase through `createBatch(...)`
4. `createBatch(...)` also inserts serial numbers into `batch_serials` in chunks

### Shipment Flow

1. Frontend calls `POST /create-shipment`
2. The route validates the sender, receiver, and batch
3. A BullMQ shipment job is queued
4. `Backend/Workers/shipmentWorker.js`:
   - decrypts sender wallet
   - hashes shipment metadata into a courier hash
   - calls `sendTokens(...)` on-chain
   - reads the `TransferInitiated` event
   - creates the shipment row in Supabase
5. Follow-up routes support scan, pass, recall, fetch, and redeem actions

### Freeze / Recall Flow

1. Frontend calls `POST /freeze-batch`
2. The route validates org ownership and queues a freeze job
3. `Backend/Workers/freezeWorker.js`:
   - decrypts org wallet
   - calls `freezeBatch(...)` on-chain
   - updates the database through `freezeBatch(...)`
4. Recall return operations use `recallWorker.js` and can release tokens either:
   - from escrow using the admin key
   - from an organization wallet if the organization still holds the tokens

### Packaging Flow

1. Frontend uploads a packaging CSV to `POST /package-order`
2. The route parses rows with:
   - `serial_number`
   - `box_code`
   - `pallet_code`
3. `createPackaging(...)`:
   - upserts pallets
   - upserts boxes
   - links serials to boxes in `batch_serials`

## Backend Routes

These are the main route groups currently mounted from `Backend/server.js`.

### User and Organization

- `POST /organization`
- `GET /organization`
- `POST /auth/signup`
- `POST /auth/login`
- `POST /auth/logout`
- `GET /auth/me`
- `POST /org/invite`
- `POST /auth/accept-invite`

### Medicines

- `POST /addMeds`
- `PUT /verifyMeds`
- `GET /medicines`
- `GET /Orgmeds`
- `GET /NearbyBatches`
- `GET /allmeds`

### Batches

- `GET /OrgBatches`
- `GET /FetchBatches`
- `GET /FetchBatch/:id`
- `GET /TransferedBatch`
- `POST /freeze-batch`
- `POST /redeem-recall-batch`
- `POST /package-order`

### Shipments

- `POST /create-shipment`
- `GET /shipments/current`
- `GET /shipments/next`
- `GET /shipments/source`
- `GET /shipments/destination`
- `POST /pass-shipment`
- `POST /recall-shipment`
- `POST /redeem-shipment`
- `POST /scan-shipment`

## Queue and Worker Design

BullMQ is used to move blockchain transactions out of the request-response path.

Defined queues in `Backend/Queue/queue.js`:

- `mintQueue`
- `shipmentQueue`
- `redeemQueue`
- `freezeQueue`
- `recallQueue`

Workers:

- `Backend/Workers/mintworker.js`
- `Backend/Workers/shipmentWorker.js`
- `Backend/Workers/redeemWorker.js`
- `Backend/Workers/freezeWorker.js`
- `Backend/Workers/recallWorker.js`

Redis is configured locally in `Backend/Queue/redis.js` on `127.0.0.1:6379`.

## Smart Contract Summary

`Contract/contracts/Pharbit.sol` includes:

- `mintBatch(...)`
- `sendTokens(...)`
- `redeemMeta(...)`
- `redeem(...)`
- `freezeBatch(...)`
- `unfreezeBatch(...)`
- `returnFrozenTokens(...)`
- `verifyMetadata(...)`

Important events:

- `BatchMinted`
- `TransferInitiated`
- `Redeemed`
- `BatchFrozen`
- `BatchUnfrozen`

## Environment Variables

The repo expects these environment variables based on current code usage.

### Backend

- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`
- `MASTER_KEY`
- `CONTRACT_ADDRESS`
- `SEPOLIA_RPC_URL`
- `ADMIN_PRIVATE_KEY`
- `NODE_ENV`

### Contract

- `SEPOLIA_RPC_URL`
- `PRIVATE_KEY`

### Frontend

The frontend has an `.env` file in the repo, but the current code I inspected does not clearly reference frontend env vars directly in the checked files.

## Local Development

### Backend

```bash
cd Backend
npm install
npm run dev
```

Backend server:

- default port: `4500`
- CORS origin currently set to `http://localhost:5173`

Note:

- BullMQ jobs require Redis to be running locally on port `6379`
- blockchain operations require valid keys, RPC access, and deployed contract settings

### Frontend

```bash
cd Frontend
npm install
npm run dev
```

Typical Vite dev URL:

- `http://localhost:5173`

### Contract

```bash
cd Contract
npm install
npx hardhat compile
```

Deployment configuration is in `Contract/hardhat.config.js`.

## Notable Files

- `Backend/server.js`: Express entrypoint and route registration
- `Backend/Middleware/Database/DatabaseConnect.js`: Supabase service client
- `Backend/Routes/Medicine/MintingMedicine.js`: queue-based batch mint initiation
- `Backend/Database/Transfer/Batches/CreateBatch.js`: DB batch creation and serial insertion
- `Backend/Database/Transfer/Batches/FreezeBatch.js`: DB-side freeze and recall status update
- `Backend/Database/Transfer/Packaging/CreatePackagedOrder.js`: pallets, boxes, and serial packaging linkage
- `Backend/Workers/mintworker.js`: blockchain mint worker
- `Backend/Workers/shipmentWorker.js`: blockchain transfer worker
- `Backend/Workers/freezeWorker.js`: blockchain freeze worker
- `Contract/contracts/Pharbit.sol`: core on-chain logic
- `Frontend/src/App.jsx`: route map for the UI

## Current Observations

The project already has a coherent batch and shipment lifecycle, but a few docs-worthy implementation details are worth knowing:

- existing `Frontend/README.md` and `Contract/README.md` are still starter templates
- backend routes are mounted directly at `/`, so route naming consistency matters
- queue workers are a core part of normal operation, not optional background extras
- Supabase is used as both auth provider and operational database
- the project depends on close synchronization between blockchain events and database records

## Suggested Next Documentation Upgrades

If you want, the next useful docs would be:

1. `Backend/README.md` with endpoint request and response examples
2. `API.md` with all payload schemas
3. `ARCHITECTURE.md` with sequence diagrams for mint, ship, redeem, freeze, and recall
4. `SETUP.md` with Redis, Supabase, and contract deployment instructions
