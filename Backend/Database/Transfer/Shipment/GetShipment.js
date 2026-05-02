import supabase from "../../../Middleware/Database/DatabaseConnect.js";
import FindShipmentLogs from "./Logs/GetShipmentLog.js";

/* ============================================================
   SELECT STRINGS (Data Minimization)
============================================================ */

// Use this for Source/Destination/Admin views
const shipmentSelectFull = `
  id, tracking_code, status, medicines_amount, created_at,
  batch:batches (
    id, blockchain_mint_id, manufacturing_date, expiry_date, is_quality_verified,
    medicines:medicine_id ( id, name, brand_name, composition, dosage_form, strength, drug_code, mrp, cost_price, storage_conditions, warnings, side_effects, category )
  ),
  source_org:source_org_id ( name ),
  destination_org:destination_org_id ( name ),
  current_holder_org:current_holder_org_id ( name )
`;

// Use this for Current & Next Holders (Logistics/Transit View)
const shipmentSelectLean = `
  id, 
  tracking_code, 
  status, 
  medicines_amount,
  
  batch:batches (
    id , 
    blockchain_mint_id,
    expiry_date,
    is_quality_verified,
    medicines:medicine_id (
      name,
      brand_name,
      dosage_form,
      strength,
      storage_conditions
    ),
    is_recalled ,
    is_active 
  ),
   
  current_holder_org:current_holder_org_id (
    name
  ), 
  source_org:source_org_id ( name ),
  destination_org:destination_org_id ( name )
`;
/* ============================================================
   Helper: Attach Shipment Logs
============================================================ */
const attachLogs = async (shipments) => {
  if (!shipments || shipments.length === 0) return [];
  return await Promise.all(
    shipments.map(async (shipment) => {
      const logsResult = await FindShipmentLogs(shipment.id);
      return {
        ...shipment,
        shipment_logs: logsResult.success ? logsResult.data : [],
      };
    })
  );
};

/* ============================================================
   LEAN QUERIES (Current & Next Holders)
============================================================ */

// 1. Current Holder: Only sees logistics-essential data
const FindShipment = async (orgId) => {
  try {
    if (!orgId) return [];
    const { data, error } = await supabase
      .from("shipments")
      .select(shipmentSelectLean) // LEAN DATA
      .eq("current_holder_org_id", orgId)
      .eq("is_active" , true )
      .order("created_at", { ascending: false });

    if (error) throw error;
    return await attachLogs(data);
  } catch (err) {
    console.error("FindShipment Exception:", err.message);
    return [];
  }
};

// 2. Incoming/Next Holder: Only sees logistics-essential data
const FindIncomingShipment = async (orgId) => {
  try {
    if (!orgId) return [];
    const { data, error } = await supabase
      .from("shipments")
      .select(shipmentSelectLean) // LEAN DATA
      .eq("next_expected_holder_org_id", orgId)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return await attachLogs(data);
  } catch (err) {
    console.error("FindIncomingShipment Exception:", err.message);
    return [];
  }
};

/* ============================================================
   FULL QUERIES (Source & Destination)
============================================================ */

const FindShipmentForDestination = async (orgId) => {
  try {
    if (!orgId) return [];
    const { data, error } = await supabase
      .from("shipments")
      .select(shipmentSelectFull) // FULL DATA
      .eq("destination_org_id", orgId)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return await attachLogs(data);
  } catch (err) {
    console.error("FindShipmentForDestination Exception:", err.message);
    return [];
  }
};

const FindShipmentForSource = async (orgId) => {
  try {
    if (!orgId) return [];
    const { data, error } = await supabase
      .from("shipments")
      .select(shipmentSelectFull) // FULL DATA
      .eq("source_org_id", orgId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return await attachLogs(data);
  } catch (err) {
    console.error("FindShipmentForSource Exception:", err.message);
    return [];
  }
};

export {
  FindShipment,
  FindShipmentForDestination,
  FindShipmentForSource,
  FindIncomingShipment
};