import React, { useEffect, useState } from "react";
import { CiEdit } from 'react-icons/ci';
import { HiOutlineDocumentReport } from 'react-icons/hi';
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

  const [clubs, setClubs] = useState([]); // Initialize clubs state
  const isLoading = useSelector((state) => state.club.isLoading);
  const error = useSelector((state) => state.club.error);
  const dispatch = useDispatch();
console.log("Clubs:", clubs); // Log the clubs state
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await dispatch(fetchClubs()).unwrap();
        console.log('Fetched Clubs:', res); // Log the response
        setClubs(res); // Set the fetched clubs to state
      } catch (error) {
        console.error('Error fetching Club:', error);
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
      logo: club.logo,
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

    dispatch(editClub({ id: selectedClub.id, updatedClub: formData }));

    setClubs(updatedClubs); // Update the local state with the edited club
    setModalOpen(false); // Close the modal
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedClub(null);
  };

  if (isLoading) {
    return <p className="text-center">Loading...</p>;
  }

  if (error) {
    return <p className="text-red-500 text-center">Error: {error}</p>;
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
            <tr key={club.id} className="">
              <td className="p-3 border-b">{index + 1}</td>
              <td className="p-3 border-b">
                <img
                  src={club.logo? club.logo : "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSU-rxXTrx4QdTdwIpw938VLL8EuJiVhCelkQ&s"}
                  alt={club.name}
                  className="w-16 h-16 rounded-full object-cover"
                />
              </td>
              <td className="p-3 border-b">{club.name}</td>
              <td className="p-3 border-b">{club.location}</td>
              <td className="p-3 border-b">
                {new Date(club.createdAt).toLocaleDateString()}
              </td>
            
            </tr>
          ))}
        </tbody>
      </table>

   
    </div>
  );
};

export default Club;