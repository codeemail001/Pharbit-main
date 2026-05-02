import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { SearchIcon } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import "../../Styles/Home/home.css";

const rawUrl = import.meta.env.VITE_API_URL || "";
const url = rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`;
const HomeSearch = () => {
  const [query, setQuery] = useState('');
  const [meds, setMeds] = useState([]);
  const [filteredMeds, setFilteredMeds] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedMedId, setSelectedMedId] = useState(null);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("Pharbit_Token");
        const headers = { "credentials": "include" };
        if (token) {
          headers.headers = { "Authorization": `Bearer ${token}` };
        }
        const res = await fetch(`${url}/auth/me`, headers);
        const data = await res.json();
        if (data && data.employee) {
          setUser(data.employee);
        }
      } catch (err) {
        console.error("Not logged in");
      }
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch(`${url}/auth/logout`, { method: 'POST', credentials: 'include' });
      setUser(null);
      toast.success("Logged out successfully");
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  useEffect(() => {
    const fetchMeds = async () => {
      try {
        const token = localStorage.getItem("Pharbit_Token");
        const options = { credentials: 'include' };
        if (token) {
          options.headers = { "Authorization": `Bearer ${token}` };
        }
        const res = await fetch(`${url}/allmeds`, options);
        const response = await res.json();
        if (response.success) {
          // The backend returns { success: true, data: [...] }
          setMeds(response.data || []);
        }
      } catch (error) {
        console.error("Error fetching meds:", error);
      }
    };
    fetchMeds();
  }, []);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    setSelectedMedId(null);

    if (value.length > 0) {
      const filtered = meds.filter((med) =>
        med.name.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredMeds(filtered);
      setShowDropdown(true);
    } else {
      setShowDropdown(false);
    }
  };

  const handleSelectMed = (med) => {
    setQuery(med.name);
    setSelectedMedId(med.id);
    setShowDropdown(false);
  };

  const handleSend = () => {
    if (selectedMedId) {
      navigate(`/Home/${selectedMedId}`);
    } else {
      const exactMatch = meds.find(m => m.name.toLowerCase() === query.toLowerCase());
      if (exactMatch) navigate(`/med-details/${exactMatch.id}`);
    }
  };

  return (
    <div className="home-search-page-wrapper">
      <Toaster position="top-center" />
      {/* --- HEADER --- */}
      <header className="home-search-header">
        <div className="home-search-nav-container">
          <div className="home-search-logo">
            <Link to="/">PHARBIT</Link>
          </div>
          <nav className="home-search-nav-links">
            {user ? (
              <>
                <Link to="/Dashboard" className="home-search-nav-item">Dashboard</Link>
                <button onClick={handleLogout} className="home-search-nav-btn logout-btn">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/Auth" className="home-search-nav-item">Sign In</Link>
                <Link to="/register-business" className="home-search-nav-btn">
                  Join as Business Partner
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* --- HERO SECTION --- */}
      <div className="home-search-hero">
        {/* Side-aligned Dotted Circles */}
      <div className="home-search-bg-circles">
    <div className="home-search-dot-circle c1"></div>
    <div className="home-search-dot-circle c2"></div>
    <div className="home-search-dot-circle c3"></div>
  </div>

        <div className="home-search-content">
          <h1 className="home-search-main-title">
            Track and Manage Your <br /> 
            <span>Medicine Supply Chain</span> Instantly
          </h1>

          <div className="home-search-bar-container">
            <div className="home-search-input-group">
                          <span className="home-search-icon"></span>
              <input
                type="text"
                className="home-search-input-field"
                placeholder="Enter medicine name..."
                value={query}
                onChange={handleInputChange}
                onFocus={() => query.length > 0 && setShowDropdown(true)}
              />
              <button className="home-search-send-btn" onClick={handleSend}>
                Find
              </button>
            </div>

            {showDropdown && filteredMeds.length > 0 && (
              <ul className="home-search-results-list">
                {filteredMeds.map((med) => (
                  <li 
                    key={med.id} 
                    className="home-search-results-item"
                    onClick={() => handleSelectMed(med)}
                  >
                    {med.name}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="home-search-steps">
            <span>Search Meds</span>
            <span className="home-search-arrow">→</span>
            <span>Select ID</span>
            <span className="home-search-arrow">→</span>
            <span>Verify Supply</span>
            <span className="home-search-arrow">→</span>
            <span>Blockchain Log</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeSearch;