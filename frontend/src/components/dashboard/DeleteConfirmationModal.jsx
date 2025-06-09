import React from 'react';
import { FiTrash } from 'react-icons/fi';
import { Button } from '../ui/button';

const DeleteConfirmationModal = ({
  confirmDeleteModal,
  setConfirmDeleteModal,
  handleConfirmDelete,
}) => (
  confirmDeleteModal && (
    <div
      className="fixed inset-0 z-50 flex justify-center items-center bg-black bg-opacity-50 backdrop-blur-sm"
      onClick={() => setConfirmDeleteModal(false)}
    >
      <div
        className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        <div className="flex items-center gap-3 mb-4">
          <FiTrash className="text-red-600 w-6 h-6" />
          <h3 className="text-lg font-semibold text-right">تأكيد الحذف</h3>
        </div>
        <p className="text-sm text-right mb-6">
          هل أنت متأكد من حذف هذا المصروف؟
        </p>
        <div className="flex justify-end gap-3">
          <Button
            onClick={() => setConfirmDeleteModal(false)}
            variant="outline"
            className="px-6 py-2 text-sm"
          >
            لا
          </Button>
          <Button
            onClick={handleConfirmDelete}
            className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white text-sm"
          >
            نعم
          </Button>
        </div>
      </div>
    </div>
  )
);

export default DeleteConfirmationModal;