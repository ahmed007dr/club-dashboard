import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchFreeInvites, 
  addInvite, 
  fetchInviteById, 
  editInviteById, 
  deleteInviteById,
  markInviteAsUsed
} from '../../redux/slices/invitesSlice';
import { RiVipCrown2Line } from 'react-icons/ri';
const InviteList = () => {
  const dispatch = useDispatch();
  const { invites, loading, error, currentInvite } = useSelector((state) => state.invites);
  console.log('Invites:', invites);
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMarkUsedModal, setShowMarkUsedModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedInviteId, setSelectedInviteId] = useState(null);
  

  const [filters, setFilters] = useState({
    status: '',
    clubName: '',
    guestName: '',
    date: ''
  });

  

 
  
  
  // Form states
  const [formData, setFormData] = useState({
    club: '',
    guest_name: '',
    phone: '',
    date: '',
    status: 'pending',
    invited_by: ''
  });
  
  const [markUsedData, setMarkUsedData] = useState({
    used_by: ''
  });

  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    dispatch(fetchFreeInvites());
  }, [dispatch]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user types
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const handleMarkUsedChange = (e) => {
    const { name, value } = e.target;
    setMarkUsedData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const filteredInvites = invites.filter(invite => {
    const matchesGuest = filters.guestName === '' || 
      invite.guest_name.toLowerCase().includes(filters.guestName.toLowerCase());
    const matchesStatus = filters.status === '' || invite.status === filters.status;
    const matchesClub = filters.clubName === '' || 
      invite.club_details?.name?.toLowerCase().includes(filters.clubName.toLowerCase());
    
    // Single date filtering logic
    let matchesDate = true;
    if (filters.date) {
      const inviteDate = new Date(invite.date);
      inviteDate.setHours(0, 0, 0, 0); // Normalize time to midnight
      
      const selectedDate = new Date(filters.date);
      selectedDate.setHours(0, 0, 0, 0); // Normalize time to midnight
      
      matchesDate = inviteDate.getTime() === selectedDate.getTime();
    }
    
    return matchesGuest && matchesStatus && matchesClub && matchesDate;
  });
  
  const validateForm = () => {
    const errors = {};
    if (!formData.club) errors.club = 'Club ID is required';
    if (!formData.guest_name) errors.guest_name = 'Guest name is required';
    if (!formData.phone) errors.phone = 'Phone number is required';
    if (!formData.date) errors.date = 'Date is required';
    return errors;
  };

  const handleAddInvite = async (e) => {
    e.preventDefault();
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    try {
      await dispatch(addInvite(formData)).unwrap();
      setShowAddModal(false);
      setFormData({
        club: '',
        guest_name: '',
        phone: '',
        date: '',
        status: 'pending',
        invited_by: ''
      });
      setFormErrors({});
    } catch (error) {
      console.error('Failed to add invite:', error);
    }
  };

const handleEditInvite = async (e) => {
    e.preventDefault();
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const cleanedData = {
      ...formData,
      invited_by:
        formData.invited_by?.toString().trim() === ""
          ? null
          : formData.invited_by,
      club: formData.club?.toString().trim() === "" ? null : formData.club,
    };

    try {
      await dispatch(
        editInviteById({
          inviteId: selectedInviteId,
          inviteData: cleanedData,
        })
      ).unwrap();
      setShowEditModal(false);
      setFormErrors({});
    } catch (error) {
      console.error(
        "Failed to edit invite:",
        error.response?.data || error.message
      );
    }
  };


  const handleDeleteInvite = async () => {
    try {
      await dispatch(deleteInviteById(selectedInviteId)).unwrap();
      setShowDeleteModal(false);
    } catch (error) {
      console.error('Failed to delete invite:', error);
    }
  };

  const handleMarkAsUsed = async (e) => {
    e.preventDefault();
    if (!markUsedData.used_by) {
      setFormErrors({ used_by: 'Member ID is required' });
      return;
    }
    
    try {
      await dispatch(markInviteAsUsed({
        inviteId: selectedInviteId,
        used_by: markUsedData.used_by
      })).unwrap();
      setShowMarkUsedModal(false);
      setMarkUsedData({ used_by: '' });
      setFormErrors({});
    } catch (error) {
      console.error('Failed to mark invite as used:', error);
    }
  };

  const openEditModal = async (inviteId) => {
    setSelectedInviteId(inviteId);
    try {
      const result = await dispatch(fetchInviteById(inviteId)).unwrap();
      setFormData({
        club: result.club.toString(),
        guest_name: result.guest_name,
        phone: result.phone,
        date: result.date,
        status: result.status,
        invited_by: result.invited_by ? result.invited_by.toString() : ''
      });
      setShowEditModal(true);
    } catch (error) {
      console.error('Failed to fetch invite:', error);
    }
  };

  const openMarkUsedModal = (inviteId) => {
    setSelectedInviteId(inviteId);
    setShowMarkUsedModal(true);
  };

  const openDeleteModal = (inviteId) => {
    setSelectedInviteId(inviteId);
    setShowDeleteModal(true);
  };

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6; // Adjust this number based on your preference

  // Calculate paginated invites
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentInvites = filteredInvites.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredInvites.length / itemsPerPage);

  // Handle page change
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    setCurrentPage(1);
  };

  const getStatusBadge = (status) => {
    let bgColor = 'bg-gray-500';
    if (status === 'used') bgColor = 'bg-green-100 text-green-600';
    if (status === 'pending') bgColor = 'bg-yellow-100 text-yellow-600';
    if (status === 'cancelled') bgColor = 'bg-red-100 text-red-600';
    
    return (
      <span className={`${bgColor}  text-xs px-2 py-1 rounded-full`}>
        {status}
      </span>
    );
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );
  
  if (error) return (
    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
      Error: {error}
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-start justify-between">
      <div className="flex justify-between items-center mb-8">
      <button 
          onClick={() => setShowAddModal(true)}
          className="btn flex items-center"
        >
          دعوة جديدة

          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </button>
       
      </div>
        <div className="flex items-start space-x-3">   
        <h1 className="text-2xl font-bold ">الدعوات المجانية</h1>

      
              <RiVipCrown2Line className="text-blue-600 w-9 h-9 text-2xl" />
            </div>
      </div>
  
      <div className="mb-6 flex flex-wrap gap-4">
  <input
    type="text"
    name="guestName"
    placeholder="ابحث عن الضيف"
    className="input"
    value={filters.guestName}
    onChange={handleFilterChange}
  />
  <select name="status" value={filters.status} onChange={handleFilterChange} className="input">
    <option value="">جميع الحالات</option>
    <option value="pending">قيد الانتظار</option>
    <option value="used">تم الاستخدام</option>
    <option value="cancelled">ملغاة</option>
  </select>
  <input
    type="text"
    name="clubName"
    placeholder="اسم النادي"
    className="input"
    value={filters.clubName}
    onChange={handleFilterChange}
  />
  <input
    type="date"
    name="date"
    className="input"
    value={filters.date}
    onChange={handleFilterChange}
  />
</div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" dir="rtl">
        {currentInvites.map((invite) => (
          <div key={invite.id} className=" rounded-lg shadow-md overflow-hidden border border-gray-200">
            <div className="p-6">
              <div className="flex justify-between items-start">
                <h3 className="text-lg font-semibold ">{invite.guest_name}</h3>
                {getStatusBadge(invite.status)}
              </div>
              <div className="mt-4 space-y-2 text-sm ">
            <p><span className="font-medium">الهاتف:</span> {invite.phone}</p>
            <p><span className="font-medium">التاريخ:</span> {new Date(invite.date).toLocaleDateString()}</p>
            <p><span className="font-medium">النادي:</span> {invite.club_details?.name || 'غير متوفر'}</p>
            <p><span className="font-medium">الموقع:</span> {invite.club_details?.location || 'غير متوفر'}</p>
          </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 px-6 py-3 flex justify-end space-x-2">
              <button
                onClick={() => openEditModal(invite.id)}
                className="text-blue-600 hover:text-blue-800 p-2 rounded-full hover:bg-blue-50"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
              <button
                onClick={() => openMarkUsedModal(invite.id)}
                disabled={invite.status === 'used'}
                className={`p-2 rounded-full ${invite.status === 'used' ? 'text-gray-400 cursor-not-allowed' : 'text-green-600 hover:text-green-800 hover:bg-green-50'}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </button>
              <button
                onClick={() => openDeleteModal(invite.id)}
                className="text-red-600 hover:text-red-800 p-2 rounded-full hover:bg-red-50"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination Controls */}
      {filteredInvites.length > itemsPerPage && (
        <div className="mt-6 flex justify-center items-center space-x-2 rtl">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`px-3 py-1 rounded-md ${
              currentPage === 1
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            السابق
          </button>
          {Array.from({ length: totalPages }, (_, index) => index + 1).map(
            (page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`px-3 py-1 rounded-md ${
                  currentPage === page
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {page}
              </button>
            )
          )}
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`px-3 py-1 rounded-md ${
              currentPage === totalPages
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            التالي
          </button>
        </div>
      )}

      {/* Add Invite Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className=" modal">
            <div className="flex justify-between items-center border-b px-6 py-4">
            <h3 className="text-lg font-semibold ">إضافة دعوة جديدة</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-500">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleAddInvite} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">معرّف النادي</label>
                <input
                  type="number"
                  name="club"
                  value={formData.club}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md ${formErrors.club ? 'border-red-500' : 'border-gray-300'}`}
                  required
                />
                {formErrors.club && <p className="mt-1 text-sm text-red-600">{formErrors.club}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">اسم الضيف</label>
                <input
                  type="text"
                  name="guest_name"
                  value={formData.guest_name}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md ${formErrors.guest_name ? 'border-red-500' : 'border-gray-300'}`}
                  required
                />
                {formErrors.guest_name && <p className="mt-1 text-sm text-red-600">{formErrors.guest_name}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">رقم الهاتف</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md ${formErrors.phone ? 'border-red-500' : 'border-gray-300'}`}
                  required
                />
                {formErrors.phone && <p className="mt-1 text-sm text-red-600">{formErrors.phone}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">التاريخ</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md ${formErrors.date ? 'border-red-500' : 'border-gray-300'}`}
                  required
                />
                {formErrors.date && <p className="mt-1 text-sm text-red-600">{formErrors.date}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الحالة</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="pending">Pending</option>
                  <option value="used">Used</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">بدعوة من (معرّف العضو)</label>
                <input
                  type="number"
                  name="invited_by"
                  value={formData.invited_by}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600  rounded-md hover:bg-blue-700"
                >
                  حفظ الدعوة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    

      {/* Mark as Used Modal */}
      {showMarkUsedModal && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div className=" modal">
      <div className="flex justify-between items-center border-b px-6 py-4">
        <h3 className="text-lg font-semibold ">تحديد كمستخدم</h3>
        <button 
          onClick={() => setShowMarkUsedModal(false)} 
          className="text-gray-400 hover:text-gray-500"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <form onSubmit={handleMarkAsUsed} className="p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">رقم العضو (المستخدم من قبله) </label>
          <input
            type="number"
            name="used_by"
            value={markUsedData.used_by}
            onChange={(e) => setMarkUsedData({ ...markUsedData, used_by: e.target.value })}
            className={`w-full px-3 py-2 border rounded-md ${formErrors.used_by ? 'border-red-500' : 'border-gray-300'}`}
            required
            min="1"
          />
          {formErrors.used_by && <p className="mt-1 text-sm text-red-600">{formErrors.used_by}</p>}
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={() => setShowMarkUsedModal(false)}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            إلغاء
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600  rounded-md hover:bg-blue-700"
          >
            تحديد كمستخدم
          </button>
        </div>
      </form>
    </div>
  </div>
)}

     {/* Edit Invite Modal */}
     {showEditModal && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div className=" modal">
      <div className="flex justify-between items-center border-b px-6 py-4">
        <h3 className="text-lg font-semibold ">تعديل الدعوة</h3>
        <button 
          onClick={() => setShowEditModal(false)} 
          className="text-gray-400 hover:text-gray-500"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <form onSubmit={handleEditInvite} className="p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">رقم النادي *</label>
          <input
            type="number"
            name="club"
            value={formData.club}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md ${formErrors.club ? 'border-red-500' : 'border-gray-300'}`}
            required
            min="1"
          />
          {formErrors.club && <p className="mt-1 text-sm text-red-600">{formErrors.club}</p>}
        </div>
        
        <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">اسم الضيف *</label>
          <input
            type="text"
            name="guest_name"
            value={formData.guest_name}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md ${formErrors.guest_name ? 'border-red-500' : 'border-gray-300'}`}
            required
          />
          {formErrors.guest_name && <p className="mt-1 text-sm text-red-600">{formErrors.guest_name}</p>}
        </div>
        
        <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">رقم الهاتف *</label>
          <input
            type="text"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md ${formErrors.phone ? 'border-red-500' : 'border-gray-300'}`}
            required
          />
          {formErrors.phone && <p className="mt-1 text-sm text-red-600">{formErrors.phone}</p>}
        </div>
        
        <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">التاريخ *</label>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md ${formErrors.date ? 'border-red-500' : 'border-gray-300'}`}
            required
          />
           <div>
           <label className="block text-sm font-medium text-gray-700 mb-1">الحالة *</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md ${formErrors.status ? 'border-red-500' : 'border-gray-300'}`}
                  required
                >
                  <option value="pending">Pending</option>
                  <option value="used">Used</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                {formErrors.status && <p className="mt-1 text-sm text-red-600">{formErrors.status}</p>}
              </div>
              
              <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الدعوة من قبل (رقم العضو)</label>
                <input
                  type="number"
                  name="invited_by"
                  value={formData.invited_by}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  min="1"
                />
                <p className="mt-1 text-xs text-gray-500">اختياري - اتركه فارغًا إذا لم يكن ذلك ممكنًا</p>
              </div>
              
          {formErrors.date && <p className="mt-1 text-sm text-red-600">{formErrors.date}</p>}
        </div>
        
        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={() => setShowEditModal(false)}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            إلغاء
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600  rounded-md hover:bg-blue-700"
          >
            حفظ التغييرات
          </button>
        </div>
      </form>
    </div>
  </div>
)}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className=" modal">
            <div className="flex justify-between items-center border-b px-6 py-4">
            <h3 className="text-lg font-semibold ">تأكيد الحذف</h3>
              <button onClick={() => setShowDeleteModal(false)} className="text-gray-400 hover:text-gray-500">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
            <p className="text-gray-600 mb-6">هل أنت متأكد أنك تريد حذف هذه الدعوة؟ لا يمكن التراجع عن هذا الإجراء.</p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleDeleteInvite}
                  className="px-4 py-2 bg-red-600  rounded-md hover:bg-red-700"
                >
                  
            حذف
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InviteList;
