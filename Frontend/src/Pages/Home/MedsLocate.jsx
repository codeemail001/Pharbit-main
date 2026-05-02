import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import "../../Styles/Home/MedsLocate.css";

const url = import.meta.env.VITE_API_URL;
const MedsLocate = () => {
    const { id } = useParams();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const res = await fetch(`${url}/NearbyBatches?id=${id}`);
                const json = await res.json();
                if (json.success) setData(json.data || []);
            } catch (err) {
                console.error("Fetch error", err);
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [id]);

    const createStoreLabel = (name) => {
        return L.divIcon({
            className: 'custom-map-marker',
            html: `<div class="marker-container">
                    <span class="marker-text">${name.split(' ')[0]}</span>
                    <div class="marker-tip"></div>
                   </div>`,
            iconSize: [100, 40],
            iconAnchor: [50, 40]
        });
    };

    if (loading) return <div className="app-loader"><span>Syncing with Pharbit Chain...</span></div>;

    const validBatches = data.filter(item => item.batch !== null);
    const medInfo = validBatches.length > 0 ? validBatches[0].batch.medicines : null;
    const locations = validBatches.filter(item => item.organization?.lat && item.organization?.long);

    const center = locations.length > 0
        ? [parseFloat(locations[0].organization.long), parseFloat(locations[0].organization.lat)]
        : [28.6139, 77.2090];

    return (
        <div className="med-locate-wrapper">
        <div className="med-nav-top">
            <button onClick={() => window.history.back()} className="back-search-btn">← Back to Search</button>
        </div>
        <div className="med-content-sidebar">
                {medInfo && (
                    <div className="med-details-card">
                        <div className="status-tag">Verified Supply</div>
                        <h1 className="med-name">{medInfo.name} <small>{medInfo.strength}</small></h1>
                        <p className="med-brand-name">{medInfo.brand_name}</p>
                        
                        <div className="info-grid">
                            <div className="info-item">
                                <label>Category</label>
                                <span>{medInfo.category || "General"}</span>
                            </div>
                            <div className="info-item">
                                <label>Route</label>
                                <span>{medInfo.route_of_administration || "Oral"}</span>
                            </div>
                            <div className="info-item">
                                <label>Price</label>
                                <span className="price-val">EUR{medInfo.mrp}</span>
                            </div>
                        </div>

                        <div className="med-meta-section">
                            <label>Composition</label>
                            <p>{medInfo.composition.join(", ")}</p>
                        </div>

                        <div className="med-meta-section">
                            <label>Side Effects</label>
                            <p className="side-effects-text">{medInfo.side_effects.join(", ")}</p>
                        </div>
                    </div>
                )}

                <div className="availability-section">
                    <h3 className="section-heading">Available Locations</h3>
                    <div className="pharmacy-grid">
                        {validBatches.map((item) => {
                            const isLowStock = item.amount < 30;
                            return (
                                <div key={item.id} className={`pharmacy-item ${isLowStock ? 'is-urgent' : ''}`}>
                                    <div className="item-header">
                                        <div className="org-details">
                                            <h4>{item.organization.name}</h4>
                                            <p>{item.organization.address.city}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="stock-row">
                                        <span className="stock-count">{item.amount} Units</span>
                                        {isLowStock && <span className="low-stock-label">Low Stock</span>}
                                    </div>

                                    <div className="item-footer">
                                        <button className="nav-btn">Route</button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="med-map-container">
                <MapContainer
                    key={center.join(",")} 
                    center={center}
                    zoom={14}
                    className="leaflet-full-view"
                    zoomControl={false}
                >
                    <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                    {locations.map((loc) => (
                        <Marker 
                            key={loc.id} 
                            position={[parseFloat(loc.organization.long), parseFloat(loc.organization.lat)]}
                            icon={createStoreLabel(loc.organization.name)}
                        >
                            <Popup className="premium-popup">
                                <strong>{loc.organization.name}</strong><br />
                                Quantity: {loc.amount}
                            </Popup>
                        </Marker>
                    ))}
                </MapContainer>
            </div>
        </div>
    );
};

export default MedsLocate;