import React from 'react';
import { FiAlertTriangle } from 'react-icons/fi';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';

const ErrorModal = ({ error, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl shadow-lg max-w-md w-full text-right">
        <div className="flex items-center gap-3 mb-4">
          <FiAlertTriangle className="text-red-600 w-8 h-8" />
          <h3 className="text-lg font-bold text-gray-800">حدث خطأ</h3>
        </div>
        <p className="text-red-600 mb-6">{error}</p>
        <Button
          onClick={onClose}
          className={cn("px-4 py-2 bg-red-600 hover:bg-red-700")}
        >
          إغلاق
        </Button>
      </div>
    </div>
  );
};

export default ErrorModal;