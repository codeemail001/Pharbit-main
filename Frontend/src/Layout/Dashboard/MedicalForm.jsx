import { useState } from "react";
import { Pill, ShieldCheck, AlertTriangle, Zap, ChevronRight, ChevronLeft, Upload, Eye } from "lucide-react";
import MedicalFormModal from "../../Components/Dashboard/MedicalFormModal";// Import the new component
import "../../Styles/Pages/MedicalForm.css";

const url = import.meta.env.VITE_API_URL;

const ArrayInput = ({ label, field, temp, setTemp, form, addItem, removeItem }) => (
  <div className="array-box">
    <label className="field-label">{label}</label>
    <div className="array-row">
      <input
        value={temp[field]}
        onChange={(e) => setTemp((prev) => ({ ...prev, [field]: e.target.value }))}
        placeholder={`Add ${label}`}
      />
      <button type="button" className="add-tag-btn" onClick={() => addItem(field)}>Add</button>
    </div>
    <div className="tags-container">
      {form[field].map((item, i) => (
        <span key={i} className="form-tag">
          {item}
          <button type="button" onClick={() => removeItem(field, i)}>×</button>
        </span>
      ))}
    </div>
  </div>
);

export default function MedicalForm() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: "", brand_name: "", composition: [], category: [],
    warnings: [], side_effects: [], storage_conditions: [],
    dosage_form: "", strength: "", route_of_administration: "",
    drug_code: "", hsn_code: "", manufacturing_license: "",
    approval_number: "", mrp: "", cost_price: "",
  });

  const [temp, setTemp] = useState({
    composition: "", category: "", warnings: "", side_effects: "", storage_conditions: "",
  });

  const [documents, setDocuments] = useState([]);
  const [showReview, setShowReview] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  const handleFiles = (e) => setDocuments([...e.target.files]);

  const addItem = (field) => {
    const val = temp[field].trim();
    if (!val) return;
    setForm((prev) => ({ ...prev, [field]: [...prev[field], val] }));
    setTemp((prev) => ({ ...prev, [field]: "" }));
  };

  const removeItem = (field, index) => {
    setForm((prev) => ({ ...prev, [field]: prev[field].filter((_, i) => i !== index) }));
  };

  const nextStep = () => setStep((s) => s + 1);
  const prevStep = () => setStep((s) => s - 1);

  const openReview = () => {
    if (!form.name || form.composition.length === 0) {
      alert("Medicine Name and Composition are required to proceed.");
      return;
    }
    setShowReview(true);
  };

  const arrayProps = { temp, setTemp, form, addItem, removeItem };

  return (
    <div className="medicine-page">
      <div className="page-header">
        <div className="header-content">
          <h1>Add New Medicine</h1>
          <p>Complete the steps to register a new pharmaceutical product.</p>
        </div>
        <div className="step-wizard">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={`step-item ${step >= i ? "active" : ""} ${step > i ? "completed" : ""}`}>
              <div className="step-number">{step > i ? "✓" : i}</div>
              <span className="step-label">
                {i === 1 ? "Basic" : i === 2 ? "Medical" : i === 3 ? "Safety" : "Legal"}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="medicine-layout">
        <div className="medicine-form-container">
          {step === 1 && (
            <div className="form-step-content anim-fade-in">
              <section className="form-section">
                <div className="section-title"><ShieldCheck size={20} /> <h3>Basic Identification</h3></div>
                <div className="form-grid">
                  <div className="field"><label>Medicine Name *</label><input name="name" value={form.name} onChange={handleChange} /></div>
                  <div className="field"><label>Brand Name</label><input name="brand_name" value={form.brand_name} onChange={handleChange} /></div>
                  <div className="field"><label>Drug Code *</label><input name="drug_code" value={form.drug_code} onChange={handleChange} /></div>
                  <div className="field"><label>HSN Code *</label><input name="hsn_code" value={form.hsn_code} onChange={handleChange} /></div>
                </div>
              </section>
            </div>
          )}

          {step === 2 && (
            <div className="form-step-content anim-fade-in">
              <section className="form-section">
                <div className="section-title"><Pill size={20} /> <h3>Medical Specifications</h3></div>
                <div className="form-grid">
                  <div className="field full-width"><ArrayInput label="Chemical Composition *" field="composition" {...arrayProps} /></div>
                  <div className="field"><label>Dosage Form</label><input name="dosage_form" value={form.dosage_form} onChange={handleChange} /></div>
                  <div className="field"><label>Strength</label><input name="strength" value={form.strength} onChange={handleChange} /></div>
                  <div className="field full-width"><label>Route of Administration</label><input name="route_of_administration" value={form.route_of_administration} onChange={handleChange} /></div>
                </div>
              </section>
            </div>
          )}

          {step === 3 && (
            <div className="form-step-content anim-fade-in">
              <section className="form-section">
                <div className="section-title"><AlertTriangle size={20} /> <h3>Safety & Storage</h3></div>
                <div className="form-grid">
                  <div className="field full-width"><ArrayInput label="Storage Conditions" field="storage_conditions" {...arrayProps} /></div>
                  <div className="field full-width"><ArrayInput label="Safety Warnings" field="warnings" {...arrayProps} /></div>
                  <div className="field full-width"><ArrayInput label="Side Effects" field="side_effects" {...arrayProps} /></div>
                  <div className="field full-width"><ArrayInput label="Therapeutic Category" field="category" {...arrayProps} /></div>
                </div>
              </section>
            </div>
          )}

          {step === 4 && (
            <div className="form-step-content anim-fade-in">
              <section className="form-section">
                <div className="section-title"><Zap size={20} /> <h3>Compliance & Pricing</h3></div>
                <div className="form-grid">
                  <div className="field"><label>MRP (EUR)</label><input type="number" name="mrp" value={form.mrp} onChange={handleChange} /></div>
                  <div className="field"><label>Cost Price (EUR)</label><input type="number" name="cost_price" value={form.cost_price} onChange={handleChange} /></div>
                  <div className="field"><label>Manufacturing License</label><input name="manufacturing_license" value={form.manufacturing_license} onChange={handleChange} /></div>
                  <div className="field"><label>Approval Number</label><input name="approval_number" value={form.approval_number} onChange={handleChange} /></div>
                  <div className="field full-width document-upload">
                    <label>Supporting Documents</label>
                    <div className="upload-box">
                      <Upload size={24} />
                      <input type="file" multiple onChange={handleFiles} />
                      <p>{documents.length > 0 ? `${documents.length} files selected` : "Click or drag to upload"}</p>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}

          <div className="form-navigation">
            {step > 1 && <button className="nav-btn-secondary" onClick={prevStep}><ChevronLeft size={18} /> Back</button>}
            {step < 4 ? (
              <button className="nav-btn-primary" onClick={nextStep}>Next Step <ChevronRight size={18} /></button>
            ) : (
              <button className="nav-btn-submit" onClick={openReview}><Eye size={18} /> Review & Submit</button>
            )}
          </div>
        </div>

        {/* Sidebar Preview */}
        <div className="medicine-preview-sticky">
          {/* ... keeping your sidebar exactly as it was ... */}
          <div className="preview-card">
            <div className="preview-card-header">
              <span className="preview-label">Live Preview</span>
              <h3>{form.name || "Medicine Name"}</h3>
              <p>{form.brand_name || "Brand Details"}</p>
            </div>
            <div className="preview-body">
              <div className="preview-row"><span>Drug Code:</span><strong>{form.drug_code || "-"}</strong></div>
              <div className="preview-row"><span>Dosage:</span><strong>{form.dosage_form || "-"}</strong></div>
              <div className="preview-row"><span>Strength:</span><strong>{form.strength || "-"}</strong></div>
              <div className="preview-tags-section">
                <p>Composition:</p>
                <div className="preview-tags">
                  {form.composition.map((c, i) => (<span key={i} className="preview-tag-pill">{c}</span>))}
                </div>
              </div>
            </div>
            <div className="preview-footer">
              <p className="preview-price">€{form.mrp || "0.00"}</p>
              <span className="preview-status">Awaiting Verification</span>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL COMPONENT */}
      <MedicalFormModal
        show={showReview}
        onClose={() => setShowReview(false)}
        form={form}
        documents={documents}
        loading={loading}
        setLoading={setLoading}
        url={url}
      />
    </div>
  );
}