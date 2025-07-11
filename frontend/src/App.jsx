import React from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import Dashboard from './pages/Dashboard';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Navbar from './components/common/Navbar';
import Main from './components/dashboard/Main';
import Subscriptions from './components/dashboard/Subscriptions';
import Receipts from './components/dashboard/Receipts';
import Members from './components/dashboard/Members';
import Tickets from './components/dashboard/Tickets';
import Attendance from './components/dashboard/Attendance';
import FreeInvites from './components/dashboard/FreeInvites';
import Leads from './components/dashboard/Leads';
import Club from './components/dashboard/Club';
import Profile from './components/dashboard/Profile';
import Staff from './components/dashboard/Staff';
import Finance from './components/dashboard/Finance';
import MemberSubscriptions from './components/dashboard/MemberSubscriptions';
import MemberProfile from './components/members/MemberProfile'; // الكود الجديد
import AddMember from './components/modals/AddMember';
import StaffProfile from './components/dashboard/StaffProfile';
import AttendanceForm from './components/dashboard/AttendanceForm';
import OutForm from './components/dashboard/OutForm';
import AttendanceAnalysis from './components/dashboard/AttendanceAnalysis';
import UserList from './components/dashboard/UserList';
import ShiftAttendanceList from './components/dashboard/ShiftAttendanceList';
import ExpenseCategory from './components/dashboard/ExpenseCategory';
import Expense from './components/dashboard/Expense';
import IncomeSources from './components/dashboard/Incomes';
import CoachProfile from './components/dashboard/CoachProfile';
import ManageUsers from './components/dashboard/ManageUsers';
import ReportsPage from './components/dashboard/Reports';
import FinancialDashboard from './components/dashboard/FinancialDashboard';
import MemberSubscriptionReport from './components/dashboard/MemberSubscriptionReport';
import SubscriptionAnalytics from './components/dashboard/SubscriptionAnalytics';
import StaffAttendanceReport from './components/dashboard/StaffAttendanceReport';
import StockAnalytics from './components/dashboard/StockAnalytics';
import StaffSalaryReport from './components/dashboard/StaffSalaryReport';
import AttendanceDashboard from './components/dashboard/AttendanceDashboard';
import useTokenRefresh from './hooks/useTokenRefresh';
import { Toaster } from 'react-hot-toast';

const ProtectedRoute = ({ element }) => {
  const accessToken = localStorage.getItem('token');
  const [isValidating, setIsValidating] = React.useState(true);
  const [isValidToken, setIsValidToken] = React.useState(false);

  React.useEffect(() => {
    const validateToken = async () => {
      try {
        // افترض API endpoint للتحقق من التوكن
        const response = await fetch('/api/validate-token', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (response.ok) {
          setIsValidToken(true);
        } else {
          setIsValidToken(false);
        }
      } catch {
        setIsValidToken(false);
      } finally {
        setIsValidating(false);
      }
    };

    if (accessToken) {
      validateToken();
    } else {
      setIsValidating(false);
    }
  }, [accessToken]);

  if (isValidating) {
    return <div className="flex justify-center items-center min-h-screen">جاري التحقق...</div>;
  }

  return accessToken && isValidToken ? element : <Navigate to="/login" replace />;
};

function App() {
  const navigate = useNavigate();
  const { error } = useTokenRefresh();

  React.useEffect(() => {
    if (error) {
      toast.error(`جلسة منتهية، يرجى تسجيل الدخول مجدداً: ${error}`);
      localStorage.removeItem('token');
      navigate('/login');
    }
  }, [error, navigate]);

  return (
    <div>
      <Navbar />
      <Toaster position="top-center" />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Protected Routes */}
        <Route path="/" element={<ProtectedRoute element={<Dashboard />} />}>
          <Route index element={<Main />} />
          <Route path="subscriptions" element={<Subscriptions />} />
          <Route path="receipts" element={<Receipts />} />
          <Route path="members" element={<Members />} />
          <Route path="member-profile" element={<MemberProfile />} /> {/* المسار الجديد */}
          <Route path="member-subscriptions/:memberId" element={<MemberSubscriptions />} />
          <Route path="tickets" element={<Tickets />} />
          <Route path="attendance" element={<Attendance />} />
          <Route path="free-invites" element={<FreeInvites />} />
          <Route path="leads" element={<Leads />} />
          <Route path="club" element={<Club />} />
          <Route path="profile" element={<Profile />} />
          <Route path="staff" element={<Staff />} />
          <Route path="finance" element={<Finance />} />
          <Route path="add-member" element={<AddMember />} />
          <Route path="staff/:id" element={<StaffProfile />} />
          <Route path="attendance-form" element={<AttendanceForm />} />
          <Route path="check-out" element={<OutForm />} />
          <Route path="attendance/:staffId" element={<AttendanceAnalysis />} />
          <Route path="staff-reports" element={<UserList />} />
          <Route path="shift-attendance" element={<ShiftAttendanceList />} />
          <Route path="expense-category" element={<ExpenseCategory />} />
          <Route path="expense" element={<Expense />} />
          <Route path="income-sources" element={<IncomeSources />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="coach-profile/:coachId" element={<CoachProfile />} />
          <Route path="manage-users" element={<ManageUsers />} />
          <Route path="dashboard/subscription-report" element={<MemberSubscriptionReport />} />
          <Route path="dashboard/StockAnalytics" element={<StockAnalytics />} />
          <Route path="dashboard/financial-analysis" element={<FinancialDashboard />} />
          <Route path="dashboard/subscription-analytics" element={<SubscriptionAnalytics />} />
          <Route path="attendance-report/:staffId?" element={<StaffAttendanceReport />} />
          <Route path="attendance-StaffSalaryReport" element={<StaffSalaryReport />} />
          <Route path="AttendanceDashboard" element={<AttendanceDashboard />} />
        </Route>
      </Routes>
    </div>
  );
}

export default App;