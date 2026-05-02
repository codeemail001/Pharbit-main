import supabase from "../../../../Middleware/Database/DatabaseConnect.js";

export async function createShipmentLog({
  shipment_id,
  organization_id,
  action,
  location = null,
  temperature = null,
  distance_travelled = null,
  notes = null,
}) {
  try {
    if (!shipment_id || !organization_id || !action) {
      return {
        success: false,
        error: "shipment_id, organization_id and action are required",
      };
    }

    const { data, error } = await supabase
      .from("shipment_logs")
      .insert([
        {
          shipment_id,
          organization_id,
          action,
          location,
          temperature,
          distance_travelled,
          notes,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      data,
    };
  } catch (err) {
    console.error("CreateShipmentLog Error:", err.message);
    return {
      success: false,
      error: err.message,
    };
  }
}