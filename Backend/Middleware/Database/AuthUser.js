import supabase from "./DatabaseConnect.js";

export const getAuthUser = async (req) => {
  try {
    // 1. Check Authorization Header (Bearer Token)
    const authHeader = req.headers.authorization;
    let token = null;
    
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }
    
    // 2. Fallback to Cookie
    if (!token || token === "null" || token === "undefined") {
      token = req.cookies?.Pharbit_Token;
    }

    // 3. Clean up
    if (token === "null" || token === "undefined") {
      token = null;
    }

    console.log("📡 Auth Check - Token Present:", !!token);
    
    if (!token) {
      console.log("❌ No token found in headers or cookies.");
      throw new Error("Unauthorized");
    }

    // 4. Verify with Supabase
    const { data, error } = await supabase.auth.getUser(token);
    
    if (error || !data.user) {
      console.error("❌ Supabase Auth Error:", error?.message || "User not found");
      throw new Error("Unauthorized");
    }

    return data.user;
  } catch (err) {
    console.error("🔒 Auth Middleware Error:", err.message);
    throw err;
  }
};


export const FindUser = async (userId) => {
  const { data, error } = await supabase
    .from("employees")
    .select("*")
    .eq("auth_id", userId)
    .single();

  if (error) throw error;
  return data;
};


export const FindRole = async (userId) => {
  const { data, error } = await supabase
    .from("employees")
    .select("role")
    .eq("auth_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("FindRole DB Error:", error);
    throw error;
  }

  if (!data || data.length === 0) {
    return null;
  }

  return data[0]; 
};


export const FindOrganization = async (userId) => {
  try {
    const { data: employee, error: empError } = await supabase
      .from("employees")
      .select("organization_id , role ")
      .eq("auth_id", userId)
      .single();

    if (empError || !employee) {
      return {
        success: false,
        error: "User not linked to any organization"
      };
    }

    const { data: organization, error: orgError } = await supabase
      .from("organizations")
      .select("*")
      .eq("id", employee.organization_id)
      .single();

    if (orgError || !organization) {
      return {
        success: false,
        error: "Organization details not found"
      };
    }

    return {
      success: true,
      data: organization,
      role: employee.role
    };
  } catch (err) {
    console.error("FindOrganization unexpected error:", err);
    return {
      success: false,
      error: "Internal error fetching organization"
    };
  }
};