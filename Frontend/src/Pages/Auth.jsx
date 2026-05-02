import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../Styles/Auth.css";
import toast, { Toaster } from "react-hot-toast";
import phoneimg from "../assets/Phone2.svg";
import { FaApple } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";


const url = import.meta.env.VITE_API_URL;
export default function Auth() {
  const navigate = useNavigate();

  const [isLogin, setIsLogin] = useState(true);
  const [signupType, setSignupType] = useState("user");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    token: ""
  });

  /* Auto fetch token from URL */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get("token");

    if (urlToken) {
      setIsLogin(false);
      setSignupType("employee");
      setForm((prev) => ({ ...prev, token: urlToken }));
    }
  }, []);

  /* Handle input */
  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  /* Submit Logic */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        const res = await fetch(`${url}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: form.email,
            password: form.password
          }),
          credentials: "include",
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        toast.success("Login Successful!");
        setTimeout(() => {
          navigate("/");
        }, 500);
      } else if (signupType === "user") {
        const res = await fetch(`${url}/auth/signup`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            firstName: form.firstName,
            lastName: form.lastName,
            email: form.email,
            password: form.password
          }),
          credentials: "include",
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        toast.success("Account created! Please login.");
        setIsLogin(true);
      } else {
        const res = await fetch(`${url}/auth/accept-invite`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token: form.token,
            password: form.password
          }),
          credentials: "include",
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        toast.success("Employee Verifed");
        setIsLogin(true);
      }
    } catch (err) {
      setError(err.message || "Something went wrong");
      toast.error(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="auth-container" >
      <Toaster
        position="top-center"
        toastOptions={{
          className: 'custom-toast', // Matches the CSS I provided
          duration: 4000,
        }} />
      <div className="auth-nav-back">
        <button onClick={() => navigate("/")} className="back-link">← Back to Home</button>
      </div>
      {/* LEFT SECTION - MOCKUP */}
      <div className="auth-left">
        <div className="phone-mockup">
          <img src={phoneimg} alt="phone" className="phone-frame" />

          <div className="circle c1">💊</div>
          <div className="circle c2">🔗</div>
          <div className="circle c3">🏪</div>
          <div className="circle c4">📍</div>
        </div>
      </div>

      {/* RIGHT SECTION - AUTH CARD */}
      <div className="auth-right">
        <div className="auth-card">
          <h2>
            {isLogin
              ? "Welcome Back"
              : signupType === "employee"
                ? "Activate Account"
                : "Create an account"}
          </h2>
          <p className="subtitle">
            {isLogin
              ? "Login to continue to your dashboard"
              : signupType === "employee"
                ? "Use your employee token to activate your account"
                : "Create your account to get started"}
          </p>

          <div className="toggle">

            <div className={`slider-blob ${isLogin ? "left" : "right"}`}></div>
            <button
              className={isLogin ? "active" : ""}
              onClick={() => setIsLogin(true)}
            >
              Login
            </button>
            <button
              className={!isLogin ? "active" : ""}
              onClick={() => setIsLogin(false)}
            >
              Signup
            </button>
          </div>

          {!isLogin && (
            <div className="signup-toggle">
              <span className={signupType === "user" ? "active" : ""}>User</span>
              <div
                className={`toggle-switch ${signupType === "employee" ? "right" : ""}`}
                onClick={() =>
                  setSignupType(signupType === "user" ? "employee" : "user")
                }
              >
                <div className="toggle-ball"></div>
              </div>
              <span className={signupType === "employee" ? "active" : ""}>
                Employee
              </span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {isLogin && (
              <input
                type="email"
                name="email"
                placeholder="Email"
                onChange={handleChange}
                required
              />
            )}

            {!isLogin && signupType === "user" && (
              <>
                <input
                  name="firstName"
                  placeholder="First Name"
                  onChange={handleChange}
                  required
                />
                <input
                  name="lastName"
                  placeholder="Last Name"
                  onChange={handleChange}
                  required
                />
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  onChange={handleChange}
                  required
                />
              </>
            )}

            {!isLogin && signupType === "employee" && (
              <input
                name="token"
                placeholder="Employee Token"
                value={form.token}
                onChange={handleChange}
                required
              />
            )}

            <input
              type="password"
              name="password"
              placeholder="Password"
              onChange={handleChange}
              required
            />

            {error && <p className="error">{error}</p>}

            <button disabled={loading} className="submit-btn">
              {loading ? "Please wait..." : "Submit"}
            </button>
          </form>

          <div className="social-btns">
            <button type="button" className="social-btn">
              <FaApple style={{ fontSize: "1.2rem", color: "#000" }} />
              <span>Apple</span>
            </button>
            <button type="button" className="social-btn">
              <FcGoogle style={{ fontSize: "1.2rem" }} />
              <span>Google</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}