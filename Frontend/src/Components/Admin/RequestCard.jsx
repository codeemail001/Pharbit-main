import { useState } from "react";
import "../../Styles/Admin/PendingRequest.css";

const url = import.meta.env.VITE_API_URL;

export default function MedicineCard({ data, onUpdate }) {
  const [open, setOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Verification Logic
  const handleVerify = async (status) => {
    try {
      setIsProcessing(true);
      const response = await fetch(`${url}/verifyMeds?id=${data.id}&status=${status}`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        // Refresh the list in the parent component
        if (onUpdate) onUpdate();
        setOpen(false); // Close modal if it was open
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.message || "Failed to update status"}`);
      }
    } catch (err) {
      console.error("Verification Error:", err);
      alert("Network error. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <div className="pending-request-card">
        <span className="pending-status">{data.verification_status}</span>
        <h2 className="pending-medicine-name">{data.name}</h2>

        <div className="pending-card-meta">
          <div className="pending-meta-item">
            <label>Brand</label>
            <span>{data.brand_name || "N/A"}</span>
          </div>
          <div className="pending-meta-item">
            <label>Drug Code</label>
            <span>{data.drug_code || "N/A"}</span>
          </div>
        </div>

        <div className="pending-card-actions">
          <button
            className="pending-btn pending-approve-btn"
            disabled={isProcessing}
            onClick={() => handleVerify("accepted")}
          >
            {isProcessing ? "..." : "Approve"}
          </button>
          <button
            className="pending-btn pending-reject-btn"
            disabled={isProcessing}
            onClick={() => handleVerify("rejected")}
          >
            {isProcessing ? "..." : "Reject"}
          </button>
          <button className="pending-btn pending-details-btn" onClick={() => setOpen(true)}>
            Details
          </button>
        </div>
      </div>

      {open && (
        <div className="pending-modal-overlay" onClick={() => setOpen(false)}>
          <div className="pending-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="pending-modal-header">
              <div>
                <span className="pending-record-id">REQ-{data.id?.slice(-8).toUpperCase()}</span>
                <h2>{data.name}</h2>
              </div>
              <button className="pending-close-x" onClick={() => setOpen(false)}>✕</button>
            </div>

            <div className="pending-modal-body">
              {/* Section 1: Pharma Details */}
              <div className="pending-modal-section">
                <span className="pending-section-title">Pharma Details</span>
                <Info label="Manufacturer" value={data.organization?.name} />
                <Info label="Dosage Form" value={data.dosage_form} />
                <Info label="Strength" value={data.strength} />
                <Info label="Route" value={data.route_of_administration} />
              </div>

              {/* Section 2: Regulatory */}
              <div className="pending-modal-section">
                <span className="pending-section-title">Regulatory</span>
                <Info label="Drug Code" value={data.drug_code} />
                <Info label="HSN Code" value={data.hsn_code} />
                <Info label="Schedule" value={data.schedule} />
                <Info label="Created On" value={new Date(data.created_at).toLocaleDateString()} />
              </div>

              {/* Section 3: Commercial */}
              <div className="pending-modal-section">
                <span className="pending-section-title">Commercial</span>
                <Info label="Retail MRP" value={`EUR ${data.mrp}`} />
                <Info label="Cost Price" value={`EUR ${data.cost_price}`} />
                <div className="pending-data-row">
                  <label>Status</label>
                  <span style={{ color: "#d97706" }}>● Verification Pending</span>
                </div>
              </div>

              {/* Section 4: Composition */}
              <div className="pending-modal-section pending-full-width">
                <span className="pending-section-title">Active Composition</span>
                <div className="pending-tag-wrapper">
                  {data.composition?.map((item, i) => (
                    <span key={i} className="pending-tag">{item}</span>
                  ))}
                </div>
              </div>

              {/* Section 5: Safety */}
              <div className="pending-modal-section pending-full-width">
                <span className="pending-section-title">Safety & Side Effects</span>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px" }}>
                  <div className="pending-data-row">
                    <label>Side Effects</label>
                    <div className="pending-tag-wrapper" style={{ marginTop: "8px" }}>
                      {data.side_effects?.length > 0 ? (
                        data.side_effects.map((se, i) => (
                          <span key={i} className="pending-tag" style={{ borderColor: "#fee2e2" }}>{se}</span>
                        ))
                      ) : (
                        <span>No major side effects reported.</span>
                      )}
                    </div>
                  </div>
                  <div className="pending-data-row">
                    <label>Critical Warnings</label>
                    <div className="pending-tag-wrapper" style={{ marginTop: "8px" }}>
                      {data.warnings?.length > 0 ? (
                        data.warnings.map((w, i) => (
                          <span key={i} className="pending-tag" style={{ borderColor: "#fef3c7", color: "#92400e" }}>{w}</span>
                        ))
                      ) : (
                        <span>No specific warnings provided.</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 6: Storage */}
              <div className="pending-modal-section pending-full-width">
                <span className="pending-section-title">Storage Conditions</span>
                <div className="pending-tag-wrapper">
                  {data.storage_conditions?.length > 0 ? (
                    data.storage_conditions.map((sc, i) => (
                      <span key={i} className="pending-tag" style={{ background: "#eff6ff", color: "#1e40af", border: "none" }}>
                        {sc}
                      </span>
                    ))
                  ) : (
                    <span>Standard room temperature storage.</span>
                  )}
                </div>
              </div>

              {data.legal_document_url && (
                <a href={data.legal_document_url} target="_blank" rel="noreferrer" className="pending-doc-btn">
                  📄 View Government Authorization & Legal Documents
                </a>
              )}

              {/* Modal Footer Actions */}
              {/* <div className="pending-card-actions" style={{ marginTop: "30px", borderTop: "1px solid #eee", paddingTop: "20px" }}>
                <button 
                  className="pending-btn pending-approve-btn" 
                  disabled={isProcessing}
                  onClick={() => handleVerify("approved")}
                >
                  {isProcessing ? "Processing..." : "Confirm Approval"}
                </button>
                <button 
                  className="pending-btn pending-reject-btn"
                  disabled={isProcessing}
                  onClick={() => handleVerify("rejected")}
                >
                  {isProcessing ? "Processing..." : "Reject Medicine"} 
                </button>
              </div> */ }
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Info({ label, value }) {
  return (
    <div className="pending-data-row">
      <label>{label}</label>
      <span>{value || "N/A"}</span>
    </div>
  );
}