import crypto from "crypto";
import supabase from "../../../Middleware/Database/DatabaseConnect.js";
import { createShipmentLog } from "./Logs/CreateShipmentLog.js";

export async function createShipment(data, orgId) {
  try {
    if (!data.batch_id || !data.destination_org_id || !data.medicines_amount) {
      return {
        success: false,
        status: 400,
        error: "Batch ID, destination org, and medicines_amount are required",
      };
    }

    /* =========================
       1️⃣ Fetch Batch
    ========================== */
    const { data: batch, error: batchError } = await supabase
      .from("batches")
      .select("id, is_active, remaining_quantity, expiry_date")
      .eq("id", data.batch_id)
      .single();

    if (batchError || !batch) {
      return { success: false, status: 404, error: "Batch not found" };
    }

    if (!batch.is_active) {
      return { success: false, status: 400, error: "Batch is inactive." };
    }

    if (new Date(batch.expiry_date) < new Date()) {
      return { success: false, status: 400, error: "Batch has expired." };
    }

    const requestedAmount = Number(data.medicines_amount);

    if (batch.remaining_quantity < requestedAmount) {
      return {
        success: false,
        status: 400,
        error: "Insufficient remaining quantity in batch",
      };
    }

    /* =========================
       2️⃣ Deduct Quantity
    ========================== */
    const { error: updateError } = await supabase
      .from("batches")
      .update({
        remaining_quantity: batch.remaining_quantity - requestedAmount,
      })
      .eq("id", data.batch_id);

    if (updateError) throw updateError;

    /* =========================
       3️⃣ Create Shipment
    ========================== */
    const trackingCode = crypto.randomUUID();

    const { data: shipment, error: shipmentError } = await supabase
      .from("shipments")
      .insert([
        {
          batch_id: data.batch_id,
          tracking_code: trackingCode,
          source_org_id: orgId,
          destination_org_id: data.destination_org_id,
          current_holder_org_id: orgId,
          next_expected_holder_org_id: null,
          blockchain_txn_id: data.txn_id,
          status: "CREATED",
          escrowed: true,
          redeemed: false,
          is_active: true,
          deposit_tx_hash: data.deposit_tx_hash || null,
          redeem_tx_hash: null,
          medicines_amount: requestedAmount,
        },
      ])
      .select()
      .single();

    if (shipmentError) throw shipmentError;

    /* =========================
       4️⃣ Fetch Organization Address (JSONB)
    ========================== */
    const { data: organization, error: orgError } = await supabase
      .from("organizations")
      .select("address")
      .eq("id", orgId)
      .single();

    if (orgError) throw orgError;

    const orgAddress = organization?.address || null;

    /* =========================
      4️⃣ Allocate Serial Numbers
    ========================== */


    /* =========================
    4️⃣ Allocate ALL Serial Numbers (FULL BATCH)
 ========================== */

    // 1️⃣ Fetch ALL unassigned serials of this batch
    const { data: serialsToAssign, error: serialFetchError } = await supabase
      .from("batch_serials")
      .select("serial_number, box_id")
      .eq("batch_id", data.batch_id)
      .is("shipment_id", null); // 🔥 ONLY unassigned

    if (serialFetchError) throw serialFetchError;

    if (!serialsToAssign || serialsToAssign.length === 0) {
      return {
        success: false,
        status: 400,
        error: "No unassigned serials found for this batch",
      };
    }

    // Extract
    const serialNumbersToAssign = serialsToAssign.map(s => s.serial_number);
    const boxIds = [...new Set(serialsToAssign.map(s => s.box_id).filter(Boolean))];

    // 2️⃣ Update ALL serials
    const { error: serialUpdateError } = await supabase
      .from("batch_serials")
      .update({
        shipment_id: shipment.id,
        is_locked: true
      })
      .eq("batch_id", data.batch_id);

    if (serialUpdateError) throw serialUpdateError;

    // 3️⃣ Update ALL boxes of this batch
    const { error: boxUpdateError } = await supabase
      .from("boxes")
      .update({ shipment_id: shipment.id })
      .eq("batch_id", data.batch_id);

    if (boxUpdateError) throw boxUpdateError;

    // 4️⃣ Update ALL pallets of this batch (direct by batch_id)
    const { error: palletUpdateError } = await supabase
      .from("pallets")
      .update({ shipment_id: shipment.id })
      .eq("batch_id", data.batch_id);

    if (palletUpdateError) throw palletUpdateError;

    /* =========================
       5️⃣ Create Shipment Log
    ========================== */
    await createShipmentLog({
      shipment_id: shipment.id,
      organization_id: orgId,
      action: "CREATED",
      location: orgAddress,  // ✅ Passing JSONB as-is
      notes: "Shipment created and escrow initiated",
    });

    return {
      success: true,
      status: 201,
      message: "Shipment created successfully",
      tracking_code: shipment.tracking_code,
      data: shipment,
    };

  } catch (err) {
    console.error("Create shipment error:", err);
    return {
      success: false,
      status: 500,
      error: err.message || "Internal Server Error",
    };
  }
}