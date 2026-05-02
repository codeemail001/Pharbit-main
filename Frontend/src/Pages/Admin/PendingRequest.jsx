import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import "../../Styles/Admin/PendingRequest.css";
import RequestCard from "../../Components/Admin/RequestCard";

const url = import.meta.env.VITE_API_URL;

export default function PendingRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("All");

  // New Filter States
  const [maxPrice, setMaxPrice] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [error, setError] = useState(null);

  // Export CSV
  const exportToCSV = () => {
    if (!filteredRequests.length) return;

    const headers = Object.keys(filteredRequests[0]);

    const rows = filteredRequests.map(obj =>
      headers.map(h => `"${(obj[h] ?? "").toString().replace(/"/g, '""')}"`).join(",")
    );

    const csvContent =
      headers.join(",") + "\n" + rows.join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "pending_medicines.csv";
    link.click();

    URL.revokeObjectURL(url);
  };

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${url}/medicines?status=pending`, {
        method: "GET",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (res.ok) {
        setRequests(Array.isArray(data.data) ? data.data : []);
      } else {
        setError(data.error || "Access Denied");
      }
    } catch (err) {
      console.error("Fetch Error:", err);
      setError("Failed to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // --- Search, Filter, & Sort Logic ---
  const filteredRequests = useMemo(() => {
    let result = [...requests];

    // 1. Tab Filtering
    if (activeTab === "High Priority") {
      result = result.filter(req =>
        ["Schedule H", "Schedule H1", "Schedule X"].includes(req.schedule)
      );
    } else if (activeTab === "Expiring Soon") {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      result = result.filter(req => new Date(req.created_at) < sevenDaysAgo);
    }

    // 2. Search Logic (Name, Brand, Code, ID)
    if (searchTerm) {
      const lowTerm = searchTerm.toLowerCase();
      result = result.filter(req =>
        req.name?.toLowerCase().includes(lowTerm) ||
        req.brand_name?.toLowerCase().includes(lowTerm) ||
        req.drug_code?.toLowerCase().includes(lowTerm) ||
        req._id?.toLowerCase().includes(lowTerm) ||
        req.id?.toLowerCase().includes(lowTerm)
      );
    }

    // 3. Price Filter
    if (maxPrice) {
      result = result.filter(req => Number(req.mrp) <= Number(maxPrice));
    }

    // 4. Date Filter
    if (dateFilter) {
      result = result.filter(req => {
        const reqDate = new Date(req.created_at).toISOString().split('T')[0];
        return reqDate === dateFilter;
      });
    }

    return result;
  }, [requests, searchTerm, activeTab, maxPrice, dateFilter]);

  const resetFilters = () => {
    setSearchTerm("");
    setMaxPrice("");
    setDateFilter("");
    setActiveTab("All");
  };

  return (
    <div className="pending-page-container">
      {/* Header */}
      <div className="pending-header-bar">
        <div className="pending-breadcrumb">
          <Link to="/Dashboard">Dashboard</Link> / <span>Pending Approvals</span>
        </div>
        <h1>Pending Medicine Requests</h1>
        <span className="pending-count-badge">
          {loading ? "Updating..." : `${filteredRequests.length} Requests Found`}
        </span>
      </div>

      {/* Search + Actions */}
      <div className="pending-search-row">
        <input
          type="text"
          placeholder="Search Name, Brand, or ID..."
          className="pending-search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        {/* Date Filter */}
        <input
          type="date"
          className="pending-action-btn"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
        />

        {/* Price Filter */}
        <input
          type="number"
          placeholder="Max Price (EUR)"
          className="pending-action-btn"
          style={{ width: '130px' }}
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
        />

        <button className="pending-action-btn" onClick={resetFilters}>Reset</button>
        <button
          className="pending-action-btn"
          style={{ background: '#0f172a', color: '#fff' }}
          onClick={exportToCSV}
        >
          Export CSV
        </button>
      </div>

      {/* Tabs */}
      <div className="pending-tab-row">
        {["All", "High Priority", "Expiring Soon"].map((tab) => (
          <button
            key={tab}
            className={`pending-tab ${activeTab === tab ? "pending-active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Cards Grid */}
      <div className="pending-card-grid">
        {loading ? (
          <div className="pending-loader">
            <div className="pending-spinner"></div>
            <p>Fetching Secure Data...</p>
          </div>
        ) : error ? (
          <div className="pending-empty-state" style={{ border: '1px solid #ef4444' }}>
            <h3 style={{ color: '#ef4444' }}>Unauthorized Access</h3>
            <p>{error}</p>
          </div>
        ) : filteredRequests.length > 0 ? (
          filteredRequests.map((req) => (
            <RequestCard
              key={req._id || req.id}
              data={req}
              onUpdate={fetchRequests}
            />
          ))
        ) : (
          <div className="pending-empty-state">
            <h3>No requests match your criteria</h3>
            <p>Try adjusting your filters or search terms.</p>
          </div>
        )}
      </div>
    </div>
  );
}