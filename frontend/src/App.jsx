import React from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import Dashboard from './pages/Dashboard';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Navbar from './components/common/Navbar';
import Main from './components/dashboard/Main';
import Subscriptions from './components/subscriptions/Subscriptions';
import Members from './components/dashboard/Members';
import Tickets from './components/tickets/Tickets';
import Attendance from './components/dashboard/Attendance';
import InviteList from './components/freeinvites/InviteList';
import Staff from './components/dashboard/Staff';
import MemberSubscriptions from './components/dashboard/MemberSubscriptions';
import MemberProfile from './components/members/MemberProfile';
import StaffProfile from './components/dashboard/StaffProfile';
import AttendanceForm from './components/dashboard/AttendanceForm';
import OutForm from './components/dashboard/OutForm';
import AttendanceAnalysis from './components/dashboard/AttendanceAnalysis';
import UserList from './components/dashboard/UserList';
import Expense from './components/dashboard/Expense';
import IncomeSources from './components/dashboard/Incomes';
import CoachProfile from './components/dashboard/CoachProfile';
import ManageUsers from './components/dashboard/ManageUsers';
import ReportsPage from './components/dashboard/Reports';
import FinancialDashboard from './components/dashboard/FinancialDashboard';
import MemberSubscriptionReport from './components/dashboard/MemberSubscriptionReport';
import SubscriptionAnalytics from './components/subscriptions/SubscriptionAnalytics';
import StaffAttendanceReport from './components/dashboard/StaffAttendanceReport';
import StockAnalytics from './components/dashboard/StockAnalytics';
import StaffSalaryReport from './components/dashboard/StaffSalaryReport';
import AttendanceDashboard from './components/dashboard/AttendanceDashboard';
import EmployeeSubscriptionList from './components/staffPage/EmployeeSubscriptionList';
import StaffExpenses from './components/staffPage/StaffExpenses';
import StaffIncomes from './components/staffPage/StaffIncomes';
import StaffExpenseTable from './components/staffPage/StaffExpenseTable';
import StaffIncomeTable from './components/staffPage/StaffIncomeTable';
import ChartsPage from './components/dashboard/ChartsPage';
import useTokenRefresh from './hooks/useTokenRefresh';
import { Toaster } from 'react-hot-toast';

const ProtectedRoute = ({ element }) => {
  const accessToken = localStorage.getItem('token');
  const [isValidating, setIsValidating] = React.useState(true);
  const [isValidToken, setIsValidToken] = React.useState(false);

  React.useEffect(() => {
    const validateToken = async () => {
      try {
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
  const navigate = usenavigate();
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
          {/* لوحة التحكم */}
          <Route index element={<Main />} />

          {/* الأعضاء والعضوية */}
          <Route path="members" element={<Members />} />
          <Route path="member-profile" element={<MemberProfile />} />
          <Route path="member-subscriptions/:memberId" element={<MemberSubscriptions />} />
          <Route path="subscriptions" element={<Subscriptions />} />
          <Route path="attendance" element={<Attendance />} />
          <Route path="free-invites" element={<InviteList />} />
          <Route path="tickets" element={<Tickets />} />

          {/* إدارة الموظفين */}
          <Route path="staff" element={<Staff />} />
          <Route path="staff/:id" element={<StaffProfile />} />
          <Route path="staff-shifts" element={<AttendanceForm />} />
          <Route path="check-out" element={<OutForm />} />
          <Route path="staff-attendance" element={<AttendanceDashboard />} />
          <Route path="attendance/:staffId" element={<AttendanceAnalysis />} />
          <Route path="EmployeeSubscriptionList" element={<EmployeeSubscriptionList />} />

          {/* التقارير والتحليلات */}
          <Route path="staff-reports" element={<UserList />} />
          <Route path="attendance-report/:staffId?" element={<StaffAttendanceReport />} />
          <Route path="attendance-StaffSalaryReport" element={<StaffSalaryReport />} />
          <Route path="subscriptions/subscription-report" element={<MemberSubscriptionReport />} />
          <Route path="subscriptions/subscription-analytics" element={<SubscriptionAnalytics />} />
          <Route path="expense" element={<Expense />} />
          <Route path="income-sources" element={<IncomeSources />} />
          <Route path="dashboard/staff-expenses" element={<StaffExpenses />} />
          <Route path="dashboard/staff-incomes" element={<StaffIncomes />} />
          <Route path="StaffExpenseTable" element={<StaffExpenseTable />} />
          <Route path="StaffIncomeTable" element={<StaffIncomeTable />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="dashboard/financial-analysis" element={<FinancialDashboard />} />
          <Route path="dashboard/StockAnalytics" element={<StockAnalytics />} />
          <Route path="ChartsPage" element={<ChartsPage />} />
          <Route path="manage-users" element={<ManageUsers />} />
          <Route path="coach-profile/:coachId" element={<CoachProfile />} />
        </Route>
      </Routes>
    </div>
  );
}

export default App;