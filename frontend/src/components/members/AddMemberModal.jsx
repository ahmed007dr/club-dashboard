import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { addMember } from "@/redux/slices/memberSlice";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FaPlus } from "react-icons/fa";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

const AddMemberModal = ({ userClub, setIsAddMemberModalOpen }) => {
  const dispatch = useDispatch();
  const [newMember, setNewMember] = useState({
    name: "",
    phone: "",
    club: userClub?.id || "",
    national_id: "",
    birth_date: "",
    referred_by: "",
    rfid_code: "",
    job: "",
    address: "",
    note: "",
    photo: null,
    gender: "",
  });
  const [photoPreview, setPhotoPreview] = useState(null);
  const [memberErrors, setMemberErrors] = useState(null);

  const handleMemberInputChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === "file") {
      const file = files[0] || null;
      setNewMember((prev) => ({ ...prev, photo: file }));
      if (file) {
        const reader = new FileReader();
        reader.onload = () => setPhotoPreview(reader.result);
        reader.readAsDataURL(file);
      } else {
        setPhotoPreview(null);
      }
    } else {
      setNewMember((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleRemovePhoto = () => {
    setNewMember((prev) => ({ ...prev, photo: null }));
    setPhotoPreview(null);
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    setMemberErrors(null);
    if (!newMember.name || !newMember.phone || !newMember.club || !newMember.gender) {
      setMemberErrors({ form: ["الاسم، رقم الهاتف، النادي، والجنس مطلوبة."] });
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }
    const form = new FormData();
    form.append("name", newMember.name);
    form.append("phone", newMember.phone);
    form.append("club", newMember.club);
    form.append("gender", newMember.gender);
    if (newMember.national_id) form.append("national_id", newMember.national_id);
    if (newMember.birth_date) form.append("birth_date", newMember.birth_date);
    if (newMember.referred_by) form.append("referred_by", newMember.referred_by);
    if (newMember.rfid_code) form.append("rfid_code", newMember.rfid_code);
    if (newMember.job) form.append("job", newMember.job);
    if (newMember.address) form.append("address", newMember.address);
    if (newMember.note) form.append("note", newMember.note);
    if (newMember.photo) form.append("photo", newMember.photo);
    try {
      await dispatch(addMember(form)).unwrap();
      toast.success("تم إضافة العضو بنجاح!");
      setIsAddMemberModalOpen(false);
      setNewMember({
        name: "",
        phone: "",
        club: userClub?.id || "",
        national_id: "",
        birth_date: "",
        referred_by: "",
        rfid_code: "",
        job: "",
        address: "",
        note: "",
        photo: null,
        gender: "",
      });
      setPhotoPreview(null);
      dispatch(fetchUsers({ page: 1 }));
    } catch (error) {
      setMemberErrors(error);
      toast.error(
        typeof error === "string"
          ? error
          : Object.values(error).flat().join(", ") || "فشل في إضافة العضو"
      );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    >
      <div className="bg-white rounded-xl p-6 w-full max-w-4xl shadow-2xl" dir="rtl">
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <FaPlus className="text-blue-600" />
          إضافة عضو جديد
        </h3>
        {memberErrors && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4">
            {memberErrors.form ? (
              <p>{memberErrors.form.join(", ")}</p>
            ) : (
              Object.keys(memberErrors).map((key) => (
                <p key={key}>
                  {key}: {Array.isArray(memberErrors[key]) ? memberErrors[key].join(", ") : memberErrors[key]}
                </p>
              ))
            )}
          </div>
        )}
        <form onSubmit={handleAddMember} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { id: "name", label: "الاسم الكامل", type: "text", placeholder: "أدخل الاسم الكامل", required: true },
            { id: "phone", label: "رقم الهاتف", type: "text", placeholder: "أدخل رقم الهاتف", required: true },
            { id: "national_id", label: "رقم الهوية", type: "text", placeholder: "أدخل رقم الهوية" },
            { id: "birth_date", label: "تاريخ الميلاد", type: "date" },
            { id: "rfid_code", label: "رمز RFID", type: "text", placeholder: "أدخل رمز RFID" },
            { id: "job", label: "الوظيفة", type: "text", placeholder: "أدخل الوظيفة" },
            { id: "address", label: "العنوان", type: "text", placeholder: "أدخل العنوان" },
            { id: "note", label: "ملاحظة", type: "textarea", placeholder: "أدخل ملاحظة" },
            {
              id: "gender",
              label: "الجنس",
              type: "select",
              options: [
                { value: "", label: "اختر الجنس" },
                { value: "M", label: "ذكر" },
                { value: "F", label: "أنثى" },
              ],
              required: true,
            },
          ].map((field) => (
            <div key={field.id} className="flex flex-col">
              <label htmlFor={field.id} className="text-sm font-medium text-gray-700 mb-2 text-right">
                {field.label} {field.required && <span className="text-red-500">*</span>}
              </label>
              {field.type === "select" ? (
                <select
                  id={field.id}
                  name={field.id}
                  value={newMember[field.id]}
                  onChange={handleMemberInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-right"
                  required={field.required}
                >
                  {field.options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : field.type === "textarea" ? (
                <textarea
                  id={field.id}
                  name={field.id}
                  value={newMember[field.id]}
                  onChange={handleMemberInputChange}
                  placeholder={field.placeholder}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-right"
                  rows={4}
                />
              ) : (
                <input
                  id={field.id}
                  name={field.id}
                  type={field.type}
                  value={newMember[field.id]}
                  onChange={handleMemberInputChange}
                  placeholder={field.placeholder}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-right"
                  required={field.required}
                />
              )}
            </div>
          ))}
          <div className="col-span-2 flex flex-col">
            <label htmlFor="photo" className="text-sm font-medium text-gray-700 mb-2 text-right">
              صورة
            </label>
            <input
              id="photo"
              name="photo"
              type="file"
              accept="image/*"
              onChange={handleMemberInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-right"
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
          <div className="col-span-2 flex justify-end gap-3">
            <Button
              type="button"
              onClick={() => setIsAddMemberModalOpen(false)}
              variant="outline"
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700"
            >
              <FaPlus className="mr-2" />
              إضافة العضو
            </Button>
          </div>
        </form>
      </div>
    </motion.div>
  );
};

export default AddMemberModal;