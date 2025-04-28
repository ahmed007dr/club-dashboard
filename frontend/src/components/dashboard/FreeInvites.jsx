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

const InviteList = () => {
  const dispatch = useDispatch();
  const { invites, loading, error, currentInvite } = useSelector((state) => state.invites);
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMarkUsedModal, setShowMarkUsedModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedInviteId, setSelectedInviteId] = useState(null);
  
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
    
    try {
      await dispatch(editInviteById({
        inviteId: selectedInviteId,
        inviteData: formData
      })).unwrap();
      setShowEditModal(false);
      setFormErrors({});
    } catch (error) {
      console.error('Failed to edit invite:', error);
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

  const getStatusBadge = (status) => {
    let bgColor = 'bg-gray-500';
    if (status === 'used') bgColor = 'bg-green-500';
    if (status === 'pending') bgColor = 'bg-yellow-500';
    if (status === 'cancelled') bgColor = 'bg-red-500';
    
    return (
      <span className={`${bgColor} text-white text-xs px-2 py-1 rounded-full`}>
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
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Free Inv33ites</h1>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add New Invite
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {invites.map((invite) => (
          <div key={invite.id} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
            <div className="p-6">
              <div className="flex justify-between items-start">
                <h3 className="text-lg font-semibold text-gray-800">{invite.guest_name}</h3>
                {getStatusBadge(invite.status)}
              </div>
              <div className="mt-4 space-y-2 text-sm text-gray-600">
                <p><span className="font-medium">Phone:</span> {invite.phone}</p>
                <p><span className="font-medium">Date:</span> {new Date(invite.date).toLocaleDateString()}</p>
                <p><span className="font-medium">Club:</span> {invite.club_details?.name || 'N/A'}</p>
                <p><span className="font-medium">Location:</span> {invite.club_details?.location || 'N/A'}</p>
              </div>
            </div>
            <div className="bg-gray-50 px-6 py-3 flex justify-end space-x-2">
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

      {/* Add Invite Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center border-b px-6 py-4">
              <h3 className="text-lg font-semibold text-gray-800">Add New Invite</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-500">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleAddInvite} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Club ID</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Guest Name</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Invited By (Member ID)</label>
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
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Save Invite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    

      {/* Mark as Used Modal */}
      {showMarkUsedModal && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
      <div className="flex justify-between items-center border-b px-6 py-4">
        <h3 className="text-lg font-semibold text-gray-800">Mark as Used</h3>
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Member ID (Used By) *</label>
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
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Mark as Used
          </button>
        </div>
      </form>
    </div>
  </div>
)}

     {/* Edit Invite Modal */}
     {showEditModal && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
      <div className="flex justify-between items-center border-b px-6 py-4">
        <h3 className="text-lg font-semibold text-gray-800">Edit Invite</h3>
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Club ID *</label>
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Guest Name *</label>
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md ${formErrors.date ? 'border-red-500' : 'border-gray-300'}`}
            required
          />
           <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Invited By (Member ID)</label>
                <input
                  type="number"
                  name="invited_by"
                  value={formData.invited_by}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  min="1"
                />
                <p className="mt-1 text-xs text-gray-500">Optional - leave blank if not applicable</p>
              </div>
              
          {formErrors.date && <p className="mt-1 text-sm text-red-600">{formErrors.date}</p>}
        </div>
        
        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={() => setShowEditModal(false)}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Save Changes
          </button>
        </div>
      </form>
    </div>
  </div>
)}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center border-b px-6 py-4">
              <h3 className="text-lg font-semibold text-gray-800">Confirm Delete</h3>
              <button onClick={() => setShowDeleteModal(false)} className="text-gray-400 hover:text-gray-500">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <p className="text-gray-600 mb-6">Are you sure you want to delete this invite? This action cannot be undone.</p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteInvite}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Delete
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
