import supabase from "./DatabaseConnect.js";

export const getAuthUser = async (req) => {
  try {
    const authHeader = req.headers.authorization;
    const cookieToken = req.cookies?.Pharbit_Token;
    let token = null;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    } else if (cookieToken) {
      token = cookieToken;
    }

    // Explicitly reject stringified "null"/"undefined"
    if (!token || token === "null" || token === "undefined" || token === "") {
      console.log(`📡 Auth [${req.method} ${req.url}] - ❌ No Token Found`);
      throw new Error("No token provided");
    }

    console.log(`📡 Auth [${req.method} ${req.url}] - ✅ Token Found (${token.substring(0, 10)}...)`);

    const { data, error } = await supabase.auth.getUser(token);
    
    if (error || !data.user) {
      console.error(`📡 Auth [${req.method} ${req.url}] - ❌ Supabase Rejected Token:`, error?.message || "User missing");
      throw new Error("Invalid token");
    }

    return data.user;
  } catch (err) {
    // Only log actual errors, not missing tokens (which is normal for public routes)
    if (err.message !== "No token provided") {
      console.error(`🔒 Auth Middleware Error:`, err.message);
    }
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