import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addMember, fetchUsers } from '../../redux/slices/memberSlice';
import { fetchClubs } from '../../redux/slices/clubSlice';
import { toast } from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

const AddMember = ({ closeAddModal, onAddSuccess }) => {
  const dispatch = useDispatch();
  const [clubs, setClubs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);

  // استرجاع بيانات المستخدم الحالي من Redux
  const currentUser = useSelector((state) => state.auth.user); // افتراض أن المستخدم في state.auth.user

  // تهيئة formData مع النادي الافتراضي بناءً على المستخدم
  const [formData, setFormData] = useState({
    name: '',
    national_id: '',
    birth_date: '',
    phone: '',
    club: currentUser?.club?.id || currentUser?.club_id || '', // تعيين نادي المستخدم
    referred_by: '',
    rfid_code: '',
    job: '',
    address: '',
    note: '',
    photo: null,
  });

  const handleChange = useCallback((e) => {
    const { name, value, type, files } = e.target;
    if (type === 'file' && files[0]) {
      const reader = new FileReader();
      reader.onload = () => {
        setFormData((prev) => ({ ...prev, [name]: reader.result }));
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(files[0]);
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
      if (name === 'photo') setPhotoPreview(null);
    }
  }, []);

  const handleRemovePhoto = useCallback(() => {
    setFormData((prev) => ({ ...prev, photo: null }));
    setPhotoPreview(null);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.national_id || !formData.birth_date || !formData.phone || !formData.club) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }
    setIsLoading(true);
    try {
      await dispatch(addMember(formData)).unwrap();
      await dispatch(fetchUsers()).unwrap();
      toast.success('تم إضافة العضو بنجاح!');
      closeAddModal();
      onAddSuccess();
      setFormData({
        name: '',
        national_id: '',
        birth_date: '',
        phone: '',
        club: currentUser?.club?.id || currentUser?.club_id || '',
        referred_by: '',
        rfid_code: '',
        job: '',
        address: '',
        note: '',
        photo: null,
      });
      setPhotoPreview(null);
    } catch (error) {
      toast.error(`فشل في إضافة العضو: ${error.message || 'خطأ غير معروف'}`);
      console.error('Add member error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await dispatch(fetchClubs()).unwrap();
        setClubs(res);
      } catch (error) {
        toast.error('فشل في جلب الأندية');
        console.error('Error fetching clubs:', error);
      }
    };
    fetchData();
  }, [dispatch]);

  return (
    <div className="max-h-[80vh] overflow-y-auto p-4 sm:p-6 bg-white rounded-lg">
      <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-center text-gray-800">إضافة عضو</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { id: 'name', label: 'الاسم الكامل', type: 'text', placeholder: 'أدخل الاسم الكامل', required: true },
            { id: 'national_id', label: 'رقم الهوية', type: 'text', placeholder: 'أدخل رقم الهوية', required: true },
            { id: 'birth_date', label: 'تاريخ الميلاد', type: 'date', required: true },
            { id: 'phone', label: 'رقم الهاتف', type: 'text', placeholder: 'أدخل رقم الهاتف', required: true },
            {
              id: 'club',
              label: 'النادي',
              type: 'select',
              required: true,
              disabled: !!currentUser?.club?.id || !!currentUser?.club_id, // تعطيل إذا كان للمستخدم نادٍ
              options: [
                { value: '', label: 'اختر النادي' },
                ...clubs.map((club) => ({ value: club.id, label: club.name })),
              ],
            },
            { id: 'referred_by', label: 'أُحيل بواسطة (رقم العضوية)', type: 'text', placeholder: 'أدخل رقم العضو المحيل' },
            { id: 'rfid_code', label: 'رمز RFID', type: 'text', placeholder: 'أدخل رمز RFID' },
            { id: 'job', label: 'الوظيفة', type: 'text', placeholder: 'أدخل الوظيفة' },
            { id: 'address', label: 'العنوان', type: 'text', placeholder: 'أدخل العنوان' },
            { id: 'note', label: 'ملاحظة', type: 'text', placeholder: 'أدخل ملاحظة' },
          ].map((field) => (
            <div key={field.id} className="flex flex-col">
              <label htmlFor={field.id} className="text-sm font-medium text-gray-700 mb-2 text-right">
                {field.label} {field.required && <span className="text-red-500">*</span>}
              </label>
              {field.type === 'select' ? (
                <select
                  id={field.id}
                  name={field.id}
                  value={formData[field.id]}
                  onChange={handleChange}
                  disabled={field.disabled}
                  className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-right ${
                    field.disabled ? 'bg-gray-100 cursor-not-allowed' : ''
                  }`}
                  required={field.required}
                >
                  {field.options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  id={field.id}
                  name={field.id}
                  type={field.type}
                  value={formData[field.id]}
                  onChange={handleChange}
                  placeholder={field.placeholder}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-right bg-white shadow-sm"
                  required={field.required}
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex flex-col">
          <label htmlFor="photo" className="text-sm font-medium text-gray-700 mb-2 text-right">
            صورة
          </label>
          <input
            id="photo"
            name="photo"
            type="file"
            accept="image/*"
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-right"
          />
          {photoPreview && (
            <div className="mt-4 flex items-center gap-4">
              <img
                src={photoPreview}
                alt="Preview"
                className="w-24 h-24 rounded-lg object-cover shadow-sm"
              />
              <button
                type="button"
                onClick={handleRemovePhoto}
                className="text-red-600 hover:text-red-700 text-sm font-medium"
              >
                إزالة الصورة
              </button>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={closeAddModal}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            disabled={isLoading}
          >
            إلغاء
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                جاري الإضافة...
              </>
            ) : (
              'إضافة عضو'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddMember;