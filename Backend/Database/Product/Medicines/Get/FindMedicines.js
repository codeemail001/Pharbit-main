import supabase from "../../../../Middleware/Database/DatabaseConnect.js";

const FindMedicine = async (status) => {
  if (!status) {
    throw new Error("Verification status is required");
  }

  const { data, error } = await supabase
    .from("medicines")
    .select(`
      id,
      organization_id,
      name,
      brand_name,
      composition,
      dosage_form,
      strength,
      route_of_administration,
      drug_code,
      hsn_code,
      schedule,
      manufacturing_license,
      approval_number,
      legal_document_url,
      is_verified,
      mrp,
      cost_price,
      storage_conditions,
      warnings,
      side_effects,
      created_at,
      category,
      verification_status,
      organization:organization_id (
        name
      )
    `)
    .eq("verification_status", status);

  if (error) throw error;
  return data;
};


const FindOrganizationMeds = async (orgId) => {
  if (!orgId) {
    throw new Error("Organization ID is required");
  }

  const { data, error } = await supabase
    .from("medicines")
    .select("*")
    .eq("organization_id", orgId);

  if (error) throw error;
  return data;
};


const FindOrganizationMedsEmployee = async (orgId, userId, role) => {
  if (!orgId) {
    throw new Error("Organization ID is required");
  }

  if (!role) {
    throw new Error("Role is required");
  }

  let query = supabase
    .from("medicines")
    .select("*")
    .eq("organization_id", orgId);

  if (role === "employee") {
    query = query.eq("verified_by", userId);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data;
};


const FindMeds = async (id) => {
  if (!id) {
    throw new Error("Medicine ID is required");
  }

  const { data, error } = await supabase
    .from("medicines")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;

  if (!data) {
    return {
      success: false,
      status: 404,
      error: "Medicine not found"
    };
  }

  return {
    success: true,
    status: 200,
    data
  };
};


const FindBatchNearby = async (medicineid) => {
  if (!medicineid) {
    throw new Error("Medicine ID is required");
  }
  const { data, error } = await supabase
  .from("batch_transmitted")
  .select(`
    id,
    amount,
    created_at,

    batch:batches (
      id,
      blockchain_mint_id,
      expiry_date,
      medicine_id,
      medicines:medicine_id (
        id,
        name,
        brand_name , 
        composition , 
        dosage_form,
        strength,
        route_of_administration,
        side_effects,
        mrp 

      )
    ),

    organization:organization_id (
      id,
      name,
      lat , 
      long , 
      address
    )
  `)
  .eq("batch.medicine_id", medicineid) 
  .eq("organization.type", "retailer")
  .eq("returned", true)
  .gt("amount", 0);

  if (error) throw error;

  if (!data) {
    return {
      success: false,
      status: 404,
      error: "Medicine not found"
    };
  }

  return {
    success: true,
    status: 200,
    data
  };
};



const FindAllMeds = async () => {
  try {
    const { data, error } = await supabase
      .from("medicines")
      .select(`
        id,
        name
      `);

    if (error) {
      throw error;
    }
    if (!data || data.length === 0) {
      return {
        success: false,
        status: 404,
        error: "No medicines found"
      };
    }

    return {
      success: true,
      status: 200,
      count: data.length,
      data
    };

  } catch (err) {
    console.error("FindAllMeds error:", err);

    return {
      success: false,
      status: 500,
      error: err.message || "Internal Server Error"
    };
  }
};




export {
  FindMedicine,
  FindMeds,
  FindOrganizationMeds,
  FindOrganizationMedsEmployee,
  FindBatchNearby,
  FindAllMeds
};