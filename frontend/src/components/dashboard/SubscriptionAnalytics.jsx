import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { CSVLink } from 'react-csv';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Tab } from '@headlessui/react';
import BASE_URL from '../../config/api';
import "./analytics.css";

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

  // Fetch subscription types and coaches
  const fetchFilters = async () => {
    try {
      const [typesResponse, coachesResponse] = await Promise.all([
        axios.get(`${BASE_URL}subscriptions/api/subscriptions/active-subscription-types/`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }),
        axios.get(`${BASE_URL}accounts/api/accounts/coaches/`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }),
      ]);
      setSubscriptionTypes(typesResponse.data.results || typesResponse.data);
      setCoaches(coachesResponse.data.results || coachesResponse.data);
    } catch (error) {
      console.error('Error fetching filters:', error);
    }
  };

  // Fetch analytics data
  const fetchAnalytics = async () => {
    setLoading(true);
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
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFilters();
    fetchAnalytics();
  }, [startDate, endDate, selectedType, selectedCoach]);

  // Sorting function
  const sortData = (data, key, direction) => {
    return [...data].sort((a, b) => {
      if (a[key] < b[key]) return direction === 'asc' ? -1 : 1;
      if (a[key] > b[key]) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  // Prepare CSV data
  const getCsvData = () => {
    if (!analytics) return [];
    const data = [];

    // Popular Types
    data.push(['أكثر أنواع الاشتراكات شعبية']);
    data.push(['النوع', 'عدد الاشتراكات', 'النسبة (%)']);
    const sortedPopularTypes = sortConfig.key && sortConfig.key.includes('popular')
      ? sortData(analytics.popular_subscription_types, sortConfig.key.split('.')[1], sortConfig.direction)
      : analytics.popular_subscription_types;
    sortedPopularTypes.forEach((type) => {
      data.push([type.name, type.total_subscriptions, type.percentage]);
    });

    // Attendance Analysis
    data.push([], ['أعلى أنواع الاشتراكات حضورًا']);
    data.push(['النوع', 'متوسط الحضور', 'إجمالي الحضور']);
    const sortedAttendanceTypes = sortConfig.key && sortConfig.key.includes('attendance')
      ? sortData(analytics.attendance_analysis.highest_attendance_types, sortConfig.key.split('.')[1], sortConfig.direction)
      : analytics.attendance_analysis.highest_attendance_types;
    sortedAttendanceTypes.forEach((type) => {
      data.push([type.type__name, type.avg_attendance.toFixed(2), type.total_attendance]);
    });
    data.push([], ['الحضور حسب أيام الأسبوع']);
    data.push(['اليوم', 'إجمالي الحضور']);
    analytics.attendance_analysis.by_day_of_week.forEach((day) => {
      data.push([day.day, day.total_entries]);
    });

    // Freeze Analysis
    data.push([], ['تحليل التجميد']);
    data.push(['النوع', 'عدد طلبات التجميد', 'الاشتراكات المتجمدة', 'نسبة التجميد (%)']);
    const sortedFreeze = sortConfig.key && sortConfig.key.includes('freeze')
      ? sortData(analytics.freeze_analysis, sortConfig.key.split('.')[1], sortConfig.direction)
      : analytics.freeze_analysis;
    sortedFreeze.forEach((freeze) => {
      data.push([freeze.name, freeze.total_freezes, freeze.frozen_subscriptions, freeze.freeze_percentage]);
    });

    // Revenue Analysis
    data.push([], ['الإيرادات حسب نوع الاشتراك']);
    data.push(['النوع', 'إجمالي الإيرادات', 'إيرادات التدريب الخاص', 'المبالغ المتبقية']);
    const sortedRevenue = sortConfig.key && sortConfig.key.includes('revenue')
      ? sortData(analytics.revenue_analysis, sortConfig.key.split('.')[1], sortConfig.direction)
      : analytics.revenue_analysis;
    sortedRevenue.forEach((type) => {
      data.push([type.name, type.total_revenue, type.private_revenue, type.remaining_amount]);
    });

    // Member Behavior
    data.push([], ['الأعضاء الأكثر نشاطًا']);
    data.push(['اسم العضو', 'عدد مرات الحضور', 'عدد الاشتراكات', 'منتظم', 'متكرر']);
    const sortedMembers = sortConfig.key && sortConfig.key.includes('member')
      ? sortData(analytics.member_behavior.active_members, sortConfig.key.split('.')[1], sortConfig.direction)
      : analytics.member_behavior.active_members;
    sortedMembers.forEach((member) => {
      data.push([
        member.member.name,
        member.attendance_count,
        member.subscription_count,
        member.is_regular ? 'نعم' : 'لا',
        member.is_repeated ? 'نعم' : 'لا'
      ]);
    });
    data.push([], ['الأعضاء غير النشطين']);
    data.push(['اسم العضو', 'عدد الاشتراكات']);
    analytics.member_behavior.inactive_members.forEach((member) => {
      data.push([member.member__name, member.subscription_count]);
    });

    // Coach Analysis
    data.push([], ['تحليل الكباتن']);
    data.push(['اسم الكابتن', 'عدد العملاء', 'إجمالي الحضور', 'إجمالي الإيرادات']);
    const sortedCoaches = sortConfig.key && sortConfig.key.includes('coach')
      ? sortData(analytics.coach_analysis, sortConfig.key.split('.')[1], sortConfig.direction)
      : analytics.coach_analysis;
    sortedCoaches.forEach((coach) => {
      data.push([coach.username, coach.total_clients, coach.total_attendance, coach.total_revenue || 0]);
    });

    // Temporal Analysis
    data.push([], ['تحليل زمني']);
    data.push(['الشهر', 'عدد الاشتراكات', 'إجمالي الإيرادات']);
    const sortedTemporal = sortConfig.key && sortConfig.key.includes('temporal')
      ? sortData(analytics.temporal_analysis, sortConfig.key.split('.')[1], sortConfig.direction)
      : analytics.temporal_analysis;
    sortedTemporal.forEach((temp) => {
      data.push([temp.month, temp.total_subscriptions, temp.total_revenue]);
    });

    // Renewal Rate
    data.push([], ['معدل التجديد حسب نوع الاشتراك']);
    data.push(['النوع', 'الاشتراكات المنتهية', 'الاشتراكات المتجددة', 'معدل التجديد (%)']);
    const sortedRenewal = sortConfig.key && sortConfig.key.includes('renewal')
      ? sortData(analytics.renewal_rate_by_type, sortConfig.key.split('.')[1], sortConfig.direction)
      : analytics.renewal_rate_by_type;
    sortedRenewal.forEach((stat) => {
      data.push([stat.name, stat.expired_subscriptions, stat.renewed_subscriptions, stat.renewal_rate]);
    });

    // Nearing Expiry
    data.push([], ['الاشتراكات القريبة من الانتهاء']);
    data.push(['اسم العضو', 'تاريخ الانتهاء']);
    analytics.nearing_expiry.forEach((sub) => {
      data.push([sub.member.name, sub.end_date]);
    });

    return data;
  };

  // Export to PDF
  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFont('Amiri');
    doc.setFontSize(16);
    doc.text('تحليل الاشتراكات', 10, 10, { align: 'right' });

    // Popular Types
    doc.text('أكثر أنواع الاشتراكات شعبية', 10, 20, { align: 'right' });
    autoTable(doc, {
      startY: 25,
      head: [['النوع', 'عدد الاشتراكات', 'النسبة (%)']],
      body: sortConfig.key && sortConfig.key.includes('popular')
        ? sortData(analytics.popular_subscription_types, sortConfig.key.split('.')[1], sortConfig.direction)
        : analytics.popular_subscription_types.map((type) => [type.name, type.total_subscriptions, type.percentage]),
      styles: { font: 'Amiri', halign: 'right' },
    });

    // Attendance Analysis
    doc.text('أعلى أنواع الاشتراكات حضورًا', 10, doc.lastAutoTable.finalY + 10, { align: 'right' });
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 15,
      head: [['النوع', 'متوسط الحضور', 'إجمالي الحضور']],
      body: sortConfig.key && sortConfig.key.includes('attendance')
        ? sortData(analytics.attendance_analysis.highest_attendance_types, sortConfig.key.split('.')[1], sortConfig.direction)
        : analytics.attendance_analysis.highest_attendance_types.map((type) => [
            type.type__name,
            type.avg_attendance.toFixed(2),
            type.total_attendance
          ]),
      styles: { font: 'Amiri', halign: 'right' },
    });
    doc.text('الحضور حسب أيام الأسبوع', 10, doc.lastAutoTable.finalY + 10, { align: 'right' });
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 15,
      head: [['اليوم', 'إجمالي الحضور']],
      body: analytics.attendance_analysis.by_day_of_week.map((day) => [day.day, day.total_entries]),
      styles: { font: 'Amiri', halign: 'right' },
    });

    // Freeze Analysis
    doc.text('تحليل التجميد', 10, doc.lastAutoTable.finalY + 10, { align: 'right' });
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 15,
      head: [['النوع', 'عدد طلبات التجميد', 'الاشتراكات المتجمدة', 'نسبة التجميد (%)']],
      body: sortConfig.key && sortConfig.key.includes('freeze')
        ? sortData(analytics.freeze_analysis, sortConfig.key.split('.')[1], sortConfig.direction)
        : analytics.freeze_analysis.map((freeze) => [
            freeze.name,
            freeze.total_freezes,
            freeze.frozen_subscriptions,
            freeze.freeze_percentage
          ]),
      styles: { font: 'Amiri', halign: 'right' },
    });

    // Revenue Analysis
    doc.text('الإيرادات حسب نوع الاشتراك', 10, doc.lastAutoTable.finalY + 10, { align: 'right' });
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 15,
      head: [['النوع', 'إجمالي الإيرادات', 'إيرادات التدريب الخاص', 'المبالغ المتبقية']],
      body: sortConfig.key && sortConfig.key.includes('revenue')
        ? sortData(analytics.revenue_analysis, sortConfig.key.split('.')[1], sortConfig.direction)
        : analytics.revenue_analysis.map((type) => [
            type.name,
            type.total_revenue,
            type.private_revenue,
            type.remaining_amount
          ]),
      styles: { font: 'Amiri', halign: 'right' },
    });

    // Member Behavior
    doc.text('الأعضاء الأكثر نشاطًا', 10, doc.lastAutoTable.finalY + 10, { align: 'right' });
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 15,
      head: [['اسم العضو', 'عدد مرات الحضور', 'عدد الاشتراكات', 'منتظم', 'متكرر']],
      body: sortConfig.key && sortConfig.key.includes('member')
        ? sortData(analytics.member_behavior.active_members, sortConfig.key.split('.')[1], sortConfig.direction)
        : analytics.member_behavior.active_members.map((member) => [
            member.member.name,
            member.attendance_count,
            member.subscription_count,
            member.is_regular ? 'نعم' : 'لا',
            member.is_repeated ? 'نعم' : 'لا'
          ]),
      styles: { font: 'Amiri', halign: 'right' },
    });
    doc.text('الأعضاء غير النشطين', 10, doc.lastAutoTable.finalY + 10, { align: 'right' });
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 15,
      head: [['اسم العضو', 'عدد الاشتراكات']],
      body: analytics.member_behavior.inactive_members.map((member) => [
        member.member__name,
        member.subscription_count
      ]),
      styles: { font: 'Amiri', halign: 'right' },
    });

    // Coach Analysis
    doc.text('تحليل الكباتن', 10, doc.lastAutoTable.finalY + 10, { align: 'right' });
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 15,
      head: [['اسم الكابتن', 'عدد العملاء', 'إجمالي الحضور', 'إجمالي الإيرادات']],
      body: sortConfig.key && sortConfig.key.includes('coach')
        ? sortData(analytics.coach_analysis, sortConfig.key.split('.')[1], sortConfig.direction)
        : analytics.coach_analysis.map((coach) => [
            coach.username,
            coach.total_clients,
            coach.total_attendance,
            coach.total_revenue || 0
          ]),
      styles: { font: 'Amiri', halign: 'right' },
    });

    // Temporal Analysis
    doc.text('تحليل زمني', 10, doc.lastAutoTable.finalY + 10, { align: 'right' });
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 15,
      head: [['الشهر', 'عدد الاشتراكات', 'إجمالي الإيرادات']],
      body: sortConfig.key && sortConfig.key.includes('temporal')
        ? sortData(analytics.temporal_analysis, sortConfig.key.split('.')[1], sortConfig.direction)
        : analytics.temporal_analysis.map((temp) => [
            temp.month,
            temp.total_subscriptions,
            temp.total_revenue
          ]),
      styles: { font: 'Amiri', halign: 'right' },
    });

    // Renewal Rate
    doc.text('معدل التجديد حسب نوع الاشتراك', 10, doc.lastAutoTable.finalY + 10, { align: 'right' });
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 15,
      head: [['النوع', 'الاشتراكات المنتهية', 'الاشتراكات المتجددة', 'معدل التجديد (%)']],
      body: sortConfig.key && sortConfig.key.includes('renewal')
        ? sortData(analytics.renewal_rate_by_type, sortConfig.key.split('.')[1], sortConfig.direction)
        : analytics.renewal_rate_by_type.map((stat) => [
            stat.name,
            stat.expired_subscriptions,
            stat.renewed_subscriptions,
            stat.renewal_rate
          ]),
      styles: { font: 'Amiri', halign: 'right' },
    });

    // Nearing Expiry
    doc.text('الاشتراكات القريبة من الانتهاء', 10, doc.lastAutoTable.finalY + 10, { align: 'right' });
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 15,
      head: [['اسم العضو', 'تاريخ الانتهاء']],
      body: analytics.nearing_expiry.map((sub) => [sub.member.name, sub.end_date]),
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
                <option key={type.id} value={type.id}>{type.name}</option>
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
                <option key={coach.id} value={coach.id}>{coach.username}</option>
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
          <button
            onClick={exportToPDF}
            className="button export-pdf"
          >
            تصدير كـ PDF
          </button>
        </div>
      </div>

      {loading && <p className="loading">جاري التحميل...</p>}
      {!loading && analytics && (
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
              'الانتهاء قريبًا'
            ].map((tab) => (
              <Tab
                key={tab}
                className={({ selected }) =>
                  `tab ${selected ? 'tab-selected' : ''}`
                }
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
                    <th className="table-header" onClick={() => handleSort('popular.total_subscriptions')}>
                      عدد الاشتراكات {sortConfig.key === 'popular.total_subscriptions' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="table-header" onClick={() => handleSort('popular.percentage')}>
                      النسبة (%) {sortConfig.key === 'popular.percentage' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(sortConfig.key && sortConfig.key.includes('popular')
                    ? sortData(analytics.popular_subscription_types, sortConfig.key.split('.')[1], sortConfig.direction)
                    : analytics.popular_subscription_types
                  ).map((type, index) => (
                    <tr key={index}>
                      <td className="table-cell">{type.name}</td>
                      <td className="table-cell">{type.total_subscriptions}</td>
                      <td className="table-cell">{type.percentage}</td>
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
                  {(sortConfig.key && sortConfig.key.includes('attendance')
                    ? sortData(analytics.attendance_analysis.highest_attendance_types, sortConfig.key.split('.')[1], sortConfig.direction)
                    : analytics.attendance_analysis.highest_attendance_types
                  ).map((type, index) => (
                    <tr key={index}>
                      <td className="table-cell">{type.type__name}</td>
                      <td className="table-cell">{type.avg_attendance.toFixed(2)}</td>
                      <td className="table-cell">{type.total_attendance}</td>
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
                  {(sortConfig.key && sortConfig.key.includes('attendance.day')
                    ? sortData(analytics.attendance_analysis.by_day_of_week, 'total_entries', sortConfig.direction)
                    : analytics.attendance_analysis.by_day_of_week
                  ).map((day, index) => (
                    <tr key={index}>
                      <td className="table-cell">{day.day}</td>
                      <td className="table-cell">{day.total_entries}</td>
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
                  {(sortConfig.key && sortConfig.key.includes('freeze')
                    ? sortData(analytics.freeze_analysis, sortConfig.key.split('.')[1], sortConfig.direction)
                    : analytics.freeze_analysis
                  ).map((freeze, index) => (
                    <tr key={index}>
                      <td className="table-cell">{freeze.name}</td>
                      <td className="table-cell">{freeze.total_freezes}</td>
                      <td className="table-cell">{freeze.frozen_subscriptions}</td>
                      <td className="table-cell">{freeze.freeze_percentage}</td>
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
                    <th className="table-header" onClick={() => handleSort('revenue.private_revenue')}>
                      إيرادات التدريب الخاص {sortConfig.key === 'revenue.private_revenue' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="table-header" onClick={() => handleSort('revenue.remaining_amount')}>
                      المبالغ المتبقية {sortConfig.key === 'revenue.remaining_amount' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(sortConfig.key && sortConfig.key.includes('revenue')
                    ? sortData(analytics.revenue_analysis, sortConfig.key.split('.')[1], sortConfig.direction)
                    : analytics.revenue_analysis
                  ).map((type, index) => (
                    <tr key={index}>
                      <td className="table-cell">{type.name}</td>
                      <td className="table-cell">{type.total_revenue}</td>
                      <td className="table-cell">{type.private_revenue}</td>
                      <td className="table-cell">{type.remaining_amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Tab.Panel>

            {/* Member Behavior */}
            <Tab.Panel>
              <h2 className="subtitle">الأعضاء الأكثر نشاطًا</h2>
              <table className="table table-margin">
                <thead>
                  <tr>
                    <th className="table-header" onClick={() => handleSort('member.member.name')}>
                      اسم العضو {sortConfig.key === 'member.member.name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="table-header" onClick={() => handleSort('member.attendance_count')}>
                      عدد مرات الحضور {sortConfig.key === 'member.attendance_count' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="table-header" onClick={() => handleSort('member.subscription_count')}>
                      عدد الاشتراكات {sortConfig.key === 'member.subscription_count' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="table-header">منتظم</th>
                    <th className="table-header">متكرر</th>
                  </tr>
                </thead>
                <tbody>
                  {(sortConfig.key && sortConfig.key.includes('member')
                    ? sortData(analytics.member_behavior.active_members, sortConfig.key.split('.')[1], sortConfig.direction)
                    : analytics.member_behavior.active_members
                  ).map((member) => (
                    <tr key={member.id}>
                      <td className="table-cell">{member.member.name}</td>
                      <td className="table-cell">{member.attendance_count}</td>
                      <td className="table-cell">{member.subscription_count}</td>
                      <td className="table-cell">{member.is_regular ? 'نعم' : 'لا'}</td>
                      <td className="table-cell">{member.is_repeated ? 'نعم' : 'لا'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <h2 className="subtitle">الأعضاء غير النشطين</h2>
              <table className="table">
                <thead>
                  <tr>
                    <th className="table-header" onClick={() => handleSort('member.inactive.member__name')}>
                      اسم العضو {sortConfig.key === 'member.inactive.member__name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="table-header" onClick={() => handleSort('member.inactive.subscription_count')}>
                      عدد الاشتراكات {sortConfig.key === 'member.inactive.subscription_count' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(sortConfig.key && sortConfig.key.includes('member.inactive')
                    ? sortData(analytics.member_behavior.inactive_members, sortConfig.key.split('.')[2], sortConfig.direction)
                    : analytics.member_behavior.inactive_members
                  ).map((member, index) => (
                    <tr key={index}>
                      <td className="table-cell">{member.member__name}</td>
                      <td className="table-cell">{member.subscription_count}</td>
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
                    <th className="table-header" onClick={() => handleSort('coach.username')}>
                      اسم الكابتن {sortConfig.key === 'coach.username' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="table-header" onClick={() => handleSort('coach.total_clients')}>
                      عدد العملاء {sortConfig.key === 'coach.total_clients' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="table-header" onClick={() => handleSort('coach.total_attendance')}>
                      إجمالي الحضور {sortConfig.key === 'coach.total_attendance' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="table-header" onClick={() => handleSort('coach.total_revenue')}>
                      إجمالي الإيرادات {sortConfig.key === 'coach.total_revenue' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(sortConfig.key && sortConfig.key.includes('coach')
                    ? sortData(analytics.coach_analysis, sortConfig.key.split('.')[1], sortConfig.direction)
                    : analytics.coach_analysis
                  ).map((coach, index) => (
                    <tr key={index}>
                      <td className="table-cell">{coach.username}</td>
                      <td className="table-cell">{coach.total_clients}</td>
                      <td className="table-cell">{coach.total_attendance}</td>
                      <td className="table-cell">{coach.total_revenue || 0}</td>
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
                    <th className="table-header" onClick={() => handleSort('temporal.month')}>
                      الشهر {sortConfig.key === 'temporal.month' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="table-header" onClick={() => handleSort('temporal.total_subscriptions')}>
                      عدد الاشتراكات {sortConfig.key === 'temporal.total_subscriptions' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="table-header" onClick={() => handleSort('temporal.total_revenue')}>
                      إجمالي الإيرادات {sortConfig.key === 'temporal.total_revenue' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(sortConfig.key && sortConfig.key.includes('temporal')
                    ? sortData(analytics.temporal_analysis, sortConfig.key.split('.')[1], sortConfig.direction)
                    : analytics.temporal_analysis
                  ).map((temp, index) => (
                    <tr key={index}>
                      <td className="table-cell">{temp.month}</td>
                      <td className="table-cell">{temp.total_subscriptions}</td>
                      <td className="table-cell">{temp.total_revenue}</td>
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
                    <th className="table-header" onClick={() => handleSort('renewal.name')}>
                      النوع {sortConfig.key === 'renewal.name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="table-header" onClick={() => handleSort('renewal.expired_subscriptions')}>
                      الاشتراكات المنتهية {sortConfig.key === 'renewal.expired_subscriptions' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="table-header" onClick={() => handleSort('renewal.renewed_subscriptions')}>
                      الاشتراكات المتجددة {sortConfig.key === 'renewal.renewed_subscriptions' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="table-header" onClick={() => handleSort('renewal.renewal_rate')}>
                      معدل التجديد (%) {sortConfig.key === 'renewal.renewal_rate' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(sortConfig.key && sortConfig.key.includes('renewal')
                    ? sortData(analytics.renewal_rate_by_type, sortConfig.key.split('.')[1], sortConfig.direction)
                    : analytics.renewal_rate_by_type
                  ).map((stat, index) => (
                    <tr key={index}>
                      <td className="table-cell">{stat.name}</td>
                      <td className="table-cell">{stat.expired_subscriptions}</td>
                      <td className="table-cell">{stat.renewed_subscriptions}</td>
                      <td className="table-cell">{stat.renewal_rate}</td>
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
                    <th className="table-header" onClick={() => handleSort('nearing.member.name')}>
                      اسم العضو {sortConfig.key === 'nearing.member.name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="table-header" onClick={() => handleSort('nearing.end_date')}>
                      تاريخ الانتهاء {sortConfig.key === 'nearing.end_date' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(sortConfig.key && sortConfig.key.includes('nearing')
                    ? sortData(analytics.nearing_expiry, sortConfig.key.split('.')[1], sortConfig.direction)
                    : analytics.nearing_expiry
                  ).map((sub) => (
                    <tr key={sub.id}>
                      <td className="table-cell">{sub.member.name}</td>
                      <td className="table-cell">{sub.end_date}</td>
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