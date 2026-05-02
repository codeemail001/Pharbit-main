-- ==========================================
-- PHARBIT DATABASE CONSTRAINTS FIX
-- ==========================================
-- Run this in your Supabase SQL Editor to prevent duplicate roles
-- and ensure data integrity for medicines.

-- 1. Ensure each user has only ONE role record
-- Note: This may fail if you already have duplicates. 
-- Clean up duplicates first if necessary:
-- DELETE FROM public.employees a USING public.employees b WHERE a.id < b.id AND a.auth_id = b.auth_id;

ALTER TABLE public.employees ADD CONSTRAINT employees_auth_id_unique UNIQUE (auth_id);

-- 2. Ensure drug codes are unique within an organization
-- This prevents the same company from adding the same medicine twice.
ALTER TABLE public.medicines ADD CONSTRAINT medicines_drug_code_org_unique UNIQUE (organization_id, drug_code);
