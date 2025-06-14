import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Table, Select, DatePicker, Button, Collapse, Spin, Alert } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import * as XLSX from 'xlsx';
import moment from 'moment';
import 'moment/locale/ar';
import BASE_URL from '../../config/api';

moment.locale('ar');

const { Option } = Select;
const { Panel } = Collapse;

const StaffSalaryReport = () => {
  const [reportData, setReportData] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(moment().format('YYYY-MM'));
  const [selectedStaff, setSelectedStaff] = useState('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch staff list for dropdown
  useEffect(() => {
    const fetchStaffList = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('يرجى تسجيل الدخول لعرض البيانات.');
          return;
        }
        const response = await axios.get(`${BASE_URL}staff/api/staff-list/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStaffList(response.data);
      } catch (err) {
        setError(
          err.response?.status === 401
            ? 'غير مصرح لك. يرجى تسجيل الدخول مرة أخرى.'
            : 'حدث خطأ أثناء جلب قائمة الموظفين.'
        );
      }
    };
    fetchStaffList();
  }, []);

  // Fetch report data
  const fetchReport = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      if (!token) {
        setError('يرجى تسجيل الدخول لعرض البيانات.');
        setLoading(false);
        return;
      }
      const url =
        selectedStaff === 'all'
          ? `${BASE_URL}staff/api/attendance-report/?month=${selectedMonth}`
          : `${BASE_URL}staff/api/staff/${selectedStaff}/attendance/report/?month=${selectedMonth}`;
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setReportData(Array.isArray(response.data) ? response.data : [response.data]);
      setLoading(false);
    } catch (err) {
      setError(
        err.response?.status === 401
          ? 'غير مصرح لك. يرجى تسجيل الدخول مرة أخرى.'
          : err.response?.status === 404
          ? 'لم يتم العثور على بيانات الرواتب لهذا الشهر أو الموظف.'
          : 'حدث خطأ أثناء جلب تقرير الرواتب.'
      );
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [selectedMonth, selectedStaff]);

  // Export to Excel for selected staff or all staff
  const exportToExcel = (staffData, fileName) => {
    const data = [];
    staffData.forEach((staff) => {
      staff.monthly_data.forEach((entry) => {
        data.push({
          الشهر: moment(entry.month, 'YYYY-MM').format('MMMM YYYY'),
          اسم_الموظف: staff.staff_name,
          معدل_الأجر_بالساعة: `${staff.hourly_rate} جنيه`,
          الساعات_الفعلية: entry.total_hours,
          الساعات_المتوقعة: entry.expected_hours,
          حالة_الساعات: entry.hours_status,
          إجمالي_الراتب: `${entry.total_salary} جنيه`,
        });
      });
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'تقرير الرواتب');
    XLSX.writeFile(wb, `${fileName}.xlsx`);
  };

  // Handle export for all staff
  const handleExportAll = () => {
    exportToExcel(reportData, `تقرير_رواتب_جميع_الموظفين_${selectedMonth}`);
  };

  // Handle export for selected staff
  const handleExportSingle = () => {
    const staff = reportData[0];
    exportToExcel([staff], `تقرير_رواتب_${staff.staff_name}_${selectedMonth}`);
  };

  // Group data by month
  const groupedByMonth = reportData.reduce((acc, staff) => {
    staff.monthly_data.forEach((entry) => {
      const month = entry.month;
      if (!acc[month]) {
        acc[month] = [];
      }
      acc[month].push({ ...entry, staff_name: staff.staff_name, hourly_rate: staff.hourly_rate });
    });
    return acc;
  }, {});

  const columns = [
    {
      title: 'اسم الموظف',
      dataIndex: 'staff_name',
      key: 'staff_name',
    },
    {
      title: 'معدل الأجر/ساعة',
      dataIndex: 'hourly_rate',
      key: 'hourly_rate',
      render: (value) => `${value} جنيه`,
    },
    {
      title: 'الساعات الفعلية',
      dataIndex: 'total_hours',
      key: 'total_hours',
    },
    {
      title: 'الساعات المتوقعة',
      dataIndex: 'expected_hours',
      key: 'expected_hours',
    },
    {
      title: 'حالة الساعات',
      dataIndex: 'hours_status',
      key: 'hours_status',
      render: (status) => (
        <span
          style={{
            color:
              status === 'مضبوط' ? '#52c41a' : status === 'زيادة' ? '#1890ff' : '#ff4d4f',
          }}
        >
          {status}
        </span>
      ),
    },
    {
      title: 'إجمالي الراتب',
      dataIndex: 'total_salary',
      key: 'total_salary',
      render: (value) => `${value} جنيه`,
    },
  ];

  return (
    <div style={{ padding: '24px', direction: 'rtl', background: '#f5f5f5', minHeight: '100vh' }}>
      <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '24px', textAlign: 'center', color: '#1a3c34' }}>
        تقرير رواتب الموظفين
      </h1>

      {/* Filters */}
      <div
        style={{
          display: 'flex',
          gap: '16px',
          marginBottom: '24px',
          flexWrap: 'wrap',
          background: '#fff',
          padding: '16px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontWeight: '500', color: '#595959' }}>الشهر:</label>
          <DatePicker
            picker="month"
            value={moment(selectedMonth, 'YYYY-MM')}
            onChange={(date) => setSelectedMonth(date ? date.format('YYYY-MM') : moment().format('YYYY-MM'))}
            format="YYYY-MM"
            style={{ width: '200px' }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontWeight: '500', color: '#595959' }}>الموظف:</label>
          <Select
            value={selectedStaff}
            onChange={setSelectedStaff}
            style={{ width: '200px' }}
            showSearch
            optionFilterProp="children"
          >
            <Option value="all">الكل</Option>
            {staffList.map((staff) => (
              <Option key={staff.id} value={staff.id}>
                {staff.username}
              </Option>
            ))}
          </Select>
        </div>
        <Button
          type="primary"
          onClick={fetchReport}
          style={{ background: '#1a3c34', borderColor: '#1a3c34' }}
        >
          تحديث البيانات
        </Button>
      </div>

      {/* Loading and Error States */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '48px', background: '#fff', borderRadius: '8px' }}>
          <Spin size="large" />
          <p style={{ marginTop: '16px', color: '#595959' }}>جاري تحميل البيانات...</p>
        </div>
      )}
      {error && (
        <Alert
          message="خطأ"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: '24px', borderRadius: '8px' }}
          action={
            <Button size="small" danger onClick={fetchReport}>
              إعادة المحاولة
            </Button>
          }
        />
      )}

      {/* Export Buttons */}
      {!loading && !error && (
        <div style={{ marginBottom: '24px', display: 'flex', gap: '16px', justifyContent: 'flex-end' }}>
          {selectedStaff !== 'all' && reportData.length > 0 && (
            <Button
              type="default"
              icon={<DownloadOutlined />}
              onClick={handleExportSingle}
              style={{ background: '#fff', borderColor: '#1a3c34', color: '#1a3c34' }}
            >
              تصدير تقرير {reportData[0]?.staff_name} (Excel)
            </Button>
          )}
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={handleExportAll}
            style={{ background: '#1a3c34', borderColor: '#1a3c34' }}
            disabled={reportData.length === 0}
          >
            تصدير تقرير جميع الموظفين (Excel)
          </Button>
        </div>
      )}

      {/* Monthly Data */}
      {!loading && !error && (
        <Collapse
          defaultActiveKey={Object.keys(groupedByMonth)}
          style={{ background: '#fff', borderRadius: '8px', border: 'none' }}
        >
          {Object.keys(groupedByMonth)
            .sort((a, b) => moment(b, 'YYYY-MM').unix() - moment(a, 'YYYY-MM').unix())
            .map((month) => (
              <Panel
                key={month}
                header={moment(month, 'YYYY-MM').format('MMMM YYYY')}
                style={{ background: '#fafafa', borderRadius: '8px', marginBottom: '8px' }}
              >
                <Table
                  columns={columns}
                  dataSource={groupedByMonth[month]}
                  rowKey={(record) => `${record.staff_name}-${month}`}
                  pagination={false}
                  locale={{ emptyText: 'لا توجد بيانات رواتب لهذا الشهر' }}
                  style={{ background: '#fff', borderRadius: '8px' }}
                />
              </Panel>
            ))}
        </Collapse>
      )}
      {!loading && !error && Object.keys(groupedByMonth).length === 0 && (
        <div
          style={{
            textAlign: 'center',
            padding: '48px',
            background: '#fff',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          }}
        >
          <p style={{ color: '#595959', fontSize: '16px' }}>
            لا توجد بيانات رواتب متاحة للشهر المحدد.
          </p>
        </div>
      )}
    </div>
  );
};

export default StaffSalaryReport;