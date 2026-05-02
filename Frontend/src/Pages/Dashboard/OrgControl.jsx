import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import toast from "react-hot-toast";
import { Users, Shield, Settings, Check, X, Copy, ExternalLink, Building } from "lucide-react";
import "../../Styles/Pages/Dashboard/OrgControl.css";

const PERMISSION_KEYS = [
    { key: "CAN_MINT", label: "Mint Medicines", desc: "Allow creating new medicine batches" },
    { key: "CAN_SHIP", label: "Initiate Shipments", desc: "Allow creating new logistics transfers" },
    { key: "CAN_FREEZE", label: "Freeze Batches", desc: "Allow recalling or freezing inventory" },
    { key: "CAN_REDEEM", label: "Finalize Deliveries", desc: "Allow completing shipments" },
    { key: "ACCESS_CONTROL_PANEL", label: "Access Control Panel", desc: "Allow managing other employees' rights" },
];

export default function OrgControl() {
    const { user } = useOutletContext();
    const org = user?.organizations;
    const url = import.meta.env.VITE_API_URL;
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [tempPermissions, setTempPermissions] = useState([]);

    useEffect(() => {
        fetchEmployees();
    }, []);

    const fetchEmployees = async () => {
        try {
            const res = await fetch(`${url}/org/employees`, { credentials: "include" });
            const data = await res.json();
            if (res.ok) {
                setEmployees(data);
            } else throw new Error(data.error);
        } catch (err) {
            toast.error(err.message || "Failed to fetch team");
        } finally {
            setLoading(false);
        }
    };

    const openModal = (emp) => {
        setSelectedEmployee(emp);
        setTempPermissions(emp.permissions || []);
    };

    const toggleTempPermission = (key) => {
        if (tempPermissions.includes(key)) {
            setTempPermissions(tempPermissions.filter(p => p !== key));
        } else {
            setTempPermissions([...tempPermissions, key]);
        }
    };

    const handleSavePermissions = async () => {
        try {
            const res = await fetch(`${url}/org/employees/permissions`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    employeeId: selectedEmployee.id,
                    permissions: tempPermissions
                }),
                credentials: "include"
            });
            const data = await res.json();
            if (data.success) {
                toast.success("Permissions updated");
                fetchEmployees();
                setSelectedEmployee(null);
            } else throw new Error(data.error);
        } catch (err) {
            toast.error(err.message || "Save failed");
        }
    };

    return (
        <div className="org-control-container">
            <header className="org-header">
                <h1><Shield className="inline mr-2" /> Organization Control Panel</h1>
                <p>Manage your company's decentralized authority and delegate rights to your team.</p>
            </header>

            {org && (
                <section className="org-credentials-card">
                    <div className="card-header">
                        <div className="flex items-center gap-2">
                            <Building size={20} className="text-blue-400" />
                            <h2 className="text-lg font-semibold">Company Credentials</h2>
                        </div>
                    </div>
                    <div className="credentials-grid">
                        <div className="cred-item">
                            <label>Organization Name</label>
                            <p>{org.name}</p>
                        </div>
                        <div className="cred-item">
                            <label>Registration ID</label>
                            <p>{org.registration_id}</p>
                        </div>
                        <div className="cred-item">
                            <label>Organization Type</label>
                            <p className="capitalize">{org.type}</p>
                        </div>
                        <div className="cred-item full-width">
                            <label>Blockchain Wallet Address</label>
                            <div className="wallet-box">
                                <code>{org.wallet_address}</code>
                                <button 
                                    className="copy-btn"
                                    onClick={() => {
                                        navigator.clipboard.writeText(org.wallet_address);
                                        toast.success("Address copied!");
                                    }}
                                >
                                    <Copy size={14} />
                                </button>
                                <a 
                                    href={`https://sepolia.etherscan.io/address/${org.wallet_address}`} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="link-btn"
                                >
                                    <ExternalLink size={14} />
                                </a>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            <section className="employee-list">
                <div className="flex items-center gap-2 mb-4 text-slate-400">
                    <Users size={20} />
                    <h2 className="text-lg font-semibold">Team Members</h2>
                </div>

                {loading ? (
                    <p>Loading team...</p>
                ) : (
                    employees.map(emp => (
                        <div key={emp.id} className="employee-card">
                            <div className="employee-info">
                                <h3>{emp.first_name} {emp.last_name}</h3>
                                <p>{emp.email} • <span className="capitalize">{emp.role}</span></p>
                                <div className="permission-badges">
                                    {(emp.permissions || []).map(p => (
                                        <span key={p} className="permission-badge">{p}</span>
                                    ))}
                                    {(!emp.permissions || emp.permissions.length === 0) && (
                                        <span className="text-xs text-slate-500 italic">No special permissions</span>
                                    )}
                                </div>
                            </div>
                            <button className="manage-btn" onClick={() => openModal(emp)}>
                                Manage Access
                            </button>
                        </div>
                    ))
                )}
            </section>

            {/* Permissions Modal */}
            {selectedEmployee && (
                <div className="permissions-modal-overlay">
                    <div className="permissions-modal">
                        <div className="modal-header">
                            <h2>Manage Permissions</h2>
                            <p className="text-slate-400 text-sm">
                                Modifying rights for <b>{selectedEmployee.first_name} {selectedEmployee.last_name}</b>
                            </p>
                        </div>

                        <div className="permission-list">
                            {PERMISSION_KEYS.map(p => (
                                <div key={p.key} className="permission-item">
                                    <div>
                                        <div className="font-semibold text-sm">{p.label}</div>
                                        <div className="text-xs text-slate-400">{p.desc}</div>
                                    </div>
                                    <input 
                                        type="checkbox" 
                                        className="w-5 h-5 cursor-pointer"
                                        checked={tempPermissions.includes(p.key)}
                                        onChange={() => toggleTempPermission(p.key)}
                                    />
                                </div>
                            ))}
                        </div>

                        <div className="modal-actions">
                            <button className="save-btn" onClick={handleSavePermissions}>Save Changes</button>
                            <button className="cancel-btn" onClick={() => setSelectedEmployee(null)}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
