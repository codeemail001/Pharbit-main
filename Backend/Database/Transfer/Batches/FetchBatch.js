import supabase from "../../../Middleware/Database/DatabaseConnect.js";

/**
 * Fetches all active batches across the platform
 */
const FindBatch = async () => {
  try {
    const { data, error } = await supabase
      .from("batches")
      .select(`
        id,
        blockchain_mint_id,
        manufacturing_date, 
        expiry_date,
        batch_quantity,
        remaining_quantity,
        is_quality_verified,
        warehouse_location,
        medicines:medicine_id (
          id,
          name,
          brand_name,
          composition,
          dosage_form,
          strength,
          route_of_administration,
          drug_code,
          hsn_code,
          schedule,
          mrp,
          cost_price,
          storage_conditions,
          warnings,
          side_effects,
          category
        ),
        organization:organization_id (
          name
        )
      `)
      .eq("is_active", true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (err) {
    console.error("FindBatch Exception:", err.message);
    return [];
  }
};

/**
 * Fetches all batches belonging to a specific organization
 */
const FindOrganizationBatch = async (orgId) => {
  if (!orgId) {
    console.error("Fetch Error: Organization ID is missing");
    return [];
  }

  try {
    const { data, error } = await supabase
      .from("batches")
      .select(`
        id,
        blockchain_mint_id,
        blockchain_tx_hash,
        manufacturing_date, 
        expiry_date,
        batch_quantity,
        remaining_quantity,
        is_quality_verified,
        warehouse_location,
        created_at,
        is_active ,
        medicines:medicine_id (
          id,
          name,
          brand_name,
          drug_code,
          category,
          hsn_code 
        ),
        organization:organization_id (
          name
        )
      `)
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  } catch (err) {
    console.error("Error in FindOrganizationBatch:", err.message);
    return [];
  }
};

/**
 * Fetches a single batch by its UUID
 */
const FindBatchbyId = async (id) => {
  if (!id) {
    return { success: false, status: 400, error: "Batch ID is required" };
  }

  try {
    const { data, error } = await supabase
      .from("batches")
      .select(`
        id,
        blockchain_mint_id,
        manufacturing_date, 
        expiry_date,
        batch_quantity,
        remaining_quantity,
        is_quality_verified,
        warehouse_location,
        medicines:medicine_id (
          id,
          name,
          brand_name,
          composition,
          dosage_form,
          strength,
          route_of_administration,
          drug_code,
          hsn_code,
          schedule,
          mrp,
          cost_price,
          storage_conditions,
          warnings,
          side_effects,
          category
        ),
        organization:organization_id (
          name
        )
      `)
      .eq("id", id)
      .maybeSingle(); // Better for fetching by ID than order() + array

    if (error) throw error;

    if (!data) {
      return { success: false, status: 404, error: "Batch not found" };
    }

    return { success: true, status: 200, data };
  } catch (err) {
    console.error("FindBatchbyId Exception:", err.message);
    return { success: false, status: 500, error: err.message };
  }
};

/**
 * Fetches Transfered Batch by OrganizationId 
 */

const FindTransferedBatch = async (orgId) => {
  if (!orgId) {
    console.error("Fetch Error: Organization ID is missing");
    return [];
  }

  try {

    const { data: transmittedBatch, error } = await supabase
      .from("batch_transmitted")
      .select(`
        id,
        amount,
        deposit_tx_hash,
        redeem_tx_hash,
        created_at,
        returned , 

        batch:batches (
          id,
          blockchain_mint_id,
          manufacturing_date,
          expiry_date,
          is_active, 
          is_recalled , 
          is_quality_verified,

          medicines:medicine_id (
            id,
            name,
            brand_name,
            dosage_form,
            strength,
            storage_conditions
          )
        ),

        organization:organization_id (
          id,
          name
        ),

        shipment:shipment_id (
          id,
          tracking_code,
          status
        )
      `)
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return transmittedBatch || [];

  } catch (err) {
    console.error("Error in FindTransferedBatch:", err.message);
    return [];
  }
};


export {
  FindBatch,
  FindOrganizationBatch,
  FindBatchbyId,
  FindTransferedBatch
};