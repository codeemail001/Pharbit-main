import supabase from "./DatabaseConnect.js";

export const getAuthUser = async (req) => {
  try {
    const authHeader = req.headers.authorization;
    let token = null;
    
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
      // Explicitly check for stringified null values from frontend
      if (token === "null" || token === "undefined") {
        token = null;
      }
    }
    
    // Fallback to Cookie if header is missing
    if (!token) {
      token = req.cookies?.Pharbit_Token;
    }

    // Final cleanup
    if (token === "null" || token === "undefined") {
      token = null;
    }

    console.log(`📡 Auth Check [${req.method} ${req.url}] - Token Found: ${!!token}`);
    
    if (!token) {
      throw new Error("Unauthorized: No valid token provided");
    }

    const { data, error } = await supabase.auth.getUser(token);
    
    if (error || !data.user) {
      throw new Error(`Unauthorized: ${error?.message || "User not found"}`);
    }

    return data.user;
  } catch (err) {
    console.error(`🔒 Auth Error [${req.method} ${req.url}]:`, err.message);
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

  if (error) throw error;
  return data?.[0] || null;
};


export const FindOrganization = async (userId) => {
  try {
    const { data: employee, error: empError } = await supabase
      .from("employees")
      .select("organization_id, role")
      .eq("auth_id", userId)
      .single();

    if (empError || !employee) {
      return { success: false, error: "User not linked to any organization" };
    }

    const { data: organization, error: orgError } = await supabase
      .from("organizations")
      .select("*")
      .eq("id", employee.organization_id)
      .single();

    if (orgError || !organization) {
      return { success: false, error: "Organization details not found" };
    }

    return {
      success: true,
      data: organization,
      role: employee.role
    };
  } catch (err) {
    console.error("FindOrganization Error:", err.message);
    return { success: false, error: "Internal error fetching organization" };
  }
};