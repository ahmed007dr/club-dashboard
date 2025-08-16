import React from 'react';
import { useSelector } from 'react-redux';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select';

const TicketFilters = ({ filterTicketType, setFilterTicketType, filterIssueDate, setFilterIssueDate, setCurrentPage }) => {
  const { ticketTypes } = useSelector((state) => state.tickets);

  return (
    <div className="mb-6 bg-white p-4 rounded-lg shadow">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">تصفية التذاكر</h3>
        <Button
          variant="outline"
          onClick={() => {
            setFilterTicketType('');
            setFilterIssueDate('');
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
  );
};

export default TicketFilters;