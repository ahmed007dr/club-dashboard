import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchTickets,
  fetchTicketTypes,
  addTicket,
  editTicketById,
  deleteTicketById,
  fetchTicketBookReport,
  createTicketBook,
  fetchCurrentTicketBook,
} from "../../redux/slices/ticketsSlice";
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs";
import BASE_URL from "../../config/api";
import { toast } from "react-hot-toast";
import usePermission from "@/hooks/usePermission";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

const Tickets = () => {
  const dispatch = useDispatch();
  const canViewTickets = usePermission("view_ticket");
  const canAddTickets = usePermission("add_ticket");
  const canEditTickets = usePermission("change_ticket");
  const canDeleteTickets = usePermission("delete");

  const {
    tickets: { results: tickets = [], count: totalItems = 0, next, previous },
    ticketTypes,
    ticketBook,
    ticketBookReport,
    loading,
    error,
  } = useSelector((state) => state.tickets);

  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showCreateBookModal, setShowCreateBookModal] = useState(false);
  const [userClub, setUserClub] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [formError, setFormError] = useState(null);
  const [selectedPrice, setSelectedPrice] = useState(null);
  const [selectedTicketType, setSelectedTicketType] = useState(null);

  const [filterTicketType, setFilterTicketType] = useState("");
  const [filterIssueDate, setFilterIssueDate] = useState("");

  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const itemsPerPageOptions = [5, 10, 20];
  const actionButtonsRef = useRef(null);

  const [ticketFormData, setTicketFormData] = useState({
    ticket_type: "",
  });
  const [bookFormData, setBookFormData] = useState({
    ticket_type: "",
    total_tickets: "",
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
      });
  }, [canViewTickets]);

  useEffect(() => {
    if (userClub && canViewTickets) {
      dispatch(fetchTicketTypes());
    }
  }, [dispatch, userClub, canViewTickets]);

  useEffect(() => {
    if (userClub && ticketFormData.ticket_type) {
      dispatch(fetchCurrentTicketBook({
        club: userClub.id,
        ticket_type: ticketFormData.ticket_type,
      }));
    }
  }, [dispatch, userClub, ticketFormData.ticket_type]);

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
    });
    setSelectedPrice(ticket.ticket_type_details?.price || null);
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

  const openCreateBookModal = () => {
    closeAllModals();
    setShowCreateBookModal(true);
    setFormError(null);
  };

  const closeAllModals = () => {
    setShowEditModal(false);
    setShowDeleteModal(false);
    setShowViewModal(false);
    setShowCreateBookModal(false);
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

  const handleBookFormChange = (e) => {
    const { name, value } = e.target;
    setBookFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTicketTypeButtonClick = (type) => {
    setTicketFormData((prev) => ({ ...prev, ticket_type: type.id.toString() }));
    setSelectedPrice(type.price);
    setSelectedTicketType(type);
    toast.success(
      `تم اختيار التذكرة بنوع ${type.name} بقيمة ${type.price} جنيه`
    );
  };

  const handleBookTicketTypeButtonClick = (type) => {
    setBookFormData((prev) => ({ ...prev, ticket_type: type.id.toString() }));
  };

  const handleEditTicketTypeButtonClick = (type) => {
    setSelectedTicket((prev) => ({ ...prev, ticket_type: type.id.toString() }));
    setSelectedPrice(type.price);
    setSelectedTicketType(type);
    toast.success(
      `تم اختيار التذكرة بنوع ${type.name} بقيمة ${type.price} جنيه`
    );
  };

  const handleCreateTicketSubmit = async (e) => {
    e.preventDefault();
    if (!ticketFormData.ticket_type) {
      toast.error("يرجى اختيار نوع التذكرة");
      return;
    }
    if (!userClub) {
      toast.error("خطأ: لا يمكن إضافة تذكرة بدون نادي مرتبط");
      return;
    }
    let ticketBookId = ticketBook?.id || ticketBook;
    if (!ticketBookId) {
      const bookData = {
        club: userClub.id,
        ticket_type: parseInt(ticketFormData.ticket_type),
        total_tickets: 100,
      };
      try {
        const result = await dispatch(createTicketBook(bookData)).unwrap();
        ticketBookId = result.id || result;
        toast.success(`تم إنشاء دفتر جديد: ${result.serial_prefix}`);
      } catch (err) {
        const errorMessage = typeof err === 'string' ? err : (err.detail || err.message || JSON.stringify(err));
        setFormError(`فشل في إنشاء دفتر: ${errorMessage}`);
        toast.error(`فشل في إنشاء دفتر: ${errorMessage}`);
        return;
      }
    }
    const ticketData = {
      club: userClub.id,
      ticket_type: parseInt(ticketFormData.ticket_type),
      ticket_book: parseInt(ticketBookId),
      issue_date: new Date().toISOString().split('T')[0],
    };
    dispatch(addTicket(ticketData))
      .unwrap()
      .then((response) => {
        const { serial_number, book } = response;
        const remainingTickets = book.remaining_tickets;
        toast.success(
          `تم إضافة تذكرة ${serial_number} في دفتر ${book.serial_prefix}، باقي من الدفتر ${remainingTickets}`
        );
        if (remainingTickets === 0) {
          toast.info("الدفتر اكتمل، يرجى إنشاء دفتر جديد.");
        }
        dispatch(fetchTickets({
          page: 1,
          page_size: itemsPerPage,
          club: userClub.id,
          ticket_type: filterTicketType,
          issue_date: filterIssueDate,
        }));
        dispatch(fetchCurrentTicketBook({
          club: userClub.id,
          ticket_type: ticketFormData.ticket_type,
        }));
        setTicketFormData({ ticket_type: "" });
        setSelectedPrice(null);
        setSelectedTicketType(null);
      })
      .catch((err) => {
        const errorMessage = typeof err === 'string' ? err : (err.detail || err.message || JSON.stringify(err));
        setFormError(`فشل في إضافة التذكرة: ${errorMessage}`);
        toast.error(`فشل في إضافة التذكرة: ${errorMessage}`);
      });
  };

  const handleCreateBookSubmit = (e) => {
    e.preventDefault();
    if (!userClub) {
      toast.error("خطأ: لا يمكن إنشاء دفتر بدون نادي مرتبط");
      return;
    }
    if (!bookFormData.ticket_type) {
      toast.error("يرجى اختيار نوع التذكرة");
      return;
    }
    if (!bookFormData.total_tickets || parseInt(bookFormData.total_tickets) < 1) {
      toast.error("يرجى إدخال عدد صحيح لحجم الدفتر (أكبر من 0)");
      return;
    }
    const bookData = {
      club: userClub.id,
      ticket_type: parseInt(bookFormData.ticket_type),
      total_tickets: parseInt(bookFormData.total_tickets),
    };
    dispatch(createTicketBook(bookData))
      .unwrap()
      .then((response) => {
        toast.success(`تم إنشاء دفتر ${response.serial_prefix} بنجاح!`);
        setBookFormData({ ticket_type: "", total_tickets: "" });
        setShowCreateBookModal(false);
        dispatch(fetchCurrentTicketBook({
          club: userClub.id,
          ticket_type: bookFormData.ticket_type,
        }));
      })
      .catch((err) => {
        const errorMessage = typeof err === 'string' ? err : (err.detail || err.message || JSON.stringify(err));
        setFormError(`فشل في إنشاء الدفتر: ${errorMessage}`);
        toast.error(`فشل في إنشاء الدفتر: ${errorMessage}`);
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
    const updatedTicketData = {
      club: userClub.id,
      ticket_type: parseInt(selectedTicket.ticket_type),
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
        const errorMessage = typeof err === 'string' ? err : (err.detail || err.message || JSON.stringify(err));
        setFormError(`فشل في تعديل التذكرة: ${errorMessage}`);
        toast.error(`فشل في تعديل التذكرة: ${errorMessage}`);
      });
  };

  const handleDelete = () => {
    if (!selectedTicket) {
      return;
    }
    dispatch(deleteTicketById(selectedTicket.id))
      .unwrap()
      .then((response) => {
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
        const errorMessage = typeof err === 'string' ? err : (err.detail || err.message || JSON.stringify(err));
        toast.error(`فشل في حذف التذكرة: ${errorMessage}`);
      });
  };

  const handleReportDateChange = (e) => {
    setReportDate(e.target.value);
  };

  const fetchReport = () => {
    if (!reportDate) {
      toast.error("يرجى اختيار تاريخ التقرير");
      return;
    }
    dispatch(fetchTicketBookReport({ date: reportDate }))
      .unwrap()
      .then((response) => {
        toast.success("تم جلب تقرير الدفاتر بنجاح!");
      })
      .catch((err) => {
        const errorMessage = typeof err === 'string' ? err : (err.detail || err.message || JSON.stringify(err));
        toast.error(`فشل في جلب تقرير الدفاتر: ${errorMessage}`);
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

  if (loading || loadingProfile) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="animate-spin w-8 h-8 text-green-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6" dir="rtl">
      <Tabs defaultValue="tickets" className="space-y-6">
        <TabsList className="bg-gray-100 rounded-lg p-1 flex flex-wrap justify-center">
          <TabsTrigger value="tickets" className="px-4 py-2 rounded-md data-[state=active]:bg-white">التذاكر</TabsTrigger>
          {canViewTickets && (
            <TabsTrigger value="report" className="px-4 py-2 rounded-md data-[state=active]:bg-white">تقرير الدفاتر</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="tickets">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
            <div className="flex items-center gap-3">
              <FaTicketAlt className="text-green-600 w-8 h-8" />
              <h2 className="text-2xl font-bold">إدارة التذاكر</h2>
            </div>
            {canAddTickets && (
              <Button
                onClick={openCreateBookModal}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                إضافة دفتر
              </Button>
            )}
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
                {selectedPrice !== null && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-right">
                    <p className="text-sm font-medium text-gray-700">
                      السعر: <span className="text-green-600 font-bold">{selectedPrice} جنيه</span>
                    </p>
                    {ticketBook && (
                      <p className="text-sm font-medium text-gray-700">
                        المتبقي من الدفتر: <span className="text-green-600 font-bold">{ticketBook.remaining_tickets} تذكرة</span>
                      </p>
                    )}
                  </div>
                )}
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setTicketFormData({ ticket_type: "" });
                      setSelectedPrice(null);
                      setSelectedTicketType(null);
                      setFormError(null);
                    }}
                  >
                    إلغاء
                  </Button>
                  <Button type="submit" disabled={loading || !userClub}>
                    {loading ? <Loader2 className="animate-spin h-4 w-4" /> : "إضافة"}
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
                      <th className="py-3 px-4 text-right text-sm font-medium text-gray-700">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {tickets.map((ticket) => (
                      <tr key={ticket.id} className="hover:bg-gray-50">
                        <td className="py-3 px-4 text-right text-sm">{ticket.serial_number}</td>
                        <td className="py-3 px-4 text-right text-sm">{ticket.ticket_type_details?.name || ticket.ticket_type_display}</td>
                        <td className="py-3 px-4 text-right text-sm">{ticket.price} جنيه</td>
                        <td className="py-3 px-4 text-right text-sm">
                          {new Date(ticket.issue_datetime).toLocaleString('ar-EG')}
                        </td>
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
                      <p className="text-sm">نوع التذكرة: {ticket.ticket_type_details?.name || ticket.ticket_type_display}</p>
                      <p className="text-sm">السعر: {ticket.price} جنيه</p>
                      <p className="text-sm">وقت الإصدار: {new Date(ticket.issue_datetime).toLocaleString('ar-EG')}</p>
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
        </TabsContent>

        <TabsContent value="report">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium mb-4">تقرير الدفاتر</h3>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium mb-1">تاريخ التقرير</label>
                <Input
                  type="date"
                  value={reportDate}
                  onChange={handleReportDateChange}
                  className="w-full"
                />
              </div>
              <Button
                className="mt-6 sm:mt-0 bg-green-600 hover:bg-green-700 text-white"
                onClick={fetchReport}
              >
                جلب التقرير
              </Button>
            </div>
            {ticketBookReport.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white rounded">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="py-3 px-4 text-right text-sm font-medium text-gray-700">رقم الدفتر</th>
                      <th className="py-3 px-4 text-right text-sm font-medium text-gray-700">إجمالي التذاكر</th>
                      <th className="py-3 px-4 text-right text-sm font-medium text-gray-700">التذاكر المصدرة</th>
                      <th className="py-3 px-4 text-right text-sm font-medium text-gray-700">إجمالي التذاكر المصدرة</th>
                      <th className="py-3 px-4 text-right text-sm font-medium text-gray-700">التسلسل</th>
                      <th className="py-3 px-4 text-right text-sm font-medium text-gray-700">أرقام التذاكر</th>
                      <th className="py-3 px-4 text-right text-sm font-medium text-gray-700">المتبقي</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {ticketBookReport.map((book, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="py-3 px-4 text-right text-sm">{book.book_serial}</td>
                        <td className="py-3 px-4 text-right text-sm">{book.total_tickets}</td>
                        <td className="py-3 px-4 text-right text-sm">{book.issued_tickets}</td>
                        <td className="py-3 px-4 text-right text-sm">{book.total_issued_tickets}</td>
                        <td className="py-3 px-4 text-right text-sm">
                          <span className={`px-2 py-1 rounded text-xs ${book.is_sequential ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}>
                            {book.is_sequential ? "تسلسلي" : "غير تسلسلي"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right text-sm">{book.serial_numbers.join(", ")}</td>
                        <td className="py-3 px-4 text-right text-sm">{book.remaining_tickets}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center text-gray-500">لا توجد بيانات لتقرير الدفاتر</p>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={showCreateBookModal} onOpenChange={setShowCreateBookModal}>
        <DialogContent dir="rtl" className="max-w-md modal-container">
          <DialogHeader>
            <DialogTitle className="text-right text-2xl font-bold">إنشاء دفتر تذاكر جديد</DialogTitle>
            <DialogDescription className="text-right text-sm text-gray-500">
              هذا الحوار يسمح لك بإنشاء دفتر تذاكر جديد بناءً على نوع التذكرة وعدد التذاكر.
            </DialogDescription>
          </DialogHeader>
          {formError && (
            <div className="bg-red-100 text-red-700 p-2 rounded mb-4 text-right text-sm">{formError}</div>
          )}
          <form onSubmit={handleCreateBookSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-right">نوع التذكرة</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {ticketTypes.map((type) => (
                  <Button
                    key={type.id}
                    type="button"
                    variant={bookFormData.ticket_type === type.id.toString() ? "default" : "outline"}
                    className="text-sm w-full"
                    onClick={() => handleBookTicketTypeButtonClick(type)}
                  >
                    {type.name} ({type.price} جنيه)
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-right">حجم الدفتر (عدد التذاكر)</label>
              <Input
                type="number"
                name="total_tickets"
                value={bookFormData.total_tickets}
                onChange={handleBookFormChange}
                placeholder="أدخل عدد التذاكر"
                min="1"
                required
                className="w-full"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setBookFormData({ ticket_type: "", total_tickets: "" });
                  setFormError(null);
                  setShowCreateBookModal(false);
                }}
              >
                إلغاء
              </Button>
              <Button type="submit" disabled={loading || !userClub}>
                {loading ? <Loader2 className="animate-spin h-4 w-4" /> : "إنشاء دفتر"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent dir="rtl" className="max-w-md modal-container">
          <DialogHeader>
            <DialogTitle className="text-right text-2xl font-bold">تعديل التذكرة</DialogTitle>
            <DialogDescription className="text-right text-sm text-gray-500">
              هذا الحوار يسمح لك بتعديل نوع التذكرة.
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
                <Button onClick={handleEditSave} disabled={loading}>
                  {loading ? <Loader2 className="animate-spin h-4 w-4" /> : "حفظ"}
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
              <p><strong>نوع التذكرة:</strong> {selectedTicket.ticket_type_details?.name || selectedTicket.ticket_type_display}</p>
              <p><strong>السعر:</strong> {selectedTicket.price} جنيه</p>
              <p><strong>وقت الإصدار:</strong> {new Date(selectedTicket.issue_datetime).toLocaleString('ar-EG')}</p>
              <p><strong>رقم الدفتر:</strong> {selectedTicket.book?.serial_prefix || 'غير محدد'}</p>
              <p><strong>المتبقي من الدفتر:</strong> {selectedTicket.book?.remaining_tickets || 'غير محدد'}</p>
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