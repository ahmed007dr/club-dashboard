import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addTicket, fetchTickets } from '../../redux/slices/ticketsSlice';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { toast } from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import { FiList, FiPlus } from 'react-icons/fi';

const TicketForm = ({ userClub, userId, canAddTickets, itemsPerPage, filterTicketType, filterIssueDate }) => {
  const dispatch = useDispatch();
  const { ticketTypes, loading: ticketsLoading } = useSelector((state) => state.tickets);
  const [ticketFormData, setTicketFormData] = useState({
    ticket_type: '',
    notes: '',
    num_tickets: 1,
  });
  const [selectedPrice, setSelectedPrice] = useState(null);
  const [formError, setFormError] = useState(null);

  const handleTicketFormChange = (e) => {
    const { name, value } = e.target;
    setTicketFormData((prev) => ({
      ...prev,
      [name]: name === 'num_tickets' ? parseInt(value) || 1 : value,
    }));

    if (name === 'ticket_type') {
      const selectedType = ticketTypes.find((type) => type.id.toString() === value);
      if (selectedType) {
        setSelectedPrice(selectedType.price);
        toast.success(`تم اختيار التذكرة بنوع ${selectedType.name} بقيمة ${selectedType.price} جنيه`);
      } else {
        setSelectedPrice(null);
      }
    }
  };

  const handleCreateTicketSubmit = async (e) => {
    e.preventDefault();
//     console.log('Submitting ticket with data:', JSON.stringify(ticketFormData, null, 2));

    // Validate ticket types availability
    if (!ticketTypes.length) {
      toast.error('لا توجد أنواع تذاكر متاحة. يرجى إضافة نوع تذكرة أولاً.');
      setFormError('لا توجد أنواع تذاكر متاحة. يرجى إضافة نوع تذكرة أولاً.');
      return;
    }

    // Validate ticket type selection
    const ticketTypeId = parseInt(ticketFormData.ticket_type);
    if (!ticketFormData.ticket_type || isNaN(ticketTypeId)) {
      console.error('Invalid ticket_type:', ticketFormData.ticket_type);
      toast.error('يرجى اختيار نوع تذكرة صالح');
      setFormError('يرجى اختيار نوع تذكرة صالح');
      return;
    }

    // Validate ticket type exists
    const selectedType = ticketTypes.find((type) => type.id === ticketTypeId);
    if (!selectedType) {
      console.error('Selected ticket_type not found in ticketTypes:', ticketTypeId);
      toast.error('نوع التذكرة المختار غير موجود');
      setFormError('نوع التذكرة المختار غير موجود');
      return;
    }

    // Validate number of tickets
    if (ticketFormData.num_tickets < 1) {
      toast.error('عدد التذاكر يجب أن يكون أكبر من صفر');
      setFormError('عدد التذاكر يجب أن يكون أكبر من صفر');
      return;
    }

    // Validate user club
    if (!userClub) {
      toast.error('خطأ: لا يمكن إضافة تذكرة بدون نادي مرتبط');
      setFormError('خطأ: لا يمكن إضافة تذكرة بدون نادي مرتبط');
      return;
    }

    // Validate user ID
    if (!userId) {
      toast.error('خطأ: لا يمكن إضافة تذكرة بدون معرف المستخدم');
      setFormError('خطأ: لا يمكن إضافة تذكرة بدون معرف المستخدم');
      return;
    }

    // Prepare ticket data for API
    const ticketData = {
      club: userClub.id,
      ticket_type: ticketTypeId, // Changed from ticket_type_id to ticket_type to match server expectation
      issued_by: userId,
      num_tickets: ticketFormData.num_tickets,
      notes: ticketFormData.notes || '', // Ensure notes is always sent, even if empty
    };

//     console.log('Ticket data to send:', JSON.stringify(ticketData, null, 2));

    try {
      const response = await dispatch(addTicket(ticketData)).unwrap();
//       console.log('addTicket response:', JSON.stringify(response, null, 2));

      const numTickets = ticketFormData.num_tickets;
      const currentTime = new Date().toLocaleTimeString('ar-EG');
      const ticketRange = numTickets === 1
        ? response[0]?.serial_number || 'غير متوفر'
        : `${response[0]?.serial_number || 'غير متوفر'} إلى ${response[response.length - 1]?.serial_number || 'غير متوفر'}`;
      toast.success(`تم إضافة ${numTickets} تذكرة (${ticketRange}) بقيمة ${selectedPrice * numTickets} جنيه عند الساعة ${currentTime}`);

      // Refresh ticket list
      await dispatch(fetchTickets({
        page: 1,
        page_size: itemsPerPage,
        club: userClub.id,
        ticket_type: filterTicketType || '',
        issue_date: filterIssueDate || '',
      }));

      // Reset form
      setTicketFormData({ ticket_type: '', notes: '', num_tickets: 1 });
      setSelectedPrice(null);
      setFormError(null);
    } catch (err) {
      console.error('addTicket error:', JSON.stringify(err, null, 2));
      const errorMessage = err?.ticket_type?.[0] || err?.error || 'فشل في إضافة التذكرة';
      setFormError(`فشل في إضافة التذكرة: ${errorMessage}`);
      toast.error(`فشل في إضافة التذكرة: ${errorMessage}`);
    }
  };

  const resetForm = () => {
    setTicketFormData({ ticket_type: '', notes: '', num_tickets: 1 });
    setSelectedPrice(null);
    setFormError(null);
  };

  if (!canAddTickets) return null;

  if (!ticketTypes.length) {
    return (
      <div className="mb-6 bg-white p-4 rounded-lg shadow" dir="rtl">
        <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
          <FiPlus className="text-green-600 w-5 h-5" />
          إضافة تذكرة جديدة
        </h3>
        <div className="bg-yellow-100 text-yellow-700 p-2 rounded mb-3 text-right text-sm">
          لا توجد أنواع تذاكر متاحة. يرجى إضافة نوع تذكرة أولاً.
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6 bg-white p-4 rounded-lg shadow" dir="rtl">
      <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
        <FiPlus className="text-green-600 w-5 h-5" />
        إضافة تذكرة جديدة
      </h3>
      {formError && (
        <div className="bg-red-100 text-red-700 p-2 rounded mb-3 text-right text-sm">
          {formError}
        </div>
      )}
      <form onSubmit={handleCreateTicketSubmit}>
        <div className="flex gap-3 mb-3 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium mb-1 text-right text-gray-700">نوع التذكرة</label>
            <div className="relative">
              <FiList className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                name="ticket_type"
                value={ticketFormData.ticket_type}
                onChange={handleTicketFormChange}
                className="w-full border border-gray-300 rounded-lg py-2 pr-8 pl-3 bg-white text-gray-700 text-sm focus:ring-2 focus:ring-green-500 focus:outline-none transition-all duration-200 text-right"
                required
              >
                <option value="">اختر نوع التذكرة</option>
                {ticketTypes.map((type) => (
                  <option key={type.id} value={type.id.toString()}>
                    {type.name} ({type.price} جنيه)
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium mb-1 text-right text-gray-700">عدد التذاكر</label>
            <Input
              type="number"
              name="num_tickets"
              value={ticketFormData.num_tickets}
              onChange={handleTicketFormChange}
              placeholder="أدخل عدد التذاكر"
              min="1"
              max="1000"
              className="w-full border border-gray-300 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-green-500 focus:outline-none transition-all duration-200"
              required
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium mb-1 text-right text-gray-700">ملاحظات (اختياري)</label>
            <Input
              type="text"
              name="notes"
              value={ticketFormData.notes}
              onChange={handleTicketFormChange}
              placeholder="أدخل ملاحظات التذكرة (اختياري)"
              className="w-full border border-gray-300 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-green-500 focus:outline-none transition-all duration-200"
            />
          </div>
        </div>
        <div className="flex justify-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="text-sm py-2 px-4 border-gray-300 text-gray-700 hover:bg-gray-50"
            onClick={resetForm}
          >
            إلغاء
          </Button>
          <Button
            type="submit"
            className="text-sm py-2 px-4 bg-green-600 hover:bg-green-700 text-white"
            disabled={ticketsLoading || !userClub || !ticketFormData.ticket_type || ticketFormData.num_tickets < 1}
          >
            {ticketsLoading ? <Loader2 className="animate-spin h-4 w-4" /> : 'إضافة'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default TicketForm;