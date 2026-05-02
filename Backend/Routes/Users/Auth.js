import express from "express";
console.log("🚀 AUTH ROUTER FILE LOADED: Auth.js is being executed!");
import supabase from "../../Middleware/Database/DatabaseConnect.js";
import { createAuthUser } from "../../Database/Users/User/CreateUser.js";
import { FindUser, getAuthUser } from "../../Middleware/Database/AuthUser.js";
import { UserDetails } from "../../Database/Users/User/UserDetails.js";

const router = express.Router();

router.get("/auth/test", (req, res) => {
  res.json({ message: "Auth Router is Active!" });
});

//User Login 
router.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required"
      });
    }
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    if (error || !data?.session) {
      return res.status(401).json({
        error: "Invalid email or password"
      });
    }
    const { user, session } = data;
    res.cookie("Pharbit_Token", session.access_token, {
      httpOnly: true,
      secure: false, 
      sameSite: "lax",
      maxAge: 60 * 60 * 1000,
      path: "/"
    });

    console.log("Cookie should be set now");
    console.log("Headers being sent:", res.getHeaders());

    return res.status(200).json({
      message: "Login successful",
      user: {
        id: user.id,
        email: user.email
      }
    });

  } catch (err) {

    console.error("Login error:", err);

    return res.status(500).json({
      error: "Login failed"
    });
  }
});


// User Signup
router.post("/auth/signup", async (req, res) => {
  try {

    const { email, password, firstName, lastName } = req.body;

    // Validate
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        error: "All fields are required"
      });
    }

    // Create user (Admin)
    const authUser = await createAuthUser(
      email,
      password,
      firstName,
      lastName
    );

    if (!authUser) {
      return res.status(400).json({
        error: "User creation failed"
      });
    }

    // Auto login
    const { data: loginData, error: loginErr } =
      await supabase.auth.signInWithPassword({
        email,
        password
      });

    if (loginErr || !loginData?.session) {
      return res.status(400).json({
        error: "Login after signup failed"
      });
    }

    res.cookie("Pharbit_Token", loginData.session.access_token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 60 * 60 * 1000,
      path: "/"
    });

    return res.status(201).json({
      message: "Signup successful",
      user: {
        id: authUser.id,
        email: authUser.email,
        name: `${firstName} ${lastName}`
      }
    });

  } catch (err) {
    console.error("Signup error:", err);
    // If it's a Supabase/Auth error, return 400
    if (err.__isAuthError || err.status === 422) {
      return res.status(400).json({
        error: err.message || "Email already exists or invalid data"
      });
    }
    return res.status(500).json({
      error: err.message || "Signup failed"
    });
  }
});


// User Logout 
router.post("/auth/logout", async (req, res) => {
  try {

    const token = req.cookies?.Pharbit_Token;

    if (!token) {
      return res.status(200).json({
        message: "Already logged out"
      });
    }
    const { error } = await supabase.auth.admin.signOut(token);

    if (error) {
      console.error("Supabase logout error:", error.message);
    }

    res.clearCookie("Pharbit_Token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/"
    });

    return res.status(200).json({
      message: "Logout successful"
    });

  } catch (err) {

    console.error("Logout error:", err);

    return res.status(500).json({
      error: "Logout failed"
    });
  }
});



router.get("/auth/me", async (req, res) => {
  try {

    const authUser = await getAuthUser(req);

    if (!authUser) {
      return res.status(401).json({
        error: "Unauthorized"
      });
    }
    const employee = await UserDetails(authUser.id);
    
    // If not an employee, construct a basic user object from metadata
    const userData = employee || {
        email: authUser.email,
        first_name: authUser.user_metadata?.first_name || "User",
        last_name: authUser.user_metadata?.last_name || "",
        role: "user" // Default role for non-employees
    };

    return res.status(200).json({
      message: "User fetched successfully",
      employee: userData
    });

  } catch (err) {
    console.error("ME error:", err);
    const status = err.message === "Unauthorized" ? 401 : 500;
    return res.status(status).json({
      error: err.message || "Failed to fetch user"
    });
  }
});

export default router;