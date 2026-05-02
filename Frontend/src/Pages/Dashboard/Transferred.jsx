import { useEffect, useState } from "react";
import {
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    Filter,
    ArrowUpDown
} from "lucide-react";
import "../../Styles/Pages/Product.css";
import Header from "../../Components/Dashboard/Header";
import CreateShipmentModal from "../../Components/Dashboard/CreateShipmentModal";
import InviteEmployeeModal from "../../Components/Dashboard/InviteEmployeeModal";
import TransferViewModal from "../../Components/Dashboard/TransferredModal";
import FreezeBatchModal from "../../Components/Dashboard/FreezeBatchModal";
const url = import.meta.env.VITE_API_URL;

export default function Transferred() {
    const [batches, setBatches] = useState([]);
    const [selected, setSelected] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;
    const [isShipmentModalOpen, setIsShipmentModalOpen] = useState(false);
    const [filterStatus, setFilterStatus] = useState("all");
    const [sortKey, setSortKey] = useState("date");
    const [isSortOpen, setIsSortOpen] = useState(false);
    const [isInviteEmployeeOpen, setInviteEmployeeOpen] = useState(false);
    const [isFreezeModal, setFreezeModalOpen] = useState(false);

    useEffect(() => {
        const CACHE_KEY = "org_batches_cache";
        const CACHE_TIME = 1 * 60 * 1000; // 5 minutes

        const fetchBatches = async () => {
            try {
                setLoading(true);

                // Check cache first
                const cached = localStorage.getItem(CACHE_KEY);
                if (cached) {
                    const parsed = JSON.parse(cached);

                    if (Date.now() - parsed.timestamp < CACHE_TIME) {
                        setBatches(parsed.data);
                        setLoading(false);
                        return;
                    }
                }

                // Fetch from API if cache missing or expired
                const res = await fetch(`${url}/TransferedBatch`, { credentials: "include" });
                const result = await res.json();

                if (result.success && result.data) {
                    setBatches(result.data);

                    // Save to cache
                    localStorage.setItem(
                        CACHE_KEY,
                        JSON.stringify({
                            data: result.data,
                            timestamp: Date.now()
                        })
                    );
                }

            } catch (err) {
                console.error("Failed to fetch batches:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchBatches();
    }, []);

    const filteredBatches = batches
        .filter((item) => {
            const batch = item.batch || {};
            const med = batch.medicines || {};

            const matchesSearch =
                med.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                batch.blockchain_mint_id?.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesStatus =
                filterStatus === "all" ||
                (filterStatus === "active" ? batch.is_active : !batch.is_active);

            return matchesSearch && matchesStatus;
        })
        .sort((a, b) => {
            const batchA = a.batch || {};
            const batchB = b.batch || {};
            const medA = batchA.medicines || {};
            const medB = batchB.medicines || {};

            if (sortKey === "date") return new Date(b.created_at) - new Date(a.created_at);
            if (sortKey === "name") return medA.name?.localeCompare(medB.name);

            return 0;
        });

    const totalPages = Math.ceil(filteredBatches.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredBatches.slice(indexOfFirstItem, indexOfLastItem);

    const getPageNumbers = () => {
        const maxVisible = 4;
        let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
        let end = Math.min(totalPages, start + maxVisible - 1);
        if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);
        const pages = [];
        for (let i = start; i <= end; i++) pages.push(i);
        return pages;
    };

    return (
        <div className="inventory-view">

            <Header
                onSearch={setSearchQuery} searchVal={searchQuery}
                onOpenShipmentModal={() => setIsShipmentModalOpen(true)}
                onOpenFreezeModal={() => setFreezeModalOpen(true)}
                onOpenInviteModal={() => setInviteEmployeeOpen(true)
                }
            />
            <CreateShipmentModal
                isOpen={isShipmentModalOpen}
                onClose={() => setIsShipmentModalOpen(false)}
            />

            <InviteEmployeeModal
                isOpen={isInviteEmployeeOpen}
                onClose={() => setInviteEmployeeOpen(false)}
            />
            <FreezeBatchModal
                            isOpen={isFreezeModal}
                            onClose={() => setFreezeModalOpen(false)}
                        />
            <div className="inventory-glass-card">
                <header className="inventory-top-bar">
                    <div className="title-area">
                        <h1>Transferred Batches</h1>
                    </div>

                    <div className="header-meta">
                        <div className="sort-dropdown-container">
                            <button className="sort-trigger-btn" onClick={() => setIsSortOpen(!isSortOpen)}>
                                <Filter size={16} />
                                <span>Sort & Filter</span>
                                <ChevronDown size={14} className={isSortOpen ? "rotate" : ""} />
                            </button>

                            {isSortOpen && (
                                <div className="sort-menu-dropdown">
                                    <div className="menu-section">
                                        <p className="menu-label">Batch Status</p>
                                        <button onClick={() => { setFilterStatus("all"); setIsSortOpen(false); setCurrentPage(1) }} className={filterStatus === "all" ? "active" : ""}>All Batches</button>
                                        <button onClick={() => { setFilterStatus("active"); setIsSortOpen(false); setCurrentPage(1) }} className={filterStatus === "active" ? "active" : ""}>Active</button>
                                        <button onClick={() => { setFilterStatus("inactive"); setIsSortOpen(false); setCurrentPage(1) }} className={filterStatus === "inactive" ? "active" : ""}>Inactive</button>
                                    </div>
                                    <div className="menu-divider"></div>
                                    <div className="menu-section">
                                        <p className="menu-label">Sort By</p>
                                        <button onClick={() => { setSortKey("name"); setIsSortOpen(false) }} className={sortKey === "name" ? "active" : ""}> <ArrowUpDown size={12} /> Name </button>
                                        <button onClick={() => { setSortKey("quantity"); setIsSortOpen(false) }} className={sortKey === "quantity" ? "active" : ""}> <ArrowUpDown size={12} /> Minted Quantity </button>
                                        <button onClick={() => { setSortKey("date"); setIsSortOpen(false) }} className={sortKey === "date" ? "active" : ""}> <ArrowUpDown size={12} /> Newest </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <div className="table-responsive">
                    <table className="modern-table">
                        <thead>
                            <tr>
                                <th>Medicine & Batch ID</th>
                                <th>Mfg Date</th>
                                <th>Expiry Date</th>

                                <th>Location</th>
                                <th>Status</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="7" className="status-cell"><div className="loader" /></td></tr>
                            ) : currentItems.length > 0 ? (
                                currentItems.map((item) => {
                                    const batch = item.batch || {};
                                    const med = batch.medicines || {};

                                    return (
                                        <tr key={item.id} className="fade-in-row">
                                            <td>
                                                <div className="med-identity">
                                                    <span className="m-name">{med.name}</span>
                                                    <span className="m-code">ID: {batch.blockchain_mint_id}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <span className="m-brand" style={{ fontWeight: '500' }}>
                                                    {batch.manufacturing_date}
                                                </span>
                                            </td>
                                            <td>
                                                <span className="m-brand" style={{ color: '#ef4444', fontWeight: '500' }}>
                                                    {batch.expiry_date}
                                                </span>
                                            </td>

                                            <td className="m-brand">
                                                {item.organization?.name || "Unknown"}
                                            </td>

                                            <td>
                                                <div className={`m-status ${batch.is_active ? "is-ok" : "is-rejected"}`}>
                                                    {batch.is_active ? "Active" : "Inactive"}
                                                </div>
                                            </td>

                                            <td>
                                                <button
                                                    onClick={() => setSelected(item)}
                                                    className="view-link"
                                                >
                                                    Details
                                                </button>
                                                
                                            </td>

                                            
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr><td colSpan="7" className="empty-msg">No batches found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {!loading && filteredBatches.length > itemsPerPage && (
                    <footer className="pagination-footer">
                        <p className="page-info">Showing <b>{indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredBatches.length)}</b> of {filteredBatches.length}</p>
                        <div className="pagination-controls">
                            <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="pag-btn"><ChevronLeft size={16} /></button>
                            <div className="page-numbers">
                                {getPageNumbers().map((num) => (
                                    <button key={num} onClick={() => setCurrentPage(num)} className={`num-btn ${currentPage === num ? 'active' : ''}`}>{num}</button>
                                ))}
                            </div>
                            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="pag-btn"><ChevronRight size={16} /></button>
                        </div>
                    </footer>
                )}
            </div>
            <TransferViewModal
                open={!!selected}
                batch={selected}
                onClose={() => setSelected(null)}
            />
        </div>
    );
}