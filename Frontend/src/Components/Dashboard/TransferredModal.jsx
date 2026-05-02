import "../../Styles/Components/ViewModal.css";
import { useState } from "react";
import { ShieldCheck, AlertTriangle, Box, Calendar, Hash } from "lucide-react";

const url = import.meta.env.VITE_API_URL;

export default function TransferViewModal({ open, onClose, batch }) {
  if (!open || !batch) return null;
 const [recallLoading, setRecallLoading] = useState(false); 
  // Real batch object comes nested from API
  const realBatch = batch.batch || {};
  const medicine = realBatch.medicines || {};

  // Choose whichever tx exists
  const txHash = batch.deposit_tx_hash || batch.redeem_tx_hash;
  const txUrl = txHash ? `https://sepolia.etherscan.io/tx/${txHash}` : null;

 

  const handleRecall = async () => {
    try {
      setRecallLoading(true);

      const res = await fetch(`${url}/redeem-recall-batch`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          shipment_id: batch.shipment?.id,
          tracking_code: batch.shipment?.tracking_code,
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Recall failed");

      alert("Recall initiated successfully 🚨");
      onClose();

    } catch (err) {
      alert(err.message);
    } finally {
      setRecallLoading(false);
    }
  };

  return (
    <div className="dashboard-modal-overlay" onClick={onClose}>
      <div className="dashboard-modal-container" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="dashboard-modal-header">
          <div className="modal-title-group">
            <h2 className="dashboard-modal-title">{medicine.name || "Medicine"}</h2>

            <div className="modal-subtitle-row">
              <span className="dashboard-modal-brand">{medicine.brand_name}</span>
              <span className="separator">•</span>
              <span className="dashboard-modal-code">
                Batch: {realBatch.blockchain_mint_id}
              </span>
            </div>
          </div>

          <div className={`status-tag ${realBatch.is_active ? "approved" : "pending"}`}>
            {realBatch.is_active ? <ShieldCheck size={14} /> : <AlertTriangle size={14} />}
            {realBatch.is_active ? "Active Batch" : "Inactive"}
          </div>
        </div>

        {/* Info Grid */}
        <div className="dashboard-modal-info-grid">

          <div className="dashboard-modal-info-card">
            <p className="dashboard-modal-label">Manufacturing Date</p>
            <div className="card-content">
              <Calendar size={18} className="blue-icon" />
              <p>{realBatch.manufacturing_date}</p>
            </div>
          </div>

          <div className="dashboard-modal-info-card">
            <p className="dashboard-modal-label">Expiry Date</p>
            <div className="card-content">
              <Calendar size={18} style={{ color: "#ef4444" }} />
              <p>{realBatch.expiry_date}</p>
            </div>
          </div>

          <div className="dashboard-modal-info-card">
            <p className="dashboard-modal-label">Transferred Amount</p>
            <div className="card-content">
              <Box size={18} className="blue-icon" />
              <p>{batch.amount} Units</p>
            </div>
          </div>

        </div>

        {/* Details */}
        <div className="dashboard-modal-body">

          <section className="modal-section">
            <p className="dashboard-modal-section-title">Medicine Properties</p>

            <div className="dashboard-modal-tags">
              <span className="dashboard-modal-tag">
                Form: {medicine.dosage_form || "N/A"}
              </span>

              <span className="dashboard-modal-tag">
                Strength: {medicine.strength || "N/A"}
              </span>

              <span className="dashboard-modal-tag">
                Storage: {medicine.storage_conditions || "N/A"}
              </span>
            </div>
          </section>

          <section className="modal-section">
            <p className="dashboard-modal-section-title">Blockchain Provenance</p>

            <div
              className="dashboard-modal-warning"
              style={{
                background: "rgba(79, 70, 229, 0.1)",
                border: "1px solid #4f46e5",
              }}
            >
              <div className="warning-header">
                <Hash size={16} style={{ color: "#4f46e5" }} />
                <p
                  className="dashboard-modal-warning-title"
                  style={{ color: "#4f46e5" }}
                >
                  Transaction Verified
                </p>
              </div>

              {txHash && (
                <>
                  <p
                    style={{
                      fontSize: "12px",
                      marginTop: "5px",
                      wordBreak: "break-all",
                      opacity: 0.8,
                    }}
                  >
                    Hash: {txHash}
                  </p>

                  <a
                    href={txUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="view-link"
                    style={{ marginTop: "10px", display: "inline-block" }}
                  >
                    View on Etherscan
                  </a>
                </>
              )}
            </div>
          </section>

        </div>

        {/* Footer */}
        <div className="dashboard-modal-actions">

          {(batch.batch.is_recalled && !batch.returned) && (
            <button
              onClick={handleRecall}
              className="dashboard-modal-close-btn"
              style={{
                marginRight: "10px",
                background: "#ef4444",
                color: "white"
              }}
              disabled={recallLoading}
            >
              {recallLoading ? "Recalling..." : "Recall Batch"}
            </button>
          )}

          <button onClick={onClose} className="dashboard-modal-close-btn">
            Close Details
          </button>

        </div>

        <div className="dashboard-modal-footer-meta">
          <span>Quality Verified: {realBatch.is_quality_verified ? "Yes" : "No"}</span>
        </div>

      </div>
    </div>
  );
}