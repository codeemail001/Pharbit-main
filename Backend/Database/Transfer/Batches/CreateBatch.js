import supabase from "../../../Middleware/Database/DatabaseConnect.js";

export async function createBatch(data, orgId) {
  try {

    if (!data.medicine_id || !data.batch_number) {
      return {
        success: false,
        status: 400,
        error: "Medicine ID and Batch Number are required",
      };
    }

    const mintId = data.batch_number;
    console.log("DATA RECEIVED:", data.serial_numbers?.length);

    const { data: existingBatch, error: checkError } = await supabase
      .from("batches")
      .select("id, batch_number, blockchain_mint_id")
      .or(`blockchain_mint_id.eq.${mintId}, blockchain_tx_hash.eq.${data.blockchain_tx_hash}`)
      .maybeSingle();

    if (checkError) throw checkError;

    if (existingBatch) {
      return {
        success: false,
        status: 409,
        error: "A batch with this Mint ID or Transaction Hash already exists.",
      };
    }

    /* =========================
       Insert Batch (UNCHANGED)
    ========================== */
    const { data: inserted, error: insertError } = await supabase
      .from("batches")
      .insert([
        {
          organization_id: orgId,
          medicine_id: data.medicine_id,

          blockchain_mint_id: mintId,
          blockchain_tx_hash: data.blockchain_tx_hash,
          blockchain_network: data.blockchain_network || "mainnet",

          batch_number: data.batch_number,
          manufacturing_date: data.manufacturing_date,
          expiry_date: data.expiry_date,

          batch_quantity: Number(data.batch_quantity),
          remaining_quantity: Number(data.batch_quantity),

          is_quality_verified: true,
          is_active: true,

          warehouse_location: data.warehouse_location || null,
        },
      ])
      .select()
      .single();

    if (insertError) {
      if (insertError.code === "23505") {
        return {
          success: false,
          status: 409,
          error: "Unique constraint violation (Batch/Mint ID already exists)",
        };
      }
      throw insertError;
    }

    /* ============================================================
       NEW: INSERT SERIAL NUMBERS (IF PROVIDED)
    ============================================================ */

    if (data.serial_numbers && Array.isArray(data.serial_numbers)) {
      console.log("SERIAL ARRAY CHECK:", Array.isArray(data.serial_numbers));

      const serialNumbers = data.serial_numbers
        .filter(s => s !== null && s !== undefined && s !== "")
        .map(s => String(s).trim());

      // 1️⃣ Validate count matches batch_quantity
      if (serialNumbers.length !== Number(data.batch_quantity)) {
        return {
          success: false,
          status: 400,
          error: "Serial count must match batch quantity",
        };
      }

      // 2️⃣ Check duplicates inside CSV
      const unique = new Set(serialNumbers);
      if (unique.size !== serialNumbers.length) {
        return {
          success: false,
          status: 400,
          error: "Duplicate serial numbers detected",
        };
      }

      // 3️⃣ Prepare payload
      const serialPayload = serialNumbers.map(serial => ({
        serial_number: serial,
        batch_id: inserted.id,
        shipment_id: null,
      }));
      console.log("SERIAL PAYLOAD COUNT:", serialPayload.length);

      // 4️⃣ Insert in chunks (safe for Supabase limits)
      const chunkSize = 500;

      for (let i = 0; i < serialPayload.length; i += chunkSize) {
        const chunk = serialPayload.slice(i, i + chunkSize);
        console.log("INSERTING CHUNK SIZE:", chunk.length);
        const { error: serialError } = await supabase
          .from("batch_serials")
          .insert(chunk);

        if (serialError) {
          console.error("SERIAL INSERT ERROR:", serialError);
          // Rollback batch if serial insert fails
          await supabase
            .from("batches")
            .delete()
            .eq("id", inserted.id);

          throw serialError;
        }
      }
    }

    /* =========================
       Final Success Response
    ========================== */
    return {
      success: true,
      status: 201,
      message: "Batch successfully registered and minted",
      data: inserted,
    };

  } catch (err) {
    console.error("Create batch error:", err);
    return {
      success: false,
      status: 500,
      error: err.message || "Internal Server Error",
    };
  }
}