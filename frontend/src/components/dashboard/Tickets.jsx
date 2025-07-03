// src/components/dashboard/Tickets.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTicketTypes, fetchTickets } from '../../redux/slices/ticketsSlice';
import { FaTicketAlt } from 'react-icons/fa';
import { RiForbidLine } from 'react-icons/ri';
import { Loader2 } from 'lucide-react';
import usePermission from '../../hooks/usePermission';
import BASE_URL from '../../config/api';
import { toast } from 'react-hot-toast';
import TicketForm from './TicketForm';
import AddTicketTypeModal from './AddTicketTypeModal';
import TicketFilters from './TicketFilters';
import TicketTable from './TicketTable';
import TicketPagination from './TicketPagination';
import TicketModals from './TicketModals';
import { Button } from '../ui/button';

const Tickets = () => {
  const dispatch = useDispatch();
  const canViewTickets = usePermission('view_ticket');
  const canAddTickets = usePermission('add_ticket');
  const canEditTickets = usePermission('change_ticket');
  const canDeleteTickets = usePermission('delete_ticket');

  const {
    tickets: { results: tickets = [], count: totalItems = 0 },
    ticketTypes,
    loading: ticketsLoading,
    error,
  } = useSelector((state) => state.tickets);

  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showAddTicketTypeModal, setShowAddTicketTypeModal] = useState(false);
  const [userClub, setUserClub] = useState(null);
  const [userId, setUserId] = useState(null); // تعريف userId
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [filterTicketType, setFilterTicketType] = useState('');
  const [filterIssueDate, setFilterIssueDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const actionButtonsRef = useRef(null);

  useEffect(() => {
    if (!canViewTickets) {
      setLoadingProfile(false);
      return;
    }
    setLoadingProfile(true);
    fetch(`${BASE_URL}accounts/api/profile/`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
    })
      .then((response) => {
        if (!response.ok) throw new Error(`Profile fetch failed: ${response.status}`);
        return response.json();
      })
      .then((data) => {
//         console.log('Profile data:', data);
        setUserClub({ id: data.club.id, name: data.club.name });
        setUserId(data.id); // تعيين userId من الرد
        localStorage.setItem('userId', data.id); // تخزين userId
        setLoadingProfile(false);
      })
      .catch((err) => {
        console.error('Profile fetch error:', err);
        setLoadingProfile(false);
        toast.error(`خطأ في جلب الملف الشخصي: ${err.message}`);
      });
  }, [canViewTickets]);

  useEffect(() => {
    if (userClub && canViewTickets) {
      dispatch(fetchTicketTypes());
    }
  }, [dispatch, userClub, canViewTickets]);

  useEffect(() => {
    if (userClub && canViewTickets) {
      dispatch(fetchTickets({
        page: currentPage,
        page_size: itemsPerPage,
        club: userClub.id,
        ticket_type: filterTicketType,
        issue_date: filterIssueDate,
      }));
    }
  }, [currentPage, dispatch, filterTicketType, filterIssueDate, itemsPerPage, userClub, canViewTickets]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterTicketType, filterIssueDate]);

  const openViewModal = (ticket, e) => {
    if (e) e.stopPropagation();
    closeAllModals();
    setSelectedTicket(ticket);
    setShowViewModal(true);
  };

  const openEditModal = (ticket, e) => {
    if (e) e.stopPropagation();
    closeAllModals();
    const selectedType = ticketTypes.find((type) => type.id === ticket.ticket_type?.id);
    setSelectedTicket({
      id: ticket.id,
      ticket_type: ticket.ticket_type?.id?.toString() || '',
      notes: ticket.notes || '',
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (ticket, e) => {
    if (e) e.stopPropagation();
    closeAllModals();
    setSelectedTicket(ticket);
    setShowDeleteModal(true);
  };

  const closeAllModals = () => {
    setShowEditModal(false);
    setShowDeleteModal(false);
    setShowViewModal(false);
    setShowAddTicketTypeModal(false);
    setSelectedTicket(null);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (actionButtonsRef.current && actionButtonsRef.current.contains(e.target)) return;
      if (!e.target.closest('.modal-container')) {
        closeAllModals();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!canViewTickets) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center p-4" dir="rtl">
        <RiForbidLine className="text-red-600 w-16 h-16 mb-4" />
        <h2 className="text-xl font-bold text-gray-700 mb-2">لا يوجد صلاحية</h2>
        <p className="text-gray-500 max-w-md">ليس لديك الصلاحيات اللازمة لعرض التذاكر.</p>
      </div>
    );
  }

  if (ticketsLoading || loadingProfile) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="animate-spin w-8 h-8 text-green-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6" dir="rtl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
        <div className="flex items-center gap-3">
          <FaTicketAlt className="text-green-600 w-8 h-8" />
          <h2 className="text-2xl font-bold">إدارة التذاكر</h2>
        </div>
        {canAddTickets && (
          <Button
            variant="default"
            onClick={() => setShowAddTicketTypeModal(true)}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            إضافة نوع تذكرة جديد
          </Button>
        )}
      </div>

      <AddTicketTypeModal
        open={showAddTicketTypeModal}
        onOpenChange={setShowAddTicketTypeModal}
        userClub={userClub}
        canAddTickets={canAddTickets}
      />
      <TicketForm
        userClub={userClub}
        userId={userId} // تمرير userId
        canAddTickets={canAddTickets}
        itemsPerPage={itemsPerPage}
        filterTicketType={filterTicketType}
        filterIssueDate={filterIssueDate}
      />
      <TicketFilters
        filterTicketType={filterTicketType}
        setFilterTicketType={setFilterTicketType}
        filterIssueDate={filterIssueDate}
        setFilterIssueDate={setFilterIssueDate}
        setCurrentPage={setCurrentPage}
      />
      <TicketTable
        tickets={tickets}
        canEditTickets={canEditTickets}
        canDeleteTickets={canDeleteTickets}
        openViewModal={openViewModal}
        openEditModal={openEditModal}
        openDeleteModal={openDeleteModal}
      />
      <TicketPagination
        currentPage={currentPage}
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
        setCurrentPage={setCurrentPage}
        setItemsPerPage={setItemsPerPage}
      />
      <TicketModals
        selectedTicket={selectedTicket}
        setSelectedTicket={setSelectedTicket}
        showEditModal={showEditModal}
        setShowEditModal={setShowEditModal}
        showDeleteModal={showDeleteModal}
        setShowDeleteModal={setShowDeleteModal}
        showViewModal={showViewModal}
        setShowViewModal={setShowViewModal}
        userClub={userClub}
        currentPage={currentPage}
        itemsPerPage={itemsPerPage}
        filterTicketType={filterTicketType}
        filterIssueDate={filterIssueDate}
        canEditTickets={canEditTickets}
      />
    </div>
  );
};

export default Tickets;