import crypto from "crypto";
import supabase from "../../../Middleware/Database/DatabaseConnect.js";
import { createShipmentLog } from "./Logs/CreateShipmentLog.js";
import { OrgDetails } from "../../Users/Organization/FindOrganization.js";

export async function RecallShipment(shipmentId, orgId) {
  try {

    if (!shipmentId || !orgId) {
      return {
        success: false,
        status: 400,
        error: "Shipment ID and Organization ID are required",
      };
    }

    /* =========================
       1️⃣ Fetch Shipment
    ========================== */
    const { data: shipment, error } = await supabase
      .from("shipments")
      .select("*")
      .eq("id", shipmentId)
      .single();

    if (error || !shipment) {
      return { success: false, status: 404, error: "Shipment not found" };
    }

    if (!shipment.is_active || shipment.redeemed) {
      return {
        success: false,
        status: 400,
        error: "Shipment is inactive or already redeemed",
      };
    }

    /* =========================
       2️⃣ Validate Current Holder
    ========================== */
    if (shipment.current_holder_org_id !== orgId) {
      return {
        success: false,
        status: 403,
        error: "You are not authorized to recall this shipment",
      };
    }

    /* =========================
       3️⃣ Check Batch Status
    ========================== */
    const { data: batch, error: batchError } = await supabase
      .from("batches")
      .select("is_active")
      .eq("id", shipment.batch_id)
      .single();

    if (batchError || !batch) {
      return {
        success: false,
        status: 404,
        error: "Batch not found",
      };
    }

    if (batch.is_active) {
      return {
        success: false,
        status: 409,
        error: "Batch is still active. Cannot recall shipment.",
      };
    }

    /* =========================
       4️⃣ Generate New Tracking Code
    ========================== */
    const newTrackingCode = crypto.randomUUID();

    /* =========================
       5️⃣ Update Shipment
    ========================== */
    const { data: updatedShipment, error: updateError } = await supabase
      .from("shipments")
      .update({
        tracking_code: newTrackingCode,
        next_expected_holder_org_id: shipment.source_org_id,
        status: "RECALLING",
        updated_at: new Date(),
      })
      .eq("id", shipmentId)
      .select()
      .single();

    if (updateError) throw updateError;

    /* =========================
       6️⃣ Get Organization Details
    ========================== */
    const org = await OrgDetails(orgId);

    if (!org) {
      throw new Error("Organization not found");
    }

    /* =========================
       7️⃣ Create Log
    ========================== */
    await createShipmentLog({
      shipment_id: shipmentId,
      organization_id: orgId,
      location: org.address || null,
      action: "RECALLING",
      notes: `Shipment recalled back to source organization`,
    });

    return {
      success: true,
      status: 200,
      message: "Shipment recall initiated successfully",
      new_tracking_code: newTrackingCode,
      data: updatedShipment,
    };

  } catch (err) {
    console.error("Recall shipment error:", err);
    return {
      success: false,
      status: 500,
      error: err.message || "Internal Server Error",
    };
  }
}