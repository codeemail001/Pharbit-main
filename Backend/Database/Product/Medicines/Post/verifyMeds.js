import supabase from "../../../../Middleware/Database/DatabaseConnect.js";
import { FindMeds } from "../Get/FindMedicines.js";

export async function verifyMedicine(medicineId, adminId = null, status) {
  try {

    if (!medicineId) {
      return {
        success: false,
        status: 400,
        error: "Medicine ID is required"
      };
    }

    if (!status) {
      return {
        success: false,
        status: 400,
        error: "status is required"
      };
    }

    const result = await FindMeds(medicineId);

    if (!result.success) {
      return result;
    }

    const medicine = result.data;

    if (medicine.is_verified) {
      return {
        success: false,
        status: 409,
        error: "Medicine already verified"
      };
    }

    const { data: updated, error: updateError } = await supabase
      .from("medicines")
      .update({
        is_verified: status === "accepted",
        verification_status: status
      })
      .eq("id", medicineId)
      .select()
      .single();

    if (updateError) throw updateError;

    return {
      success: true,
      status: 200,
      message: "Medicine verified successfully",
      data: updated
    };

  } catch (err) {

    console.error("Verify medicine error:", err);

    return {
      success: false,
      status: 500,
      error: err.message || "Server error"
    };
  }
}