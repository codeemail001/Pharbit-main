import supabase from "../../../Middleware/Database/DatabaseConnect.js";
import { createShipmentLog } from "./Logs/CreateShipmentLog.js";
import { OrgDetails } from "../../Users/Organization/FindOrganization.js";

export async function ReturnShipment(shipmentId, tracking_code, orgId) {
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
      .maybeSingle();

    if (error || !shipment) {
      return {
        success: false,
        status: 404,
        error: "Shipment not found",
      };
    }

    /* =========================
       2️⃣ Validations
    ========================== */
    if (shipment.tracking_code !== tracking_code) {
      return {
        success: false,
        status: 400,
        error: "Wrong Tracking Code",
      };
    }

    if (!shipment.is_active) {
      return {
        success: false,
        status: 400,
        error: "Shipment already returned",
      };
    }

    /* =========================
       3️⃣ Handle Redeemed Case
    ========================== */

    let amount;
    let returnSource;

    if (shipment.redeemed) {
      // 🔹 ESCROW FLOW
      const { data: batchTx, error: batchError } = await supabase
        .from("batch_transmitted")
        .select("amount, returned")
        .eq("batch_id", shipment.batch_id)
        .single();

      if (batchError || !batchTx || batchTx.returned) {
        return {
          success: false,
          status: 400,
          error: "Batch not found or already returned",
        };
      }

      amount = batchTx.amount;
      returnSource = "ORGANIZATION";

    } else {
      // 🔹 NORMAL FLOW
      amount = shipment.medicines_amount;
      returnSource = "ESCROW";
    }

    /* =========================
       4️⃣ Fetch Batch (for blockchain ID)
    ========================== */
    const { data: batch, error: batchError } = await supabase
      .from("batches")
      .select("blockchain_mint_id")
      .eq("id", shipment.batch_id)
      .single();

    if (batchError || !batch) {
      return {
        success: false,
        status: 404,
        error: "Batch not found",
      };
    }

    /* =========================
       5️⃣ Update Shipment
    ========================== */
    const { data: updatedShipment, error: updateError } = await supabase
      .from("shipments")
      .update({
        status: "RETURNED",
        current_holder_org_id: shipment.source_org_id,
        updated_at: new Date(),
        is_active: false,
      })
      .eq("id", shipmentId)
      .select()
      .single();

    if (updateError) throw updateError;


    // Update batch_transmitted.returned only if shipment.redeemed
    if (shipment.redeemed) {
      const { data: updatedBatch, error: updatingbatcherror } = await supabase
        .from("batch_transmitted")
        .update({
          returned: true,
        })
        .eq("batch_id", shipment.batch_id)
        .select()
        .maybeSingle();

      if (updatingbatcherror) throw updatingbatcherror;

      // optional: no need to throw if not found, just log
      if (!updatedBatch) {
        console.warn("No batch_transmitted record found (safe to ignore)");
      }
    }
    /* =========================
       6️⃣ Org Details + Logs
    ========================== */
    const org = await OrgDetails(orgId);

    if (!org) throw new Error("Organization not found");

    await createShipmentLog({
      shipment_id: shipmentId,
      organization_id: orgId,
      location: org.address || null,
      action: "RETURNED",
      notes: `Shipment returned to manufacturer warehouse`,
    });

    /* =========================
       ✅ Final Return
    ========================== */
    return {
      success: true,
      status: 200,
      message: "Shipment returned successfully",
      batch_blockchain_id: batch.blockchain_mint_id,
      amount: amount,
      returnSource: returnSource,
      data: updatedShipment,
    };

  } catch (err) {
    console.error("Return shipment error:", err);

    return {
      success: false,
      status: 500,
      error: err.message || "Internal Server Error",
    };
  }
}