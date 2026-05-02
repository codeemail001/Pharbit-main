import { Route, Routes, Navigate } from "react-router";
import Auth from "./Pages/Auth";
import MedicalForm from "./Layout/Dashboard/MedicalForm";
import PendingRequests from "./Pages/Admin/PendingRequest";
import OrgControl from "./Pages/Dashboard/OrgControl";

// Import your Layout and Pages
import ProfileDashboard from "./Layout/Dashboard/profiledashboard";
import Products from "./Pages/Dashboard/Products";
import Batches from "./Pages/Dashboard/Batches";
import Shipment from "./Pages/Dashboard/Shipment";
import Requests from "./Pages/Dashboard/Requests";
import Passing from "./Pages/Dashboard/Passing";
import Transferred from "./Pages/Dashboard/Transferred";
import HomeSearch from "./Pages/Home/home";
import MedsLocate from "./Pages/Home/MedsLocate";
import RegisterBusiness from "./Pages/RegisterBusiness";


function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/Auth" element={<Auth />} />
      <Route path="/Form" element={<MedicalForm />} />
      <Route path="/" element={<HomeSearch />} />
       <Route path="/Home/:id" element={<MedsLocate/>} />
      <Route path="/register-business" element={<RegisterBusiness />} />

      {/* Dashboard Protected Routes */}
      <Route path="/Dashboard" element={<ProfileDashboard />}>
        {/* This renders at /Dashboard */}
        <Route index element={<div className="p-6">Welcome to Pharbit Dashboard</div>} />
        {/* This renders at /Dashboard/products */}
        <Route path="products" element={<Products />} />
        {/* Add placeholders for other sidebar links so they don't break */}
        <Route path="add-product" element={<MedicalForm />} />
        <Route path="Batches" element={<Batches />} />
        <Route path="Shipments" element={<Shipment />} />
        <Route path="Requests" element={<Requests />} />
        <Route path="Passing" element={<Passing />} />
        <Route path="Transfer/Batches" element={<Transferred/>} />
        <Route path="pending" element={<PendingRequests />} />
        <Route path="organization-control" element={<OrgControl />} />
        <Route path="network" element={<Navigate to="/Dashboard/organization-control" replace />} />
        {/* <Route path="Employee" element={<InviteEmployee/>} /> */} 
      </Route>
    </Routes>
  );
}

export default App;