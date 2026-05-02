import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import "../Styles/Pages/RegisterBusiness.css";

const url = import.meta.env.VITE_API_URL;

const RegisterBusiness = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(true);
    const [form, setForm] = useState({
        organizationName: '',
        registrationId: '',
        type: 'Manufacturer'
    });

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const res = await fetch(`${url}/auth/me`, { credentials: 'include' });
                if (res.status === 401) setIsLoggedIn(false);
            } catch (err) {
                setIsLoggedIn(false);
            }
        };
        checkAuth();
    }, []);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch(`${url}/organization`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(form),
            });

            const data = await res.json();
            
            if (res.status === 401) {
                toast.error('You must be logged in to register a business.');
                setTimeout(() => navigate('/Auth'), 2000);
                return;
            }

            if (!res.ok) throw new Error(data.message || data.error || 'Registration failed');

            toast.success('Organization Registered & Linked Successfully!');
            // Redirect to Dashboard as they are now an owner
            setTimeout(() => navigate('/Dashboard'), 2000);
        } catch (err) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="reg-biz-container">
            <Toaster position="top-center" />
            
            <div className="reg-biz-card">
                <header className="reg-biz-header">
                    <Link to="/" className="reg-biz-back">← Back to Home</Link>
                    <h1>Register Your Business</h1>
                    <p>Step 2: Link your Pharbit account to a verified pharmaceutical organization.</p>
                    {!isLoggedIn && (
                        <div className="info-alert error-alert">
                            ⚠️ <strong>Authentication Required:</strong> You are not logged in. Please <Link to="/Auth">Login First</Link> to register a business.
                        </div>
                    )}
                    {isLoggedIn && (
                        <div className="info-alert">
                            ✅ <strong>Ready:</strong> Logged in as owner. Fill details to register your organization.
                        </div>
                    )}
                </header>

                <form className="reg-biz-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Organization Name</label>
                        <input 
                            type="text" 
                            name="organizationName" 
                            placeholder="e.g. Pfizer Global" 
                            value={form.organizationName}
                            onChange={handleChange}
                            required 
                        />
                    </div>

                    <div className="form-group">
                        <label>Registration ID / License No.</label>
                        <input 
                            type="text" 
                            name="registrationId" 
                            placeholder="e.g. REG-123456" 
                            value={form.registrationId}
                            onChange={handleChange}
                            required 
                        />
                    </div>

                    <div className="form-group">
                        <label>Organization Type</label>
                        <select name="type" value={form.type} onChange={handleChange}>
                            <option value="Manufacturer">Manufacturer</option>
                            <option value="Distributor">Distributor / Wholesaler</option>
                            <option value="Pharmacy">Pharmacy / Retailer</option>
                            <option value="Hospital">Hospital / Clinic</option>
                        </select>
                    </div>

                    <button type="submit" className="reg-biz-btn" disabled={loading}>
                        {loading ? 'Registering...' : 'Register Organization'}
                    </button>
                </form>

                <footer className="reg-biz-footer">
                    <p>Already have an organization? <Link to="/Auth">Login here</Link></p>
                </footer>
            </div>
        </div>
    );
};

export default RegisterBusiness;
