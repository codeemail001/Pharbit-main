import { useState } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import { 
    LayoutGrid, Box, Layers, PlusCircle, LogOut, ChevronLeft, ChevronRight, 
    Truck, Inbox, ArrowBigDown, User, ShieldCheck, Shield 
} from "lucide-react";
import "../../Styles/Components/Sidebar.css";

export default function Sidebar({ role, permissions = [] }) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const navigate = useNavigate();

    const navItems = [
        { to: "/Dashboard", icon: LayoutGrid, label: "Dashboard" },
        { to: "/Dashboard/products", icon: Box, label: "Inventory" },
        { to: "/Dashboard/batches", icon: Layers, label: "Batches" },
        { to: "/Dashboard/add-product", icon: PlusCircle, label: "Add Products" },
        { to: "/Dashboard/Requests", icon: Inbox, label: "Requests" },
        { to: "/Dashboard/Passing", icon: Inbox, label: "Passing" },
        { to: "/Dashboard/Shipments", icon: Truck, label: "Track Shipments" },
        { to: "/Dashboard/Transfer/Batches", icon: ArrowBigDown , label: "Incoming Batch" },
    ];

    // Admin/Owner only links
    if (["admin", "owner"].includes(role?.toLowerCase()) || (permissions || []).includes("ACCESS_CONTROL_PANEL")) {
        navItems.push({ to: "/Dashboard/organization-control", icon: Shield, label: "Org Control" });
        if (["admin", "owner"].includes(role?.toLowerCase())) {
            navItems.push({ to: "/Dashboard/pending", icon: ShieldCheck, label: "Pending Approvals" });
        }
    }

    const handleLogout = () => {
        navigate("/");
    };

    return (
        <aside className={`sidebar ${isCollapsed ? "collapsed" : ""}`}>
            {/* Sidebar Header with Pharbit Logo */}
            <div className="sidebar-header">
                <Link to="/" className="logo-section">
                    <div className="logo-icon-box">
                        <div className="logo-symbol" />
                    </div>
                    {!isCollapsed && <span className="logo-text">Pharbit</span>}
                </Link>
                <button className="collapse-btn" onClick={() => setIsCollapsed(!isCollapsed)}>
                    {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                </button>
            </div>

            {/* Navigation */}
            <div className="nav-container">
                {!isCollapsed && <p className="nav-subtitle">MAIN MENU</p>}
                <nav className="sidebar-nav">
                    {navItems.map((item) => (
                        <NavLink key={item.to} to={item.to} className="nav-link">
                            {({ isActive }) => (
                                <div className={`nav-item ${isActive ? "active" : ""}`}>
                                    <item.icon className="icon-style" size={22} strokeWidth={2} />
                                    {!isCollapsed && <span className="label-text">{item.label}</span>}
                                    {item.badge && !isCollapsed && <span className="nav-badge">{item.badge}</span>}
                                    {item.badge && isCollapsed && <div className="badge-dot" />}
                                </div>
                            )}
                        </NavLink>
                    ))}
                </nav>
            </div>

            {/* Footer / Logout */}
            <div className="sidebar-footer">
                <button className="logout-action" onClick={handleLogout}>
                    <LogOut size={22} strokeWidth={2} />
                    {!isCollapsed && <span>Logout</span>}
                </button>
            </div>
        </aside>
    );
}