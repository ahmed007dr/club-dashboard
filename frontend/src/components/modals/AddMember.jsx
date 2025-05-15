import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { addMember, fetchUsers } from '../../redux/slices/memberSlice';
import { fetchClubs } from '../../redux/slices/clubSlice';
import { toast } from 'react-hot-toast';

const AddMember = ({ closeAddModal, onAddSuccess }) => {
  const dispatch = useDispatch();
  const [clubs, setClubs] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    national_id: '',
    birth_date: '',
    phone: '',
    club: '',
    referred_by: '',
    rfid_code: '',
    job: '',
    address: '',
    note: '',
    photo: null,
  });

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === 'file' && files[0]) {
      const reader = new FileReader();
      reader.onload = () => {
        setFormData({ ...formData, [name]: reader.result });
      };
      reader.readAsDataURL(files[0]);
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const addResult = await dispatch(addMember(formData)).unwrap();
      console.log('addMember response:', addResult);
      await new Promise((resolve) => setTimeout(resolve, 500)); // Wait for server
      try {
        const fetchResult = await dispatch(fetchUsers()).unwrap();
        console.log('fetchUsers response:', fetchResult);
      } catch (fetchError) {
        console.error('fetchUsers error:', fetchError);
        toast.error('تم إضافة العضو، لكن فشل تحديث القائمة. حاول التحديث يدويًا.');
      }
      toast.success('تم إضافة العضو بنجاح!');
      closeAddModal();
      onAddSuccess();
      setFormData({
        name: '',
        national_id: '',
        birth_date: '',
        phone: '',
        club: '',
        referred_by: '',
        rfid_code: '',
        job: '',
        address: '',
        note: '',
        photo: null,
      });
    } catch (error) {
      toast.error('فشل في إضافة العضو');
      console.error('Add member error:', error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await dispatch(fetchClubs()).unwrap();
        setClubs(res);
      } catch (error) {
        console.error('Error fetching clubs:', error);
      }
    };

    fetchData();
  }, [dispatch]);

  return (
    <div className="max-h-[80vh] overflow-auto">
      <h2 className="text-3xl font-bold mb-8 text-center text-gray-800">إضافة عضو</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="name">الاسم الكامل</label>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
              placeholder="أدخل الاسم الكامل"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="national_id">رقم الهوية</label>
            <input
              id="national_id"
              name="national_id"
              type="text"
              value={formData.national_id}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
              placeholder="أدخل رقم الهوية"
              required
            />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="birth_date">تاريخ الميلاد</label>
            <input
              id="birth_date"
              name="birth_date"
              type="date"
              value={formData.birth_date}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="phone">رقم الهاتف</label>
            <input
              id="phone"
              name="phone"
              type="text"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
              placeholder="أدخل رقم الهاتف"
              required
            />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="club">النادي</label>
            <select
              id="club"
              name="club"
              value={formData.club}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
              required
            >
              <option value="">اختر النادي</option>
              {clubs.map((club) => (
                <option key={club.id} value={club.id}>
                  {club.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="referred_by">أُحيل بواسطة (رقم العضوية)</label>
            <input
              id="referred_by"
              name="referred_by"
              type="text"
              value={formData.referred_by}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
              placeholder="أدخل رقم العضو المحيل"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="rfid_code">رمز RFID</label>
            <input
              id="rfid_code"
              name="rfid_code"
              type="text"
              value={formData.rfid_code}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
              placeholder="أدخل رمز RFID"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="job">الوظيفة</label>
            <input
              id="job"
              name="job"
              type="text"
              value={formData.job}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
              placeholder="أدخل الوظيفة"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="address">العنوان</label>
            <input
              id="address"
              name="address"
              type="text"
              value={formData.address}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
              placeholder="أدخل العنوان"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="note">ملاحظة</label>
            <input
              id="note"
              name="note"
              type="text"
              value={formData.note}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
              placeholder="أدخل ملاحظة"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="photo">صورة</label>
          <input
            id="photo"
            name="photo"
            type="file"
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
          />
        </div>
        <div>
          <button type="submit" className="btn">
            إضافة عضو
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddMember;