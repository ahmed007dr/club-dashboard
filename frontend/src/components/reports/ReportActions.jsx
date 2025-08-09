import React from 'react';
import { Button } from '@/components/ui/button';
import { Eye, Download, Printer, Loader2, Clock, Lock, Unlock } from 'lucide-react';
import axios from 'axios';  // Assuming for API calls

const ReportActions = ({ loading, previewLoading, handlePreviewReport, reportData, handleGenerateReport, handlePrintReport, handleGenerateShiftReport, userRole }) => {
  const handleOpenJournal = async () => {
    try {
      await axios.post('finance/api/open-cash-journal/');
      // Refresh data
    } catch (error) {
      console.error('Error opening journal');
    }
  };

  const handleCloseJournal = async () => {
    try {
      await axios.post('finance/api/close-cash-journal/');
      // Refresh data
    } catch (error) {
      console.error('Error closing journal');
    }
  };

  return (
    <div className="flex flex-wrap gap-3 justify-end">
      {/* ... الأزرار الحالية ... */}
      {userRole !== 'admin' && userRole !== 'owner' && (  // Only for employees
        <>
          <Button
            onClick={handleOpenJournal}
            disabled={loading || previewLoading || (reportData?.status === 'open')}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
          >
            <Unlock className="w-5 h-5" />
            فتح يومية
          </Button>
          <Button
            onClick={handleCloseJournal}
            disabled={loading || previewLoading || (reportData?.status === 'closed')}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700"
          >
            <Lock className="w-5 h-5" />
            إغلاق يومية
          </Button>
        </>
      )}
    </div>
  );
};
export default ReportActions;