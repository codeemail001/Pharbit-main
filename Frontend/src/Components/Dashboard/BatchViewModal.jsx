
import "../../Styles/Components/ViewModal.css";
import { Pill, ShieldCheck, AlertTriangle, Box, Calendar, MapPin, Hash } from "lucide-react";

export default function BatchViewModal({ open, onClose, batch }) {
  if (!open || !batch) return null;

  // Destructure medicine details from the nested object
  const medicine = batch.medicines || {};

  // Blockchain Explorer Link (Assuming Sepolia)
  const txUrl = `https://sepolia.etherscan.io/tx/${batch.blockchain_tx_hash}`;

  return (
    <div className="dashboard-modal-overlay" onClick={onClose}>
      <div className="dashboard-modal-container" onClick={(e) => e.stopPropagation()}>

        {/* Header Section */}
        <div className="dashboard-modal-header">
          <div className="modal-title-group">
            <h2 className="dashboard-modal-title">{medicine.name}</h2>
            <div className="modal-subtitle-row">
              <span className="dashboard-modal-brand">{medicine.brand_name}</span>
              <span className="separator">•</span>
              <span className="dashboard-modal-code">Batch: {batch.blockchain_mint_id}</span>
            </div>
          </div>
          <div className={`status-tag ${batch.is_active ? "approved" : "pending"}`}>
            {batch.is_active ? <ShieldCheck size={14} /> : <AlertTriangle size={14} />}
            {batch.is_active ? "Active Batch" : "Inactive"}
          </div>
        </div>

        {/* Batch Tracking Grid */}
        <div className="dashboard-modal-info-grid">
          <div className="dashboard-modal-info-card">
            <p className="dashboard-modal-label">Manufacturing Date</p>
            <div className="card-content">
              <Calendar size={18} className="blue-icon" />
              <p>{batch.manufacturing_date}</p>
            </div>
          </div>

          <div className="dashboard-modal-info-card">
            <p className="dashboard-modal-label">Expiry Date</p>
            <div className="card-content">
              <Calendar size={18} style={{ color: '#ef4444' }} />
              <p>{batch.expiry_date}</p>
            </div>
          </div>

          <div className="dashboard-modal-info-card">
            <p className="dashboard-modal-label">Stock Status</p>
            <div className="card-content">
              <Box size={18} className="blue-icon" />
              <p>{batch.remaining_quantity} / {batch.batch_quantity} Units</p>
            </div>
          </div>

          <div className="dashboard-modal-info-card">
            <p className="dashboard-modal-label">Warehouse</p>
            <div className="card-content">
              <MapPin size={18} className="blue-icon" />
              <p>{batch.warehouse_location || "Not Assigned"}</p>
            </div>
          </div>
        </div>

        {/* Detailed Body */}
        <div className="dashboard-modal-body">
          <section className="modal-section">
            <p className="dashboard-modal-section-title">Medicine Properties</p>
            <div className="dashboard-modal-tags">
              <span className="dashboard-modal-tag">Form: {medicine.dosage_form}</span>
              <span className="dashboard-modal-tag">Category: {medicine.category}</span>
              {medicine.composition?.map((item, index) => (
                <span key={index} className="dashboard-modal-tag">{item}</span>
              ))}
            </div>
          </section>

          <section className="modal-section">
            <p className="dashboard-modal-section-title">Blockchain Provenance</p>
            <div className="dashboard-modal-warning" style={{ background: 'rgba(79, 70, 229, 0.1)', border: '1px solid #4f46e5' }}>
              <div className="warning-header">
                <Hash size={16} style={{ color: '#4f46e5' }} />
                <p className="dashboard-modal-warning-title" style={{ color: '#4f46e5' }}>Transaction Verified</p>
              </div>
              <p style={{ fontSize: '12px', marginTop: '5px', wordBreak: 'break-all', opacity: 0.8 }}>
                Hash: {batch.blockchain_tx_hash}
              </p>
              <a href={txUrl} target="_blank" rel="noreferrer" className="view-link" style={{ marginTop: '10px', display: 'inline-block' }}>
                View on Etherscan
              </a>
            </div>
          </section>
        </div>

        {/* Action Footer */}
        <div className="dashboard-modal-actions">
          <button onClick={onClose} className="dashboard-modal-close-btn">
            Close Details
          </button>
        </div>

        <div className="dashboard-modal-footer-meta">
          <span>HSN: {medicine.hsn_code}</span>
          <span>Quality Verified: {batch.is_quality_verified ? "Yes" : "No"}</span>
        </div>
      </div>
    </div>
  );
}