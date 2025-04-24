import React from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Navbar from "./components/common/Navbar";
import Main from "./components/dashboard/Main";
import Subscriptions from "./components/dashboard/Subscriptions";
import Receipts from "./components/dashboard/Receipts";
import Members from "./components/dashboard/Members";
import Tickets from "./components/dashboard/Tickets";
import Attendance from "./components/dashboard/Attendance";
import FreeInvites from "./components/dashboard/FreeInvites";
import Leads from "./components/dashboard/Leads";
import Club from "./components/dashboard/Club";
import Profile from "./components/dashboard/Profile";
import Staff from "./components/dashboard/Staff";
import Finance from "./components/dashboard/Finance";
import Member from "./pages/member/Member";

function App() {
  const location = useLocation();
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      {/* Main content area expands to fill remaining space */}
      <div className="flex-grow">
        <Routes>
          <Route path="/" element={<Dashboard />}>
            <Route index element={<Main />} />
            <Route path="subscriptions" element={<Subscriptions />} />
            <Route path="receipts" element={<Receipts />} />
            <Route path="members" element={<Members />} />
            <Route path="/member/:id" element={<Member />} />
            <Route path="tickets" element={<Tickets />} />
            <Route path="attendance" element={<Attendance />} />
            <Route path="free-invites" element={<FreeInvites />} />
            <Route path="leads" element={<Leads />} />
            <Route path="club" element={<Club />} />
            <Route path="profile" element={<Profile />} />
            <Route path="staff" element={<Staff />} />
            <Route path="finance" element={<Finance />} />
          </Route>

          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </div>

      {/* Sticky Footer */}
      {location.pathname === "/login" ? null : (
        <footer className="p-4 border-t border-gray-200 text-center dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400">
          Footer Content
        </footer>
      )}
    </div>
  );
}

export default App;
