import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { CSVLink } from 'react-csv';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Tab } from '@headlessui/react';
import BASE_URL from '../../config/api';
import './analytics.css';

const SubscriptionAnalytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [subscriptionTypes, setSubscriptionTypes] = useState([]);
  const [coaches, setCoaches] = useState([]);
  const [startDate, setStartDate] = useState(format(new Date().setDate(new Date().getDate() - 90), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedType, setSelectedType] = useState('');
  const [selectedCoach, setSelectedCoach] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch subscription types and coaches
  const fetchFilters = async () => {
    try {
      console.log('Fetching filters from:', `${BASE_URL}subscriptions/api/subscription-types/active/`, `${BASE_URL}accounts/api/coaches/`);
      const [typesResponse, coachesResponse] = await Promise.all([
        axios.get(`${BASE_URL}subscriptions/api/subscription-types/active/`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }),
        axios.get(`${BASE_URL}accounts/api/coaches/`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }),
      ]);
      setSubscriptionTypes(Array.isArray(typesResponse.data.results) ? typesResponse.data.results : typesResponse.data || []);
      setCoaches(Array.isArray(coachesResponse.data.results) ? coachesResponse.data.results : coachesResponse.data || []);
    } catch (error) {
      console.error('Error fetching filters:', error.message, error.response?.status);
      setError(`فشل في جلب بيانات الفلاتر: ${error.message}`);
    }
  };

  // Fetch analytics data
  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${BASE_URL}subscriptions/api/subscriptions/analytics/`, {
        params: {
          start_date: startDate,
          end_date: endDate,
          subscription_type: selectedType,
          coach: selectedCoach,
        },
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      console.log('Analytics response:', response.data);
      setAnalytics(response.data || {});
    } catch (error) {
      console.error('Error fetching analytics:', error.message, error.response?.status);
      setError(`فشل في جلب بيانات التحليلات: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFilters();
    fetchAnalytics();
  }, [startDate, endDate, selectedType, selectedCoach]);

  // Sorting function with null checks
  const sortData = (data, key, direction) => {
    if (!Array.isArray(data)) return [];
    return [...data].sort((a, b) => {
      let aValue, bValue;
      if (key === 'member_details.name') {
        aValue = a?.member_details?.name ?? '';
        bValue = b?.member_details?.name ?? '';
      } else {
        aValue = a?.[key] ?? '';
        bValue = b?.[key] ?? '';
      }
      if (aValue < bValue) return direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  // Prepare CSV data with defensive checks
  const getCsvData = () => {
    if (!analytics) return [];

    const data = [];

    // Popular Types
    data.push(['أكثر أنواع الاشتراكات شعبية']);
    data.push(['النوع', 'عدد الاشتراكات', 'النسبة (%)']);
    const popularTypes = Array.isArray(analytics.popular_subscription_types) ? analytics.popular_subscription_types : [];
    const sortedPopularTypes = sortConfig.key?.includes('popular')
      ? sortData(popularTypes, sortConfig.key.split('.')[1], sortConfig.direction)
      : popularTypes;
    sortedPopularTypes.forEach((type) => {
      if (type) {
        data.push([type.name ?? 'غير معروف', type.total ?? 0, type.percentage ?? 0]);
      }
    });

    // Attendance Analysis
    data.push([], ['أعلى أنواع الاشتراكات حضورًا']);
    data.push(['النوع', 'متوسط الحضور', 'إجمالي الحضور']);
    const attendanceTypes = Array.isArray(analytics.attendance_analysis?.highest_attendance_types)
      ? analytics.attendance_analysis.highest_attendance_types
      : [];
    const sortedAttendanceTypes = sortConfig.key?.includes('attendance')
      ? sortData(attendanceTypes, sortConfig.key.split('.')[1], sortConfig.direction)
      : attendanceTypes;
    sortedAttendanceTypes.forEach((type) => {
      if (type) {
        data.push([
          type.type__name ?? 'غير معروف',
          type.avg_attendance ? Number(type.avg_attendance).toFixed(2) : '0.00',
          type.total_attendance ?? 0,
        ]);
      }
    });
    data.push([], ['الحضور حسب أيام الأسبوع']);
    data.push(['اليوم', 'إجمالي الحضور']);
    const byDayOfWeek = Array.isArray(analytics.attendance_analysis?.by_day_of_week)
      ? analytics.attendance_analysis.by_day_of_week
      : [];
    byDayOfWeek.forEach((day) => {
      if (day) {
        data.push([day.day ?? 'غير معروف', day.total_entries ?? 0]);
      }
    });

    // Freeze Analysis
    data.push([], ['تحليل التجميد']);
    data.push(['النوع', 'عدد طلبات التجميد', 'الاشتراكات المتجمدة', 'نسبة التجميد (%)']);
    const freezeAnalysis = Array.isArray(analytics.freeze_analysis) ? analytics.freeze_analysis : [];
    const sortedFreeze = sortConfig.key?.includes('freeze')
      ? sortData(freezeAnalysis, sortConfig.key.split('.')[1], sortConfig.direction)
      : freezeAnalysis;
    sortedFreeze.forEach((freeze) => {
      if (freeze) {
        data.push([
          freeze.name ?? 'غير معروف',
          freeze.total_freezes ?? 0,
          freeze.frozen_subscriptions ?? 0,
          freeze.freeze_percentage ?? 0,
        ]);
      }
    });

    // Revenue Analysis
    data.push([], ['الإيرادات حسب نوع الاشتراك']);
    data.push(['النوع', 'إجمالي الإيرادات', 'إيرادات تعويض الكابتن', 'المبالغ المتبقية']);
    const revenueAnalysis = Array.isArray(analytics.revenue_analysis) ? analytics.revenue_analysis : [];
    const sortedRevenue = sortConfig.key?.includes('revenue')
      ? sortData(revenueAnalysis, sortConfig.key.split('.')[1], sortConfig.direction)
      : revenueAnalysis;
    sortedRevenue.forEach((type) => {
      if (type) {
        data.push([
          type.name ?? 'غير معروف',
          type.total_revenue ?? 0,
          type.coach_compensation_revenue ?? 0,
          type.remaining_amount ?? 0,
        ]);
      }
    });

    // Member Behavior
    data.push([], ['الأعضاء الأكثر نشاطًا']);
    data.push(['اسم العضو', 'عدد مرات الحضور', 'عدد الاشتراكات', 'منتظم', 'متكرر']);
    const activeMembers = Array.isArray(analytics.member_behavior?.active_members)
      ? analytics.member_behavior.active_members
      : [];
    console.log('Active members:', activeMembers);
    const sortedMembers = sortConfig.key?.includes('member')
      ? sortData(activeMembers, sortConfig.key.split('.')[1], sortConfig.direction)
      : activeMembers;
    sortedMembers.forEach((member) => {
      if (member && typeof member === 'object' && member.member_details) {
        data.push([
          member.member_details.name ?? 'غير معروف',
          member.attendance_count ?? 0,
          member.subscription_count ?? 0,
          member.is_regular ? 'نعم' : 'لا',
          member.is_repeated ? 'نعم' : 'لا',
        ]);
      }
    });
    data.push([], ['الأعضاء غير النشطين']);
    data.push(['اسم العضو', 'عدد الاشتراكات']);
    const inactiveMembers = Array.isArray(analytics.member_behavior?.inactive_members)
      ? analytics.member_behavior.inactive_members
      : [];
    inactiveMembers.forEach((member) => {
      if (member) {
        data.push([member.member__name ?? 'غير معروف', member.subscription_count ?? 0]);
      }
    });

    // Coach Analysis
    data.push([], ['تحليل الكباتن']);
    data.push(['اسم الكابتن', 'عدد العملاء', 'إجمالي الحضور', 'إجمالي إيرادات التعويض']);
    const coachAnalysis = Array.isArray(analytics.coach_analysis) ? analytics.coach_analysis : [];
    const sortedCoaches = sortConfig.key?.includes('coach')
      ? sortData(coachAnalysis, sortConfig.key.split('.')[1], sortConfig.direction)
      : coachAnalysis;
    sortedCoaches.forEach((coach) => {
      if (coach) {
        data.push([
          coach.username ?? 'غير معروف',
          coach.total_clients ?? 0,
          coach.total_attendance ?? 0,
          coach.total_revenue ?? 0,
        ]);
      }
    });

    // Temporal Analysis
    data.push([], ['تحليل زمني']);
    data.push(['الشهر', 'عدد الاشتراكات', 'إجمالي الإيرادات']);
    const temporalAnalysis = Array.isArray(analytics.temporal_analysis) ? analytics.temporal_analysis : [];
    const sortedTemporal = sortConfig.key?.includes('temporal')
      ? sortData(temporalAnalysis, sortConfig.key.split('.')[1], sortConfig.direction)
      : temporalAnalysis;
    sortedTemporal.forEach((temp) => {
      if (temp) {
        data.push([temp.month ?? 'غير معروف', temp.total_subscriptions ?? 0, temp.total_revenue ?? 0]);
      }
    });

    // Renewal Rate
    data.push([], ['معدل التجديد حسب نوع الاشتراك']);
    data.push(['النوع', 'الاشتراكات المنتهية', 'الاشتراكات المتجددة', 'معدل التجديد (%)']);
    const renewalRate = Array.isArray(analytics.renewal_rate_by_type) ? analytics.renewal_rate_by_type : [];
    const sortedRenewal = sortConfig.key?.includes('renewal')
      ? sortData(renewalRate, sortConfig.key.split('.')[1], sortConfig.direction)
      : renewalRate;
    sortedRenewal.forEach((stat) => {
      if (stat) {
        data.push([
          stat.name ?? 'غير معروف',
          stat.expired_subscriptions ?? 0,
          stat.renewed_subscriptions ?? 0,
          stat.renewal_rate ?? 0,
        ]);
      }
    });

    // Nearing Expiry
    data.push([], ['الاشتراكات القريبة من الانتهاء']);
    data.push(['اسم العضو', 'تاريخ الانتهاء']);
    const nearingExpiry = Array.isArray(analytics.nearing_expiry) ? analytics.nearing_expiry : [];
    nearingExpiry.forEach((sub) => {
      if (sub?.member_details) {
        data.push([sub.member_details.name ?? 'غير معروف', sub.end_date ?? 'غير معروف']);
      }
    });

    return data;
  };

  // Export to PDF with defensive checks
  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFont('Amiri');
    doc.setFontSize(16);
    doc.text('تحليل الاشتراكات', 10, 10, { align: 'right' });

    if (!analytics) {
      doc.text('لا توجد بيانات متاحة', 10, 20, { align: 'right' });
      doc.save('subscription_analytics.pdf');
      return;
    }

    // Popular Types
    doc.text('أكثر أنواع الاشتراكات شعبية', 10, 20, { align: 'right' });
    autoTable(doc, {
      startY: 25,
      head: [['النوع', 'عدد الاشتراكات', 'النسبة (%)']],
      body: (sortConfig.key?.includes('popular')
        ? sortData(analytics.popular_subscription_types || [], sortConfig.key.split('.')[1], sortConfig.direction)
        : analytics.popular_subscription_types || []
      ).map((type) => [
        type?.name ?? 'غير معروف',
        type?.total ?? 0,
        type?.percentage ?? 0,
      ]),
      styles: { font: 'Amiri', halign: 'right' },
    });

    // Attendance Analysis
    doc.text('أعلى أنواع الاشتراكات حضورًا', 10, doc.lastAutoTable.finalY + 10, { align: 'right' });
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 15,
      head: [['النوع', 'متوسط الحضور', 'إجمالي الحضور']],
      body: (sortConfig.key?.includes('attendance')
        ? sortData(analytics.attendance_analysis?.highest_attendance_types || [], sortConfig.key.split('.')[1], sortConfig.direction)
        : analytics.attendance_analysis?.highest_attendance_types || []
      ).map((type) => [
        type?.type__name ?? 'غير معروف',
        type?.avg_attendance ? Number(type.avg_attendance).toFixed(2) : '0.00',
        type?.total_attendance ?? 0,
      ]),
      styles: { font: 'Amiri', halign: 'right' },
    });
    doc.text('الحضور حسب أيام الأسبوع', 10, doc.lastAutoTable.finalY + 10, { align: 'right' });
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 15,
      head: [['اليوم', 'إجمالي الحضور']],
      body: (analytics.attendance_analysis?.by_day_of_week || []).map((day) => [
        day?.day ?? 'غير معروف',
        day?.total_entries ?? 0,
      ]),
      styles: { font: 'Amiri', halign: 'right' },
    });

    // Freeze Analysis
    doc.text('تحليل التجميد', 10, doc.lastAutoTable.finalY + 10, { align: 'right' });
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 15,
      head: [['النوع', 'عدد طلبات التجميد', 'الاشتراكات المتجمدة', 'نسبة التجميد (%)']],
      body: (sortConfig.key?.includes('freeze')
        ? sortData(analytics.freeze_analysis || [], sortConfig.key.split('.')[1], sortConfig.direction)
        : analytics.freeze_analysis || []
      ).map((freeze) => [
        freeze?.name ?? 'غير معروف',
        freeze?.total_freezes ?? 0,
        freeze?.frozen_subscriptions ?? 0,
        freeze?.freeze_percentage ?? 0,
      ]),
      styles: { font: 'Amiri', halign: 'right' },
    });

    // Revenue Analysis
    doc.text('الإيرادات حسب نوع الاشتراك', 10, doc.lastAutoTable.finalY + 10, { align: 'right' });
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 15,
      head: [['النوع', 'إجمالي الإيرادات', 'إيرادات تعويض الكابتن', 'المبالغ المتبقية']],
      body: (sortConfig.key?.includes('revenue')
        ? sortData(analytics.revenue_analysis || [], sortConfig.key.split('.')[1], sortConfig.direction)
        : analytics.revenue_analysis || []
      ).map((type) => [
        type?.name ?? 'غير معروف',
        type?.total_revenue ?? 0,
        type?.coach_compensation_revenue ?? 0,
        type?.remaining_amount ?? 0,
      ]),
      styles: { font: 'Amiri', halign: 'right' },
    });

    // Member Behavior
    doc.text('الأعضاء الأكثر نشاطًا', 10, doc.lastAutoTable.finalY + 10, { align: 'right' });
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 15,
      head: [['اسم العضو', 'عدد مرات الحضور', 'عدد الاشتراكات', 'منتظم', 'متكرر']],
      body: (sortConfig.key?.includes('member')
        ? sortData(analytics.member_behavior?.active_members || [], sortConfig.key.split('.')[1], sortConfig.direction)
        : analytics.member_behavior?.active_members || []
      ).map((member) => [
        member?.member_details?.name ?? 'غير معروف',
        member?.attendance_count ?? 0,
        member?.subscription_count ?? 0,
        member?.is_regular ? 'نعم' : 'لا',
        member?.is_repeated ? 'نعم' : 'لا',
      ]),
      styles: { font: 'Amiri', halign: 'right' },
    });
    doc.text('الأعضاء غير النشطين', 10, doc.lastAutoTable.finalY + 10, { align: 'right' });
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 15,
      head: [['اسم العضو', 'عدد الاشتراكات']],
      body: (analytics.member_behavior?.inactive_members || []).map((member) => [
        member?.member__name ?? 'غير معروف',
        member?.subscription_count ?? 0,
      ]),
      styles: { font: 'Amiri', halign: 'right' },
    });

    // Coach Analysis
    doc.text('تحليل الكباتن', 10, doc.lastAutoTable.finalY + 10, { align: 'right' });
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 15,
      head: [['اسم الكابتن', 'عدد العملاء', 'إجمالي الحضور', 'إجمالي إيرادات التعويض']],
      body: (sortConfig.key?.includes('coach')
        ? sortData(analytics.coach_analysis || [], sortConfig.key.split('.')[1], sortConfig.direction)
        : analytics.coach_analysis || []
      ).map((coach) => [
        coach?.username ?? 'غير معروف',
        coach?.total_clients ?? 0,
        coach?.total_attendance ?? 0,
        coach?.total_revenue ?? 0,
      ]),
      styles: { font: 'Amiri', halign: 'right' },
    });

    // Temporal Analysis
    doc.text('تحليل زمني', 10, doc.lastAutoTable.finalY + 10, { align: 'right' });
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 15,
      head: [['الشهر', 'عدد الاشتراكات', 'إجمالي الإيرادات']],
      body: (sortConfig.key?.includes('temporal')
        ? sortData(analytics.temporal_analysis || [], sortConfig.key.split('.')[1], sortConfig.direction)
        : analytics.temporal_analysis || []
      ).map((temp) => [
        temp?.month ?? 'غير معروف',
        temp?.total_subscriptions ?? 0,
        temp?.total_revenue ?? 0,
      ]),
      styles: { font: 'Amiri', halign: 'right' },
    });

    // Renewal Rate
    doc.text('معدل التجديد حسب نوع الاشتراك', 10, doc.lastAutoTable.finalY + 10, { align: 'right' });
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 15,
      head: [['النوع', 'الاشتراكات المنتهية', 'الاشتراكات المتجددة', 'معدل التجديد (%)']],
      body: (sortConfig.key?.includes('renewal')
        ? sortData(analytics.renewal_rate_by_type || [], sortConfig.key.split('.')[1], sortConfig.direction)
        : analytics.renewal_rate_by_type || []
      ).map((stat) => [
        stat?.name ?? 'غير معروف',
        stat?.expired_subscriptions ?? 0,
        stat?.renewed_subscriptions ?? 0,
        stat?.renewal_rate ?? 0,
      ]),
      styles: { font: 'Amiri', halign: 'right' },
    });

    // Nearing Expiry
    doc.text('الاشتراكات القريبة من الانتهاء', 10, doc.lastAutoTable.finalY + 10, { align: 'right' });
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 15,
      head: [['اسم العضو', 'تاريخ الانتهاء']],
      body: (analytics.nearing_expiry || []).map((sub) => [
        sub?.member_details?.name ?? 'غير معروف',
        sub?.end_date ?? 'غير معروف',
      ]),
      styles: { font: 'Amiri', halign: 'right' },
    });

    doc.save('subscription_analytics.pdf');
  };

  return (
    <div className="container" dir="rtl">
      <h1 className="title">تحليل الاشتراكات</h1>

      {/* Date Filters and Export Buttons */}
      <div className="filters">
        <div className="filter-group">
          <div className="filter-item">
            <label className="label">من تاريخ</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="input"
            />
          </div>
          <div className="filter-item">
            <label className="label">إلى تاريخ</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="input"
            />
          </div>
          <div className="filter-item">
            <label className="label">نوع الاشتراك</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="input"
            >
              <option value="">الكل</option>
              {subscriptionTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name ?? 'غير معروف'}
                </option>
              ))}
            </select>
          </div>
          <div className="filter-item">
            <label className="label">الكابتن</label>
            <select
              value={selectedCoach}
              onChange={(e) => setSelectedCoach(e.target.value)}
              className="input"
            >
              <option value="">الكل</option>
              {coaches.map((coach) => (
                <option key={coach.id} value={coach.id}>
                  {coach.username ?? 'غير معروف'}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="button-group">
          <CSVLink
            data={getCsvData()}
            filename="subscription_analytics.csv"
            className="button export-csv"
          >
            تصدير كـ Excel
          </CSVLink>
          <button onClick={exportToPDF} className="button export-pdf">
            تصدير كـ PDF
          </button>
        </div>
      </div>

      {loading && <p className="loading">جاري التحميل...</p>}
      {error && <p className="error">{error}</p>}
      {!loading && !error && analytics && (
        <Tab.Group>
          <Tab.List className="tab-list">
            {[
              'أنواع الاشتراكات',
              'الحضور',
              'التجميد',
              'الإيرادات',
              'سلوك الأعضاء',
              'الكباتن',
              'زمني',
              'التجديد',
              'الانتهاء قريبًا',
            ].map((tab) => (
              <Tab
                key={tab}
                className={({ selected }) => `tab ${selected ? 'tab-selected' : ''}`}
              >
                {tab}
              </Tab>
            ))}
          </Tab.List>
          <Tab.Panels className="tab-panels">
            {/* Popular Subscription Types */}
            <Tab.Panel>
              <h2 className="subtitle">أكثر أنواع الاشتراكات شعبية</h2>
              <table className="table">
                <thead>
                  <tr>
                    <th className="table-header" onClick={() => handleSort('popular.name')}>
                      النوع {sortConfig.key === 'popular.name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="table-header" onClick={() => handleSort('popular.total')}>
                      عدد الاشتراكات {sortConfig.key === 'popular.total' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="table-header" onClick={() => handleSort('popular.percentage')}>
                      النسبة (%) {sortConfig.key === 'popular.percentage' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(sortConfig.key?.includes('popular')
                    ? sortData(analytics.popular_subscription_types || [], sortConfig.key.split('.')[1], sortConfig.direction)
                    : analytics.popular_subscription_types || []
                  ).map((type, index) => (
                    <tr key={`popular-${index}`}>
                      <td className="table-cell">{type?.name ?? 'غير معروف'}</td>
                      <td className="table-cell">{type?.total ?? 0}</td>
                      <td className="table-cell">{type?.percentage ?? 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Tab.Panel>

            {/* Attendance Analysis */}
            <Tab.Panel>
              <h2 className="subtitle">أعلى أنواع الاشتراكات حضورًا</h2>
              <table className="table table-margin">
                <thead>
                  <tr>
                    <th className="table-header" onClick={() => handleSort('attendance.type__name')}>
                      النوع {sortConfig.key === 'attendance.type__name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="table-header" onClick={() => handleSort('attendance.avg_attendance')}>
                      متوسط الحضور {sortConfig.key === 'attendance.avg_attendance' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="table-header" onClick={() => handleSort('attendance.total_attendance')}>
                      إجمالي الحضور {sortConfig.key === 'attendance.total_attendance' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(sortConfig.key?.includes('attendance')
                    ? sortData(analytics.attendance_analysis?.highest_attendance_types || [], sortConfig.key.split('.')[1], sortConfig.direction)
                    : analytics.attendance_analysis?.highest_attendance_types || []
                  ).map((type, index) => (
                    <tr key={`attendance-${index}`}>
                      <td className="table-cell">{type?.type__name ?? 'غير معروف'}</td>
                      <td className="table-cell">{type?.avg_attendance ? Number(type.avg_attendance).toFixed(2) : '0.00'}</td>
                      <td className="table-cell">{type?.total_attendance ?? 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <h2 className="subtitle">الحضور حسب أيام الأسبوع</h2>
              <table className="table">
                <thead>
                  <tr>
                    <th className="table-header">اليوم</th>
                    <th className="table-header" onClick={() => handleSort('attendance.day.total_entries')}>
                      إجمالي الحضور {sortConfig.key === 'attendance.day.total_entries' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(sortConfig.key?.includes('attendance.day')
                    ? sortData(analytics.attendance_analysis?.by_day_of_week || [], 'total_entries', sortConfig.direction)
                    : analytics.attendance_analysis?.by_day_of_week || []
                  ).map((day, index) => (
                    <tr key={`day-${index}`}>
                      <td className="table-cell">{day?.day ?? 'غير معروف'}</td>
                      <td className="table-cell">{day?.total_entries ?? 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Tab.Panel>

            {/* Freeze Analysis */}
            <Tab.Panel>
              <h2 className="subtitle">تحليل التجميد</h2>
              <table className="table">
                <thead>
                  <tr>
                    <th className="table-header" onClick={() => handleSort('freeze.name')}>
                      النوع {sortConfig.key === 'freeze.name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="table-header" onClick={() => handleSort('freeze.total_freezes')}>
                      عدد طلبات التجميد {sortConfig.key === 'freeze.total_freezes' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="table-header" onClick={() => handleSort('freeze.frozen_subscriptions')}>
                      الاشتراكات المتجمدة {sortConfig.key === 'freeze.frozen_subscriptions' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="table-header" onClick={() => handleSort('freeze.freeze_percentage')}>
                      نسبة التجميد (%) {sortConfig.key === 'freeze.freeze_percentage' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(sortConfig.key?.includes('freeze')
                    ? sortData(analytics.freeze_analysis || [], sortConfig.key.split('.')[1], sortConfig.direction)
                    : analytics.freeze_analysis || []
                  ).map((freeze, index) => (
                    <tr key={`freeze-${index}`}>
                      <td className="table-cell">{freeze?.name ?? 'غير معروف'}</td>
                      <td className="table-cell">{freeze?.total_freezes ?? 0}</td>
                      <td className="table-cell">{freeze?.frozen_subscriptions ?? 0}</td>
                      <td className="table-cell">{freeze?.freeze_percentage ?? 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Tab.Panel>

            {/* Revenue Analysis */}
            <Tab.Panel>
              <h2 className="subtitle">الإيرادات حسب نوع الاشتراك</h2>
              <table className="table">
                <thead>
                  <tr>
                    <th className="table-header" onClick={() => handleSort('revenue.name')}>
                      النوع {sortConfig.key === 'revenue.name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="table-header" onClick={() => handleSort('revenue.total_revenue')}>
                      إجمالي الإيرادات {sortConfig.key === 'revenue.total_revenue' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="table-header" onClick={() => handleSort('revenue.coach_compensation_revenue')}>
                      إيرادات تعويض الكابتن {sortConfig.key === 'revenue.coach_compensation_revenue' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="table-header" onClick={() => handleSort('revenue.remaining_amount')}>
                      المبالغ المتبقية {sortConfig.key === 'revenue.remaining_amount' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(sortConfig.key?.includes('revenue')
                    ? sortData(analytics.revenue_analysis || [], sortConfig.key.split('.')[1], sortConfig.direction)
                    : analytics.revenue_analysis || []
                  ).map((type, index) => (
                    <tr key={`revenue-${index}`}>
                      <td className="table-cell">{type?.name ?? 'غير معروف'}</td>
                      <td className="table-cell">{type?.total_revenue ?? 0}</td>
                      <td className="table-cell">{type?.coach_compensation_revenue ?? 0}</td>
                      <td className="table-cell">{type?.remaining_amount ?? 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Tab.Panel>

            {/* Member Behavior */}
            <Tab.Panel>
              <h2 className="subtitle">الأعضاء الأكثر نشاطًا</h2>
              {analytics.member_behavior?.active_members?.length === 0 && (
                <p>لا توجد بيانات للأعضاء النشطين حاليًا.</p>
              )}
              <table className="table table-margin">
                <thead>
                  <tr>
                    <th className="table-header" onClick={() => handleSort('member_details.name')}>
                      اسم العضو {sortConfig.key === 'member_details.name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="table-header" onClick={() => handleSort('attendance_count')}>
                      عدد مرات الحضور {sortConfig.key === 'attendance_count' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="table-header" onClick={() => handleSort('subscription_count')}>
                      عدد الاشتراكات {sortConfig.key === 'subscription_count' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="table-header">منتظم</th>
                    <th className="table-header">متكرر</th>
                  </tr>
                </thead>
                <tbody>
                  {(sortConfig.key?.includes('member_details') || sortConfig.key?.includes('attendance_count') || sortConfig.key?.includes('subscription_count')
                    ? sortData(analytics.member_behavior?.active_members || [], sortConfig.key, sortConfig.direction)
                    : analytics.member_behavior?.active_members || []
                  ).map((member, index) => (
                    <tr key={member?.id ?? `member-${index}`}>
                      <td className="table-cell">{member?.member_details?.name ?? 'غير معروف'}</td>
                      <td className="table-cell">{member?.attendance_count ?? 0}</td>
                      <td className="table-cell">{member?.subscription_count ?? 0}</td>
                      <td className="table-cell">{member?.is_regular ? 'نعم' : 'لا'}</td>
                      <td className="table-cell">{member?.is_repeated ? 'نعم' : 'لا'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <h2 className="subtitle">الأعضاء غير النشطين</h2>
              {analytics.member_behavior?.inactive_members?.length === 0 && (
                <p>لا توجد بيانات للأعضاء غير النشطين حاليًا.</p>
              )}
              <table className="table">
                <thead>
                  <tr>
                    <th className="table-header" onClick={() => handleSort('member__name')}>
                      اسم العضو {sortConfig.key === 'member__name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="table-header" onClick={() => handleSort('subscription_count')}>
                      عدد الاشتراكات {sortConfig.key === 'subscription_count' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(sortConfig.key?.includes('member__name') || sortConfig.key?.includes('subscription_count')
                    ? sortData(analytics.member_behavior?.inactive_members || [], sortConfig.key, sortConfig.direction)
                    : analytics.member_behavior?.inactive_members || []
                  ).map((member, index) => (
                    <tr key={`inactive-${index}`}>
                      <td className="table-cell">{member?.member__name ?? 'غير معروف'}</td>
                      <td className="table-cell">{member?.subscription_count ?? 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Tab.Panel>

            {/* Coach Analysis */}
            <Tab.Panel>
              <h2 className="subtitle">تحليل الكباتن</h2>
              <table className="table">
                <thead>
                  <tr>
                    <th className="table-header" onClick={() => handleSort('username')}>
                      اسم الكابتن {sortConfig.key === 'username' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="table-header" onClick={() => handleSort('total_clients')}>
                      عدد العملاء {sortConfig.key === 'total_clients' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="table-header" onClick={() => handleSort('total_attendance')}>
                      إجمالي الحضور {sortConfig.key === 'total_attendance' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="table-header" onClick={() => handleSort('total_revenue')}>
                      إجمالي إيرادات التعويض {sortConfig.key === 'total_revenue' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(sortConfig.key?.includes('coach')
                    ? sortData(analytics.coach_analysis || [], sortConfig.key, sortConfig.direction)
                    : analytics.coach_analysis || []
                  ).map((coach, index) => (
                    <tr key={`coach-${index}`}>
                      <td className="table-cell">{coach?.username ?? 'غير معروف'}</td>
                      <td className="table-cell">{coach?.total_clients ?? 0}</td>
                      <td className="table-cell">{coach?.total_attendance ?? 0}</td>
                      <td className="table-cell">{coach?.total_revenue ?? 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Tab.Panel>

            {/* Temporal Analysis */}
            <Tab.Panel>
              <h2 className="subtitle">تحليل زمني</h2>
              <table className="table">
                <thead>
                  <tr>
                    <th className="table-header" onClick={() => handleSort('month')}>
                      الشهر {sortConfig.key === 'month' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="table-header" onClick={() => handleSort('total_subscriptions')}>
                      عدد الاشتراكات {sortConfig.key === 'total_subscriptions' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="table-header" onClick={() => handleSort('total_revenue')}>
                      إجمالي الإيرادات {sortConfig.key === 'total_revenue' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(sortConfig.key?.includes('temporal')
                    ? sortData(analytics.temporal_analysis || [], sortConfig.key, sortConfig.direction)
                    : analytics.temporal_analysis || []
                  ).map((temp, index) => (
                    <tr key={`temporal-${index}`}>
                      <td className="table-cell">{temp?.month ?? 'غير معروف'}</td>
                      <td className="table-cell">{temp?.total_subscriptions ?? 0}</td>
                      <td className="table-cell">{temp?.total_revenue ?? 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Tab.Panel>

            {/* Renewal Rate */}
            <Tab.Panel>
              <h2 className="subtitle">معدل التجديد حسب نوع الاشتراك</h2>
              <table className="table">
                <thead>
                  <tr>
                    <th className="table-header" onClick={() => handleSort('name')}>
                      النوع {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="table-header" onClick={() => handleSort('expired_subscriptions')}>
                      الاشتراكات المنتهية {sortConfig.key === 'expired_subscriptions' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="table-header" onClick={() => handleSort('renewed_subscriptions')}>
                      الاشتراكات المتجددة {sortConfig.key === 'renewed_subscriptions' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="table-header" onClick={() => handleSort('renewal_rate')}>
                      معدل التجديد (%) {sortConfig.key === 'renewal_rate' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(sortConfig.key?.includes('renewal')
                    ? sortData(analytics.renewal_rate_by_type || [], sortConfig.key, sortConfig.direction)
                    : analytics.renewal_rate_by_type || []
                  ).map((stat, index) => (
                    <tr key={`renewal-${index}`}>
                      <td className="table-cell">{stat?.name ?? 'غير معروف'}</td>
                      <td className="table-cell">{stat?.expired_subscriptions ?? 0}</td>
                      <td className="table-cell">{stat?.renewed_subscriptions ?? 0}</td>
                      <td className="table-cell">{stat?.renewal_rate ?? 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Tab.Panel>

            {/* Nearing Expiry */}
            <Tab.Panel>
              <h2 className="subtitle">الاشتراكات القريبة من الانتهاء</h2>
              <table className="table">
                <thead>
                  <tr>
                    <th className="table-header" onClick={() => handleSort('member_details.name')}>
                      اسم العضو {sortConfig.key === 'member_details.name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="table-header" onClick={() => handleSort('end_date')}>
                      تاريخ الانتهاء {sortConfig.key === 'end_date' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(sortConfig.key?.includes('nearing')
                    ? sortData(analytics.nearing_expiry || [], sortConfig.key, sortConfig.direction)
                    : analytics.nearing_expiry || []
                  ).map((sub, index) => (
                    <tr key={sub?.id ?? `nearing-${index}`}>
                      <td className="table-cell">{sub?.member_details?.name ?? 'غير معروف'}</td>
                      <td className="table-cell">{sub?.end_date ?? 'غير معروف'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      )}
    </div>
  );
};

export default SubscriptionAnalytics;
