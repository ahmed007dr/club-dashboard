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
  const [itemsPerPage, setItemsPerPage] = useState(5); // Dynamic items per page
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

  // Extract unique subscriptions from receipts (temporary until /subscriptions/ endpoint)
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

  // Payment method choices (adjusted for backend)
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
    setCurrentPage(1); // Reset to page 1 when receipts change
  }, [receipts]);

  // Pagination logic
  const totalItems = filteredReceipts.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const paginatedReceipts = filteredReceipts.slice(startIndex, endIndex);

  // Generate page numbers for display (limited range)
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
    setCurrentPage(1); // Reset to page 1
  };

  if (status === "loading")
    return <div className="flex justify-center items-center h-screen">جاري التحميل...</div>;
  if (error) return <div className="text-red-500 text-center p-4">خطأ: {error}</div>;

  return (
    <div className="container mx-auto px-4 py-8" dir="rtl">
      {/* Header and Add Receipt Button */}
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <HiOutlineDocumentReport className="text-blue-600 w-9 h-9 text-2xl" />
          <h2 className="text-2xl font-bold mb-6">الإيصالات</h2>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn flex items-center bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
        >
          إضافة إيصال
          <svg
            className="w-5 h-5 mr-2"
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
        </button>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-6 w-full">
        <div className="relative w-full">
          <input
            type="text"
            placeholder="أدخل رقم الفاتورة"
            value={searchTerm}
            onChange={handleSearchInputChange}
            className={`px-4 w-full py-2 border ${
              inputError ? "border-red-500" : "border-gray-300"
            } rounded-md`}
          />
          {inputError && (
            <p className="absolute text-red-500 text-xs mt-1">{inputError}</p>
          )}
        </div>
        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
          disabled={status === "loading"}
        >
          {status === "loading" ? "جاري البحث..." : "بحث"}
        </button>
        {searchTerm && (
          <button
            type="button"
            onClick={resetSearch}
            className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded"
          >
            إعادة تعيين
          </button>
        )}
      </form>

      {/* Receipts Table */}
      <div className="overflow-x-auto">
        {paginatedReceipts.length > 0 ? (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الإجراءات
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  المبلغ
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  طريقة الدفع
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ملاحظة
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  رقم الفاتورة
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedReceipts.map((receipt) => (
                <tr key={receipt.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 flex gap-2">
                    <button
                      onClick={() => handleEdit(receipt.id)}
                      className="text-indigo-600 hover:text-indigo-900"
                      aria-label="تعديل الإيصال"
                    >
                      <CiEdit />
                    </button>
                    <button
                      onClick={() => handleDelete(receipt.id)}
                      className="text-red-600 hover:text-red-900"
                      aria-label="حذف الإيصال"
                    >
                      <CiTrash />
                    </button>
                  </td>
                  <td className="px-6 py-4">{receipt.amount}</td>
                  <td className="px-6 py-4 capitalize">{receipt.payment_method}</td>
                  <td className="px-6 py-4">{receipt.note}</td>
                  <td className="px-6 py-4">{receipt.invoice_number}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="p-4 text-gray-500">
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
          className="bg-primary text-white px-6"
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
          <div className="flex justify-between items-center mb-4">
            <div>
              <label className="text-sm text-gray-700">
                عدد الإيصالات لكل صفحة:
                <select
                  value={itemsPerPage}
                  onChange={handleItemsPerPageChange}
                  className="ml-2 px-2 py-1 border border-gray-300 rounded-md"
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
            <div className="flex justify-center items-center space-x-2" dir="ltr">
              <button
                onClick={handlePrevious}
                disabled={currentPage === 1}
                className={`px-4 py-2 rounded-md ${
                  currentPage === 1
                    ? "bg-gray-200 cursor-not-allowed"
                    : "bg-blue-500 text-white hover:bg-blue-600"
                }`}
                aria-label="الصفحة السابقة"
              >
                السابق
              </button>

              {getPageNumbers().map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`px-4 py-2 rounded-md ${
                    currentPage === page
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 hover:bg-gray-300"
                  }`}
                  aria-label={`الصفحة ${page}`}
                >
                  {page}
                </button>
              ))}

              {totalPages > getPageNumbers().length && getPageNumbers()[getPageNumbers().length - 1] < totalPages && (
                <span className="px-4 py-2">...</span>
              )}

              <button
                onClick={handleNext}
                disabled={currentPage === totalPages}
                className={`px-4 py-2 rounded-md ${
                  currentPage === totalPages
                    ? "bg-gray-200 cursor-not-allowed"
                    : "bg-blue-500 text-white hover:bg-blue-600"
                }`}
                aria-label="الصفحة التالية"
              >
                التالي
              </button>
            </div>
          )}
        </div>
      )}

      {/* Add Receipt Form Modal */}
      {showForm && (
        <div className="fixed inset-0  bg-gray-600 bg-opacity-50 flex items-center justify-center ">
          <div className="bg-white h-[90vh] overflow-y-auto rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
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
            <div className="p-6">
              <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                هل أنت متأكد من رغبتك في حذف هذا الإيصال؟
              </h3>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={cancelDelete}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  إلغاء
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                >
                  تأكيد
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                تعديل الإيصال
              </h3>
              <form onSubmit={handleEditSubmit}>
                <div className="mb-4">
                  <label className="block text-gray-700 font-medium mb-2">
                    النادي
                  </label>
                  <select
                    name="club"
                    value={editData.club}
                    onChange={handleEditInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
                  <label className="block text-gray-700 font-medium mb-2">
                    العضو
                  </label>
                  <input
                    type="number"
                    name="member"
                    value={editData.member}
                    onChange={handleEditInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-gray-700 font-medium mb-2">
                    الإشتراك
                  </label>
                  <select
                    name="subscription"
                    value={editData.subscription}
                    onChange={handleEditInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
                  <label className="block text-gray-700 font-medium mb-2">
                    المبلغ
                  </label>
                  <input
                    type="text"
                    name="amount"
                    value={editData.amount}
                    onChange={handleEditInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-gray-700 font-medium mb-2">
                    طريقة الدفع
                  </label>
                  <select
                    name="payment_method"
                    value={editData.payment_method}
                    onChange={handleEditInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    {paymentMethods.map((method) => (
                      <option key={method.value} value={method.value}>
                        {method.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-gray-700 font-medium mb-2">
                    رقم الفاتورة
                  </label>
                  <p className="mt-1 text-sm text-gray-500">
                    رقم الفاتورة يتم توليده تلقائياً ولا يمكن تعديله
                  </p>
                </div>

                <div className="mb-6">
                  <label className="block text-gray-700 font-medium mb-2">
                    ملاحظة
                  </label>
                  <textarea
                    name="note"
                    value={editData.note}
                    onChange={handleEditInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    rows={3}
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                    disabled={isUpdating}
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