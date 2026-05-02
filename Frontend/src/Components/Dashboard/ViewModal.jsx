import { useState } from "react";
import "../../Styles/Components/ViewModal.css";
import { Pill, ShieldCheck, AlertTriangle, Zap, Loader2 } from "lucide-react";

export default function ViewModal({ open, onClose, medicine }) {

  const url = import.meta.env.VITE_API_URL;

  const [showMintForm, setShowMintForm] = useState(false);
  const [isMinting, setIsMinting] = useState(false);

  const [supply, setSupply] = useState("");
  const [manufacturingDate, setManufacturingDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [warehouseLocation, setWarehouseLocation] = useState("");
  const [csvFile, setCsvFile] = useState(null);

  if (!open || !medicine) return null;

  const isApproved =
    medicine.verification_status === "approved" ||
    medicine.verification_status === "accepted";

  const handleMint = async () => {
    try {

      if (!supply || !manufacturingDate || !expiryDate || !warehouseLocation) {
        alert("Please fill all fields");
        return;
      }

      setIsMinting(true);

      const formData = new FormData();

      formData.append("medicineId", medicine.id);
      formData.append("pricePerToken", medicine.mrp);
      formData.append("supply", supply);
      formData.append("manufacturingDate", manufacturingDate);
      formData.append("expiryDate", expiryDate);
      formData.append("warehouseLocation", warehouseLocation);

      if (csvFile) {
        formData.append("serials_csv", csvFile);
      }

      const response = await fetch(`${url}/auto-mint`, {
        method: "POST",
        body: formData,
        credentials: "include"
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Minting failed");
      }

      alert(
        "Mint request submitted successfully.\n" +
        "Batch will appear once blockchain processing completes."
      );

      setShowMintForm(false);
      onClose();

    } catch (error) {
      console.error(error);
      alert(error.message);
    } finally {
      setIsMinting(false);
    }
  };

  return (
    <div className="dashboard-modal-overlay" onClick={onClose}>
      <div
        className="dashboard-modal-container"
        onClick={(e) => e.stopPropagation()}
      >

        {/* HEADER */}

        <div className="dashboard-modal-header">

          <div className="modal-title-group">
            <h2 className="dashboard-modal-title">{medicine.name}</h2>

            <div className="modal-subtitle-row">
              <span className="dashboard-modal-brand">
                {medicine.brand_name}
              </span>
              <span className="separator">•</span>
              <span className="dashboard-modal-code">
                {medicine.drug_code}
              </span>
            </div>
          </div>

          <div className={`status-tag ${isApproved ? "approved" : "pending"}`}>
            {isApproved ? <ShieldCheck size={14} /> : <Zap size={14} />}
            {medicine.verification_status}
          </div>

        </div>

        {/* INFO GRID */}

        <div className="dashboard-modal-info-grid">

          <div className="dashboard-modal-info-card">
            <p className="dashboard-modal-label">Dosage Form</p>
            <div className="card-content">
              <Pill size={18} className="blue-icon" />
              <p>{medicine.dosage_form}</p>
            </div>
          </div>

          <div className="dashboard-modal-info-card">
            <p className="dashboard-modal-label">Unit Price (MRP)</p>
            <div className="card-content">
              <p className="dashboard-modal-price">€{medicine.mrp}</p>
            </div>
          </div>

        </div>

        {/* BODY */}

        <div className="dashboard-modal-body">

          {/* Composition */}

          <section className="modal-section">
            <p className="dashboard-modal-section-title">
              Chemical Composition
            </p>

            <div className="dashboard-modal-tags">
              {medicine.composition?.map((item, index) => (
                <span key={index} className="dashboard-modal-tag">
                  {item}
                </span>
              ))}
            </div>

          </section>

          {/* Storage */}

          <section className="modal-section">

            <p className="dashboard-modal-section-title">
              Storage & Handling
            </p>

            <ul className="dashboard-modal-list">
              {medicine.storage_conditions?.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>

          </section>

          {/* Warnings */}

          {medicine.warnings?.length > 0 && (

            <div className="dashboard-modal-warning">

              <div className="warning-header">
                <AlertTriangle size={16} />
                <p className="dashboard-modal-warning-title">
                  Safety Warnings
                </p>
              </div>

              <ul className="dashboard-modal-warning-list">
                {medicine.warnings.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>

            </div>

          )}

          {/* =======================
               MINT FORM
          ======================= */}

          {showMintForm && (

            <div className="mint-form">

              <h3>Mint New Batch</h3>

              <input
                type="number"
                placeholder="Supply"
                value={supply}
                onChange={(e) => setSupply(e.target.value)}
              />

              <input
                type="date"
                value={manufacturingDate}
                onChange={(e) => setManufacturingDate(e.target.value)}
              />

              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
              />

              <input
                type="text"
                placeholder="Warehouse Location"
                value={warehouseLocation}
                onChange={(e) => setWarehouseLocation(e.target.value)}
              />

              <input
                type="file"
                accept=".csv"
                onChange={(e) => setCsvFile(e.target.files[0])}
              />

              <button
                className="mint-submit-btn"
                onClick={handleMint}
                disabled={isMinting}
              >
                {isMinting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Minting...
                  </>
                ) : (
                  "Submit Mint Request"
                )}
              </button>

            </div>

          )}

        </div>

        {/* ACTIONS */}

        <div className="dashboard-modal-actions">

          {isApproved && !showMintForm && (
            <button
              className="mint-btn"
              onClick={() => setShowMintForm(true)}
            >
              <Zap size={18} fill="currentColor" />
              Mint Medicine Batch
            </button>
          )}

          <button
            onClick={onClose}
            className="dashboard-modal-close-btn"
          >
            Close Details
          </button>

        </div>

        <div className="dashboard-modal-footer-meta">
          <span>HSN: {medicine.hsn_code}</span>
          <span>License: {medicine.manufacturing_license}</span>
        </div>

      </div>
    </div>
  );
}