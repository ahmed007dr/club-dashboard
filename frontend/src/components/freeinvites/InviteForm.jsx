
import React from 'react';
import PropTypes from 'prop-types';
import { Form, Input, Select, DatePicker, Button, Space } from 'antd';
import moment from 'moment';

/**
 * مكون نموذج لإضافة أو تعديل دعوة.
 * يستخدم في مودال الإضافة والتعديل في InviteList.
 * @param {Object} props
 * @param {Object} props.form - كائن النموذج من Ant Design
 * @param {Function} props.onSubmit - دالة لمعالجة إرسال النموذج
 * @param {Object} props.initialValues - القيم الابتدائية للنموذج
 * @param {boolean} props.isEditMode - تحديد ما إذا كان النموذج في وضع التعديل
 * @param {Object} props.userClub - بيانات النادي (id, name)
 * @param {Function} props.onCancel - دالة لإلغاء النموذج
 */
const InviteForm = ({ form, onSubmit, initialValues, isEditMode, userClub, onCancel }) => {
  return (
    <Form
      form={form}
      onFinish={onSubmit}
      layout="vertical"
      initialValues={initialValues}
    >
      <Form.Item
        name="club"
        label="النادي"
        rules={[{ required: true, message: 'اختيار النادي مطلوب' }]}
      >
        <Select disabled>
          {userClub && <Select.Option value={userClub.id}>{userClub.name}</Select.Option>}
        </Select>
      </Form.Item>
      <Form.Item
        name="guest_name"
        label="اسم الضيف"
        rules={[{ required: true, message: 'اسم الضيف مطلوب' }]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        name="phone"
        label="رقم الهاتف"
        rules={[{ required: true, message: 'رقم الهاتف مطلوب' }]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        name="date"
        label="التاريخ"
        rules={[{ required: true, message: 'التاريخ مطلوب' }]}
      >
        <DatePicker className="w-full" />
      </Form.Item>
      <Form.Item
        name="status"
        label="الحالة"
        rules={[{ required: true, message: 'الحالة مطلوبة' }]}
      >
        <Select>
          <Select.Option value="pending">متاحة</Select.Option>
          <Select.Option value="used">مستخدمة</Select.Option>
          <Select.Option value="cancelled">ملغاة</Select.Option>
        </Select>
      </Form.Item>
      <Form.Item name="invited_by" label="بدعوة من (رقم العضوية)">
        <Input placeholder="أدخل رقم العضوية" />
      </Form.Item>
      <Form.Item name="rfid_code" label="RFID Code">
        <Input placeholder="أدخل رمز RFID (اختياري)" />
      </Form.Item>
      <Form.Item>
        <Space>
          <Button onClick={onCancel}>إلغاء</Button>
          <Button type="primary" htmlType="submit">
            {isEditMode ? 'حفظ' : 'إضافة'}
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
};

InviteForm.propTypes = {
  form: PropTypes.object.isRequired,
  onSubmit: PropTypes.func.isRequired,
  initialValues: PropTypes.shape({
    club: PropTypes.number,
    guest_name: PropTypes.string,
    phone: PropTypes.string,
    date: PropTypes.any,
    status: PropTypes.string,
    invited_by: PropTypes.string,
    rfid_code: PropTypes.string,
  }).isRequired,
  isEditMode: PropTypes.bool.isRequired,
  userClub: PropTypes.shape({
    id: PropTypes.number,
    name: PropTypes.string,
  }),
  onCancel: PropTypes.func.isRequired,
};

export default InviteForm;
