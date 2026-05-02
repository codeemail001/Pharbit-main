import { useEffect, useState } from "react";
import {
    ChevronLeft,
    ChevronRight,
    Package,
    MapPin
} from "lucide-react";

import Header from "../../Components/Dashboard/Header";
import ReceiveShipmentModal from "../../Components/Dashboard/ReceiveShipmentModal";
import CreateShipmentModal from "../../Components/Dashboard/CreateShipmentModal";
import InviteEmployeeModal from "../../Components/Dashboard/InviteEmployeeModal";

import "../../Styles/Pages/Product.css";

const url = import.meta.env.VITE_API_URL;

export default function Requests() {
    const [searchQuery, setSearchQuery] = useState("");
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedShipment, setSelectedShipment] = useState(null);
    const [isInviteEmployeeOpen, setInviteEmployeeOpen] = useState(false);
    const [isShipmentModalOpen, setIsShipmentModalOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 4;

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        const CACHE_KEY = "incoming_shipments_requests_cache";
        const CACHE_TIME = 0 * 60 * 1000; // 5 minutes

        try {
            setLoading(true);

            // Check cache first
            const cached = localStorage.getItem(CACHE_KEY);
            if (cached) {
                const parsed = JSON.parse(cached);

                if (Date.now() - parsed.timestamp < CACHE_TIME) {
                    setRequests(parsed.data);
                    setLoading(false);
                    return;
                }
            }

            const res = await fetch(`${url}/shipments/next`, {
                credentials: "include"
            });

            const result = await res.json();

            if (result.success) {
                setRequests(result.data);

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
            console.error("Failed to fetch requests", err);
        } finally {
            setLoading(false);
        }
    };

    const totalPages = Math.ceil(requests.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;

    const currentItems = requests.slice(indexOfFirstItem, indexOfLastItem);

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
            <div className="inventory-glass-card">

                <header className="inventory-top-bar">
                    <div className="title-area">
                        <h1>Incoming Shipment Requests</h1>
                    </div>
                </header>

                <div className="table-responsive">
                    <table className="modern-table">

                        <thead>
                            <tr>
                                <th>Medicine & Batch</th>
                                <th>Origin</th>
                                <th>Destination</th>
                                <th>Incoming</th>
                                <th>Amount</th>
                                <th></th>
                            </tr>
                        </thead>

                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="status-cell">
                                        <div className="loader" />
                                    </td>
                                </tr>
                            ) : currentItems.length > 0 ? (

                                currentItems.map((ship) => {

                                    return (
                                        <tr key={ship.id} className="fade-in-row">
                                            <td>
                                                <div className="med-identity">
                                                    <span className="m-name">
                                                        {ship.batch?.medicines?.name}
                                                    </span>
                                                    <span className="m-code">
                                                        Mint ID: #{ship.batch?.blockchain_mint_id}
                                                    </span>
                                                </div>
                                            </td>

                                            <td>
                                                <div className="origin-cell">
                                                    {ship.source_org?.name}
                                                </div>
                                            </td>

                                            <td>
                                                <div className="origin-cell">
                                                    {ship.destination_org?.name}
                                                </div>
                                            </td>

                                            <td>
                                                <div className="origin-cell">
                                                    {ship.current_holder_org?.name}
                                                </div>
                                            </td>

                                            <td>
                                                {ship.medicines_amount} Units
                                            </td>

                                            <td>
                                                <button
                                                    className="view-link"
                                                    onClick={() => setSelectedShipment(ship)}
                                                >
                                                    Receive Shipment
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })) : (<tr>
                                    <td colSpan="5" className="empty-msg">
                                        No incoming shipment requests.
                                    </td>
                                </tr>

                            )}
                        </tbody>
                    </table>
                </div>
                {/* Pagination */}

                {!loading && requests.length > itemsPerPage && (
                    <footer className="pagination-footer">
                        <p className="page-info">
                            Showing <b>{indexOfFirstItem + 1}-{Math.min(indexOfLastItem, requests.length)}</b> of {requests.length}
                        </p>
                        <div className="pagination-controls">
                            <button
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(p => p - 1)}
                                className="pag-btn"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <div className="page-numbers">
                                {getPageNumbers().map((num) => (
                                    <button
                                        key={num}
                                        onClick={() => setCurrentPage(num)}
                                        className={`num-btn ${currentPage === num ? "active" : ""}`}
                                    >
                                        {num}
                                    </button>
                                ))}
                            </div>
                            <button
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage(p => p + 1)}
                                className="pag-btn"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </footer>
                )}
            </div>
            {selectedShipment && (
                <ReceiveShipmentModal
                    shipment={selectedShipment}
                    onClose={() => setSelectedShipment(null)}
                    onSuccess={fetchRequests}
                />
            )}
        </div>
    );
}