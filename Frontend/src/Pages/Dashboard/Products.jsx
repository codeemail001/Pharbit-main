import { useEffect, useState } from "react";
import ViewModal from "../../Components/Dashboard/ViewModal";
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
import FreezeBatchModal from "../../Components/Dashboard/FreezeBatchModal";

const url = import.meta.env.VITE_API_URL;

export default function Products() {
    const [medicines, setMedicines] = useState([]);
    const [selected, setSelected] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;
    const [isShipmentModalOpen, setIsShipmentModalOpen] = useState(false);
    const [isInviteEmployeeOpen, setInviteEmployeeOpen] = useState(false);
const [isFreezeModal, setFreezeModalOpen] = useState(false);
    // Sort & Filter States
    const [filterStatus, setFilterStatus] = useState("all");
    const [sortKey, setSortKey] = useState("name");
    const [isSortOpen, setIsSortOpen] = useState(false);

    useEffect(() => {
        const CACHE_KEY = "org_medicines_cache";
        const CACHE_TIME = 2 * 60 * 1000; // 5 minutes

        const fetchMedicines = async () => {
            try {
                setLoading(true);

                // Check cache first
                const cached = localStorage.getItem(CACHE_KEY);
                if (cached) {
                    const parsed = JSON.parse(cached);

                    if (Date.now() - parsed.timestamp < CACHE_TIME) {
                        setMedicines(parsed.data);
                        setLoading(false);2
                        return;
                    }
                }

                // Fetch from API if cache missing/expired
                const res = await fetch(`${url}/Orgmeds`, { credentials: "include" });
                const result = await res.json();

                if (result.success && result.data) {
                    setMedicines(result.data);

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
                console.error("Failed to fetch medicines:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchMedicines();
    }, []);

    // Filter Logic based on Search Query AND Status
    const filteredMedicines = medicines
        .filter((med) => {
            const matchesSearch =
                med.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                med.drug_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                med.brand_name.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesStatus = filterStatus === "all" ||
                med.verification_status.toLowerCase() === filterStatus.toLowerCase();

            return matchesSearch && matchesStatus;
        })
        .sort((a, b) => {
            if (sortKey === "price") return a.mrp - b.mrp;
            if (sortKey === "date") return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
            return a.name.localeCompare(b.name);
        });

    const totalPages = Math.ceil(filteredMedicines.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredMedicines.slice(indexOfFirstItem, indexOfLastItem);

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
                        <h1>Inventory</h1>
                    </div>

                    <div className="header-meta">
                        <div className="sort-dropdown-container">
                            <button
                                className="sort-trigger-btn"
                                onClick={() => setIsSortOpen(!isSortOpen)}
                            >
                                <Filter size={16} />
                                <span>Sort & Filter</span>
                                <ChevronDown size={14} className={isSortOpen ? "rotate" : ""} />
                            </button>

                            {isSortOpen && (
                                <div className="sort-menu-dropdown">
                                    <div className="menu-section">
                                        <p className="menu-label">Filter Status</p>
                                        <button
                                            onClick={() => { setFilterStatus("all"); setIsSortOpen(false); setCurrentPage(1) }}
                                            className={filterStatus === "all" ? "active" : ""}
                                        >All Items</button>
                                        <button
                                            onClick={() => { setFilterStatus("accepted"); setIsSortOpen(false); setCurrentPage(1) }}
                                            className={filterStatus === "accepted" ? "active" : ""}
                                        >Accepted</button>
                                        <button
                                            onClick={() => { setFilterStatus("pending"); setIsSortOpen(false); setCurrentPage(1) }}
                                            className={filterStatus === "pending" ? "active" : ""}
                                        >Pending</button>
                                        <button
                                            onClick={() => { setFilterStatus("rejected"); setIsSortOpen(false); setCurrentPage(1) }}
                                            className={filterStatus === "rejected" ? "active" : ""}
                                        >Rejected</button>
                                    </div>

                                    <div className="menu-divider"></div>

                                    <div className="menu-section">
                                        <p className="menu-label">Sort By</p>
                                        <button onClick={() => { setSortKey("name"); setIsSortOpen(false) }} className={sortKey === "name" ? "active" : ""}>
                                            <ArrowUpDown size={12} /> Name (A-Z)
                                        </button>
                                        <button onClick={() => { setSortKey("price"); setIsSortOpen(false) }} className={sortKey === "price" ? "active" : ""}>
                                            <ArrowUpDown size={12} /> Price: Low to High
                                        </button>
                                        <button onClick={() => { setSortKey("date"); setIsSortOpen(false) }} className={sortKey === "date" ? "active" : ""}>
                                            <ArrowUpDown size={12} /> Date Added
                                        </button>
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
                                <th>Medicine & Code</th>
                                <th>Manufacturer</th>
                                <th>Format</th>
                                <th>Price</th>
                                <th>Status</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="6" className="status-cell"><div className="loader" /></td></tr>
                            ) : currentItems.length > 0 ? (
                                currentItems.map((med) => (
                                    <tr key={med.id} className="fade-in-row">
                                        <td>
                                            <div className="med-identity">
                                                <span className="m-name">{med.name}</span>
                                                <span className="m-code">{med.drug_code}</span>
                                            </div>
                                        </td>
                                        <td className="m-brand">{med.brand_name}</td>
                                        <td><span className="m-tag">{med.dosage_form}</span></td>
                                        <td className="m-price">€{med.mrp}</td>
                                        <td>
                                            <div
                                                className={`m-status ${med.verification_status === "approved" ||
                                                    med.verification_status === "accepted"
                                                    ? "is-ok"
                                                    : med.verification_status === "rejected"
                                                        ? "is-rejected"
                                                        : "is-wait"
                                                    }`}
                                            >
                                                {med.verification_status}
                                            </div>
                                        </td>
                                        <td>
                                            <button onClick={() => setSelected(med)} className="view-link">View Details</button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="6" className="empty-msg">No medicines match your search or filters.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {!loading && filteredMedicines.length > itemsPerPage && (
                    <footer className="pagination-footer">
                        <p className="page-info">
                            Showing <b>{indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredMedicines.length)}</b> of {filteredMedicines.length}
                        </p>
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
            <ViewModal open={!!selected} medicine={selected} onClose={() => setSelected(null)} />
        </div>
    );
}