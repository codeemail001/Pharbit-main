import { useEffect, useState } from "react";
import ShipmentDetailModal from "../../Components/Dashboard/ShipDetailModal";
import {
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    Filter,
} from "lucide-react";
import "../../Styles/Pages/Product.css";
import Header from "../../Components/Dashboard/Header";
import CreateShipmentModal from "../../Components/Dashboard/CreateShipmentModal";
import InviteEmployeeModal from "../../Components/Dashboard/InviteEmployeeModal";
import FreezeBatchModal from "../../Components/Dashboard/FreezeBatchModal";
const url = import.meta.env.VITE_API_URL;

export default function Shipment() {
    const [shipments, setShipments] = useState([]);
    const [selectedShipment, setSelectedShipment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;
    const [isShipmentModalOpen, setIsShipmentModalOpen] = useState(false);
    const [filterStatus, setFilterStatus] = useState("all");
    const [sortKey, setSortKey] = useState("newest");
    const [isSortOpen, setIsSortOpen] = useState(false);
    const [isInviteEmployeeOpen, setInviteEmployeeOpen] = useState(false);
    const [isFreezeModal, setFreezeModalOpen] = useState(false);

    useEffect(() => {
        const CACHE_KEY = "dashboard_shipments_cache";
        const CACHE_TIME = 0 * 60 * 1000; // 5 minutes

        const fetchAllShipments = async () => {
            try {
                setLoading(true);

                // Check cache first
                const cached = localStorage.getItem(CACHE_KEY);
                if (cached) {
                    const parsed = JSON.parse(cached);

                    if (Date.now() - parsed.timestamp < CACHE_TIME) {
                        setShipments(parsed.data);
                        setLoading(false);
                        return;
                    }
                }

                const [sourceRes ] = await Promise.all([
                    fetch(`${url}/shipments/source`, { credentials: "include" }),
                ]);

                const sourceResult = await sourceRes.json();


                let combinedData = [];
                if (sourceResult.success) combinedData = [...combinedData, ...sourceResult.data];

                const uniqueShipments = Array.from(
                    new Map(combinedData.map(item => [item.id, item])).values()
                );

                setShipments(uniqueShipments);

                // Save to cache
                localStorage.setItem(
                    CACHE_KEY,
                    JSON.stringify({
                        data: uniqueShipments,
                        timestamp: Date.now()
                    })
                );

            } catch (err) {
                console.error("Failed to fetch shipments:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchAllShipments();
    }, []);

    const filteredShipments = shipments
        .filter((ship) => {
            const med = ship.batch?.medicines || {};
            const matchesSearch =
                med.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                ship.tracking_code?.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesStatus = filterStatus === "all" ||
                ship.status.toLowerCase() === filterStatus.toLowerCase();

            return matchesSearch && matchesStatus;
        })
        .sort((a, b) => {
            if (sortKey === "quantity") return b.medicines_amount - a.medicines_amount;
            if (sortKey === "newest") return new Date(b.created_at) - new Date(a.created_at);
            return (a.batch?.medicines?.name || "").localeCompare(b.batch?.medicines?.name || "");
        });

    const totalPages = Math.ceil(filteredShipments.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredShipments.slice(indexOfFirstItem, indexOfLastItem);

    const getPageNumbers = () => {
        const pages = [];
        for (let i = 1; i <= totalPages; i++) pages.push(i);
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
                    <div className="title-area"><h1>Shipment Logistics</h1></div>
                    <div className="header-meta">
                        <div className="sort-dropdown-container">
                            <button className="sort-trigger-btn" onClick={() => setIsSortOpen(!isSortOpen)}>
                                <Filter size={16} /> <span>Sort & Filter</span>
                                <ChevronDown size={14} className={isSortOpen ? "rotate" : ""} />
                            </button>
                            {isSortOpen && (
                                <div className="sort-menu-dropdown">
                                    <div className="menu-section">
                                        <p className="menu-label">Filter Status</p>
                                        {["all", "CREATED", "FORWARDED", "RECEIVED", "REDEEMED"].map(status => (
                                            <button key={status} onClick={() => { setFilterStatus(status); setIsSortOpen(false); setCurrentPage(1); }} className={filterStatus === status ? "active" : ""}>{status}</button>
                                        ))}
                                    </div>
                                    <div className="menu-divider"></div>
                                    <div className="menu-section">
                                        <p className="menu-label">Sort By</p>
                                        <button onClick={() => { setSortKey("newest"); setIsSortOpen(false) }}>Date (Newest)</button>
                                        <button onClick={() => { setSortKey("quantity"); setIsSortOpen(false) }}>Amount</button>
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
                                <th>Medicine & Batch</th>
                                <th>Tracking ID</th>
                                <th>Amount</th>
                                <th>Origin/Manufacturer</th>
                                <th>Status</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="6" className="status-cell"><div className="loader" /></td></tr>
                            ) : currentItems.length > 0 ? (
                                currentItems.map((ship) => (
                                    <tr key={ship.id} className="fade-in-row">
                                        <td>
                                            <div className="med-identity">
                                                <span className="m-name">{ship.batch.medicines.name}</span>
                                                <span className="m-code">Mint ID: #{ship.batch.blockchain_mint_id}</span>
                                            </div>
                                        </td>
                                        <td><code className="tracking-id">{ship.tracking_code.slice(0, 13)}...</code></td>
                                        <td>{ship.medicines_amount} Units</td>
                                        <td>{ship.source_org.name}</td>
                                        <td><div className={`m-status ${ship.status === 'REDEEMED' ? 'is-ok' : 'is-wait'}`}>{ship.status}</div></td>
                                        <td><button onClick={() => setSelectedShipment(ship)} className="view-link">View Chain</button></td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="6" className="empty-msg">No shipments found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* The Pagination Footer you were missing */}
                {!loading && filteredShipments.length > itemsPerPage && (
                    <footer className="pagination-footer">
                        <p className="page-info">
                            Showing <b>{indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredShipments.length)}</b> of {filteredShipments.length}
                        </p>
                        <div className="pagination-controls">
                            <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="pag-btn">
                                <ChevronLeft size={16} />
                            </button>
                            <div className="page-numbers">
                                {getPageNumbers().map((num) => (
                                    <button key={num} onClick={() => setCurrentPage(num)} className={`num-btn ${currentPage === num ? 'active' : ''}`}>{num}</button>
                                ))}
                            </div>
                            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="pag-btn">
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </footer>
                )}
            </div>

            {selectedShipment && (
                <ShipmentDetailModal
                    isOpen={!!selectedShipment}
                    shipmentData={selectedShipment} // Passing all data here
                    onClose={() => setSelectedShipment(null)}
                />
            )}
        </div>
    );
}