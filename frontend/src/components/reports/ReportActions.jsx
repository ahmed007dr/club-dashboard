import React from 'react';
import { Button } from '@/components/ui/button';
import { Eye, Download, Printer, Loader2, Clock } from 'lucide-react';

const ReportActions = ({ loading, previewLoading, handlePreviewReport, reportData, handleGenerateReport, handlePrintReport, handleGenerateShiftReport }) => {
  return (
    <div className="flex flex-wrap gap-3 justify-end">
      <Button
        onClick={handlePreviewReport}
        disabled={loading || previewLoading}
        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-2 px-4 text-sm"
      >
        {previewLoading ? <Loader2 className="animate-spin w-5 h-5" /> : <Eye className="w-5 h-5" />}
        معاينة التقرير
      </Button>
      {reportData && (
        <>
          <Button
            onClick={handleGenerateReport}
            disabled={loading}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-2 px-4 text-sm"
          >
            {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <Download className="w-5 h-5" />}
            تنزيل التقرير كـ PDF
          </Button>
          <Button
            onClick={handlePrintReport}
            disabled={loading || previewLoading}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white py-2 px-4 text-sm"
          >
            <Printer className="w-5 h-5" />
            طباعة التقرير
          </Button>
        </>
      )}
      <Button
        onClick={handleGenerateShiftReport}
        disabled={loading || previewLoading}
        className="hidden-button flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white py-1 px-3 text-sm"
      >
        {loading ? <Loader2 className="animate-spin w-4 h-4" /> : <Clock className="w-4 h-4" />}
        تقرير الشيفتات
      </Button>
    </div>
  );
};

export default ReportActions;