import React, { useEffect, useState } from "react";
import { CiEdit } from "react-icons/ci";
import { HiOutlineDocumentReport } from "react-icons/hi";
import { useDispatch, useSelector } from "react-redux";
import { Button } from "../ui/button";
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

  const formatDateForInput = (dateString) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const handleEditClick = (club) => {
    setSelectedClub(club);
    setFormData({
      name: club.name,
      location: club.location,
      logo: club.logo || "",
      createdAt: formatDateForInput(club.createdAt),
    });
    setModalOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleEditSubmit = () => {
    const updatedClubs = clubs.map((c) =>
      c.id === selectedClub.id ? { ...selectedClub, ...formData } : c
    );

    dispatch(editClub({ id: selectedClub.id, updatedClub: formData }))
      .unwrap()
      .then(() => {
        setClubs(updatedClubs);
        setModalOpen(false);
      })
      .catch((err) => {
        console.error("Failed to edit club:", err);
      });
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedClub(null);
  };

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
    <div className="container mx-auto p-4 sm:p-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center space-x-3 space-x-reverse mb-6">
        <HiOutlineDocumentReport className="text-blue-600 w-6 h-6 sm:w-8 sm:h-8" />
        <h2 className="text-xl sm:text-2xl font-semibold">الأندية</h2>
      </div>

      {/* Clubs Table */}
      <div className="overflow-x-auto">
        {clubs.length > 0 ? (
          <>
            {/* Table for Small Screens and Above */}
            <table className="min-w-full border border-gray-200 hidden sm:table">
              <thead className="bg-gray-50 text-right">
                <tr>
                  <th className="p-2 sm:p-3 text-sm font-medium text-gray-500 uppercase">
                    #
                  </th>
                  <th className="p-2 sm:p-3 text-sm font-medium text-gray-500 uppercase">
                    الشعار
                  </th>
                  <th className="p-2 sm:p-3 text-sm font-medium text-gray-500 uppercase">
                    الاسم
                  </th>
                  <th className="p-2 sm:p-3 text-sm font-medium text-gray-500 uppercase">
                    الموقع
                  </th>
                  <th className="p-2 sm:p-3 text-sm font-medium text-gray-500 uppercase">
                    تاريخ الإنشاء
                  </th>
                  <th className="p-2 sm:p-3 text-sm font-medium text-gray-500 uppercase">
                    الإجراءات
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {clubs.map((club, index) => (
                  <tr key={club.id} className="hover:bg-gray-50">
                    <td className="p-2 sm:p-3 text-sm">{index + 1}</td>
                    <td className="p-2 sm:p-3">
                      <img
                        src={
                          club.logo ||
                          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSU-rxXTrx4QdTdwIpw938VLL8EuJiVhCelkQ&s"
                        }
                        alt={club.name}
                        className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover"
                      />
                    </td>
                    <td className="p-2 sm:p-3 text-sm">{club.name}</td>
                    <td className="p-2 sm:p-3 text-sm">{club.location}</td>
                    <td className="p-2 sm:p-3 text-sm">
                      {new Date(club.createdAt).toLocaleDateString("ar-EG")}
                    </td>
                    <td className="p-2 sm:p-3">
                      <Button
                        onClick={() => handleEditClick(club)}
                        className="bg-transparent text-green-700 hover:bg-green-100 p-2"
                      >
                        <CiEdit className="w-5 h-5 sm:w-6 sm:h-6" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Card Layout for Mobile */}
            <div className="sm:hidden space-y-4">
              {clubs.map((club, index) => (
                <div
                  key={club.id}
                  className="border rounded-md p-4 bg-white shadow-sm"
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-semibold">#{index + 1}</span>
                    <Button
                      onClick={() => handleEditClick(club)}
                      className="bg-transparent text-green-700 hover:bg-green-100 p-2"
                    >
                      <CiEdit className="w-5 h-5" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-3 mb-2">
                    <img
                      src={
                        club.logo ||
                        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSU-rxXTrx4QdTdwIpw938VLL8EuJiVhCelkQ&s"
                      }
                      alt={club.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div>
                      <p className="text-sm font-semibold">{club.name}</p>
                      <p className="text-sm text-gray-600">{club.location}</p>
                    </div>
                  </div>
                  <p className="text-sm">
                    <strong>تاريخ الإنشاء:</strong>{" "}
                    {new Date(club.createdAt).toLocaleDateString("ar-EG")}
                  </p>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="text-sm sm:text-base text-center p-4 text-gray-500">
            لا توجد أندية متاحة
          </p>
        )}
      </div>

      {/* Modal for editing club */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-40 flex justify-center items-center bg-black bg-opacity-50 p-4"
          onClick={closeModal}
        >
          <div
            className="bg-white p-4 sm:p-6 rounded-lg shadow-lg w-full max-w-md max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg sm:text-xl font-bold mb-4">تعديل النادي</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleEditSubmit();
              }}
              className="space-y-4"
            >
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  اسم النادي
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring focus:ring-blue-200"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="location"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  الموقع
                </label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring focus:ring-blue-200"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="logo"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  رابط الشعار
                </label>
                <input
                  type="text"
                  id="logo"
                  name="logo"
                  value={formData.logo}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring focus:ring-blue-200"
                />
              </div>
              <div>
                <label
                  htmlFor="createdAt"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  تاريخ الإنشاء
                </label>
                <input
                  type="datetime-local"
                  id="createdAt"
                  name="createdAt"
                  value={formData.createdAt}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring focus:ring-blue-200"
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400 transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition"
                >
                  حفظ التغييرات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Club;