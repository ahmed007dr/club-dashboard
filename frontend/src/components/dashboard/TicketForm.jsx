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
  const [ticketFormData, setTicketFormData] = useState({ ticket_type: '', notes: '' });
  const [selectedPrice, setSelectedPrice] = useState(null);
  const [formError, setFormError] = useState(null);

  const handleTicketFormChange = (e) => {
    const { name, value } = e.target;
    setTicketFormData((prev) => ({ ...prev, [name]: value }));

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
    console.log('Submitting ticket with data:', JSON.stringify(ticketFormData, null, 2));

    if (!ticketFormData.ticket_type) {
      toast.error('يرجى اختيار نوع التذكرة');
      return;
    }
    if (!userClub) {
      toast.error('خطأ: لا يمكن إضافة تذكرة بدون نادي مرتبط');
      return;
    }
    if (!userId) {
      toast.error('خطأ: لا يمكن إضافة تذكرة بدون معرف المستخدم');
      return;
    }

    const ticketData = {
      club: userClub.id,
      ticket_type_id: parseInt(ticketFormData.ticket_type),
      issued_by: userId,
      ...(ticketFormData.notes && { notes: ticketFormData.notes }),
    };

    console.log('Ticket data to send:', JSON.stringify(ticketData, null, 2));

    dispatch(addTicket(ticketData))
      .unwrap()
      .then((response) => {
        console.log('addTicket response:', response);
        const { serial_number, price } = response;
        const currentTime = new Date().toLocaleTimeString('ar-EG');
        toast.success(`تم إضافة تذكرة ${serial_number} بقيمة ${price} جنيه عند الساعة ${currentTime}`);
        dispatch(fetchTickets({
          page: 1,
          page_size: itemsPerPage,
          club: userClub.id,
          ticket_type: '',
          issue_date: '',
        }));
        setTicketFormData({ ticket_type: '', notes: '' });
        setSelectedPrice(null);
        setFormError(null);
      })
      .catch((err) => {
        console.error('addTicket error:', JSON.stringify(err, null, 2));
        setFormError(`فشل في إضافة التذكرة: ${err}`);
        toast.error(`فشل في إضافة التذكرة: ${err}`);
      });
  };

  if (!canAddTickets) return null;

  return (
    <div className="mb-6 bg-white p-4 rounded-lg shadow" dir="rtl">
      <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
        <FiPlus className="text-green-600 w-5 h-5" />
        إضافة تذكرة جديدة
      </h3>
      {formError && (
        <div className="bg-red-100 text-red-700 p-2 rounded mb-3 text-right text-sm">{formError}</div>
      )}
      <form onSubmit={handleCreateTicketSubmit}>
        <div className="flex gap-3 mb-3">
          <div className="flex-1">
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
          <div className="flex-1">
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
            onClick={() => {
              setTicketFormData({ ticket_type: '', notes: '' });
              setSelectedPrice(null);
              setFormError(null);
            }}
          >
            إلغاء
          </Button>
          <Button
            type="submit"
            className="text-sm py-2 px-4 bg-green-600 hover:bg-green-700 text-white"
            disabled={ticketsLoading || !userClub || !ticketFormData.ticket_type}
          >
            {ticketsLoading ? <Loader2 className="animate-spin h-4 w-4" /> : 'إضافة'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default TicketForm;