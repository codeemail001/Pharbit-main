import supabase from "../../../../Middleware/Database/DatabaseConnect.js";
import { uploadFiles } from "./uploadFiles.js";

export async function createMedicine(data, orgId, files) {
  try {

    /* =========================
       Normalize Arrays
    ========================== */

    const normalizeArray = (val) => {
      if (!val) return [];
      if (Array.isArray(val)) return val;
      if (typeof val === "string") {
        if (val.trim().startsWith("[") || val.trim().startsWith("{")) {
          try {
            const parsed = JSON.parse(val);
            return Array.isArray(parsed) ? parsed : [val];
          } catch {
            return val.split(",").map(s => s.trim());
          }
        }
        return val.split(",").map(s => s.trim());
      }
      return [val];
    };

    data.composition = normalizeArray(data.composition);
    data.category = normalizeArray(data.category);
    data.storage_conditions = normalizeArray(data.storage_conditions);
    data.warnings = normalizeArray(data.warnings);
    data.side_effects = normalizeArray(data.side_effects);

    /* =========================
       Upload Documents
    ========================== */

    let medicalDocsUrl = null;

    if (files?.medicineDocuments?.length > 0) {
      try {
        medicalDocsUrl = await uploadFiles(
          files.medicineDocuments,
          "Medicine-Documents"
        );
      } catch (uploadErr) {
        console.error("Upload failed:", uploadErr);
        return {
          success: false,
          status: 400,
          error: "Document upload failed"
        };
      }
    }

    /* =========================
       Validation
    ========================== */

    if (!data.name) {
      return { success: false, status: 400, error: "Medicine Name is required" };
    }
    if (data.composition.length === 0 || (data.composition.length === 1 && !data.composition[0])) {
      return { success: false, status: 400, error: "Composition is required" };
    }
    if (!data.drug_code) {
      return { success: false, status: 400, error: "Drug Code (license/ID) is required" };
    }

    /* =========================
       Duplicate Check
    ========================== */

    const { data: existing, error: findError } = await supabase
      .from("medicines")
      .select("id")
      .eq("drug_code", data.drug_code)
      .eq("organization_id", orgId)
      .maybeSingle();

    if (findError) throw findError;

    if (existing) {
      return {
        success: false,
        status: 409,
        error: "Medicine already exists"
      };
    }

    /* =========================
       Insert Medicine
    ========================== */

    const { data: inserted, error: insertError } = await supabase
      .from("medicines")
      .insert([
        {
          organization_id: orgId,

          name: data.name,
          brand_name: data.brand_name,

          composition: data.composition,
          category: data.category,

          dosage_form: data.dosage_form,
          strength: data.strength,
          route_of_administration: data.route_of_administration,

          drug_code: data.drug_code,
          hsn_code: data.hsn_code,
          schedule: data.schedule,

          approval_number: data.approval_number,
          manufacturing_license: data.manufacturing_license,

          mrp: data.mrp ? Number(data.mrp) : null,
          cost_price: data.cost_price ? Number(data.cost_price) : null,

          storage_conditions: data.storage_conditions,
          warnings: data.warnings,
          side_effects: data.side_effects,

          legal_document_url: medicalDocsUrl,

          is_verified: false,
          verification_status: "pending"
        }
      ])
      .select()
      .single();

    if (insertError) throw insertError;

    return {
      success: true,
      status: 201,
      message: "Medicine submitted for verification",
      data: inserted
    };

  } catch (err) {
    console.error("Create medicine error:", err);

    return {
      success: false,
      status: 500,
      error: err.message || "Server error"
    };
  }
}