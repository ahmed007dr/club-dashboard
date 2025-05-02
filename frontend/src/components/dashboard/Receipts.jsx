import React, { useState, useEffect, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  fetchReceipts,
  deleteReceipt,
  updateReceipt,
  fetchReceiptById,
  fetchReceiptByInvoice,
} from "../../redux/slices/receiptsSlice";
import { CiTrash, CiEdit } from "react-icons/ci";
import { HiOutlineDocumentReport } from "react-icons/hi";
import AddReceiptForm from "./AddReceiptForm";
import { Button } from "../ui/button";

function Receipts() {
  const dispatch = useDispatch();
  const { receipts, status, error, message, currentReceipt } = useSelector(
    (state) => state.receipts
  );

  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchError, setSearchError] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [inputError, setInputError] = useState("");
  const [editData, setEditData] = useState({
    id: "",
    club: "",
    member: "",
    subscription: "",
    amount: "",
    payment_method: "CASH",
    note: "",
    invoice_number: "",
  });

  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [receiptToDelete, setReceiptToDelete] = useState(null);

  const [filteredReceipts, setFilteredReceipts] = useState(receipts);
  const [totalInfo, setTotalInfo] = useState({ total: 0, count: 0 });

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const itemsPerPageOptions = [5, 10, 20];

  // Extract unique clubs from receipts
  const uniqueClubs = useMemo(() => {
    const clubsMap = new Map();
    receipts.forEach((receipt) => {
      if (receipt.club_details) {
        clubsMap.set(receipt.club_details.id, {
          id: receipt.club_details.id,
          name: receipt.club_details.name,
        });
      }
    });
    return Array.from(clubsMap.values());
  }, [receipts]);

  // Extract unique subscriptions from receipts
  const uniqueSubscriptions = useMemo(() => {
    const subsMap = new Map();
    receipts.forEach((receipt) => {
      if (receipt.subscription_details) {
        subsMap.set(receipt.subscription_details.id, {
          id: receipt.subscription_details.id,
          name: receipt.subscription_details.name || `Subscription ${receipt.subscription_details.id}`,
        });
      }
    });
    return Array.from(subsMap.values());
  }, [receipts]);

  // Payment method choices
  const paymentMethods = [
    { value: "CASH", label: "نقدي" },
    { value: "CREDIT_CARD", label: "بطاقة ائتمان" },
    { value: "DEBIT_CARD", label: "بطاقة خصم" },
    { value: "BANK_TRANSFER", label: "تحويل بنكي" },
    { value: "VISA", label: "فيزا" },
  ];

  // Format and validate invoice number
  const formatInvoiceNumber = (value) => {
    let cleaned = value.toUpperCase().replace(/[^A-Z0-9-]/g, "");
    if (cleaned.startsWith("INV") && cleaned.length > 11 && !cleaned.includes("-")) {
      cleaned = `${cleaned.slice(0, 11)}-${cleaned.slice(11)}`;
    }
    return cleaned.slice(0, 16);
  };

  const validateInvoiceNumber = (value) => {
    const invoiceRegex = /^INV\d{8}-\d{4}$/;
    return invoiceRegex.test(value);
  };

  const handleSearchInputChange = (e) => {
    const value = formatInvoiceNumber(e.target.value);
    setSearchTerm(value);
    setSearchError("");
    if (value && !validateInvoiceNumber(value) && value.length >= 16) {
      setInputError(
        "صيغة غير صحيحة. المتوقع: INVYYYYMMDD-NNNN (مثال: INV20250429-0003)"
      );
    } else {
      setInputError("");
    }
  };

  const resetSearch = () => {
    setSearchTerm("");
    setSearchError("");
    setInputError("");
    setFilteredReceipts(receipts);
    setCurrentPage(1);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchError("");
    setInputError("");
    if (!searchTerm.trim()) {
      setFilteredReceipts(receipts);
      setCurrentPage(1);
      return;
    }
    if (!validateInvoiceNumber(searchTerm.trim())) {
      setSearchError(
        "صيغة رقم الفاتورة غير صحيحة. المتوقع: INVYYYYMMDD-NNNN (مثال: INV20250429-0003)"
      );
      return;
    }
    const filtered = receipts.filter((receipt) =>
      receipt.invoice_number.includes(searchTerm.trim().toUpperCase())
    );
    setFilteredReceipts(filtered);
    setCurrentPage(1);
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditData({
      ...editData,
      [name]: value,
    });
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    setIsUpdating(true);

    const { id, ...receiptData } = editData;
    receiptData.club = parseInt(receiptData.club) || null;
    receiptData.member = parseInt(receiptData.member) || null;
    receiptData.subscription = parseInt(receiptData.subscription) || null;
    receiptData.amount = parseFloat(receiptData.amount) || 0;

    dispatch(
      updateReceipt({
        receiptId: id,
        receiptData,
      })
    )
      .then(() => {
        dispatch(fetchReceipts());
      })
      .catch((error) => {
        console.error("Update error:", error);
      })
      .finally(() => {
        setIsUpdating(false);
        setShowEditModal(false);
      });
  };

  const handleDelete = (receiptId) => {
    setReceiptToDelete(receiptId);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    dispatch(deleteReceipt(receiptToDelete)).then(() => {
      dispatch(fetchReceipts());
    });
    setShowDeleteConfirm(false);
    setReceiptToDelete(null);
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
        member: currentReceipt.member || "",
        subscription: currentReceipt.subscription?.toString() || "",
        amount: currentReceipt.amount || "",
        payment_method: currentReceipt.payment_method || "CASH",
        note: currentReceipt.note || "",
        invoice_number: currentReceipt.invoice_number || "",
      });
    }
  }, [currentReceipt]);

  useEffect(() => {
    dispatch(fetchReceipts());
  }, [dispatch]);

  useEffect(() => {
    setFilteredReceipts(receipts);
    setCurrentPage(1);
  }, [receipts]);

  // Pagination logic
  const totalItems = filteredReceipts.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const paginatedReceipts = filteredReceipts.slice(startIndex, endIndex);

  // Generate page numbers for display
  const getPageNumbers = () => {
    const maxPagesToShow = 5;
    const halfPages = Math.floor(maxPagesToShow / 2);
    let startPage = Math.max(1, currentPage - halfPages);
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    const pages = [];
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

  const handlePageChange = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
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
    const newItemsPerPage = parseInt(e.target.value);
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
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

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8" dir="rtl">
      {/* Header and Add Receipt Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-3">
          <HiOutlineDocumentReport className="text-blue-600 w-6 h-6 sm:w-8 sm:h-8" />
          <h2 className="text-xl sm:text-2xl font-bold">الإيصالات</h2>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          className="flex items-center w-full sm:w-auto bg-blue-500 text-white px-4 py-2 text-sm sm:text-base"
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
      </div>

      {/* Search Form */}
      <form
        onSubmit={handleSearch}
        className="flex flex-col sm:flex-row gap-2 mb-6 w-full"
      >
        <div className="relative w-full">
          <input
            type="text"
            placeholder="أدخل رقم الفاتورة"
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
        {paginatedReceipts.length > 0 ? (
          <>
            {/* Table for Small Screens and Above */}
            <table className="min-w-full divide-y divide-gray-200 hidden sm:table">
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
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedReceipts.map((receipt) => (
                  <tr key={receipt.id}>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm flex gap-2">
                      <button
                        onClick={() => handleEdit(receipt.id)}
                        className="text-indigo-600 hover:text-indigo-900"
                        aria-label="تعديل الإيصال"
                      >
                        <CiEdit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(receipt.id)}
                        className="text-red-600 hover:text-red-900"
                        aria-label="حذف الإيصال"
                      >
                        <CiTrash className="w-5 h-5" />
                      </button>
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-sm">{receipt.amount}</td>
                    <td className="px-4 sm:px-6 py-4 text-sm capitalize">
                      {paymentMethods.find(
                        (method) => method.value === receipt.payment_method
                      )?.label || receipt.payment_method}
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-sm">{receipt.note || "لا يوجد"}</td>
                    <td className="px-4 sm:px-6 py-4 text-sm">{receipt.invoice_number}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Card Layout for Mobile */}
            <div className="sm:hidden space-y-4">
              {paginatedReceipts.map((receipt) => (
                <div
                  key={receipt.id}
                  className="border rounded-md p-4 bg-white shadow-sm"
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-semibold">
                      رقم الفاتورة: {receipt.invoice_number}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(receipt.id)}
                        className="text-indigo-600 hover:text-indigo-900"
                        aria-label="تعديل الإيصال"
                      >
                        <CiEdit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(receipt.id)}
                        className="text-red-600 hover:text-red-900"
                        aria-label="حذف الإيصال"
                      >
                        <CiTrash className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm">
                    <strong>المبلغ:</strong> {receipt.amount}
                  </p>
                  <p className="text-sm">
                    <strong>طريقة الدفع:</strong>{" "}
                    {paymentMethods.find(
                      (method) => method.value === receipt.payment_method
                    )?.label || receipt.payment_method}
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
            {searchTerm ? "لم يتم العثور على إيصال بهذا الرقم" : "لم يتم العثور على إيصالات"}
          </p>
        )}
      </div>

      {/* Total Info */}
      <div className="flex justify-end mt-4">
        <Button
          onClick={() =>
            setTotalInfo({
              count: paginatedReceipts.length,
              total: paginatedReceipts.reduce(
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
      {totalItems > 0 && (
        <div className="mt-6">
          {/* Items Per Page Selector */}
          <div className="flex flex-col sm:flex-row justify-between items-center mb-4 space-y-2 sm:space-y-0">
            <div>
              <label className="text-sm text-gray-700">
                عدد الإيصالات لكل صفحة:
                <select
                  value={itemsPerPage}
                  onChange={handleItemsPerPageChange}
                  className="ml-2 px-2 py-1 border border-gray-300 rounded-md text-sm"
                  aria-label="عدد الإيصالات لكل صفحة"
                >
                  {itemsPerPageOptions.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="text-sm text-gray-700">
              عرض {startIndex + 1}-{endIndex} من {totalItems} إيصال
            </div>
          </div>

          {/* Page Navigation */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2 space-x-reverse" dir="ltr">
              <Button
                onClick={handlePrevious}
                disabled={currentPage === 1}
                className={`px-3 py-1 text-sm ${
                  currentPage === 1
                    ? "bg-gray-200 cursor-not-allowed"
                    : "bg-blue-500 text-white hover:bg-blue-600"
                }`}
                aria-label="الصفحة السابقة"
              >
                السابق
              </Button>

              {getPageNumbers().map((page) => (
                <Button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`px-3 py-1 text-sm ${
                    currentPage === page
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 hover:bg-gray-300"
                  }`}
                  aria-label={`الصفحة ${page}`}
                >
                  {page}
                </Button>
              ))}

              {totalPages > getPageNumbers().length &&
                getPageNumbers()[getPageNumbers().length - 1] < totalPages && (
                  <span className="px-3 py-1 text-sm">...</span>
                )}

              <Button
                onClick={handleNext}
                disabled={currentPage === totalPages}
                className={`px-3 py-1 text-sm ${
                  currentPage === totalPages
                    ? "bg-gray-200 cursor-not-allowed"
                    : "bg-blue-500 text-white hover:bg-blue-600"
                }`}
                aria-label="الصفحة التالية"
              >
                التالي
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Add Receipt Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-medium leading-6 text-gray-900 mb-4">
                إضافة إيصال جديد
              </h3>
              <AddReceiptForm
                onClose={() => setShowForm(false)}
                clubs={uniqueClubs}
                subscriptions={uniqueSubscriptions}
              />
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4">
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
      {showEditModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-medium leading-6 text-gray-900 mb-4">
                تعديل الإيصال
              </h3>
              <form onSubmit={handleEditSubmit}>
                <div className="mb-4">
                  <label className="block text-gray-700 font \ font-medium mb-2 text-sm sm:text-base">
                    النادي
                  </label>
                  <select
                    name="club"
                    value={editData.club}
                    onChange={handleEditInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm sm:text-base"
                    required
                  >
                    <option value="">اختر النادي</option>
                    {uniqueClubs.map((club) => (
                      <option key={club.id} value={club.id}>
                        {club.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-gray-700 font-medium mb-2 text-sm sm:text-base">
                    العضو
                  </label>
                  <input
                    type="number"
                    name="member"
                    value={editData.member}
                    onChange={handleEditInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm sm:text-base"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-gray-700 font-medium mb-2 text-sm sm:text-base">
                    الإشتراك
                  </label>
                  <select
                    name="subscription"
                    value={editData.subscription}
                    onChange={handleEditInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm sm:text-base"
                  >
                    <option value="">اختر الإشتراك</option>
                    {uniqueSubscriptions.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-gray-700 font-medium mb-2 text-sm sm:text-base">
                    المبلغ
                  </label>
                  precautions<input
                    type="text"
                    name="amount"
                    value={editData.amount}
                    onChange={handleEditInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm sm:text-base"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-gray-700 font-medium mb-2 text-sm sm:text-base">
                    طريقة الدفع
                  </label>
                  <select
                    name="payment_method"
                    value={editData.payment_method}
                    onChange={handleEditInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm sm:text-base"
                  >
                    {paymentMethods.map((method) => (
                      <option key={method.value} value={method.value}>
                        {method.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-gray-700 font-medium mb-2 text-sm sm:text-base">
                    رقم الفاتورة
                  </label>
                  <p className="mt-1 text-sm text-gray-500">
                    رقم الفاتورة يتم توليده تلقائياً ولا يمكن تعديله
                  </p>
                </div>

                <div className="mb-6">
                  <label className="block text-gray-700 font-medium mb-2 text-sm sm:text-base">
                    ملاحظة
                  </label>
                  <textarea
                    name="note"
                    value={editData.note}
                    onChange={handleEditInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm sm:text-base"
                    rows={3}
                  />
                </div>

                <div className="flex justify-end space-x-3 space-x-reverse">
                  <Button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm sm:text-base"
                  >
                    إلغاء
                  </Button>
                  <Button
                    type="submit"
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm sm:text-base"
                    disabled={isUpdating}
                  >
                    {isUpdating ? "جاري الحفظ..." : "حفظ التغييرات"}
                  </Button>
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