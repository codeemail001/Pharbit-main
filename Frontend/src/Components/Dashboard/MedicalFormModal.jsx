import {
    ShieldCheck, Package, CreditCard, FileText, Activity,
    Thermometer, AlertTriangle, Stethoscope, ClipboardList, X
} from "lucide-react";
import toast from "react-hot-toast";
import "../../Styles/Components/MedicalFormModal.css";

export default function MedicalFormModal({
    show, onClose, form, documents, loading, setLoading, url
}) {
    if (!show) return null;

    const finalSubmit = async () => {
        try {
            setLoading(true);
            const fd = new FormData();
            Object.entries(form).forEach(([k, v]) => {
                fd.append(k, Array.isArray(v) ? JSON.stringify(v) : v);
            });
            documents.forEach((file) => fd.append("medicineDocuments", file));

            const response = await fetch(`${url}/addMeds`, {
                method: "POST",
                body: fd,
                credentials: "include",
            });

            const data = await response.json();

            if (response.ok) {
                toast.success("Medicine added successfully!");
                setTimeout(() => {
                    onClose();
                    window.location.href = "/Dashboard/pending"; // Simple redirect to show the new medicine
                }, 1500);
            } else {
                toast.error(`Submission failed: ${data.error || "Server error"}`);
            }
        } catch (err) {
            toast.error("Submission failed: Network error");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="form-modal-overlay">
            <div className="form-modal-card">
                {/* Header */}
                <div className="form-modal-header">
                    <div className="form-modal-header-content">
                        <div className="form-modal-icon-badge"><Activity size={22} /></div>
                        <div>
                            <h2>Final Product Review</h2>
                            <p>Verify all clinical data before registration</p>
                        </div>
                    </div>
                    <button className="form-modal-close-btn" onClick={onClose}><X size={20} /></button>
                </div>

                <div className="form-modal-body">
                    {/* Section 1: Top Level Stats */}
                    <div className="form-modal-grid-stats">
                        <div className="form-modal-stat-box">
                            <span className="form-modal-stat-label"><Package size={14} /> Drug ID</span>
                            <span className="form-modal-stat-value">{form.drug_code || "N/A"}</span>
                        </div>
                        <div className="form-modal-stat-box">
                            <span className="form-modal-stat-label"><CreditCard size={14} /> MRP</span>
                            <span className="form-modal-stat-value">€{form.mrp || "0.00"}</span>
                        </div>
                        <div className="form-modal-stat-box">
                            <span className="form-modal-stat-label"><ShieldCheck size={14} /> License</span>
                            <span className="form-modal-stat-value">{form.manufacturing_license || "N/A"}</span>
                        </div>
                        <div className="form-modal-stat-box">
                            <span className="form-modal-stat-label"><FileText size={14} /> Attachments</span>
                            <span className="form-modal-stat-value">{documents.length} Files</span>
                        </div>
                    </div>

                    {/* Section 2: Clinical Details */}
                    <div className="form-modal-section">
                        <h3 className="form-modal-section-title"><Stethoscope size={16} /> Clinical Intelligence</h3>
                        <div className="form-modal-info-card">
                            <div className="form-modal-data-row">
                                <label>Medicine Name</label>
                                <div><strong>{form.name}</strong> <small>({form.brand_name || 'No Brand'})</small></div>
                            </div>
                            <div className="form-modal-data-row">
                                <label>Composition</label>
                                <div className="form-modal-tag-group">
                                    {form.composition.map((item, i) => <span key={i} className="form-modal-pill-blue">{item}</span>)}
                                </div>
                            </div>
                            <div className="form-modal-data-row">
                                <label>Side Effects</label>
                                <div className="form-modal-tag-group">
                                    {form.side_effects.map((item, i) => <span key={i} className="form-modal-pill-red">{item}</span>)}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section 3: Safety & Logistics */}
                    <div className="form-modal-split-row">
                        <div className="form-modal-section">
                            <h3 className="form-modal-section-title"><Thermometer size={16} /> Storage & Logistics</h3>
                            <div className="form-modal-logistics-card">
                                <ul className="form-modal-list">
                                    {form.storage_conditions.length > 0 ?
                                        form.storage_conditions.map((item, i) => <li key={i}>{item}</li>) :
                                        <li>Standard room temperature</li>}
                                </ul>
                                <div className="form-modal-sub-info">
                                    <span><strong>Dosage:</strong> {form.dosage_form}</span>
                                    <span><strong>Route:</strong> {form.route_of_administration}</span>
                                </div>
                            </div>
                        </div>

                        <div className="form-modal-section">
                            <h3 className="form-modal-section-title"><AlertTriangle size={16} /> Critical Warnings</h3>
                            <div className="form-modal-warning-card">
                                {form.warnings.length > 0 ? (
                                    <ul className="form-modal-list">
                                        {form.warnings.map((item, i) => <li key={i}>{item}</li>)}
                                    </ul>
                                ) : <p>No specific contraindications reported.</p>}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="form-modal-footer">
                    <button className="form-modal-secondary-btn" onClick={onClose} disabled={loading}>Discard Changes</button>
                    <button className="form-modal-primary-btn" onClick={finalSubmit} disabled={loading}>
                        {loading ? <span className="form-modal-loader"></span> : "Register Medicine"}
                    </button>
                </div>
            </div>
        </div>
    );
}