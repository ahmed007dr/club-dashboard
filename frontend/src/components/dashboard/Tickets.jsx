import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchTickets,
  fetchTicketTypes,
  addTicket,
  editTicketById,
  deleteTicketById,
} from "../../redux/slices/ticketsSlice"; // المسار الصحيح
import { FaTicketAlt } from "react-icons/fa";
import { RiForbidLine } from "react-icons/ri";
import { MoreVertical, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/DropdownMenu";
import { Button } from "../ui/button"; 
import { Input } from "../ui/input"; 
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog"; 
import BASE_URL from "../../config/api";
import { toast } from "react-hot-toast";
import usePermission from "../../hooks/usePermission"; 
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"; 

const Tickets = () => {
  const dispatch = useDispatch();
  const canViewTickets = usePermission("view_ticket");
  const canAddTickets = usePermission("add_ticket");
  const canEditTickets = usePermission("change_ticket");
  const canDeleteTickets = usePermission("delete_ticket");

  const {
    tickets: { results: tickets = [], count: totalItems = 0, next: prevPage, previous: nextPage },
    ticketTypes,
    loading: ticketsLoading,
    error,
  } = useSelector((state) => state.tickets);

  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [userClub, setUserClub] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [formError, setFormError] = useState(null);
  const [selectedPrice, setSelectedPrice] = useState(null);
  const [selectedTicketType, setSelectedTicketType] = useState(null);

  const [filterTicketType, setFilterTicketType] = useState("");
  const [filterIssueDate, setFilterIssueDate] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const itemsPerPageOptions = [5, 10, 15];
  const actionButtonsRef = useRef(null);

  const [ticketFormData, setTicketFormData] = useState({
    ticket_type: "",
    notes: "",
  });

  useEffect(() => {
    if (!canViewTickets) {
      setLoadingProfile(false);
      return;
    }
    setLoadingProfile(true);
    fetch(`${BASE_URL}/accounts/api/profile/`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json",
      },
    })
      .then((response) => {
        if (!response.ok) throw new Error(`Profile fetch failed: ${response.status}`);
        return response.json();
      })
      .then((data) => {
        setUserClub({ id: data.club.id, name: data.club.name });
        setLoadingProfile(false);
      })
      .catch((err) => {
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
  }, [
    currentPage,
    dispatch,
    filterTicketType,
    filterIssueDate,
    itemsPerPage,
    userClub,
    canViewTickets,
  ]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterTicketType, filterIssueDate]);

  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

  const getPageNumbers = () => {
    const maxPagesToShow = 5;
    const halfPages = Math.floor(maxPagesToShow / 2);
    let startPage = Math.max(1, currentPage - halfPages);
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
  };

  const handlePageChange = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages && totalItems > 0) {
      setCurrentPage(pageNumber);
    }
  };

  const handlePrevious = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(parseInt(e.target.value));
    setCurrentPage(1);
  };

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
      ticket_type: ticket.ticket_type?.id?.toString() || "",
      notes: ticket.notes || "",
    });
    setSelectedPrice(ticket.ticket_type?.price || null);
    setSelectedTicketType(selectedType || null);
    setFormError(null);
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
    setSelectedTicket(null);
    setSelectedPrice(null);
    setSelectedTicketType(null);
    setFormError(null);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (actionButtonsRef.current && actionButtonsRef.current.contains(e.target)) return;
      if (!e.target.closest(".modal-container")) {
        closeAllModals();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleTicketFormChange = (e) => {
    const { name, value } = e.target;
    setTicketFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTicketTypeButtonClick = (type) => {
    setTicketFormData((prev) => ({ ...prev, ticket_type: type.id.toString() }));
    setSelectedPrice(type.price);
    setSelectedTicketType(type);
    toast.success(`تم اختيار التذكرة بنوع ${type.name} بقيمة ${type.price} جنيه`);
  };

  const handleEditTicketTypeButtonClick = (type) => {
    setSelectedTicket((prev) => ({ ...prev, ticket_type: type.id.toString() }));
    setSelectedPrice(type.price);
    setSelectedTicketType(type);
    toast.success(`تم اختيار التذكرة بنوع ${type.name} بقيمة ${type.price} جنيه`);
  };

  const handleCreateTicketSubmit = async (e) => {
    e.preventDefault();
    if (!ticketFormData.ticket_type) {
      toast.error("يرجى اختيار نوع التذكرة");
      return;
    }
    if (!ticketFormData.notes) {
      toast.error("يرجى إدخال ملاحظات التذكرة");
      return;
    }
    if (!userClub) {
      toast.error("خطأ: لا يمكن إضافة تذكرة بدون نادي مرتبط");
      return;
    }

    // جلب معرف المستخدم من localStorage (يجب تعديله حسب طريقة التوثيق)
    const userId = localStorage.getItem("userId") || userClub.id; // افتراضي، يجب تعديله

    const ticketData = {
      club: userClub.id,
      ticket_type_id: parseInt(ticketFormData.ticket_type),
      notes: ticketFormData.notes,
      issued_by: userId,
    };

    dispatch(addTicket(ticketData))
      .unwrap()
      .then((response) => {
        const { serial_number, price } = response;
        const currentTime = new Date().toLocaleTimeString('ar-EG');
        toast.success(`تم إضافة تذكرة ${serial_number} بقيمة ${price} جنيه عند الساعة ${currentTime}`);
        dispatch(fetchTickets({
          page: 1,
          page_size: itemsPerPage,
          club: userClub.id,
          ticket_type: filterTicketType,
          issue_date: filterIssueDate,
        }));
        setTicketFormData({ ticket_type: "", notes: "" });
        setSelectedPrice(null);
        setSelectedTicketType(null);
      })
      .catch((err) => {
        console.error("Error adding ticket:", err);
        toast.error(`فشل في إضافة التذكرة: ${err}`);
      });
  };

  const handleEditSave = (e) => {
    if (!selectedTicket || !userClub) {
      setFormError("خطأ: التذكرة أو النادي غير متاح");
      return;
    }
    if (!selectedTicket.ticket_type) {
      toast.error("يرجى اختيار نوع التذكرة");
      return;
    }
    if (!selectedTicket.notes) {
      toast.error("يرجى إدخال ملاحظات التذكرة");
      return;
    }
    const userId = localStorage.getItem("userId") || userClub.id; // افتراضي، يجب تعديله
    const updatedTicketData = {
      club: userClub.id,
      ticket_type_id: parseInt(selectedTicket.ticket_type),
      notes: selectedTicket.notes,
      issued_by: userId,
    };
    dispatch(editTicketById({ ticketId: selectedTicket.id, ticketData: updatedTicketData }))
      .unwrap()
      .then((response) => {
        toast.success("تم تعديل التذكرة بنجاح!");
        dispatch(fetchTickets({
          page: currentPage,
          page_size: itemsPerPage,
          club: userClub.id,
          ticket_type: filterTicketType,
          issue_date: filterIssueDate,
        }));
        closeAllModals();
      })
      .catch((err) => {
        setFormError(`فشل في تعديل التذكرة: ${err}`);
        toast.error(`فشل في تعديل التذكرة: ${err}`);
      });
  };

  const handleDelete = () => {
    if (!selectedTicket) {
      return;
    }
    dispatch(deleteTicketById(selectedTicket.id))
      .unwrap()
      .then(() => {
        toast.success("تم حذف التذكرة بنجاح!");
        dispatch(fetchTickets({
          page: currentPage,
          page_size: itemsPerPage,
          club: userClub.id,
          ticket_type: filterTicketType,
          issue_date: filterIssueDate,
        }));
        closeAllModals();
      })
      .catch((err) => {
        toast.error(`فشل في حذف التذكرة: ${err}`);
      });
  };

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
      </div>

      {canAddTickets && (
        <div className="mb-6 bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-4">إضافة تذكرة جديدة</h3>
          {formError && (
            <div className="bg-red-100 text-red-700 p-2 rounded mb-4 text-right text-sm">{formError}</div>
          )}
          <form onSubmit={handleCreateTicketSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-right">نوع التذكرة</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                {ticketTypes.map((type) => (
                  <Button
                    key={type.id}
                    type="button"
                    variant={ticketFormData.ticket_type === type.id.toString() ? "default" : "outline"}
                    className="text-sm w-full"
                    onClick={() => handleTicketTypeButtonClick(type)}
                  >
                    {type.name} ({type.price} جنيه)
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-right">ملاحظات</label>
              <Input
                type="text"
                name="notes"
                value={ticketFormData.notes}
                onChange={handleTicketFormChange}
                placeholder="أدخل ملاحظات التذكرة"
                required
                className="w-full"
              />
            </div>
            {selectedPrice !== null && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-right">
                <p className="text-sm font-medium text-gray-700">
                  السعر: <span className="text-green-600 font-bold">{selectedPrice} جنيه</span>
                </p>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setTicketFormData({ ticket_type: "", notes: "" });
                  setSelectedPrice(null);
                  setSelectedTicketType(null);
                  setFormError(null);
                }}
              >
                إلغاء
              </Button>
              <Button type="submit" disabled={ticketsLoading || !userClub || !ticketFormData.ticket_type}>
                {ticketsLoading ? <Loader2 className="animate-spin h-4 w-4" /> : "إضافة"}
              </Button>
            </div>
          </form>
        </div>
      )}

      <div className="mb-6 bg-white p-4 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">تصفية التذاكر</h3>
          <Button
            variant="outline"
            onClick={() => {
              setFilterTicketType("");
              setFilterIssueDate("");
              setCurrentPage(1);
            }}
          >
            إعادة التصفية
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">نوع التذكرة</label>
            <Select value={filterTicketType} onValueChange={setFilterTicketType}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="كل الأنواع" />
              </SelectTrigger>
              <SelectContent>
                {ticketTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id.toString()}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">تاريخ الإصدار</label>
            <Input
              type="date"
              value={filterIssueDate}
              onChange={(e) => setFilterIssueDate(e.target.value)}
              className="w-full"
            />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        {tickets.length > 0 ? (
          <>
            <table className="min-w-full bg-white shadow rounded hidden lg:table">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-3 px-4 text-right text-sm font-medium text-gray-700">الرقم التسلسلي</th>
                  <th className="py-3 px-4 text-right text-sm font-medium text-gray-700">نوع التذكرة</th>
                  <th className="py-3 px-4 text-right text-sm font-medium text-gray-700">السعر</th>
                  <th className="py-3 px-4 text-right text-sm font-medium text-gray-700">وقت الإصدار</th>
                  <th className="py-3 px-4 text-right text-sm font-medium text-gray-700">ملاحظات</th>
                  <th className="py-3 px-4 text-right text-sm font-medium text-gray-700">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {tickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 text-right text-sm">{ticket.serial_number}</td>
                    <td className="py-3 px-4 text-right text-sm">{ticket.ticket_type?.name || '-'}</td>
                    <td className="py-3 px-4 text-right text-sm">{ticket.price} جنيه</td>
                    <td className="py-3 px-4 text-right text-sm">
                      {new Date(ticket.issue_datetime).toLocaleString('ar-EG')}
                    </td>
                    <td className="py-3 px-4 text-right text-sm">{ticket.notes}</td>
                    <td className="py-3 px-4 text-right">
                      <DropdownMenu dir="rtl">
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-5 w-5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem onClick={(e) => openViewModal(ticket, e)}>
                            عرض التفاصيل
                          </DropdownMenuItem>
                          {canEditTickets && (
                            <DropdownMenuItem onClick={(e) => openEditModal(ticket, e)}>
                              تعديل
                            </DropdownMenuItem>
                          )}
                          {canDeleteTickets && (
                            <DropdownMenuItem onClick={(e) => openDeleteModal(ticket, e)}>
                              حذف
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="lg:hidden space-y-4">
              {tickets.map((ticket) => (
                <div key={ticket.id} className="border rounded-lg p-4 bg-white shadow-sm">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold">{ticket.serial_number}</span>
                    <DropdownMenu dir="rtl">
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-5 w-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem onClick={(e) => openViewModal(ticket, e)}>
                          عرض التفاصيل
                        </DropdownMenuItem>
                        {canEditTickets && (
                          <DropdownMenuItem onClick={(e) => openEditModal(ticket, e)}>
                            تعديل
                          </DropdownMenuItem>
                        )}
                        {canDeleteTickets && (
                          <DropdownMenuItem onClick={(e) => openDeleteModal(ticket, e)}>
                            حذف
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <p className="text-sm">نوع التذكرة: {ticket.ticket_type?.name || '-'}</p>
                  <p className="text-sm">السعر: {ticket.price} جنيه</p>
                  <p className="text-sm">وقت الإصدار: {new Date(ticket.issue_datetime).toLocaleString('ar-EG')}</p>
                  <p className="text-sm">ملاحظات: {ticket.notes}</p>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="text-center text-gray-500">لا توجد تذاكر متاحة</p>
        )}
      </div>

      {totalItems > 0 && (
        <div className="flex flex-wrap justify-between items-center mt-6 space-y-4 sm:space-y-0">
          <div className="text-sm text-gray-700">
            عرض {(currentPage - 1) * itemsPerPage + 1}–
            {Math.min(currentPage * itemsPerPage, totalItems)} من {totalItems} تذكرة
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {itemsPerPageOptions.map((option) => (
                  <SelectItem key={option} value={option.toString()}>
                    {option} لكل صفحة
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1 || totalItems === 0}
            >
              الأول
            </Button>
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentPage === 1 || totalItems === 0}
            >
              السابق
            </Button>
            {getPageNumbers().map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                onClick={() => handlePageChange(page)}
                disabled={totalItems === 0}
              >
                {page}
              </Button>
            ))}
            {totalPages > getPageNumbers().length && getPageNumbers()[getPageNumbers().length - 1] < totalPages && (
              <span className="px-3 py-1 text-sm">...</span>
            )}
            <Button
              variant="outline"
              onClick={handleNext}
              disabled={currentPage === totalPages || totalItems === 0}
            >
              التالي
            </Button>
            <Button
              variant="outline"
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage === totalPages || totalItems === 0}
            >
              الأخير
            </Button>
          </div>
        </div>
      )}

      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent dir="rtl" className="max-w-md modal-container">
          <DialogHeader>
            <DialogTitle className="text-right text-2xl font-bold">تعديل التذكرة</DialogTitle>
            <DialogDescription className="text-right text-sm text-gray-500">
              هذا الحوار يسمح لك بتعديل نوع التذكرة والملاحظات.
            </DialogDescription>
          </DialogHeader>
          {formError && (
            <div className="bg-red-100 text-red-700 p-2 rounded mb-4 text-right text-sm">{formError}</div>
          )}
          {selectedTicket && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-right">نوع التذكرة</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {ticketTypes.map((type) => (
                    <Button
                      key={type.id}
                      type="button"
                      variant={selectedTicket.ticket_type === type.id.toString() ? "default" : "outline"}
                      className="text-sm w-full"
                      onClick={() => handleEditTicketTypeButtonClick(type)}
                    >
                      {type.name} ({type.price} جنيه)
                    </Button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-right">ملاحظات</label>
                <Input
                  type="text"
                  name="notes"
                  value={selectedTicket.notes || ""}
                  onChange={(e) =>
                    setSelectedTicket((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  placeholder="أدخل ملاحظات التذكرة"
                  required
                  className="w-full"
                />
              </div>
              {selectedPrice !== null && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-right">
                  <p className="text-sm font-medium text-gray-700">
                    السعر: <span className="text-green-600 font-bold">{selectedPrice} جنيه</span>
                  </p>
                </div>
              )}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={closeAllModals}>
                  إلغاء
                </Button>
                <Button onClick={handleEditSave} disabled={ticketsLoading}>
                  {ticketsLoading ? <Loader2 className="animate-spin h-4 w-4" /> : "حفظ"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent dir="rtl" className="max-w-sm modal-container">
          <DialogHeader>
            <DialogTitle className="text-right text-xl font-bold">حذف التذكرة</DialogTitle>
            <DialogDescription className="text-right text-sm text-gray-500">
              هذا الحوار يطالبك بتأكيد حذف التذكرة.
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm">
            هل أنت متأكد من حذف التذكرة؟
          </p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={closeAllModals}>
              إلغاء
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              حذف
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
        <DialogContent dir="rtl" className="max-w-md modal-container">
          <DialogHeader>
            <DialogTitle className="text-right text-2xl font-bold">تفاصيل التذكرة</DialogTitle>
            <DialogDescription className="text-right text-sm text-gray-500">
              هذا الحوار يعرض تفاصيل التذكرة المختارة.
            </DialogDescription>
          </DialogHeader>
          {selectedTicket && (
            <div className="space-y-2">
              <p><strong>الرقم التسلسلي:</strong> {selectedTicket.serial_number}</p>
              <p><strong>نوع التذكرة:</strong> {selectedTicket.ticket_type?.name || '-'}</p>
              <p><strong>السعر:</strong> {selectedTicket.price} جنيه</p>
              <p><strong>وقت الإصدار:</strong> {new Date(selectedTicket.issue_datetime).toLocaleString('ar-EG')}</p>
              <p><strong>ملاحظات:</strong> {selectedTicket.notes}</p>
              <div className="flex justify-end mt-4">
                <Button variant="outline" onClick={closeAllModals}>
                  إغلاق
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Tickets;