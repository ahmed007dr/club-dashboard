import React, { useEffect, useState } from "react";
import { HiOutlineDocumentReport } from "react-icons/hi";
import { useDispatch, useSelector } from "react-redux";
import { editClub, fetchClubs } from "@/redux/slices/clubSlice";

const Club = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedClub, setSelectedClub] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    logo: "",
    createdAt: "",
  });

  const [clubs, setClubs] = useState([]);
  const isLoading = useSelector((state) => state.club.isLoading);
  const error = useSelector((state) => state.club.error);
  const dispatch = useDispatch();

  const parseDate = (dateInput) => {
    if (!dateInput) return null;
    
    try {
      if (typeof dateInput === 'object' && dateInput.toDate) {
        return dateInput.toDate();
      }
      
      if (typeof dateInput === 'number') {
        return new Date(dateInput > 1e10 ? dateInput : dateInput * 1000);
      }
      
      return new Date(dateInput);
    } catch (e) {
      console.error("Failed to parse date:", dateInput, e);
      return null;
    }
  };

  const formatDate = (dateInput) => {
    const date = parseDate(dateInput);
    if (!date || isNaN(date.getTime())) {
      return "لا يوجد تاريخ";
    }
    
    return date.toLocaleDateString("ar-EG", {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await dispatch(fetchClubs()).unwrap();
        setClubs(res);
      } catch (error) {
        console.error("Error fetching Club:", error);
      }
    };
    fetchData();
  }, [dispatch]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen text-sm sm:text-base">
        جاري التحميل...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 text-center p-4 text-sm sm:text-base">
        خطأ: {error}
      </div>
    );
  }

  return (
    <div className="p-4 overflow-x-auto" dir="rtl">
      <div className="flex items-start space-x-3">
        <HiOutlineDocumentReport className="btn-forest text-2xl" />
        <h2 className="text-2xl font-semibold mb-4">الأندية</h2>  
      </div>
      <table className="min-w-full border border-gray-200">
        <thead className="text-center">
          <tr>
            <th className="p-3 border-b">#</th>
            <th className="p-3 border-b">الشعار</th>
            <th className="p-3 border-b">الاسم</th>
            <th className="p-3 border-b">الموقع</th>
            <th className="p-3 border-b">تاريخ الإنشاء</th>
          </tr>
        </thead>
        <tbody>
          {clubs.map((club, index) => (
            <tr key={club.id} className="text-center">
              <td className="p-3 border-b">{index + 1}</td>
              <td className="p-3 border-b">
                <img
                  src={club.logo || "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSU-rxXTrx4QdTdwIpw938VLL8EuJiVhCelkQ&s"}
                  alt={club.name}
                  className="w-16 h-16 rounded-full object-cover mx-auto"
                />
              </td>
              <td className="p-3 border-b">{club.name}</td>
              <td className="p-3 border-b">{club.location}</td>
              <td className="p-3 border-b">{formatDate(club.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Club;