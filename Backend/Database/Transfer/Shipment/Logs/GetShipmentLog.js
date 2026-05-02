import supabase from "../../../../Middleware/Database/DatabaseConnect.js";

const FindShipmentLogs = async (shipmentId) => {
  if (!shipmentId) {
    return {
      success: false,
      status: 400,
      error: "Shipment id is required",
    };
  }

  try {
    const { data, error } = await supabase
      .from("shipment_logs")
      .select(`
        id,
        action,
        temperature,
        notes,
        created_at,
        organization:organization_id (
          name,
          address ,
          lat ,
          long 
        )
      `)
      .eq("shipment_id", shipmentId)
      .order("created_at", { ascending: true });

    if (error) throw error;

    // Supabase returns [] if no rows
    if (!data || data.length === 0) {
      return {
        success: false,
        status: 404,
        error: "No shipment logs found",
      };
    }

    return {
      success: true,
      status: 200,
      data,
    };
  } catch (err) {
    console.error("FindShipmentLogs Exception:", err.message);
    return {
      success: false,
      status: 500,
      error: err.message,
    };
  }
};

export default FindShipmentLogs;