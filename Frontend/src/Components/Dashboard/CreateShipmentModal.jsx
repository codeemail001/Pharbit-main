import { useEffect, useState } from "react";
import "../../Styles/Components/CreateShipModal.css";

const url = import.meta.env.VITE_API_URL;

export default function CreateShipmentModal({ isOpen, onClose }) {
    const [batches, setBatches] = useState([]);
    const [organizations, setOrganizations] = useState([]);

    const [selectedBatch, setSelectedBatch] = useState(null);
    const [availableAmount, setAvailableAmount] = useState(0);
    const [amount, setAmount] = useState("");
    const [receiverOrg, setReceiverOrg] = useState("");
    const [pricePerToken, setPricePerToken] = useState("");

    const [loading, setLoading] = useState(false);

    const [toast, setToast] = useState(null);

    const showToast = (message, type = "success") => {
        setToast({ message, type });
        setTimeout(() => {
            setToast(null);
        }, 2500);
    };

    /* =========================
       Fetch Batches + Orgs
    ========================== */
    useEffect(() => {
        if (!isOpen) return;

        const fetchData = async () => {
            try {
                /* ================= BATCHES ================= */
                const batchRes = await fetch(`${url}/OrgBatches`, {
                    credentials: "include"
                });

                const batchJson = await batchRes.json();
                console.log("OrgBatches response:", batchJson);

                // Handle different possible response shapes
                const batchArray = Array.isArray(batchJson)
                    ? batchJson
                    : batchJson.data || batchJson.batches || [];

                setBatches(batchArray);
                if (!Array.isArray(batchArray)) {
                    console.warn("OrgBatches did not return an array:", batchArray);
                }

                /* ================= ORGANIZATIONS ================= */
                const orgRes = await fetch(`${url}/organization`, {
                    credentials: "include"
                });

                const orgJson = await orgRes.json();
                console.log("Organization response:", orgJson);

                const orgArray = Array.isArray(orgJson)
                    ? orgJson
                    : orgJson.data || orgJson.organizations || [];

                setOrganizations(orgArray);
                if (!Array.isArray(orgArray)) {
                    console.warn("Organization API did not return an array:", orgArray);
                }

            } catch (err) {
                console.error("Error fetching modal data:", err);
                setBatches([]);
                setOrganizations([]);
            }
        };

        fetchData();
    }, [isOpen]);
    /* =========================
       Handle Batch Select
    ========================== */
    const handleBatchChange = (e) => {
        const batchId = e.target.value;

        if (!Array.isArray(batches)) return;

        const batch = batches.find(
            (b) => String(b.id) === String(batchId)
        );

        setSelectedBatch(batch || null);
        setAvailableAmount(batch.remaining_quantity || 0);
    };

    /* =========================
       Create Shipment
    ========================== */
    const handleCreateShipment = async () => {
        if (!selectedBatch || !amount || !receiverOrg || !pricePerToken) {
            showToast("Please fill all fields", "error");
            return;
        }

        if (Number(amount) > availableAmount) {
            showToast("Amount exceeds available supply", "error");
            return;
        }

        try {
            setLoading(true);

            const res = await fetch(`${url}/create-shipment`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    batch_id: selectedBatch.id,
                    amount: Number(amount),
                    receiver_org_id: receiverOrg,
                    pricePerToken: Number(pricePerToken)
                })
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || "Failed to create shipment");

            showToast("Shipment request submitted. Processing in background 🚚", "success");
            onClose();

        } catch (err) {
            showToast(err.message, "error");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="create-ship-modal-overlay" onClick={onClose}>
            <div
                className="create-ship-modal-container"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="create-ship-modal-title">Create Shipment</h2>

                {/* Batch Dropdown */}
                <div className="create-ship-modal-field">
                    <label>Select Batch</label>
                    <select onChange={handleBatchChange} defaultValue="">
                        <option value="" disabled>Select a batch</option>
                        {Array.isArray(batches) &&
                            batches.map((batch) => (
                                <option key={batch.id} value={batch.id}>
                                    {batch.medicines?.name || batch.name || "Unnamed Batch"}
                                    {" "} (Mint ID #{batch.blockchain_mint_id})
                                </option>
                            ))}
                    </select>
                </div>

                {/* Available */}
                <div className="create-ship-modal-field">
                    <label>Available Supply</label>
                    <input type="number" value={availableAmount} disabled />
                </div>

                {/* Amount */}
                <div className="create-ship-modal-field">
                    <label>Amount to Ship</label>
                    <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                    />
                </div>

                {/* Destination */}
                <div className="create-ship-modal-field">
                    <label>Final Destination</label>
                    <select
                        value={receiverOrg}
                        onChange={(e) => setReceiverOrg(e.target.value)}
                    >
                        <option value="" disabled>Select destination</option>
                        {Array.isArray(organizations) &&
                            organizations.map((org) => (
                                <option key={org.id} value={org.id}>
                                    {org.name || org.organizationName}
                                </option>
                            ))}
                    </select>
                </div>

                {/* Price Per Token */}
                <div className="create-ship-modal-field">
                    <label>Price Per Token</label>
                    <input
                        type="number"
                        value={pricePerToken}
                        onChange={(e) => setPricePerToken(e.target.value)}
                    />
                </div>

                {/* Actions */}
                <div className="create-ship-modal-actions">
                    <button
                        className="create-ship-modal-cancel"
                        onClick={onClose}
                    >
                        Cancel
                    </button>

                    <button
                        className="create-ship-modal-submit"
                        onClick={handleCreateShipment}
                        disabled={loading}
                    >
                        {loading ? "Creating..." : "Create Shipment"}
                    </button>
                </div>
                {toast && (
                    <div className="create-ship-modal-toast">
                        {toast.message}
                    </div>
                )}
            </div>
        </div>
    );
}