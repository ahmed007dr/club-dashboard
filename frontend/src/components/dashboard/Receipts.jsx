import React, { useState } from 'react';
import { CiTrash, CiEdit } from 'react-icons/ci';
import { FaEye } from 'react-icons/fa';

// Mock user (you can replace this with the actual logged-in user data)
const currentUser = { name: 'أحمد مصطفى', id: 1 };

const fakeReceipts = [
  {
    id: 1,
    buyer_name: 'مايك جونسون',
    ticket_type: 'day_pass',
    price: '30.00',
    used: false,
    issue_date: '2025-04-10',
    used_by: null,
  },
  {
    id: 2,
    buyer_name: 'سارة باركر',
    ticket_type: 'week_pass',
    price: '50.00',
    used: true,
    issue_date: '2025-04-08',
    used_by: 'سارة باركر',
  },
  {
    id: 3,
    buyer_name: 'ديفيد براون',
    ticket_type: 'month_pass',
    price: '100.00',
    used: false,
    issue_date: '2025-04-01',
    used_by: null,
  },
  {
    id: 4,
    buyer_name: 'مايك جونسون',
    ticket_type: 'day_pass',
    price: '30.00',
    used: false,
    issue_date: '2025-04-10',
    used_by: null,
  },
  {
    id: 5,
    buyer_name: 'سارة باركر',
    ticket_type: 'week_pass',
    price: '50.00',
    used: true,
    issue_date: '2025-04-08',
    used_by: 'سارة باركر',
  },
  {
    id: 6,
    buyer_name: 'ديفيد براون',
    ticket_type: 'month_pass',
    price: '100.00',
    used: false,
    issue_date: '2025-04-01',
    used_by: null,
  },
  {
    id: 7,
    buyer_name: 'ديفيد براون',
    ticket_type: 'month_pass',
    price: '100.00',
    used: false,
    issue_date: '2025-04-01',
    used_by: null,
  },
  {
    id: 8,
    buyer_name: 'ديفيد براون',
    ticket_type: 'month_pass',
    price: '100.00',
    used: false,
    issue_date: '2025-04-01',
    used_by: null,
  },
  // More fake data...
];

const Receipts = () => {
  const [receipts, setReceipts] = useState(fakeReceipts);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [modalType, setModalType] = useState(null); // 'view' | 'edit' | 'delete' | 'add'
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const receiptsPerPage = 8; // You can change this number to control the page size

  const openModal = (type, receipt = null) => {
    setSelectedReceipt(receipt);
    setModalType(type);
  };

  const closeModal = () => {
    setSelectedReceipt(null);
    setModalType(null);
  };

  const handleAddReceipt = (e) => {
    e.preventDefault();
    const newReceipt = {
      id: receipts.length + 1,
      buyer_name: e.target.buyer_name.value,
      ticket_type: e.target.ticket_type.value,
      price: e.target.price.value,
      issue_date: e.target.issue_date.value,
      used_by: e.target.used_by.value || null,
      used: false,
    };

    setReceipts([...receipts, newReceipt]);
    closeModal();
  };

  // Filter receipts based on search term
  const filteredReceipts = receipts.filter((receipt) => {
    return (
      receipt.buyer_name.includes(searchTerm) ||
      receipt.ticket_type.includes(searchTerm) ||
      receipt.id.toString().includes(searchTerm)
    );
  });

  // Pagination logic
  const indexOfLastReceipt = currentPage * receiptsPerPage;
  const indexOfFirstReceipt = indexOfLastReceipt - receiptsPerPage;
  const currentReceipts = filteredReceipts.slice(indexOfFirstReceipt, indexOfLastReceipt);

  const totalPages = Math.ceil(filteredReceipts.length / receiptsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  return (
    <div dir="rtl">
      <h2 className="text-2xl font-semibold mb-4">الفواتير</h2>
      <div className="max-sm:flex-col flex items-center justify-center sm:justify-between">
        <button
          onClick={() => openModal('add')}
          className="px-4 py-2 max-sm:w-full bg-blue-400 dark:bg-blue-900 text-white rounded cursor-pointer hover:bg-blue-500 mb-4"
        >
          إضافة فاتورة جديدة
        </button>
        <div className="mb-4 max-sm:w-full">
          <input
            type="text"
            className="border px-4 bg-gray-100 text-black outline-blue-400 py-2 max-sm:w-full rounded"
            placeholder="ابحث عن الفاتورة"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded-lg shadow">
          <thead className="bg-blue-400 dark:bg-blue-900 rounded-lg text-white">
            <tr>
              <th className="px-4 py-2 text-center">رقم الفاتورة</th>
              <th className="px-4 py-2 text-center">اسم العضو</th>
              <th className="px-4 py-2 text-center">المبلغ</th>
              <th className="px-4 py-2 text-center">تم الإصدار بواسطة</th>
              <th className="px-4 py-2 text-center">الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {currentReceipts.map((receipt) => (
              <tr key={receipt.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-2 text-center text-black/80">{receipt.id}</td>
                <td className="px-4 py-2 text-center text-black/80">{receipt.buyer_name}</td>
                <td className="px-4 py-2 text-center text-black/80">EGP {receipt.price}</td>
                <td className="px-4 py-2 text-center text-black/80">{receipt.used_by || 'غير متاح'}</td>
                <td className="px-4 py-2 space-x-2 text-center text-black/80">
                  <button onClick={() => openModal('view', receipt)} className="text-black/80 cursor-pointer hover:text-black/60">
                    <FaEye />
                  </button>
                  <button onClick={() => openModal('edit', receipt)} className="text-black/80 cursor-pointer hover:text-black/60">
                    <CiEdit />
                  </button>
                  <button onClick={() => openModal('delete', receipt)} className="text-red-500 cursor-pointer hover:text-red-700">
                    <CiTrash />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="flex justify-center mt-4">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-4 py-2 bg-gray-300 rounded-r-lg hover:bg-gray-400"
        >
          &lt; 
        </button>
        {[...Array(totalPages).keys()].map((pageNumber) => (
          <button
            key={pageNumber}
            onClick={() => handlePageChange(pageNumber + 1)}
            className={`px-3 py-2 ${currentPage === pageNumber + 1 ? 'bg-blue-500 dark:bg-blue-900 text-white' : 'bg-gray-200'} rounded-sm mx-1 hover:bg-blue-400`}
          >
            {pageNumber + 1}
          </button>
        ))}
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-4 py-2 bg-gray-300 rounded-l-lg hover:bg-gray-400"
        >
           &gt;
        </button>
      </div>

      {/* Modals (view, edit, delete) */}
      {modalType && (
        <div className="fixed inset-0 z-40 flex justify-center items-center" style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}>
          <div className="bg-white p-6 rounded-lg shadow-lg  max-sm:max-w-[22rem] w-md">
            {modalType === 'add' && (
              <>
                <h3 className="text-xl font-semibold mb-4">إضافة فاتورة جديدة</h3>
                <form onSubmit={handleAddReceipt} className="space-y-4">
                  <input
                    name="buyer_name"
                    className="w-full border rounded px-3 py-2"
                    placeholder="اسم المشتري"
                  />
                
                  <input
                    name="price"
                    className="w-full border rounded px-3 py-2"
                    type="number"
                    step="0.01"
                    placeholder="السعر"
                  />
                  <input
                    name="issue_date"
                    className="w-full border rounded px-3 py-2"
                    type="date"
                  />
                  <input
                    name="used_by"
                    className="w-full border rounded px-3 py-2"
                    defaultValue={currentUser.name}
                    placeholder="مستخدم بواسطة"
                    disabled
                  />
                  <div className="flex justify-between gap-3 mt-4">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                    >
                      العودة
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      حفظ
                    </button>
                  </div>
                </form>
              </>
            )}
            {/* Other modals (view, edit, delete) */}
            {modalType === 'view' && selectedReceipt && (
              <>
                <h3 className="text-xl font-semibold mb-4">عرض الفاتورة</h3>
                <p><strong>اسم العضو:</strong> {selectedReceipt.buyer_name}</p>
                <p><strong>المبلغ:</strong> EGP {selectedReceipt.price}</p>
                <p><strong>تم الإصدار بواسطة:</strong> {selectedReceipt.used_by || 'غير متاح'}</p>
                <div className="flex justify-between gap-3 mt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                  >
                    العودة
                  </button>
                </div>
              </>
            )}
            {modalType === 'edit' && selectedReceipt && (
              <>
                <h3 className="text-xl font-semibold mb-4">تعديل الفاتورة</h3>
                <form onSubmit={handleAddReceipt} className="space-y-4">
                  <input
                    name="buyer_name"
                    className="w-full border rounded px-3 py-2"
                    defaultValue={selectedReceipt.buyer_name}
                    placeholder="اسم المشتري"
                  />
                  <input
                    name="price"
                    className="w-full border rounded px-3 py-2"
                    type="number"
                    step="0.01"
                    defaultValue={selectedReceipt.price}
                    placeholder="السعر"
                  />
                  <input
                    name="issue_date"
                    className="w-full border rounded px-3 py-2"
                    type="date"
                    defaultValue={selectedReceipt.issue_date}
                  />
                  <input
                    name="used_by"
                    className="w-full border rounded px-3 py-2"
                    defaultValue={selectedReceipt.used_by}
                    placeholder="مستخدم بواسطة"
                  />
                  <div className="flex justify-between gap-3 mt-4">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                    >
                      العودة
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      حفظ
                    </button>
                  </div>
                </form>
              </>
            )}
            {modalType === 'delete' && selectedReceipt && (
              <>
                <h3 className="text-xl font-semibold mb-4">حذف الفاتورة</h3>
                <p>هل أنت متأكد من أنك تريد حذف الفاتورة الخاصة بـ {selectedReceipt.buyer_name}؟</p>
                <div className="flex justify-between gap-3 mt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                  >
                    العودة
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setReceipts(receipts.filter((receipt) => receipt.id !== selectedReceipt.id));
                      closeModal();
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    حذف
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Receipts;
