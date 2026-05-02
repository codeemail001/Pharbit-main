import { useState, useEffect } from "react";
import "../../Styles/Components/CreateShipModal.css";

const url = import.meta.env.VITE_API_URL;

export default function PassingModal({ shipment, onClose, onSuccess }) {

    const [organizations, setOrganizations] = useState([]);
    const [nextOrg, setNextOrg] = useState("");
    const [temperature, setTemperature] = useState("");
    const [loading, setLoading] = useState(false);
    const [confirmText, setConfirmText] = useState("");

    const [toast, setToast] = useState(null);

    const showToast = (message) => {
        setToast(message);
        setTimeout(() => setToast(null), 2500);
    };

    useEffect(() => {

        const fetchOrgs = async () => {

            try {

                const res = await fetch(`${url}/organization`, {
                    credentials: "include"
                });

                const data = await res.json();

                const orgArray = Array.isArray(data)
                    ? data
                    : data.data || [];

                setOrganizations(orgArray);

            } catch (err) {
                console.error("Failed to fetch orgs:", err);
            }

        };

        fetchOrgs();

    }, []);

    const handlePassShipment = async () => {

    if (!nextOrg || !temperature) {
        showToast("Fill all fields");
        return;
    }

    // 🔍 DEBUG BLOCK START
    console.log("========== PASS SHIPMENT DEBUG ==========");
    console.log("Full shipment object:", shipment);

    console.log("shipment.id:", shipment?.id);
    console.log("shipment.batch:", shipment?.batch);
    console.log("shipment.batch.id:", shipment?.batch?.id);

    console.log("nextOrg (raw):", nextOrg, "type:", typeof nextOrg);
    console.log("temperature:", temperature);

    const payload = {
        shipment_id: shipment?.id,
        batch_id: shipment?.batch?.id,
        next_holder_org_id: nextOrg,
        temperature: temperature?.trim()
    };

    console.log("FINAL PAYLOAD:", payload);
    console.log("========================================");
    // 🔍 DEBUG BLOCK END

    try {

        setLoading(true);

        const res = await fetch(`${url}/pass-shipment`, {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        const result = await res.json();

        console.log("RESPONSE STATUS:", res.status);
        console.log("RESPONSE BODY:", result);

        if (!res.ok) throw new Error(result.error);

        showToast("Shipment passed successfully");

        onSuccess();
        onClose();

    } catch (err) {

        console.error("ERROR:", err);
        showToast(err.message);

    } finally {

        setLoading(false);

    }

};

    const handleRecall = async () => {
        if (!shipment?.id || !shipment?.tracking_code) {
            showToast("Invalid shipment data");
            return;
        }
        try {
            setLoading(true);

            const res = await fetch(`${url}/redeem-recall-batch`, {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    shipment_id: shipment?.id,
                    tracking_code: shipment?.tracking_code,
                }),
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || "Recall failed");

            showToast("Recall initiated successfully 🚨");
            onSuccess();
            onClose();

        } catch (err) {
            showToast(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="create-ship-modal-overlay" onClick={onClose}>
            <div
                className="create-ship-modal-container"
                onClick={(e) => e.stopPropagation()}
            >
                {!shipment?.batch?.is_recalled && (
                    <h2 className="create-ship-modal-title">
                        Pass Shipment
                    </h2>
                )}

                {shipment?.batch?.is_recalled === true ? (
                    <div style={{ marginTop: "20px", textAlign: "center" }}>
                        <p style={{ marginBottom: "10px", fontSize: "14px" }}>
                            Type <b>RECALL SHIPMENT</b> to confirm
                        </p>

                        <input
                            value={confirmText}
                            onChange={(e) => setConfirmText(e.target.value)}
                            placeholder="RECALL SHIPMENT"
                            style={{
                                padding: "10px",
                                borderRadius: "8px",
                                border: "1px solid #ccc",
                                width: "80%",
                                marginBottom: "15px",
                                textAlign: "center"
                            }}
                        />

                        <div className="create-ship-modal-actions" style={{ justifyContent: "center" }}>
                            <button
                                className="create-ship-modal-submit"
                                onClick={handleRecall}
                                disabled={loading || confirmText !== "RECALL SHIPMENT"}
                                style={{
                                    backgroundColor: "#ff4d4f",
                                    border: "none",
                                    color: "white"
                                }}
                            >
                                {loading ? "Processing..." : "Recall Shipment"}
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="create-ship-modal-field">
                            <label>Next Organization</label>
                            <select
                                value={nextOrg}
                                onChange={(e) => setNextOrg(e.target.value)}
                            >
                                <option value="">Select organization</option>

                                {organizations.map((org) => (
                                    <option key={org.id} value={org.id}>
                                        {org.name}
                                    </option>
                                ))}

                            </select>
                        </div>

                        <div className="create-ship-modal-field">
                            <label>Temperature</label>
                            <input
                                placeholder="Example: 2°C - 8°C"
                                value={temperature}
                                onChange={(e) => setTemperature(e.target.value)}
                            />
                        </div>

                        <div className="create-ship-modal-actions">
                            <button
                                className="create-ship-modal-cancel"
                                onClick={onClose}
                            >
                                Cancel
                            </button>
                            <button
                                className="create-ship-modal-submit"
                                onClick={handlePassShipment}
                                disabled={loading}
                            >
                                {loading ? "Passing..." : "Pass Shipment"}
                            </button>
                        </div>
                    </>
                )}
                {toast && (
                    <div className="create-ship-modal-toast">
                        {toast}
                    </div>
                )}
            </div>
        </div>
    );
}