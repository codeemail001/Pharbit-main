import express from "express";

import { FindUser, getAuthUser } from "../../Middleware/Database/AuthUser.js";
import { findInviteByToken, InviteEmployee, markInviteUsed } from "../../Database/Users/Organization/InviteEmployee.js";
import { createAuthUser } from "../../Database/Users/User/CreateUser.js";
import { EmployeeRegistration } from "../../Database/Users/Organization/EmployeeRegistration.js";

const router = express.Router();

router.post("/org/invite", async (req, res) => {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return res.status(401).json({
        error: "Unauthorized"
      });
    }
    const employee = await FindUser(authUser.id);
    if (!employee) {
      return res.status(403).json({
        error: "Not an employee"
      });
    }
    console.log(employee.role);
    if (!["manager", "owner", "admin"].includes(employee.role)) {
      return res.status(403).json({
        error: "You are not allowed to invite"
      });
    }
    const result = await InviteEmployee(
      req.body,
      employee
    );
    res.status(200).json({
      message: "Invite sent successfully",
      data: result
    });

  } catch (err) {
    console.error("Invite error:", err);
    res.status(400).json({
      error: err.message
    });
  }
});


router.post("/auth/accept-invite", async (req, res) => {
  try {

    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        error: "Token and password required"
      });
    }

    // 1. Find invite
    const invite = await findInviteByToken(token);

    // 2. Create auth user
    const authUser = await createAuthUser(
      invite.email,
      password,
      invite.first_name,
      invite.last_name,
    );

    // 3. Create employee
    const employee = await EmployeeRegistration({
      authId: authUser.id,
      orgId: invite.organization_id,
      email: invite.email,
      role: invite.role,
      firstName: invite.first_name,
      lastName: invite.last_name
    });

    await markInviteUsed(invite.id);
    return res.status(201).json({
      message: "Account created successfully",
      employee
    });

  } catch (err) {

    console.error("Accept invite error:", err);

    return res.status(400).json({
      error: err.message
    });
  }
});



export default router;