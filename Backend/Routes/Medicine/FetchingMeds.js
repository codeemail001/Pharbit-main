import express from "express";
import { FindAllMeds, FindBatchNearby, FindMedicine, FindOrganizationMeds, FindOrganizationMedsEmployee } from "../../Database/Product/Medicines/Get/FindMedicines.js";
import { FindOrganization, FindRole, getAuthUser } from "../../Middleware/Database/AuthUser.js";

const router = express.Router();

router.get("/medicines", async (req, res) => {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return res.status(401).json({
        error: "Unauthorized"
      });
    }

    const { status } = req.query;
    if (!status) {
      return res.status(400).json({
        error: "Status query param is required"
      });
    }
    if (status === "pending") {
      const roleResult = await FindRole(authUser.id);
      const userRole = roleResult?.role?.toLowerCase();
      console.log("DEBUG: Status=pending requested. User role:", userRole);
      
      if (!userRole) {
        console.warn("DEBUG: No role found for user", authUser.id);
        return res.status(403).json({
          error: "Access Denied: Your account is not yet linked to an organization role."
        });
      }

      if (!["admin", "owner"].includes(userRole)) {
        console.warn("DEBUG: Role", userRole, "not authorized for pending view");
        return res.status(403).json({
          error: `Access Denied: Role '${userRole}' does not have permission to view pending approvals.`
        });
      }
    }
    const medicines = await FindMedicine(status);
    return res.status(200).json({
      success: true,
      count: medicines.length,
      data: medicines
    });

  } catch (err) {

    console.error("Error fetching medicines:", err);

    return res.status(500).json({
      error: "Failed to fetch medicines"
    });
  }
});



router.get("/Orgmeds", async (req, res) => {
  try {
    const authUser = await getAuthUser(req);

    if (!authUser) {
      return res.status(401).json({
        error: "Unauthorized"
      });
    }

    const orgdata = await FindOrganization(authUser.id);

    if (!orgdata || !orgdata.data) {
      return res.status(404).json({
        error: "Organization not found"
      });
    }

    // ✅ Allow owner, manager & employee
    if (!["owner", "manager", "employee", "admin"].includes(orgdata.role)) {
      console.log("Access Denied - Role:", orgdata.role, "Allowed:", ["owner", "manager", "employee", "admin"]);
      return res.status(403).json({
        error: "Access denied"
      });
    }

    const orgId = orgdata.data.organization_id || orgdata.data.id;

    const medicines = await FindOrganizationMedsEmployee(
      orgId,
      authUser.id,
      orgdata.role
    );

    return res.status(200).json({
      success: true,
      count: medicines.length,
      data: medicines
    });

  } catch (err) {

    console.error("Error fetching medicines:", err);

    return res.status(500).json({
      error: "Failed to fetch medicines"
    });
  }
});

router.get("/NearbyBatches", async (req, res) => {
  try {

    const { id } = req.query; 
    if (!id) {
      return res.status(400).json({
        success: false,
        error: "Medicine ID is required",
      });
    }

    const batches = await FindBatchNearby(id);

    return res.status(200).json({
      success: true,
      count: batches.length,
      data: batches
    });

  } catch (err) {
    console.error("Error fetching all Batches:", err);
    return res.status(500).json({ error: "Failed to fetch all Batches" });
  }
});


router.get("/allmeds", async (req, res) => {
  try {
    
    const meds = await FindAllMeds()
    return res.status(200).json({
      success: true,
      count: meds.length,
      data: meds
    });

  } catch (err) {
    console.error("Error fetching all Medicine:", err);
    return res.status(500).json({ error: "Failed to fetch all Medicine" });
  }
});



export default router;