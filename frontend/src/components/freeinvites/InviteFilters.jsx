
import React from 'react';
import PropTypes from 'prop-types';
import { Input, Select, DatePicker, Button } from 'antd';
import { useDebounce } from 'use-debounce';
import moment from 'moment';

/**
 * مكون لتصفية الدعوات بناءً على اسم الضيف، الحالة، والتاريخ.
 * يستخدم useDebounce لتقليل عدد طلبات البحث أثناء الكتابة.
 * @param {Object} props
 * @param {string} props.guestName - اسم الضيف للبحث
 * @param {string} props.status - حالة الدعوة (pending, used, cancelled)
 * @param {string} props.date - تاريخ الدعوة
 * @param {Function} props.onGuestNameChange - دالة لتحديث اسم الضيف
 * @param {Function} props.onStatusChange - دالة لتحديث الحالة
 * @param {Function} props.onDateChange - دالة لتحديث التاريخ
 * @param {Function} props.onReset - دالة لإعادة تصفية الفلاتر
 */
const InviteFilters = ({
  guestName,
  status,
  date,
  onGuestNameChange,
  onStatusChange,
  onDateChange,
  onReset,
}) => {
  const [debouncedGuestName] = useDebounce(guestName, 500);
  const [debouncedDate] = useDebounce(date, 500);

  return (
    <div className="mb-6" dir="rtl">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-medium">تصفية الدعوات</h3>
        <Button type="link" onClick={onReset}>
          إعادة التصفية
        </Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">اسم الضيف</label>
          <Input
            placeholder="ابحث باسم الضيف"
            value={guestName}
            onChange={(e) => onGuestNameChange(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">الحالة</label>
          <Select
            value={status}
            onChange={onStatusChange}
            className="w-full"
            options={[
              { value: '', label: 'كل الحالات' },
              { value: 'pending', label: 'متاحة' },
              { value: 'used', label: 'مستخدمة' },
              { value: 'cancelled', label: 'ملغاة' },
            ]}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">التاريخ</label>
          <DatePicker
            value={date ? moment(date) : null}
            onChange={(_, dateString) => onDateChange(dateString)}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
};

InviteFilters.propTypes = {
  guestName: PropTypes.string.isRequired,
  status: PropTypes.string.isRequired,
  date: PropTypes.string,
  onGuestNameChange: PropTypes.func.isRequired,
  onStatusChange: PropTypes.func.isRequired,
  onDateChange: PropTypes.func.isRequired,
  onReset: PropTypes.func.isRequired,
};

export default InviteFilters;
