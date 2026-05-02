import { useEffect, useState, useMemo, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Header from "../../Components/Dashboard/Header";
import PassingModal from "../../Components/Dashboard/PassingModal";
import "../../Styles/Pages/Product.css";
import CreateShipmentModal from "../../Components/Dashboard/CreateShipmentModal";
import InviteEmployeeModal from "../../Components/Dashboard/InviteEmployeeModal";
const url = import.meta.env.VITE_API_URL;
import FreezeBatchModal from "../../Components/Dashboard/FreezeBatchModal";

// Simple Global Cache for Shipments
let shipmentCache = null;

export default function Passing() {
    const [shipments, setShipments] = useState(shipmentCache || []);
    const [loading, setLoading] = useState(!shipmentCache);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedShipment, setSelectedShipment] = useState(null);
    const [isInviteEmployeeOpen, setInviteEmployeeOpen] = useState(false);
    const [isShipmentModalOpen, setIsShipmentModalOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [isFreezeModal, setFreezeModalOpen] = useState(false);

    const itemsPerPage = 4;

    const fetchShipments = useCallback(async (silent = false) => {
        try {
            if (!silent) setLoading(true);

            const res = await fetch(`${url}/shipments/current`, {
                credentials: "include"
            });
            const result = await res.json();

            if (result.success) {
                setShipments(result.data);
                shipmentCache = result.data; // Update Cache
            }
        } catch (err) {
            console.error("Failed to fetch shipments:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchShipments();
    }, [fetchShipments]);

    // --- Performance Optimization with useMemo ---

    const { currentItems, totalPages, indexOfFirstItem } = useMemo(() => {
        const total = Math.ceil(shipments.length / itemsPerPage);
        const lastIdx = currentPage * itemsPerPage;
        const firstIdx = lastIdx - itemsPerPage;
        const items = shipments.slice(firstIdx, lastIdx);

        return {
            currentItems: items,
            totalPages: total,
            indexOfFirstItem: firstIdx
        };
    }, [shipments, currentPage, itemsPerPage]);

    const pageNumbers = useMemo(() => {
        return Array.from({ length: totalPages }, (_, i) => i + 1);
    }, [totalPages]);

    // --- End Optimizations ---

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
                        <h1>Shipments in Custody</h1>
                    </div>
                </header>

                <div className="table-responsive">
                    <table className="modern-table">
                        <thead>
                            <tr>
                                <th>Medicine & Batch</th>
                                <th>Origin</th>
                                <th>Final Destination</th>
                                <th>Current Holder</th>
                                <th>Amount</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && shipments.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="status-cell">
                                        <div className="loader" />
                                    </td>
                                </tr>
                            ) : currentItems.length > 0 ? (
                                currentItems.map((ship) => (
                                    <tr key={ship.id} className="fade-in-row">
                                        <td>
                                            <div className="med-identity">
                                                <span className="m-name">{ship.batch?.medicines?.name}</span>
                                                <span className="m-code">Mint ID: #{ship.batch?.blockchain_mint_id}</span>
                                            </div>
                                        </td>
                                        <td>{ship.source_org?.name}</td>
                                        <td>{ship.destination_org?.name}</td>
                                        <td>{ship.current_holder_org?.name}</td>
                                        <td>{ship.medicines_amount} Units</td>
                                        <td>
                                            <button
                                                className={`view-link ${ship.status === "FORWARDED" ? "disabled-btn" : ""}`}
                                                onClick={() => ship.status !== "FORWARDED" && setSelectedShipment(ship)}
                                                disabled={ship.status === "FORWARDED"}
                                                style={ship.status === "FORWARDED" ? { pointerEvents: "none", opacity: 0.5, cursor: "not-allowed" } : {}}
                                            >
                                                {ship.batch?.is_active === false && ship.batch?.is_recalled === true
                                                    ? "Recall Shipment"
                                                    : ship.batch?.is_active === false
                                                    ? "Returned"
                                                    : ship.status === "FORWARDED"
                                                    ? "Shipment Passed"
                                                    : "Pass Shipment"}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="empty-msg">No shipments available.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {!loading && shipments.length > itemsPerPage && (
                    <footer className="pagination-footer">
                        <p className="page-info">
                            Showing <b>{indexOfFirstItem + 1}-{Math.min(indexOfFirstItem + itemsPerPage, shipments.length)}</b> of {shipments.length}
                        </p>
                        <div className="pagination-controls">
                            <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="pag-btn">
                                <ChevronLeft size={16} />
                            </button>
                            <div className="page-numbers">
                                {pageNumbers.map((num) => (
                                    <button
                                        key={num}
                                        onClick={() => setCurrentPage(num)}
                                        className={`num-btn ${currentPage === num ? "active" : ""}`}
                                    >
                                        {num}
                                    </button>
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
                <PassingModal
                    shipment={selectedShipment}
                    onClose={() => setSelectedShipment(null)}
                    onSuccess={() => fetchShipments(true)} // Silent refresh after success
                />
            )}
        </div>
    );
}