
import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchFreeInvites,
  addInvite,
  editInviteById,
  deleteInviteById,
  markInviteAsUsed,
  clearError,
} from '../../redux/slices/invitesSlice';
import { Modal, Button, Space, Form } from 'antd';
import { RiVipCrown2Line } from 'react-icons/ri';
import { toast } from 'react-hot-toast';
import moment from 'moment';
import { useDebounce } from 'use-debounce';
import usePermission from '../../hooks/usePermission';
import InviteTable from './InviteTable';
import InviteFilters from './InviteFilters';
import InviteForm from './InviteForm';
import BASE_URL from '../../config/api';

/**
 * مكون لعرض قائمة الدعوات المجانية مع إمكانية الإضافة، التعديل، الحذف، والتصفية.
 * @returns {JSX.Element} واجهة قائمة الدعوات
 */
const InviteList = () => {
  const dispatch = useDispatch();
  const {
    invites: { results: invites = [], count: totalItems = 0, next, previous },
    loading,
    error,
  } = useSelector((state) => state.invites);

  const [userClub, setUserClub] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [form] = Form.useForm();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedInvite, setSelectedInvite] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [filterGuestName, setFilterGuestName] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [debouncedFilters] = useDebounce(
    { filterGuestName, filterStatus, filterDate },
    500
  );
  const actionButtonsRef = useRef(null);

  const canViewInvites = usePermission('view_freeinvite');
  const canAddInvites = usePermission('add_freeinvite');

  // Fetch user profile
  useEffect(() => {
    if (!canViewInvites) {
      setLoadingProfile(false);
      return;
    }
    fetch(`${BASE_URL}accounts/api/profile/`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        if (data?.club?.id) {
          setUserClub({ id: data.club.id, name: data.club.name });
        }
        setLoadingProfile(false);
      })
      .catch((err) => {
        console.error('Failed to fetch profile:', err);
        setLoadingProfile(false);
      });
  }, [canViewInvites]);

  // Fetch invites with debounced filters
  useEffect(() => {
    if (userClub && canViewInvites) {
      dispatch(
        fetchFreeInvites({
          page: currentPage,
          page_size: itemsPerPage,
          club: userClub.id,
          guest_name: debouncedFilters.filterGuestName || undefined,
          status: debouncedFilters.filterStatus || undefined,
          date: debouncedFilters.filterDate || undefined,
        })
      );
    }
  }, [dispatch, userClub, canViewInvites, currentPage, itemsPerPage, debouncedFilters]);

  // Reset page on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedFilters]);

  // Handle error toasts
  useEffect(() => {
    if (error) {
      toast.error(typeof error === 'string' ? error : error.message || 'حدث خطأ');
      dispatch(clearError());
    }
  }, [error, dispatch]);

  // Modal handlers
  const openAddModal = () => {
    form.resetFields();
    form.setFieldsValue({ club: userClub?.id, status: 'pending' });
    setShowAddModal(true);
  };

  const openEditModal = (invite) => {
    setSelectedInvite(invite);
    form.setFieldsValue({
      club: userClub?.id,
      guest_name: invite.guest_name,
      phone: invite.phone,
      date: invite.date ? moment(invite.date) : null,
      status: invite.status,
      invited_by: invite.invited_by_details?.membership_number,
      rfid_code: invite.rfid_code || '',
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (invite) => {
    setSelectedInvite(invite);
    setShowDeleteModal(true);
  };

  const handleAddInvite = async (values) => {
    try {
      await dispatch(
        addInvite({
          ...values,
          club: Number(values.club),
          date: values.date.format('YYYY-MM-DD'),
          invited_by: values.invited_by || null,
        })
      ).unwrap();
      toast.success('تمت إضافة الدعوة بنجاح');
      setShowAddModal(false);
      form.resetFields();
    } catch (err) {
      toast.error('فشل في إضافة الدعوة');
    }
  };

  const handleEditInvite = async (values) => {
    try {
      await dispatch(
        editInviteById({
          inviteId: selectedInvite.id,
          inviteData: {
            ...values,
            club: Number(values.club),
            date: values.date.format('YYYY-MM-DD'),
            invited_by: values.invited_by || null,
          },
        })
      ).unwrap();
      toast.success('تم تعديل الدعوة بنجاح');
      setShowEditModal(false);
    } catch (err) {
      toast.error('فشل في تعديل الدعوة');
    }
  };

  const handleDeleteInvite = async () => {
    try {
      await dispatch(deleteInviteById(selectedInvite.id)).unwrap();
      toast.success('تم حذف الدعوة بنجاح');
      setShowDeleteModal(false);
    } catch (err) {
      toast.error('فشل في حذف الدعوة');
    }
  };

  const handleMarkUsed = async (invite) => {
    try {
      await dispatch(markInviteAsUsed(invite.id)).unwrap();
      toast.success('تم تعليم الدعوة كمستخدمة');
    } catch (err) {
      toast.error('فشل في تعليم الدعوة كمستخدمة');
    }
  };

  // Pagination
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

  if (loadingProfile) {
    return <div className="flex justify-center items-center h-screen">جاري التحميل...</div>;
  }

  if (!canViewInvites) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center p-4" dir="rtl">
        <RiVipCrown2Line className="text-red-600 text-4xl mb-4" />
        <h2 className="text-xl font-bold text-gray-700 mb-2">لا يوجد صلاحية</h2>
        <p className="text-gray-500">ليس لديك الصلاحيات اللازمة لعرض الدعوات المجانية.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6" dir="rtl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-3 space-x-reverse">
          <RiVipCrown2Line className="text-blue-600 w-8 h-8" />
          <h2 className="text-2xl font-bold">الدعوات المجانية</h2>
        </div>
        {canAddInvites && (
          <Button type="primary" onClick={openAddModal} disabled={!userClub}>
            إضافة دعوة جديدة
          </Button>
        )}
      </div>

      <InviteFilters
        guestName={filterGuestName}
        status={filterStatus}
        date={filterDate}
        onGuestNameChange={setFilterGuestName}
        onStatusChange={setFilterStatus}
        onDateChange={setFilterDate}
        onReset={() => {
          setFilterGuestName('');
          setFilterStatus('');
          setFilterDate('');
          setCurrentPage(1);
        }}
      />

      <InviteTable
        invites={invites}
        loading={loading}
        onEdit={openEditModal}
        onDelete={openDeleteModal}
        onMarkUsed={handleMarkUsed}
      />

      <div className="flex flex-col sm:flex-row justify-between items-center mt-6" dir="rtl">
        {totalItems > 0 && (
          <>
            <div className="text-sm text-gray-700">
              عرض {(currentPage - 1) * itemsPerPage + 1}–
              {Math.min(currentPage * itemsPerPage, totalItems)} من {totalItems} دعوة
            </div>
            <Space>
              <Select
                value={itemsPerPage}
                onChange={(value) => {
                  setItemsPerPage(value);
                  setCurrentPage(1);
                }}
                options={[10, 20, 50].map((size) => ({
                  label: `${size} لكل صفحة`,
                  value: size,
                }))}
              />
              <Button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
              >
                الأول
              </Button>
              <Button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                السابق
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .slice(Math.max(0, currentPage - 3), Math.min(totalPages, currentPage + 2))
                .map((page) => (
                  <Button
                    key={page}
                    type={currentPage === page ? 'primary' : 'default'}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </Button>
                ))}
              <Button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                التالي
              </Button>
              <Button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
              >
                الأخير
              </Button>
            </Space>
          </>
        )}
      </div>

      {/* Add Invite Modal */}
      <Modal
        open={showAddModal}
        title="إضافة دعوة جديدة"
        onCancel={() => setShowAddModal(false)}
        footer={null}
      >
        <InviteForm
          form={form}
          onSubmit={handleAddInvite}
          initialValues={{ club: userClub?.id, status: 'pending' }}
          isEditMode={false}
          userClub={userClub}
          onCancel={() => setShowAddModal(false)}
        />
      </Modal>

      {/* Edit Invite Modal */}
      <Modal
        open={showEditModal}
        title="تعديل الدعوة"
        onCancel={() => setShowEditModal(false)}
        footer={null}
      >
        <InviteForm
          form={form}
          onSubmit={handleEditInvite}
          initialValues={{
            club: userClub?.id,
            guest_name: selectedInvite?.guest_name,
            phone: selectedInvite?.phone,
            date: selectedInvite?.date ? moment(selectedInvite.date) : null,
            status: selectedInvite?.status,
            invited_by: selectedInvite?.invited_by_details?.membership_number,
            rfid_code: selectedInvite?.rfid_code || '',
          }}
          isEditMode={true}
          userClub={userClub}
          onCancel={() => setShowEditModal(false)}
        />
      </Modal>

      {/* Delete Invite Modal */}
      <Modal
        open={showDeleteModal}
        title="حذف الدعوة"
        onCancel={() => setShowDeleteModal(false)}
        footer={
          <Space>
            <Button onClick={() => setShowDeleteModal(false)}>إلغاء</Button>
            <Button type="primary" danger onClick={handleDeleteInvite}>
              حذف
            </Button>
          </Space>
        }
      >
        <p>هل أنت متأكد أنك تريد حذف دعوة "{selectedInvite?.guest_name}"؟</p>
      </Modal>
    </div>
  );
};

InviteList.propTypes = {
  // No props are passed directly to InviteList
};

export default InviteList;
