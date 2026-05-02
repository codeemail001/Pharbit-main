import { useEffect, useState } from "react";
import { Search, Plus, Layers, Truck, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "../../Styles/Components/Header.css";

const url = import.meta.env.VITE_API_URL;

export default function Header({ onSearch, searchVal, onOpenShipmentModal, onOpenInviteModal , onOpenFreezeModal }) {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const CACHE_KEY = "auth_me_cache";
    const CACHE_TIME = 5 * 60 * 1000; // 5 minutes

    const fetchUser = async () => {
      try {
        // Check cache first
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);

          if (Date.now() - parsed.timestamp < CACHE_TIME) {
            setUser(parsed.data);
          }
        }

        // Always try to refresh in background
        const res = await fetch(`${url}/auth/me`, { credentials: "include" });
        const data = await res.json();

        if (data && data.employee) {
          setUser(data.employee);

          // Update cache
          localStorage.setItem(
            CACHE_KEY,
            JSON.stringify({
              data: data.employee,
              timestamp: Date.now()
            })
          );
        }

      } catch (err) {
        console.error("Failed to fetch user:", err);
      }
    };

    fetchUser();
  }, []);

  const firstLetter = user?.first_name?.charAt(0).toUpperCase() || "U";

  return (
    <div className="profile-header-container">

      {/* LEFT SECTION */}
      <div className="header-left-actions">

        <div className="search-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search products, codes, or brands..."
            className="profile-header-search"
            value={searchVal}
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>

        {/* ACTION BUTTONS */}
        <div className="header-action-buttons">

          {(user?.role === "owner" || user?.role === "admin" || (user?.permissions || []).includes("CAN_MINT")) && (
            <button
              className="header-add-btn"
              onClick={() => navigate("/dashboard/add-product")}
            >
              <Plus size={18} />
              <span>Add Product</span>
            </button>
          )}

          {(user?.role === "owner" || user?.role === "admin" || (user?.permissions || []).includes("CAN_FREEZE")) && (
            <button
              className="header-batch-btn"
              onClick={onOpenFreezeModal}
            >
              <Layers size={18} />
              <span>Freeze Batch</span>
            </button>
          )}

          {(user?.role === "owner" || user?.role === "admin" || (user?.permissions || []).includes("CAN_SHIP")) && (
            <button
              className="header-shipment-btn"
              onClick={onOpenShipmentModal}
            >
              <Truck size={18} />
              <span>Create Shipment</span>
            </button>
          )}



          {(user?.role === "owner" || user?.role === "admin" || (user?.permissions || []).includes("ACCESS_CONTROL_PANEL")) && (
            <button
              className="header-shipment-btn"
              onClick={onOpenInviteModal}
            >
              <User size={18} />
              <span>Invite Employee</span>
            </button>
          )}
        </div>

      </div>

      {/* RIGHT SECTION */}
      <div className="profile-header-right">
        {user ? (
          <div className="profile-header-profile">
            <div className="profile-header-avatar">
              {firstLetter}
            </div>
            <div className="profile-header-info">
              <p className="profile-header-name">
                {user.first_name} {user.last_name}
              </p>
              <p className="profile-header-email">{user.email}</p>
            </div>
          </div>
        ) : (
          <div className="profile-header-loading">
            <div className="profile-header-loading-avatar" />
            <div className="profile-header-loading-text">
              <div /><div />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}