import { useEffect, useState } from "react";
import "../../Styles/Components/CreateShipModal.css";

const url = import.meta.env.VITE_API_URL;

export default function FreezeBatchModal({ isOpen, onClose }) {
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(null);

  const [recallReason, setRecallReason] = useState("");
  const [confirmText, setConfirmText] = useState("");

  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  };

  /* =========================
     Fetch Batches
  ========================== */
  useEffect(() => {
    if (!isOpen) return;

    const fetchBatches = async () => {
      try {
        const res = await fetch(`${url}/OrgBatches`, {
          credentials: "include",
        });

        const data = await res.json();

        const batchArray = Array.isArray(data)
          ? data
          : data.data || data.batches || [];

        // ✅ Only keep active batches
        const activeBatches = batchArray.filter((b) => b.is_active);

        setBatches(activeBatches);
      } catch (err) {
        console.error("Error fetching batches:", err);
        setBatches([]);
      }
    };

    fetchBatches();
  }, [isOpen]);

  /* =========================
     Handle Batch Select
  ========================== */
  const handleBatchChange = (e) => {
    const batchId = e.target.value;

    const batch = batches.find(
      (b) => String(b.id) === String(batchId)
    );

    setSelectedBatch(batch || null);
  };

  /* =========================
     Freeze Batch
  ========================== */
  const handleFreeze = async () => {
    if (!selectedBatch || !recallReason) {
      showToast("Fill all fields", "error");
      return;
    }

    if (confirmText !== "FREEZE") {
      showToast('Type "FREEZE" to confirm', "error");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${url}/freeze-batch`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          batchId: selectedBatch.id,
          medicineId: selectedBatch.medicines?.id, // ✅ correct mapping
          recallReason: recallReason,
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Freeze failed");

      showToast("Batch frozen successfully ❄️", "success");
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
        <h2 className="create-ship-modal-title">Freeze Batch</h2>

        {/* Batch Select */}
        <div className="create-ship-modal-field">
          <label>Select Batch</label>
          <select onChange={handleBatchChange} defaultValue="">
            <option value="" disabled>Select a batch</option>

            {batches
              .filter((batch) => batch.is_active)
              .map((batch) => (
              <option key={batch.id} value={batch.id}>
                {batch.medicines?.name || "Unnamed"} | 
                {" "}{batch.medicines?.brand_name} | 
                {" "}Mint #{batch.blockchain_mint_id}
              </option>
            ))}
          </select>
        </div>

        {/* Batch Info Preview */}
        {selectedBatch && (
          <div className="create-ship-modal-field">
            <label>Batch Info</label>
            <div style={{ fontSize: "12px", opacity: 0.8 }}>
              <p><b>Drug Code:</b> {selectedBatch.medicines?.drug_code}</p>
              <p><b>Category:</b> {selectedBatch.medicines?.category}</p>
              <p><b>Org:</b> {selectedBatch.organization?.name}</p>
              <p><b>Remaining:</b> {selectedBatch.remaining_quantity}</p>
              <p><b>Expiry:</b> {selectedBatch.expiry_date}</p>
            </div>
          </div>
        )}

        {/* Recall Reason */}
        <div className="create-ship-modal-field">
          <label>Recall Reason</label>
          <input
            type="text"
            placeholder="Enter reason..."
            value={recallReason}
            onChange={(e) => setRecallReason(e.target.value)}
          />
        </div>

        {/* Confirmation */}
        <div className="create-ship-modal-field">
          <label>Type "FREEZE" to confirm</label>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
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
            onClick={handleFreeze}
            disabled={loading}
          >
            {loading ? "Freezing..." : "Freeze Batch"}
          </button>
        </div>

        {/* Toast */}
        {toast && (
          <div className="create-ship-modal-toast">
            {toast.message}
          </div>
        )}
      </div>
    </div>
  );
}