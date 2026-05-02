import React, { useState, useEffect } from 'react';
import "../../Styles/Components/InviteEmployee.css"

const url = import.meta.env.VITE_API_URL;
const InviteEmployeeModal = ({ isOpen, onClose }) => {
    const [data, setData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        role: 'Employee'
    });
    const [loading, setLoading] = useState(false);

    // Prevent scrolling when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch(`${url}/org/invite`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(data),
            });

            if (response.ok) {
                alert('Success! Employee has been invited.');
                setData({ firstName: '', lastName: '', email: '', role: 'Employee' });
                onClose(); // Auto-close on success
            } else {
                const err = await response.json();
                alert(`Error: ${err.message || 'Failed to send invite'}`);
            }
        } catch (error) {
            alert('Network error. Is the server running?', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="invite-modal-overlay" onClick={onClose}>
            <div className="invite-modal-container" onClick={(e) => e.stopPropagation()}>
                <header className="invite-modal-header">
                    <div className="invite-header-content">
                        <h1 className="invite-modal-title">Invite Team Member</h1>
                        <p className="invite-modal-subtitle">
                            Grant organization access to a new user.
                        </p>
                    </div>
                    <button className="invite-close-btn" onClick={onClose}>&times;</button>
                </header>

                <form className="invite-modal-form" onSubmit={handleSubmit}>
                    <div className="invite-modal-row">
                        <div className="invite-modal-group">
                            <label className="invite-modal-label">First Name</label>
                            <input
                                className="invite-modal-input"
                                name="firstName"
                                placeholder="John"
                                value={data.firstName}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="invite-modal-group">
                            <label className="invite-modal-label">Last Name</label>
                            <input
                                className="invite-modal-input"
                                name="lastName"
                                placeholder="Doe"
                                value={data.lastName}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="invite-modal-group">
                        <label className="invite-modal-label">Work Email</label>
                        <input
                            className="invite-modal-input"
                            type="email"
                            name="email"
                            placeholder="name@company.com"
                            value={data.email}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="invite-modal-group">
                        <label className="invite-modal-label">Assigned Role</label>
                        <select
                            className="invite-modal-select"
                            name="role"
                            value={data.role}
                            onChange={handleChange}
                        >
                            <option value="Employee">Employee</option>
                            <option value="Manager">Manager</option>
                            <option value="Admin">Admin</option>
                        </select>
                    </div>

                    <div className="invite-modal-actions">
                        <button type="button" className="invite-btn-cancel" onClick={onClose}>
                            Cancel
                        </button>
                        <button
                            className="invite-btn-submit"
                            type="submit"
                            disabled={loading}
                        >
                            {loading ? 'Sending...' : 'Send Invitation'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default InviteEmployeeModal;