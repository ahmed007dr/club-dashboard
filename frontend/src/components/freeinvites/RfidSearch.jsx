import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Input, Button, Form, Card, Select, DatePicker, Space } from 'antd';
import { toast } from 'react-hot-toast';
import moment from 'moment';
import { addInvite, searchMemberByRfid, clearMemberData } from '../redux/slices/invitesSlice';
import usePermission from '../hooks/usePermission';

const RfidSearch = () => {
  const dispatch = useDispatch();
  const [form] = Form.useForm();
  const [rfidCode, setRfidCode] = useState('');
  const { memberData, loading, error } = useSelector((state) => state.invites);
  const canAddInvites = usePermission('add_freeinvite');

  useEffect(() => {
    if (error) {
      toast.error(typeof error === 'string' ? error : error.error || 'حدث خطأ');
      dispatch(clearMemberData());
    }
  }, [error, dispatch]);

  const handleSearch = () => {
    if (!rfidCode) {
      toast.error('يرجى إدخال رمز RFID');
      return;
    }
    dispatch(searchMemberByRfid(rfidCode));
  };

  const handleAddInvite = async (values) => {
    try {
      await dispatch(
        addInvite({
          ...values,
          club: memberData.member.club,
          date: values.date.format('YYYY-MM-DD'),
          invited_by: memberData.membership_number,
          status: 'pending',
        })
      ).unwrap();
      toast.success('تمت إضافة الدعوة بنجاح');
      form.resetFields();
      setRfidCode('');
      dispatch(clearMemberData());
    } catch (err) {
      toast.error('فشل في إضافة الدعوة: ' + (err.error || 'خطأ غير معروف'));
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setRfidCode('');
    dispatch(clearMemberData());
  };

  if (!canAddInvites) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center p-4" dir="rtl">
        <h2 className="text-xl font-bold text-gray-700 mb-2">لا يوجد صلاحية</h2>
        <p className="text-gray-500">ليس لديك الصلاحيات اللازمة لإضافة دعوات مجانية.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6" dir="rtl">
      <h2 className="text-2xl font-bold mb-6">إضافة دعوة باستخدام RFID</h2>
      <div className="mb-6">
        <Input
          placeholder="أدخل رمز RFID"
          value={rfidCode}
          onChange={(e) => setRfidCode(e.target.value)}
          className="w-full max-w-xs mb-2"
        />
        <Button type="primary" onClick={handleSearch} loading={loading}>
          بحث
        </Button>
      </div>

      {memberData && (
        <Card title={`بيانات العضو: ${memberData.member_name}`} className="mb-6">
          <p><strong>رقم العضوية:</strong> {memberData.membership_number}</p>
          <p><strong>الاشتراكات النشطة:</strong></p>
          {memberData.subscriptions.length > 0 ? (
            <ul>
              {memberData.subscriptions.map((sub) => (
                <li key={sub.subscription_id}>
                  <strong>نوع الاشتراك:</strong> {sub.subscription_type} <br />
                  <strong>الدعوات المسموح بها:</strong> {sub.total_allowed} <br />
                  <strong>الدعوات المستخدمة:</strong> {sub.used} <br />
                  <strong>الدعوات المتبقية:</strong> {sub.remaining}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-red-500">لا توجد اشتراكات نشطة</p>
          )}
        </Card>
      )}

        {memberData && memberData.subscriptions.length > 0 ? (
          <Card title="إضافة دعوة جديدة">
            <Form form={form} onFinish={handleAddInvite} layout="vertical">
              <Form.Item
                name="subscription"
                label="الاشتراك"
                rules={[{ required: true, message: 'اختيار الاشتراك مطلوب' }]}
              >
                <Select>
                  {memberData.subscriptions
                    .filter((sub) => sub.remaining > 0)
                    .map((sub) => (
                      <Select.Option key={sub.subscription_id} value={sub.subscription_id}>
                        {sub.subscription_type} (متبقي: {sub.remaining})
                      </Select.Option>
                    ))}
                </Select>
              </Form.Item>
              {/* باقي الحقول */}
            </Form>
          </Card>
        ) : (
          memberData && <p className="text-red-500">لا توجد اشتراكات نشطة متاحة</p>
        )}
    </div>
  );
};

export default RfidSearch;