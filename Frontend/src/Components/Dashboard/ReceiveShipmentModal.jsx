import { useState } from "react";
import "../../Styles/Components/ReceiveShipmentModal.css";

const url = import.meta.env.VITE_API_URL;

export default function ReceiveShipmentModal({ shipment, onClose, onSuccess }) {
    const [trackingCode, setTrackingCode] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${url}/scan-shipment`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    shipment_id: shipment.id,
                    tracking_code: trackingCode
                })
            });

            const result = await res.json();
            if (result.success) {
                onSuccess();
                onClose();
            }
        } catch (err) {
            console.error("Scan shipment failed", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="receive-modal-overlay" onClick={onClose}>
            <div className="receive-modal-container" onClick={(e) => e.stopPropagation()}>
                <h3 className="receive-modal-title">Receive Shipment</h3>
                <p className="receive-modal-desc">
                    Enter tracking code to confirm shipment arrival.
                </p>

                <input
                    className="receive-modal-input"
                    type="text"
                    placeholder="Enter tracking code"
                    value={trackingCode}
                    onChange={(e) => setTrackingCode(e.target.value)}
                />

                <div className="receive-modal-actions">
                    <button className="receive-btn-secondary" onClick={onClose}>
                        Cancel
                    </button>
                    <button
                        className="receive-btn-primary"
                        onClick={handleSubmit}
                        disabled={loading || !trackingCode}
                    >
                        {loading ? "Processing..." : "Confirm Receipt"}
                    </button>
                </div>
            </div>
        </div>
    );
}