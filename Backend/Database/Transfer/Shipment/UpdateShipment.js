import supabase from "../../../Middleware/Database/DatabaseConnect.js";
import { createShipmentLog } from "./Logs/CreateShipmentLog.js";

export async function updateShipmentOnScan(trackingCode, orgId) {
  try {

    /* =========================
       1️⃣ Fetch Shipment
    ========================== */
    const { data: shipment, error } = await supabase
      .from("shipments")
      .select("*")
      .eq("tracking_code", trackingCode)
      .single();

    if (error || !shipment) {
      return { success: false, status: 404, error: "Shipment not found" };
    }

    /* =========================
       2️⃣ Check Authorization
    ========================== */
    if (
      shipment.next_expected_holder_org_id !== orgId &&
      shipment.destination_org_id !== orgId
    ) {
      return {
        success: false,
        status: 403,
        error: "You are not authorized to receive this shipment",
      };
    }

    /* =========================
       3️⃣ Update Shipment State
    ========================== */
    const isFinalDestination = shipment.destination_org_id === orgId;

    const { data: updatedShipment, error: updateError } = await supabase
      .from("shipments")
      .update({
        current_holder_org_id: orgId,
        next_expected_holder_org_id: null,
        status: "RECEIVED",
        updated_at: new Date(),
      })
      .eq("id", shipment.id)
      .select()
      .single();

    if (updateError) throw updateError;

    /* =========================
       4️⃣ Fetch Org Address
    ========================== */
    const { data: org } = await supabase
      .from("organizations")
      .select("address")
      .eq("id", orgId)
      .single();

    /* =========================
       5️⃣ ALWAYS Create RECEIVED Log
    ========================== */
    await createShipmentLog({
      shipment_id: shipment.id,
      organization_id: orgId,
      action: "RECEIVED",
      location: org?.address || null,
      notes: isFinalDestination
        ? "Shipment received at final destination"
        : "Shipment received by intermediate organization",
    });

    /* =========================
       6️⃣ If Final Destination → Allow Redeem
    ========================== */
    if (isFinalDestination) {
      return {
        success: true,
        status: 200,
        message: "Final destination reached. Proceed to redeem.",
        action: "REDEEM",
        data: updatedShipment,
      };
    }

    /* =========================
       7️⃣ Otherwise Normal Receive
    ========================== */
    return {
      success: true,
      status: 200,
      message: "Shipment received successfully",
      action: "RECEIVED",
      data: updatedShipment,
    };

  } catch (err) {
    console.error("Update shipment error:", err);
    return {
      success: false,
      status: 500,
      error: err.message || "Internal Server Error",
    };
  }
}