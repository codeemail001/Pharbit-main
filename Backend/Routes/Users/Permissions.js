import express from "express";
import supabase from "../../Middleware/Database/DatabaseConnect.js";
import { getAuthUser, FindUser } from "../../Middleware/Database/AuthUser.js";

const router = express.Router();

// Get all employees for the organization of the logged-in user
router.get("/org/employees", async (req, res) => {
  try {
    const authUser = await getAuthUser(req);
    const currentUser = await FindUser(authUser.id);

    if (!["owner", "admin"].includes(currentUser.role) && !(currentUser.permissions || []).includes("ACCESS_CONTROL_PANEL")) {
      return res.status(403).json({ error: "Forbidden: Access control restricted" });
    }

    const { data, error } = await supabase
      .from("employees")
      .select("*")
      .eq("organization_id", currentUser.organization_id);

    if (error) throw error;
    res.status(200).json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update permissions for a specific employee
router.post("/org/employees/permissions", async (req, res) => {
  try {
    const { employeeId, permissions } = req.body;
    const authUser = await getAuthUser(req);
    const currentUser = await FindUser(authUser.id);

    // Only owners or those with ACCESS_CONTROL_PANEL can modify permissions
    if (!["owner", "admin"].includes(currentUser.role) && !(currentUser.permissions || []).includes("ACCESS_CONTROL_PANEL")) {
      return res.status(403).json({ error: "Forbidden" });
    }

    // Verify the target employee is in the same organization
    const { data: targetEmployee, error: fetchError } = await supabase
      .from("employees")
      .select("organization_id")
      .eq("id", employeeId)
      .single();

    if (fetchError || !targetEmployee) throw new Error("Employee not found");
    if (targetEmployee.organization_id !== currentUser.organization_id) {
      return res.status(403).json({ error: "Cannot modify employees outside your organization" });
    }

    const { error: updateError } = await supabase
      .from("employees")
      .update({ permissions })
      .eq("id", employeeId);

    if (updateError) throw updateError;
    res.status(200).json({ success: true, message: "Permissions updated successfully" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
