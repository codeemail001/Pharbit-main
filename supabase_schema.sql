-- ==========================================
-- PHARBIT SUPABASE INITIALIZATION SCRIPT
-- ==========================================
-- Copy and paste this entirely into the Supabase SQL Editor and hit RUN.

-- 1. Organizations Table
CREATE TABLE public.organizations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    registration_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    wallet_address TEXT UNIQUE,
    wallet_encrypted TEXT,
    wallet_iv TEXT,
    wallet_tag TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Employees Table
CREATE TABLE public.employees (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    auth_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    role TEXT DEFAULT 'staff',
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Medicines Table
CREATE TABLE public.medicines (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    brand_name TEXT,
    composition JSONB DEFAULT '[]'::jsonb,
    category JSONB DEFAULT '[]'::jsonb,
    dosage_form TEXT,
    strength TEXT,
    route_of_administration TEXT,
    drug_code TEXT NOT NULL,
    hsn_code TEXT,
    schedule TEXT,
    approval_number TEXT,
    manufacturing_license TEXT,
    mrp NUMERIC,
    cost_price NUMERIC,
    storage_conditions JSONB DEFAULT '[]'::jsonb,
    warnings JSONB DEFAULT '[]'::jsonb,
    side_effects JSONB DEFAULT '[]'::jsonb,
    legal_document_url TEXT,
    is_verified BOOLEAN DEFAULT false,
    verification_status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Batches Table
CREATE TABLE public.batches (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id),
    medicine_id UUID REFERENCES public.medicines(id),
    blockchain_mint_id TEXT,
    blockchain_tx_hash TEXT,
    blockchain_network TEXT DEFAULT 'mainnet',
    batch_number TEXT NOT NULL,
    manufacturing_date DATE,
    expiry_date DATE,
    batch_quantity INTEGER NOT NULL,
    remaining_quantity INTEGER NOT NULL,
    is_quality_verified BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    warehouse_location TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(blockchain_mint_id),
    UNIQUE(blockchain_tx_hash)
);

-- 5. Shipments Table
CREATE TABLE public.shipments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    batch_id UUID REFERENCES public.batches(id),
    tracking_code UUID UNIQUE NOT NULL,
    source_org_id UUID REFERENCES public.organizations(id),
    destination_org_id UUID REFERENCES public.organizations(id),
    current_holder_org_id UUID REFERENCES public.organizations(id),
    next_expected_holder_org_id UUID REFERENCES public.organizations(id),
    blockchain_txn_id TEXT,
    status TEXT DEFAULT 'CREATED',
    escrowed BOOLEAN DEFAULT true,
    redeemed BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    deposit_tx_hash TEXT,
    redeem_tx_hash TEXT,
    medicines_amount INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Pallets Table (For Packaging)
CREATE TABLE public.pallets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    pallet_code TEXT UNIQUE,
    batch_id UUID REFERENCES public.batches(id),
    shipment_id UUID REFERENCES public.shipments(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Boxes Table (For Packaging)
CREATE TABLE public.boxes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    box_code TEXT UNIQUE,
    pallet_id UUID REFERENCES public.pallets(id),
    batch_id UUID REFERENCES public.batches(id),
    shipment_id UUID REFERENCES public.shipments(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Batch Serials Table
CREATE TABLE public.batch_serials (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    serial_number TEXT NOT NULL,
    batch_id UUID REFERENCES public.batches(id) ON DELETE CASCADE,
    shipment_id UUID REFERENCES public.shipments(id),
    box_id UUID REFERENCES public.boxes(id),
    is_locked BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(serial_number, batch_id)
);

-- 9. Shipment Logs Table
CREATE TABLE public.shipment_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    shipment_id UUID REFERENCES public.shipments(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES public.organizations(id),
    action TEXT NOT NULL,
    location JSONB,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
