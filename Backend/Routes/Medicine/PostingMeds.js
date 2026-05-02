import express from "express";
import { FindOrganization, FindRole, getAuthUser } from "../../Middleware/Database/AuthUser.js";
import { upload } from "../../Middleware/Database/uploadfiles.js";
import { createMedicine } from "../../Database/Product/Medicines/Post/CreateMedicine.js";
import { verifyMedicine } from "../../Database/Product/Medicines/Post/verifyMeds.js";

const router = express.Router();

router.post("/addMeds", upload.fields([{ name: "medicineDocuments", maxCount: 10 }]),
  async (req, res) => {
    try {
      const authUser = await getAuthUser(req);

      if (!authUser) {
        return res.status(401).json({
          error: "Unauthorized"
        });
      }
      const orgResult = await FindOrganization(authUser.id);

      if (!orgResult.success) {
        return res.status(404).json({
          error: orgResult.error
        });
      }
      const files = req.files || {};
      const data = req.body;
      const orgId = orgResult.data.id;
      const result = await createMedicine(
        data,
        orgId,
        files
      );
      return res.status(result.status).json(result);
    } catch (err) {
      console.error("Add medicine error:", err);
      return res.status(500).json({
        error: err.message || "Internal server error"
      });
    }
  }
);


router.put("/verifyMeds", async (req, res) => {
  try {
    const authUser = await getAuthUser(req);

    if (!authUser) {
      return res.status(401).json({
        error: "Unauthorized"
      });
    }

    const roleResult = await FindRole(authUser.id);
    if (!["admin", "owner"].includes(roleResult.role)) {
      return res.status(403).json({
        error: "Admin/Owner access required"
      });
    }
    const medicineId = req.query.id;
    const status = req.query.status;

    if (!medicineId) {
      return res.status(400).json({
        error: "Medicine ID is required"
      });
    }
    const result = await verifyMedicine(medicineId, authUser.id, status);
    return res.status(result.status).json(result);

  } catch (err) {

    console.error("Verify medicine error:", err);

    return res.status(500).json({
      error: "Internal server error"
    });
  }
});




export default router;