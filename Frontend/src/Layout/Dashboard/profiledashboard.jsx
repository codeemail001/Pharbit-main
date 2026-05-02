import { useState, useEffect } from "react";
import { Outlet, useNavigate, Link } from "react-router-dom";
import Sidebar from "../../Components/Dashboard/Sidebar";
import "../../Styles/Layout/ProfileDashboard.css";

const url = import.meta.env.VITE_API_URL;

export default function ProfileDashboard() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const res = await fetch(`${url}/auth/me`, { credentials: "include" });
                const data = await res.json();
                
                if (res.status === 401 || !data.employee) {
                    navigate("/Auth");
                } else {
                    setUser(data.employee);
                }
            } catch (err) {
                navigate("/Auth");
            } finally {
                setLoading(false);
            }
        };
        checkAuth();
    }, [navigate]);

    if (loading) return <div className="dashboard-loader">Verifying Pharbit Session...</div>;

    const hasOrg = user?.organizations;

    return (
        <div className="profile-dashboard-container">
            <Sidebar role={user?.role} permissions={user?.permissions} />
            <main className="profile-dashboard-main">
                <div className="profile-dashboard-content">
                    {!hasOrg ? (
                        <div className="no-org-placeholder">
                            <h2>Organization Required</h2>
                            <p>You haven't linked your account to a business yet.</p>
                            <Link to="/register-business" className="cta-btn">Register Your Business</Link>
                        </div>
                    ) : (
                        <Outlet context={{ user }} />
                    )}
                </div>
            </main>
        </div>
    );
}
