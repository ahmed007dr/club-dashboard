import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  fetchReceipts,
  deleteReceipt,
  updateReceipt,
  fetchReceiptById,
} from "../../redux/slices/receiptsSlice";
import { CiTrash, CiEdit } from "react-icons/ci";
import { HiOutlineDocumentReport } from "react-icons/hi";
import AddReceiptForm from "./AddReceiptForm";
import { Button } from "../ui/button";
import { toast } from "react-hot-toast";
import { fetchSubscriptions } from "../../redux/slices/subscriptionsSlice";
import usePermission from "@/hooks/usePermission";

function Receipts() {
  const dispatch = useDispatch();
  const { receipts, status, error, pagination } = useSelector(
    (state) => state.receipts
  );
  const { subscriptions } = useSelector((state) => state.subscriptions);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchField, setSearchField] = useState("invoice_number");
  const [searchError, setSearchError] = useState("");
  const [inputError, setInputError] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [editData, setEditData] = useState({
    id: "",
    club: "",
    identifier: "",
    member: "",
    subscription: "",
    amount: "",
    payment_method: "cash",
    note: "",
    invoice_number: "",
  });
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [receiptToDelete, setReceiptToDelete] = useState(null);
  const [filteredReceipts, setFilteredReceipts] = useState(receipts);
  const [totalInfo, setTotalInfo] = useState({ total: 0, count: 0 });
  const [allSubscriptions, setAllSubscriptions] = useState([]);

  const canViewReceipts = usePermission("view_receipt");
  const canEditReceipts = usePermission("change_receipt");
  const canDeleteReceipts = usePermission("delete_receipt");
  const canAddReceipts = usePermission("add_receipt");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(pagination.currentPage || 1);
  const itemsPerPage = 20;
  const totalPages = Math.ceil(pagination.count / itemsPerPage);

  // Search fields configuration
  const searchFields = [
    { value: "invoice_number", label: "رقم الفاتورة" },
    { value: "amount", label: "المبلغ" },
    { value: "payment_method", label: "طريقة الدفع" },
    { value: "note", label: "ملاحظة" },
    { value: "club_name", label: "اسم النادي" },
    { value: "member_name", label: "اسم العضو" },
  ];

  // Fetch subscriptions for dropdowns (limited or summarized data)
  const fetchDropdownSubscriptions = async () => {
    try {
      // Fetch only the first page or a summarized endpoint for subscriptions
      const response = await dispatch(fetchSubscriptions({ page: 1 })).unwrap();
      const results = Array.isArray(response)
        ? response
        : response.results || response.data || response.subscriptions || [];
      setAllSubscriptions(results);
      console.log("Fetched subscriptions for dropdowns:", results.length);
    } catch (error) {
      console.error("Failed to fetch subscriptions:", error.message);
      toast.error("فشل في تحميل بيانات الاشتراكات");
    }
  };

  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        await dispatch(fetchReceipts(currentPage)).unwrap();
      } catch (error) {
        console.error("Failed to fetch receipts:", error.message);
        toast.error("فشل في تحميل الإيصالات");
      }
    };
    fetchData();
  }, [dispatch, currentPage]);

  // Fetch subscriptions only once on mount
  useEffect(() => {
    fetchDropdownSubscriptions();
  }, [dispatch]);

  // Data filtering helpers
  const uniqueClubs = Array.from(
    new Map(
      allSubscriptions.map((sub) => [
        sub.club,
        {
          id: sub.club,
          name: sub.club_details?.name || "Unknown Club",
        },
      ])
    ).values()
  );

  const getFilteredMembers = (clubId) => {
    return clubId
      ? allSubscriptions.filter((sub) => sub.club === parseInt(clubId))
      : allSubscriptions;
  };

  const getUniqueMembers = (clubId) => {
    const filtered = getFilteredMembers(clubId);
    return Array.from(
      new Map(
        filtered.map((sub) => [
          sub.member,
          {
            id: sub.member,
            name: sub.member_details?.name || sub.member_name || "Unknown Member",
            phone: sub.member_details?.phone || "",
            rfid_code: sub.member_details?.rfid_code || "",
          },
        ])
      ).values()
    );
  };

  const getFilteredSubscriptions = (memberId) => {
    return memberId
      ? allSubscriptions.filter((sub) => sub.member === parseInt(memberId))
      : [];
  };

  // Resolve identifier to member ID
  const resolveIdentifierToMember = (identifier, clubId) => {
    if (!identifier || !clubId) return null;
    const members = getUniqueMembers(clubId);
    const identifierLower = identifier.trim().toLowerCase();
    const member = members.find(
      (m) =>
        (m.name && m.name.toLowerCase().includes(identifierLower)) ||
        (m.phone && m.phone.toLowerCase().includes(identifierLower)) ||
        (m.rfid_code && m.rfid_code.toLowerCase().includes(identifierLower))
    );
    return member ? member.id : null;
  };

  // Update member ID when identifier or club changes
  useEffect(() => {
    const memberId = resolveIdentifierToMember(editData.identifier, editData.club);
    setEditData((prev) => ({
      ...prev,
      member: memberId ? memberId.toString() : "",
      subscription: memberId ? prev.subscription : "",
    }));
  }, [editData.identifier, editData.club]);

  // Format and validate invoice number
  const formatInvoiceNumber = (value) => {
    let cleaned = value.toUpperCase().replace(/[^A-Z0-9-]/g, "");
    if (
      cleaned.startsWith("INV") &&
      cleaned.length > 11 &&
      !cleaned.includes("-")
    ) {
      cleaned = `${cleaned.slice(0, 11)}-${cleaned.slice(11)}`;
    }
    return cleaned.slice(0, 16);
  };

  const validateInvoiceNumber = (value) => {
    const invoiceRegex = /^INV\d{8}-\d{4}$/;
    return invoiceRegex.test(value);
  };

  const handleSearchInputChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setSearchError("");

    if (searchField === "invoice_number") {
      const formattedValue = formatInvoiceNumber(value);
      setSearchTerm(formattedValue);

      if (value && !validateInvoiceNumber(formattedValue)) {
        setInputError(
          "صيغة غير صحيحة. المتوقع: INVYYYYMMDD-NNNN (مثال: INV20250429-0003)"
        );
      } else {
        setInputError("");
      }
    } else {
      setInputError("");
    }
  };

  const resetSearch = () => {
    setSearchTerm("");
    setSearchError("");
    setInputError("");
    setFilteredReceipts(
      [...receipts].sort((a, b) => new Date(b.date) - new Date(a.date))
    );
    setCurrentPage(1);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchError("");
    setInputError("");

    if (!searchTerm.trim()) {
      const sortedReceipts = [...receipts].sort((a, b) =>
        new Date(b.date) - new Date(a.date)
      );
      setFilteredReceipts(sortedReceipts);
      setCurrentPage(1);
      return;
    }

    const searchTermLower = searchTerm.trim().toLowerCase();

    const filtered = receipts
      .filter((receipt) => {
        switch (searchField) {
          case "invoice_number":
            return receipt.invoice_number?.toLowerCase().includes(searchTermLower);
          case "amount":
            return receipt.amount?.toString().includes(searchTermLower);
          case "payment_method":
            return (
              (receipt.payment_method === "cash" &&
                "نقدي".includes(searchTermLower)) ||
              (receipt.payment_method === "bank" &&
                "تحويل بنكي".includes(searchTermLower)) ||
              (receipt.payment_method === "visa" &&
                "فيزا".includes(searchTermLower)) ||
              receipt.payment_method?.toLowerCase().includes(searchTermLower)
            );
          case "note":
            return receipt.note?.toLowerCase().includes(searchTermLower);
          case "club_name":
            return receipt.club_details?.name?.toLowerCase().includes(searchTermLower);
          case "member_name":
            return receipt.member_details?.name?.toLowerCase().includes(searchTermLower);
          default:
            return true;
        }
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    setFilteredReceipts(filtered);
    setCurrentPage(1);
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "club" && { identifier: "", member: "", subscription: "" }),
      ...(name === "identifier" && { subscription: "" }),
    }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setIsUpdating(true);

    const memberId = resolveIdentifierToMember(editData.identifier, editData.club);
    if (!memberId) {
      toast.error("لم يتم العثور على عضو مطابق لهذا المعرف");
      setIsUpdating(false);
      return;
    }

    const { id, identifier, ...receiptData } = editData;
    receiptData.club = parseInt(receiptData.club) || null;
    receiptData.member = memberId;
    receiptData.subscription = parseInt(receiptData.subscription) || null;
    receiptData.amount = parseFloat(receiptData.amount) || 0;

    try {
      await dispatch(
        updateReceipt({
          receiptId: id,
          receiptData,
        })
      ).unwrap();
      await dispatch(fetchReceipts(currentPage));
      toast.success("تم تحديث الإيصال بنجاح");
    } catch (error) {
      console.error("Update error:", error);
      toast.error("حدث خطأ أثناء تحديث الإيصال");
    } finally {
      setIsUpdating(false);
      setShowEditModal(false);
    }
  };

  const handleDelete = (receiptId) => {
    setReceiptToDelete(receiptId);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      await dispatch(deleteReceipt(receiptToDelete)).unwrap();
      await dispatch(fetchReceipts(currentPage));
      toast.success("تم حذف الإيصال بنجاح");
    } catch (error) {
      console.error("Error deleting receipt:", error);
      toast.error("حدث خطأ أثناء حذف الإيصال");
    } finally {
      setShowDeleteConfirm(false);
      setReceiptToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setReceiptToDelete(null);
  };

  const handleEdit = (receiptId) => {
    dispatch(fetchReceiptById(receiptId));
    setShowEditModal(true);
  };

  useEffect(() => {
    if (currentReceipt) {
      setEditData({
        id: currentReceipt.id,
        club: currentReceipt.club?.toString() || "",
        identifier: currentReceipt.member_details?.name || "",
        member: currentReceipt.member?.toString() || "",
        subscription: currentReceipt.subscription?.toString() || "",
        amount: currentReceipt.amount || "",
        payment_method: currentReceipt.payment_method || "cash",
        note: currentReceipt.note || "",
        invoice_number: currentReceipt.invoice_number || "",
      });
    }
  }, [currentReceipt]);

  useEffect(() => {
    const sortedReceipts = [...receipts].sort((a, b) =>
      new Date(b.date) - new Date(a.date)
    );
    setFilteredReceipts(sortedReceipts);
  }, [receipts]);

  // Pagination handler
  const paginate = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  if (status === "loading")
    return (
      <div className="flex justify-center items-center h-screen text-sm sm:text-base">
        جاري التحميل...
      </div>
    );
  if (error)
    return (
      <div className="text-red-500 text-center p-4 text-sm sm:text-base">
        خطأ: {error}
      </div>
    );

  if (!canViewReceipts) {
    return (
      <div className="text-red-500 text-center p-4 text-sm sm:text-base">
        ليس لديك صلاحية لاظهار الإيصالات
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8" dir="rtl">
      {/* Header and Add Receipt Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-3">
          <HiOutlineDocumentReport className="text-blue-600 w-6 h-6 sm:w-8 sm:h-8" />
          <h2 className="text-xl sm:text-2xl font-bold">الإيصالات</h2>
        </div>
        {canAddReceipts && (
          <Button
            onClick={() => setShowForm(true)}
            className="flex items-center w-full sm:w-auto btn"
          >
            إضافة إيصال
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
          </Button>
        )}
      </div>

      {/* Search Form */}
      <form
        onSubmit={handleSearch}
        className="flex flex-col sm:flex-row gap-2 mb-6 w-full"
      >
        <div className="flex flex-col sm:flex-row gap-2 w-full">
          <select
            value={searchField}
            onChange={(e) => setSearchField(e.target.value)}
            className="w-full sm:w-1/4 px-3 py-2 border border-gray-300 rounded-md text-sm sm:text-base"
          >
            {searchFields.map((field) => (
              <option key={field.value} value={field.value}>
                {field.label}
              </option>
            ))}
          </select>

          <div className="relative w-full">
            <input
              type={searchField === "amount" ? "number" : "text"}
              placeholder={`ابحث بـ ${
                searchFields.find((f) => f.value === searchField)?.label || ""
              }`}
              value={searchTerm}
              onChange={handleSearchInputChange}
              className={`w-full px-3 py-2 border text-sm sm:text-base ${
                inputError ? "border-red-500" : "border-gray-300"
              } rounded-md focus:outline-none focus:ring focus:ring-blue-200`}
            />
            {inputError && (
              <p className="absolute text-red-500 text-xs mt-1">{inputError}</p>
            )}
          </div>
        </div>

        <Button
          type="submit"
          className="w-full sm:w-auto bg-blue-500 hover:bg-blue-600 text-white text-sm sm:text-base py-2 px-4"
          disabled={status === "loading"}
        >
          {status === "loading" ? "جاري البحث..." : "بحث"}
        </Button>

        {searchTerm && (
          <Button
            type="button"
            onClick={resetSearch}
            className="w-full sm:w-auto bg-gray-500 hover:bg-gray-600 text-white text-sm sm:text-base py-2 px-4"
          >
            إعادة تعيين
          </Button>
        )}
      </form>
      {searchError && (
        <p className="text-red-500 text-sm mb-4">{searchError}</p>
      )}

      {/* Receipts Table */}
      <div className="overflow-x-auto">
        {filteredReceipts.length > 0 ? (
          <>
            {/* Table for Medium Screens and Above */}
            <table className="min-w-full divide-y divide-gray-200 hidden md:table">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 sm:px-6 py-3 text-right text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">
                    الإجراءات
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-right text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">
                    المبلغ
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-right text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">
                    طريقة الدفع
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-right text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">
                    ملاحظة
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-right text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">
                    رقم الفاتورة
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-right text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">
                    النادي
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-right text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">
                    العضو
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredReceipts.map((receipt) => (
                  <tr key={receipt.id}>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm flex gap-2">
                      {canEditReceipts && (
                        <button
                          onClick={() => handleEdit(receipt.id)}
                          className="text-indigo-600 hover:text-indigo-900"
                          aria-label="تعديل الإيصال"
                        >
                          <CiEdit className="w-5 h-5" />
                        </button>
                      )}
                      {canDeleteReceipts && (
                        <button
                          onClick={() => handleDelete(receipt.id)}
                          className="text-red-600 hover:text-red-900"
                          aria-label="حذف الإيصال"
                        >
                          <CiTrash className="w-5 h-5" />
                        </button>
                      )}
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-sm">
                      {receipt.amount}
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-sm capitalize">
                      {receipt.payment_method === "cash"
                        ? "نقدي"
                        : receipt.payment_method === "bank"
                        ? "تحويل بنكي"
                        : receipt.payment_method === "visa"
                        ? "فيزا"
                        : receipt.payment_method}
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-sm">
                      {receipt.note || "لا يوجد"}
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-sm">
                      {receipt.invoice_number}
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-sm">
                      {receipt.club_details?.name || "غير معروف"}
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-sm">
                      {receipt.member_details?.name || "غير معروف"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Card Layout for Mobile and Small Screens */}
            <div className="md:hidden space-y-4">
              {filteredReceipts.map((receipt) => (
                <div
                  key={receipt.id}
                  className="border rounded-md p-4 bg-white shadow-sm"
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-semibold">
                      رقم الفاتورة: {receipt.invoice_number}
                    </span>
                    <div className="flex gap-2">
                      {canEditReceipts && (
                        <button
                          onClick={() => handleEdit(receipt.id)}
                          className="text-indigo-600 hover:text-indigo-900"
                          aria-label="تعديل الإيصال"
                        >
                          <CiEdit className="w-5 h-5" />
                        </button>
                      )}
                      {canDeleteReceipts && (
                        <button
                          onClick={() => handleDelete(receipt.id)}
                          className="text-red-600 hover:text-red-900"
                          aria-label="حذف الإيصال"
                        >
                          <CiTrash className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-sm">
                    <strong>المبلغ:</strong> {receipt.amount}
                  </p>
                  <p className="text-sm">
                    <strong>طريقة الدفع:</strong>{" "}
                    {receipt.payment_method === "cash"
                      ? "نقدي"
                      : receipt.payment_method === "bank"
                      ? "تحويل بنكي"
                      : receipt.payment_method === "visa"
                      ? "فيزا"
                      : receipt.payment_method}
                  </p>
                  <p className="text-sm">
                    <strong>النادي:</strong>{" "}
                    {receipt.club_details?.name || "غير معروف"}
                  </p>
                  <p className="text-sm">
                    <strong>العضو:</strong>{" "}
                    {receipt.member_details?.name || "غير معروف"}
                  </p>
                  <p className="text-sm">
                    <strong>ملاحظة:</strong> {receipt.note || "لا يوجد"}
                  </p>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="p-4 text-gray-500 text-sm sm:text-base">
            {searchTerm
              ? "لم يتم العثور على إيصال بهذه المعايير"
              : "لم يتم العثور على إيصالات"}
          </p>
        )}
      </div>

      {/* Total Info */}
      <div className="flex justify-end mt-4">
        <Button
          onClick={() =>
            setTotalInfo({
              count: filteredReceipts.length,
              total: filteredReceipts.reduce(
                (acc, receipt) => acc + (parseFloat(receipt.amount) || 0),
                0
              ),
            })
          }
          className="w-full sm:w-auto bg-primary text-white px-4 sm:px-6 py-2 text-sm sm:text-base"
        >
          حساب الإجمالي
        </Button>
      </div>

      {totalInfo.count > 0 && (
        <div className="mt-4 bg-gray-50 border rounded-md p-4 text-right space-y-1">
          <p className="text-sm font-semibold text-gray-700">
            عدد الإيصالات: {totalInfo.count}
          </p>
          <p className="text-sm font-semibold text-gray-700">
            إجمالي الإيصالات: {totalInfo.total} جنيه
          </p>
        </div>
      )}

      {/* Pagination Controls */}
      <div className="flex justify-between items-center mt-4" dir="rtl">
        {pagination.count === 0 && (
          <div className="text-sm text-gray-600">لا توجد إيصالات لعرضها</div>
        )}
        {pagination.count > 0 && (
          <>
            <div className="text-sm text-gray-600">
              عرض {(currentPage - 1) * itemsPerPage + 1} إلى{" "}
              {Math.min(currentPage * itemsPerPage, pagination.count)} من{" "}
              {pagination.count} إيصال
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => paginate(1)}
                disabled={currentPage === 1 || pagination.count === 0}
                className={`px-3 py-1 rounded ${
                  currentPage === 1 || pagination.count === 0
                    ? "bg-gray-200 opacity-50 cursor-not-allowed"
                    : "bg-blue-700 text-white hover:bg-blue-800"
                }`}
              >
                الأول
              </button>
              <button
                onClick={() => paginate(currentPage - 1)}
                disabled={!pagination.previous || pagination.count === 0}
                className={`px-3 py-1 rounded ${
                  !pagination.previous || pagination.count === 0
                    ? "bg-gray-200 opacity-50 cursor-not-allowed"
                    : "bg-blue-700 text-white hover:bg-blue-800"
                }`}
              >
                السابق
              </button>
              {(() => {
                const maxButtons = 5;
                const sideButtons = Math.floor(maxButtons / 2);
                let start = Math.max(1, currentPage - sideButtons);
                let end = Math.min(totalPages, currentPage + sideButtons);

                if (end - start + 1 < maxButtons) {
                  if (currentPage <= sideButtons) {
                    end = Math.min(totalPages, maxButtons);
                  } else {
                    start = Math.max(1, totalPages - maxButtons + 1);
                  }
                }

                return Array.from(
                  { length: end - start + 1 },
                  (_, i) => start + i
                ).map((page) => (
                  <button
                    key={page}
                    onClick={() => paginate(page)}
                    disabled={pagination.count === 0}
                    className={`px-3 py-1 rounded ${
                      currentPage === page && pagination.count > 0
                        ? "bg-blue-700 text-white"
                        : "bg-gray-200 hover:bg-gray-300"
                    } ${
                      pagination.count === 0
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    }`}
                  >
                    {page}
                  </button>
                ));
              })()}
              <button
                onClick={() => paginate(currentPage + 1)}
                disabled={!pagination.next || pagination.count === 0}
                className={`px-3 py-1 rounded ${
                  !pagination.next || pagination.count === 0
                    ? "bg-gray-200 opacity-50 cursor-not-allowed"
                    : "bg-blue-700 text-white hover:bg-blue-800"
                }`}
              >
                التالي
              </button>
              <button
                onClick={() => paginate(totalPages)}
                disabled={currentPage === totalPages || pagination.count === 0}
                className={`px-3 py-1 rounded ${
                  currentPage === totalPages || pagination.count === 0
                    ? "bg-gray-200 opacity-50 cursor-not-allowed"
                    : "bg-blue-700 text-white hover:bg-blue-800"
                }`}
              >
                الأخير
              </button>
            </div>
          </>
        )}
      </div>

      {/* Add Receipt Form Modal */}
      {showForm && canAddReceipts && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-medium leading-6 text-gray-900 mb-4">
                إضافة إيصال جديد
              </h3>
              <AddReceiptForm
                onClose={() => setShowForm(false)}
                clubs={uniqueClubs}
                subscriptions={allSubscriptions}
              />
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && canDeleteReceipts && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-medium leading-6 text-gray-900 mb-4">
                هل أنت متأكد من رغبتك في حذف هذا الإيصال؟
              </h3>
              <div className="flex justify-end space-x-3 space-x-reverse">
                <Button
                  onClick={cancelDelete}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm sm:text-base"
                >
                  إلغاء
                </Button>
                <Button
                  onClick={confirmDelete}
                  className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 text-sm sm:text-base"
                >
                  تأكيد
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && canEditReceipts && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-medium leading-6 text-gray-900 mb-4">
                تعديل الإيصال
              </h3>
              <form onSubmit={handleEditSubmit} className="space-y-4">
                {/* Club Dropdown */}
                <div>
                  <label className="block mb-1 font-medium text-gray-700">
                    اختر النادي
                  </label>
                  <select
                    name="club"
                    value={editData.club}
                    onChange={handleEditInputChange}
                    className="w-full border px-3 py-2 rounded-md text-sm sm:text-base"
                    required
                    disabled={isUpdating}
                  >
                    <option value="">-- اختر النادي --</option>
                    {uniqueClubs.map((club) => (
                      <option key={club.id} value={club.id}>
                        {club.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Member Identifier Input */}
                <div>
                  <label className="block mb-1 font-medium text-gray-700">
                    المعرف (اسم العضو، رقم الهاتف، أو RFID)
                  </label>
                  <input
                    type="text"
                    name="identifier"
                    value={editData.identifier}
                    onChange={handleEditInputChange}
                    className="w-full border px-3 py-2 rounded-md text-sm sm:text-base"
                    placeholder="أدخل اسم العضو، رقم الهاتف، أو RFID"
                    required
                    disabled={!editData.club || isUpdating}
                  />
                  {editData.identifier && !editData.member && (
                    <p className="mt-1 text-xs text-red-500">
                      لا يوجد عضو متطابق مع هذا المعرف
                    </p>
                  )}
                </div>

                {/* Subscription Dropdown */}
                <div>
                  <label className="block mb-1 font-medium text-gray-700">
                    اختر الاشتراك
                  </label>
                  <select
                    name="subscription"
                    value={editData.subscription}
                    onChange={handleEditInputChange}
                    className="w-full border px-3 py-2 rounded-md text-sm sm:text-base"
                    disabled={
                      !editData.member ||
                      isUpdating ||
                      !getFilteredSubscriptions(editData.member).length
                    }
                  >
                    <option value="">-- اختر الاشتراك (اختياري) --</option>
                    {editData.member &&
                      getFilteredSubscriptions(editData.member).map((sub) => (
                        <option key={sub.id} value={sub.id}>
                          {sub?.type_details?.name || "نوع غير معروف"} -{" "}
                          {sub?.type_details?.price || "0"} جنيه
                        </option>
                      ))}
                  </select>
                  {editData.member &&
                    getFilteredSubscriptions(editData.member).length === 0 && (
                      <p className="mt-1 text-xs text-red-500">
                        لا توجد اشتراكات متاحة لهذا العضو
                      </p>
                    )}
                </div>

                {/* Amount Input */}
                <div>
                  <label className="block mb-1 font-medium text-gray-700">
                    المبلغ
                  </label>
                  <input
                    type="number"
                    name="amount"
                    value={editData.amount}
                    onChange={handleEditInputChange}
                    className="w-full border px-3 py-2 rounded-md text-sm sm:text-base"
                    required
                    step="0.01"
                    min="0"
                    disabled={isUpdating}
                  />
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block mb-1 font-medium text-gray-700">
                    طريقة الدفع
                  </label>
                  <select
                    name="payment_method"
                    value={editData.payment_method}
                    onChange={handleEditInputChange}
                    className="w-full border px-3 py-2 rounded-md text-sm sm:text-base"
                    disabled={isUpdating}
                  >
                    <option value="cash">نقدي</option>
                    <option value="bank">تحويل بنكي</option>
                    <option value="visa">فيزا</option>
                  </select>
                </div>

                {/* Invoice Number */}
                <div>
                  <label className="block mb-1 font-medium text-gray-700">
                    رقم الفاتورة
                  </label>
                  <input
                    type="text"
                    value={editData.invoice_number}
                    className="w-full border px-3 py-2 rounded-md text-sm sm:text-base bg-gray-100"
                    readOnly
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    رقم الفاتورة لا يمكن تعديله
                  </p>
                </div>

                {/* Note */}
                <div>
                  <label className="block mb-1 font-medium text-gray-700">
                    ملاحظات
                  </label>
                  <textarea
                    name="note"
                    value={editData.note}
                    onChange={handleEditInputChange}
                    rows={3}
                    className="w-full border px-3 py-2 rounded-md text-sm sm:text-base"
                    disabled={isUpdating}
                  />
                </div>

                {/* Buttons */}
                <div className="flex justify-end space-x-3 space-x-reverse">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 text-sm sm:text-base"
                    disabled={isUpdating}
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 text-sm sm:text-base"
                    disabled={
                      isUpdating ||
                      !editData.club ||
                      !editData.identifier ||
                      !editData.member ||
                      !editData.amount
                    }
                  >
                    {isUpdating ? "جاري الحفظ..." : "حفظ التغييرات"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Receipts;