import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addTicket, fetchTickets } from '../../redux/slices/ticketsSlice';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { toast } from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

const TicketForm = ({ userClub, canAddTickets, itemsPerPage, filterTicketType, filterIssueDate }) => {
  const dispatch = useDispatch();
  const { ticketTypes, loading: ticketsLoading } = useSelector((state) => state.tickets);
  const [ticketFormData, setTicketFormData] = useState({ ticket_type: '', notes: '' });
  const [selectedPrice, setSelectedPrice] = useState(null);
  const [selectedTicketType, setSelectedTicketType] = useState(null);
  const [formError, setFormError] = useState(null);

  const handleTicketFormChange = (e) => {
    const { name, value } = e.target;
    setTicketFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTicketTypeButtonClick = (type) => {
    setTicketFormData((prev) => ({ ...prev, ticket_type: type.id.toString() }));
    setSelectedPrice(type.price);
    setSelectedTicketType(type);
    toast.success(`تم اختيار التذكرة بنوع ${type.name} بقيمة ${type.price} جنيه`);
  };

  const handleCreateTicketSubmit = async (e) => {
    e.preventDefault();
    if (!ticketFormData.ticket_type) {
      toast.error('يرجى اختيار نوع التذكرة');
      return;
    }
    if (!ticketFormData.notes) {
      toast.error('يرجى إدخال ملاحظات التذكرة');
      return;
    }
    if (!userClub) {
      toast.error('خطأ: لا يمكن إضافة تذكرة بدون نادي مرتبط');
      return;
    }
  
    const userId = localStorage.getItem('userId') || userClub.id;
    const ticketData = {
      club: userClub.id,
      ticket_type_id: parseInt(ticketFormData.ticket_type),
      notes: ticketFormData.notes,
      issued_by: userId,
    };
  
    dispatch(addTicket(ticketData))
      .unwrap()
      .then((response) => {
        const { serial_number, price } = response;
        const currentTime = new Date().toLocaleTimeString('ar-EG');
        toast.success(`تم إضافة تذكرة ${serial_number} بقيمة ${price} جنيه عند الساعة ${currentTime}`);
        dispatch(fetchTickets({
          page: 1,
          page_size: itemsPerPage,
          club: userClub.id,
          ticket_type: filterTicketType,
          issue_date: filterIssueDate,
        }));
        setTicketFormData({ ticket_type: '', notes: '' });
        setSelectedPrice(null);
        setSelectedTicketType(null);
        setFormError(null);
      })
      .catch((err) => {
        setFormError(`فشل في إضافة التذكرة: ${err}`);
        toast.error(`فشل في إضافة التذكرة: ${err}`);
      });
  };

  
  if (!canAddTickets) return null;

  return (
    <div className="mb-6 bg-white p-4 rounded-lg shadow">
      <h3 className="text-lg font-medium mb-4">إضافة تذكرة جديدة</h3>
      {formError && (
        <div className="bg-red-100 text-red-700 p-2 rounded mb-4 text-right text-sm">{formError}</div>
      )}
      <form onSubmit={handleCreateTicketSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1 text-right">نوع التذكرة</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {ticketTypes.map((type) => (
              <Button
                key={type.id}
                type="button"
                variant={ticketFormData.ticket_type === type.id.toString() ? 'default' : 'outline'}
                className="text-sm w-full"
                onClick={() => handleTicketTypeButtonClick(type)}
              >
                {type.name} ({type.price} جنيه)
              </Button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 text-right">ملاحظات</label>
          <Input
            type="text"
            name="notes"
            value={ticketFormData.notes}
            onChange={handleTicketFormChange}
            placeholder="أدخل ملاحظات التذكرة"
            required
            className="w-full"
          />
        </div>
        {selectedPrice !== null && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-right">
            <p className="text-sm font-medium text-gray-700">
              السعر: <span className="text-green-600 font-bold">{selectedPrice} جنيه</span>
            </p>
          </div>
        )}
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setTicketFormData({ ticket_type: '', notes: '' });
              setSelectedPrice(null);
              setSelectedTicketType(null);
              setFormError(null);
            }}
          >
            إلغاء
          </Button>
          <Button type="submit" disabled={ticketsLoading || !userClub || !ticketFormData.ticket_type}>
            {ticketsLoading ? <Loader2 className="animate-spin h-4 w-4" /> : 'إضافة'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default TicketForm;