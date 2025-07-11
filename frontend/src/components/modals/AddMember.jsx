import React, { useState, useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addMember } from '../../redux/slices/memberSlice';
import { fetchClubs } from '../../redux/slices/clubSlice';
import { toast } from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

const AddMember = ({ closeAddModal, onAddSuccess }) => {
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [errors, setErrors] = useState(null);
  const [clubs, setClubs] = useState([]);

  // استرجاع بيانات المستخدم الحالي من Redux
  const currentUser = useSelector((state) => state.auth.user);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    club: currentUser?.club?.id || currentUser?.club_id || '',
    national_id: '',
    birth_date: '',
    referred_by: '',
    rfid_code: '',
    job: '',
    address: '',
    note: '',
    photo: null,
    gender: '', // إضافة حقل gender
  });

  
  // معالجة التغييرات في الحقول
  const handleChange = useCallback((e) => {
    const { name, value, type, files } = e.target;
    if (type === 'file') {
      const file = files[0] || null;
      setFormData((prev) => ({ ...prev, photo: file }));
      if (file) {
        const reader = new FileReader();
        reader.onload = () => setPhotoPreview(reader.result);
        reader.readAsDataURL(file);
      } else {
        setPhotoPreview(null);
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  }, []);

  // إزالة الصورة
  const handleRemovePhoto = useCallback(() => {
    setFormData((prev) => ({ ...prev, photo: null }));
    setPhotoPreview(null);
  }, []);

  // إرسال النموذج
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors(null);
    setIsLoading(true);

    // التحقق من الحقول المطلوبة
    if (!formData.name || !formData.phone || !formData.club) {
      setErrors({ form: ['الاسم، رقم الهاتف، والنادي مطلوبة.'] });
      setIsLoading(false);
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    // إنشاء FormData
    const form = new FormData();
    form.append('name', formData.name);
    form.append('phone', formData.phone);
    form.append('club', formData.club);
    if (formData.national_id) form.append('national_id', formData.national_id);
    if (formData.birth_date) form.append('birth_date', formData.birth_date);
    if (formData.referred_by) form.append('referred_by', formData.referred_by);
    if (formData.rfid_code) form.append('rfid_code', formData.rfid_code);
    if (formData.job) form.append('job', formData.job);
    if (formData.address) form.append('address', formData.address);
    if (formData.note) form.append('note', formData.note);
    if (formData.gender) form.append('gender', formData.gender); 
    if (formData.photo) form.append('photo', formData.photo);

    try {
      const result = await dispatch(addMember(form)).unwrap();
      toast.success('تم إضافة العضو بنجاح!');
      closeAddModal();
      onAddSuccess();
      setFormData({
        name: '',
        phone: '',
        club: currentUser?.club?.id || currentUser?.club_id || '',
        national_id: '',
        birth_date: '',
        referred_by: '',
        rfid_code: '',
        job: '',
        address: '',
        note: '',
        photo: null,
      });
      setPhotoPreview(null);
    } catch (error) {
      console.error('Add member error:', JSON.stringify(error, null, 2));
      setErrors(error);
      toast.error(
        typeof error === 'string'
          ? error
          : Object.keys(error).length
          ? Object.values(error).flat().join(', ')
          : 'فشل في إضافة العضو. يرجى التحقق من البيانات.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // جلب الأندية
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await dispatch(fetchClubs()).unwrap();
        setClubs(res);
        // تعيين النادي الافتراضي إذا لم يكن محددًا
        if (!formData.club && res.length > 0) {
          setFormData((prev) => ({ ...prev, club: res[0].id }));
        }
      } catch (error) {
        toast.error('فشل في جلب الأندية');
        console.error('Error fetching clubs:', error);
      }
    };
    fetchData();
  }, [dispatch, formData.club]);

  return (
    <div className="max-h-[80vh] overflow-y-auto p-4 sm:p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-center text-gray-800">إضافة عضو</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        {errors && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg text-right">
            {errors.form ? (
              <p>{errors.form.join(', ')}</p>
            ) : (
              Object.keys(errors).map((key) => (
                <p key={key}>
                  {key}: {Array.isArray(errors[key]) ? errors[key].join(', ') : errors[key]}
                </p>
              ))
            )}
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
         
        {[
          { id: 'name', label: 'الاسم الكامل', type: 'text', placeholder: 'أدخل الاسم الكامل', required: true },
          { id: 'phone', label: 'رقم الهاتف', type: 'text', placeholder: 'أدخل رقم الهاتف', required: true },
          { id: 'national_id', label: 'رقم الهوية', type: 'text', placeholder: 'أدخل رقم الهوية' },
          { id: 'birth_date', label: 'تاريخ الميلاد', type: 'date' },
          {
            id: 'club',
            label: 'النادي',
            type: 'select',
            required: true,
            disabled: !!currentUser?.club?.id || !!currentUser?.club_id,
            options: [
              { value: '', label: 'اختر النادي' },
              ...clubs.map((club) => ({ value: club.id, label: club.name })),
            ],
          },
          { id: 'referred_by', label: 'أُحيل بواسطة (رقم العضو)', type: 'text', placeholder: 'أدخل رقم العضو المحيل' },
          { id: 'rfid_code', label: 'رمز RFID', type: 'text', placeholder: 'أدخل رمز RFID' },
          { id: 'job', label: 'الوظيفة', type: 'text', placeholder: 'أدخل الوظيفة' },
          { id: 'address', label: 'العنوان', type: 'text', placeholder: 'أدخل العنوان' },
          { id: 'note', label: 'ملاحظة', type: 'textarea', placeholder: 'أدخل ملاحظة' },
          {
            id: 'gender',
            label: 'الجنس',
            type: 'select',
            options: [
              { value: '', label: 'اختر الجنس' },
              { value: 'M', label: 'ذكر' },
              { value: 'F', label: 'أنثى' },
            ],
          },

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
              ) : field.type === 'textarea' ? (
                <textarea
                  id={field.id}
                  name={field.id}
                  value={formData[field.id]}
                  onChange={handleChange}
                  placeholder={field.placeholder}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-right bg-white shadow-sm"
                  rows={4}
                />
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