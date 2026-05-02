import supabase from "../../../Middleware/Database/DatabaseConnect.js";

export async function createPackaging(batchId, packagingRows) {
    try {

        /* =========================
           1. Extract unique pallets and boxes
        ========================== */
        const uniquePallets = [...new Set(packagingRows.map(r => r.pallet_code))];
        if (!packagingRows || packagingRows.length === 0) {
            return { success: false, error: "No packaging data provided" };
        }
        const uniqueBoxes = [
            ...new Map(
                packagingRows.map(r => [r.box_code, { box_code: r.box_code, pallet_code: r.pallet_code }])
            ).values()
        ];

        for (const row of packagingRows) {
            if (!row.serial_number || !row.box_code || !row.pallet_code) {
                return { success: false, error: "Invalid row data in packagingRows" };
            }
        }

        /* =========================
           2. Insert pallets
        ========================== */
        const palletInserts = uniquePallets.map(pallet_code => ({
            pallet_code,
            batch_id: batchId,
        }));

        const { data: insertedPallets, error: palletError } = await supabase
            .from("pallets")
            .upsert(palletInserts, { onConflict: "pallet_code" })
            .select("id, pallet_code");

        if (palletError) throw new Error("Pallet insert failed: " + palletError.message);

        // map pallet_code → pallet.id
        const palletMap = {};
        insertedPallets.forEach(p => { palletMap[p.pallet_code] = p.id });
        if (!insertedPallets || insertedPallets.length === 0) {
            return { success: false, error: "No pallets inserted" };
        }

        /* =========================
           3. Insert boxes
        ========================== */
        const boxInserts = uniqueBoxes.map(({ box_code, pallet_code }) => ({
            box_code,
            batch_id: batchId,
            pallet_id: palletMap[pallet_code],
        }));

        const { data: insertedBoxes, error: boxError } = await supabase
            .from("boxes")
            .upsert(boxInserts, { onConflict: "box_code" })
            .select("id, box_code");

        if (boxError) throw new Error("Box insert failed: " + boxError.message);

        // map box_code → box.id
        const boxMap = {};
        insertedBoxes.forEach(b => { boxMap[b.box_code] = b.id });
        if (!insertedBoxes || insertedBoxes.length === 0) {
            return { success: false, error: "No boxes inserted" };
        }

      /* =========================
   4. Update batch_serials with box_id
========================== */
const CHUNK_SIZE = 500;

for (let i = 0; i < packagingRows.length; i += CHUNK_SIZE) {
    const chunk = packagingRows.slice(i, i + CHUNK_SIZE);

    for (const row of chunk) {
        const boxId = boxMap[row.box_code];
        if (!boxId || !row.serial_number) continue;

        const { error: serialError } = await supabase
            .from("batch_serials")
            .update({
                box_id: boxId,
            })
            .eq("serial_number", row.serial_number)
            .eq("batch_id", batchId);

        if (serialError) {
            console.error("SERIAL UPDATE ERROR:", serialError);
            throw new Error("Serial update failed: " + serialError.message);
        }
    }
}

        return {
            success: true,
            summary: {
                pallets: uniquePallets.length,
                boxes: uniqueBoxes.length,
                serials: packagingRows.length,
            }
        };

    } catch (error) {
        return { success: false, error: error.message };
    }
}