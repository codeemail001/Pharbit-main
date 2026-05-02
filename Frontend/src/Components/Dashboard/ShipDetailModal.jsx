import { useEffect } from "react";
import { MapPin, Package, Truck, Globe, Info, Clock, Thermometer, ShieldCheck } from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "../../Styles/Components/ShipmentModal.css";

// Fix for default leaflet icons
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

const DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

const OriginIcon = L.divIcon({
    className: "shipment-modal-custom-marker",
    html: "<div class='marker-pin origin'></div>",
    iconSize: [30, 42],
    iconAnchor: [15, 42]
});

const CurrentIcon = L.divIcon({
    className: "shipment-modal-custom-marker",
    html: "<div class='marker-pin current pulse'></div>",
    iconSize: [30, 42],
    iconAnchor: [15, 42]
});

function RecenterMap({ coords }) {
    const map = useMap();
    useEffect(() => {
        if (coords.length > 0) {
            const bounds = L.latLngBounds(coords);
            map.fitBounds(bounds, { padding: [100, 100] });
        }
    }, [coords, map]);
    return null;
}

export default function ShipmentDetailModal({ isOpen, shipmentData, onClose }) {
    if (!isOpen || !shipmentData) return null;

    const chronologicalLogs = [...(shipmentData.shipment_logs || [])].sort(
        (a, b) => new Date(a.created_at) - new Date(b.created_at)
    );

    const displayLogs = [...chronologicalLogs].reverse();
    const latestLog = displayLogs[0];
    const originLog = chronologicalLogs[0];

    const allCoords = chronologicalLogs.map(log => [
        parseFloat(log.organization.long),
        parseFloat(log.organization.lat)
    ]);

    return (
        <div className="shipment-modal-overlay" onClick={onClose}>
            <div className="shipment-modal-container" onClick={e => e.stopPropagation()}>

                <div className="shipment-modal-left-panel">
                    <header className="shipment-modal-header">
                        <button className="shipment-modal-back-btn" onClick={onClose}>←</button>
                        <div className="shipment-modal-header-text">
                            <h2>{shipmentData.batch?.medicines?.name}</h2>
                            <div className="shipment-modal-status-tags">
                                <span className={`shipment-modal-tag status-${shipmentData.status.toLowerCase()}`}>
                                    {shipmentData.status}
                                </span>
                                <span className="shipment-modal-tag-id">Batch #{shipmentData.batch?.blockchain_mint_id}</span>
                            </div>
                        </div>
                    </header>

                    <div className="shipment-modal-scroll-area">
                        {/* SECTION 1: SHIPMENT OVERVIEW */}
                        <div className="shipment-modal-section">
                            <div className="section-title">
                                <Info size={16} />
                                <h3>Shipment Overview</h3>
                            </div>
                            <div className="shipment-modal-overview-grid">
                                <div className="overview-card">
                                    <Package size={18} />
                                    <div>
                                        <label>Quantity</label>
                                        <p>{shipmentData.medicines_amount} Units</p>
                                    </div>
                                </div>
                                <div className="overview-card">
                                    <Thermometer size={18} />
                                    <div>
                                        <label>Storage Temp</label>
                                        <p>{latestLog?.temperature || "Ambient"}</p>
                                    </div>
                                </div>

                            </div>
                        </div>

                        {/* SECTION 2: ROUTE SUMMARY */}
                        <div className="shipment-modal-summary-card">
                            <div className="shipment-modal-route-item">
                                <div className="route-dot start"></div>
                                <div className="route-info">
                                    <label>Origin (Manufacturer)</label>
                                    <p>{originLog?.organization?.name}</p>
                                    <span>{originLog?.organization?.address?.city}, {originLog?.organization?.address?.country}</span>
                                </div>
                            </div>
                            <div className="route-connector-line"></div>
                            <div className="shipment-modal-route-item">
                                <div className="route-dot end"></div>
                                <div className="route-info">
                                    <label>Current Location</label>
                                    <p>{latestLog?.organization?.name}</p>
                                    <span>{latestLog?.organization?.address?.city}, {latestLog?.organization?.address?.country}</span>
                                </div>
                            </div>
                        </div>

                        {/* SECTION 3: AUDIT TRAIL */}
                        <div className="shipment-modal-timeline-section">
                            <div className="section-title">
                                <Clock size={16} />
                                <h3>Audit Trail (Blockchain)</h3>
                            </div>

                            <div className="shipment-modal-timeline">
                                {displayLogs.map((log, index) => (
                                    <div className="shipment-modal-timeline-item" key={log.id}>
                                        <div className="timeline-visual">
                                            <div className="timeline-dot"></div>
                                            {index !== displayLogs.length - 1 && <div className="timeline-line"></div>}
                                        </div>
                                        <div className="timeline-content">
                                            <div className="timeline-header">
                                                <h4>{log.action.replace(/_/g, ' ')}</h4>
                                                <span>{new Date(log.created_at).toLocaleDateString()}</span>
                                            </div>
                                            <p className="timeline-org-name">{log.organization?.name}</p>
                                            <p className="timeline-notes">{log.notes}</p>
                                            <div className="timeline-footer">
                                                <MapPin size={12} />
                                                <span>{log.organization?.address?.city}, {log.organization?.address?.country}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="shipment-modal-right-panel">
                    <MapContainer
                        center={allCoords.length > 0 ? allCoords[allCoords.length - 1] : [0, 0]}
                        zoom={6}
                        zoomControl={false}
                        className="shipment-leaflet-container"
                    >
                        <TileLayer
                            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                        />
                        <RecenterMap coords={allCoords} />
                        <Polyline positions={allCoords} color="#3b82f6" weight={4} dashArray="10, 15" />

                        {chronologicalLogs.map((log, idx) => {
                            const isFirst = idx === 0;
                            const isLast = idx === chronologicalLogs.length - 1;
                            const pos = [parseFloat(log.organization.long), parseFloat(log.organization.lat)];

                            return (
                                <Marker
                                    key={log.id}
                                    position={pos}
                                    icon={isLast ? CurrentIcon : (isFirst ? OriginIcon : DefaultIcon)}
                                >
                                    <Popup className="shipment-custom-popup">
                                        <div className="popup-body">
                                            <h6>{log.action}</h6>
                                            <p>{log.organization.name}</p>
                                            <small>{new Date(log.created_at).toLocaleString()}</small>
                                        </div>
                                    </Popup>
                                </Marker>
                            );
                        })}
                    </MapContainer>
                    <div className="map-badge">
                        <div className="live-indicator"></div>
                        Live Supply Chain Tracking
                    </div>
                </div>
            </div>
        </div>
    );
}