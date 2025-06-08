import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addTicketType, fetchTicketTypes } from '../../redux/slices/ticketsSlice';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { toast } from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

const AddTicketTypeModal = ({ open, onOpenChange, userClub, canAddTickets }) => {
  const dispatch = useDispatch();
  const { loading: ticketsLoading } = useSelector((state) => state.tickets);
  const [ticketTypeFormData, setTicketTypeFormData] = useState({
    name: '',
    price: '',
    description: '',
  });
  const [formError, setFormError] = useState(null);

  const handleTicketTypeFormChange = (e) => {
    const { name, value } = e.target;
    setTicketTypeFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateTicketTypeSubmit = async (e) => {
    e.preventDefault();
    if (!ticketTypeFormData.name) {
      toast.error('يرجى إدخال اسم نوع التذكرة');
      return;
    }
    if (!ticketTypeFormData.price || ticketTypeFormData.price < 0) {
      toast.error('يرجى إدخال سعر صحيح (أكبر من أو يساوي الصفر)');
      return;
    }
    if (!userClub) {
      toast.error('خطأ: لا يمكن إضافة نوع تذكرة بدون نادي مرتبط');
      return;
    }

    const ticketTypeData = {
      name: ticketTypeFormData.name,
      price: parseFloat(ticketTypeFormData.price),
      description: ticketTypeFormData.description,
    };

    dispatch(addTicketType(ticketTypeData))
      .unwrap()
      .then((response) => {
        toast.success(`تم إضافة نوع التذكرة ${response.name} بنجاح`);
        dispatch(fetchTicketTypes());
        setTicketTypeFormData({ name: '', price: '', description: '' });
        setFormError(null);
        onOpenChange(false); // Close the modal
      })
      .catch((err) => {
        setFormError(`فشل في إضافة نوع التذكرة: ${err}`);
        toast.error(`فشل في إضافة نوع التذكرة: ${err}`);
      });
  };

  if (!canAddTickets) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="max-w-md modal-container">
        <DialogHeader>
          <DialogTitle className="text-right text-2xl font-bold">إضافة نوع تذكرة جديد</DialogTitle>
          <DialogDescription className="text-right text-sm text-gray-500">
            هذا الحوار يسمح لك بإضافة نوع تذكرة جديد.
          </DialogDescription>
        </DialogHeader>
        {formError && (
          <div className="bg-red-100 text-red-700 p-2 rounded mb-4 text-right text-sm">{formError}</div>
        )}
        <form onSubmit={handleCreateTicketTypeSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-right">اسم نوع التذكرة</label>
            <Input
              type="text"
              name="name"
              value={ticketTypeFormData.name}
              onChange={handleTicketTypeFormChange}
              placeholder="أدخل اسم نوع التذكرة (مثال: VIP)"
              required
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-right">السعر</label>
            <Input
              type="number"
              name="price"
              value={ticketTypeFormData.price}
              onChange={handleTicketTypeFormChange}
              placeholder="أدخل السعر (مثال: 100.00)"
              min="0"
              step="0.01"
              required
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-right">الوصف</label>
            <Input
              type="text"
              name="description"
              value={ticketTypeFormData.description}
              onChange={handleTicketTypeFormChange}
              placeholder="أدخل وصف نوع التذكرة (اختياري)"
              className="w-full"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setTicketTypeFormData({ name: '', price: '', description: '' });
                setFormError(null);
                onOpenChange(false);
              }}
            >
              إلغاء
            </Button>
            <Button type="submit" disabled={ticketsLoading || !userClub}>
              {ticketsLoading ? <Loader2 className="animate-spin h-4 w-4" /> : 'إضافة'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddTicketTypeModal;