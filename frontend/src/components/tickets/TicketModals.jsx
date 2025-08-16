import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { editTicketById, deleteTicketById, fetchTickets } from '../../redux/slices/ticketsSlice';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/Dialog';
import { toast } from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

const TicketModals = ({
  selectedTicket,
  setSelectedTicket,
  showEditModal,
  setShowEditModal,
  showDeleteModal,
  setShowDeleteModal,
  showViewModal,
  setShowViewModal,
  userClub,
  currentPage,
  itemsPerPage,
  filterTicketType,
  filterIssueDate,
  canEditTickets,
}) => {
  const dispatch = useDispatch();
  const { ticketTypes, loading: ticketsLoading } = useSelector((state) => state.tickets);
  const [selectedPrice, setSelectedPrice] = React.useState(null);
  const [formError, setFormError] = React.useState(null);

  const closeAllModals = () => {
    setShowEditModal(false);
    setShowDeleteModal(false);
    setShowViewModal(false);
    setSelectedTicket(null);
    setSelectedPrice(null);
    setFormError(null);
  };

  const handleEditTicketTypeButtonClick = (type) => {
    setSelectedTicket((prev) => ({ ...prev, ticket_type: type.id.toString() }));
    setSelectedPrice(type.price);
    toast.success(`تم اختيار التذكرة بنوع ${type.name} بقيمة ${type.price} جنيه`);
  };

  const handleEditSave = () => {
    if (!selectedTicket || !userClub) {
      setFormError('خطأ: التذكرة أو النادي غير متاح');
      return;
    }
    if (!selectedTicket.ticket_type) {
      toast.error('يرجى اختيار نوع التذكرة');
      return;
    }
    if (!selectedTicket.notes) {
      toast.error('يرجى إدخال ملاحظات التذكرة');
      return;
    }
    const userId = localStorage.getItem('userId') || userClub.id;
    const updatedTicketData = {
      club: userClub.id,
      ticket_type_id: parseInt(selectedTicket.ticket_type),
      notes: selectedTicket.notes,
      issued_by: userId,
    };
    dispatch(editTicketById({ ticketId: selectedTicket.id, ticketData: updatedTicketData }))
      .unwrap()
      .then(() => {
        toast.success('تم تعديل التذكرة بنجاح!');
        dispatch(fetchTickets({
          page: currentPage,
          page_size: itemsPerPage,
          club: userClub.id,
          ticket_type: filterTicketType,
          issue_date: filterIssueDate,
        }));
        closeAllModals();
      })
      .catch((err) => {
        setFormError(`فشل في تعديل التذكرة: ${err}`);
        toast.error(`فشل في تعديل التذكرة: ${err}`);
      });
  };

  const handleDelete = () => {
    if (!selectedTicket) return;
    dispatch(deleteTicketById(selectedTicket.id))
      .unwrap()
      .then(() => {
        toast.success('تم حذف التذكرة بنجاح!');
        dispatch(fetchTickets({
          page: currentPage,
          page_size: itemsPerPage,
          club: userClub.id,
          ticket_type: filterTicketType,
          issue_date: filterIssueDate,
        }));
        closeAllModals();
      })
      .catch((err) => {
        toast.error(`فشل في حذف التذكرة: ${err}`);
      });
  };

  return (
    <>
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent dir="rtl" className="max-w-md modal-container">
          <DialogHeader>
            <DialogTitle className="text-right text-2xl font-bold">تعديل التذكرة</DialogTitle>
            <DialogDescription className="text-right text-sm text-gray-500">
              هذا الحوار يسمح لك بتعديل نوع التذكرة والملاحظات.
            </DialogDescription>
          </DialogHeader>
          {formError && (
            <div className="bg-red-100 text-red-700 p-2 rounded mb-4 text-right text-sm">{formError}</div>
          )}
          {selectedTicket && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-right">نوع التذكرة</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {ticketTypes.map((type) => (
                    <Button
                      key={type.id}
                      type="button"
                      variant={selectedTicket.ticket_type === type.id.toString() ? 'default' : 'outline'}
                      className="text-sm w-full"
                      onClick={() => handleEditTicketTypeButtonClick(type)}
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
                  value={selectedTicket.notes || ''}
                  onChange={(e) =>
                    setSelectedTicket((prev) => ({ ...prev, notes: e.target.value }))
                  }
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
                <Button type="button" variant="outline" onClick={closeAllModals}>
                  إلغاء
                </Button>
                <Button onClick={handleEditSave} disabled={ticketsLoading || !canEditTickets}>
                  {ticketsLoading ? <Loader2 className="animate-spin h-4 w-4" /> : 'حفظ'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent dir="rtl" className="max-w-sm modal-container">
          <DialogHeader>
            <DialogTitle className="text-right text-xl font-bold">حذف التذكرة</DialogTitle>
            <DialogDescription className="text-right text-sm text-gray-500">
              هذا الحوار يطالبك بتأكيد حذف التذكرة.
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm">هل أنت متأكد من حذف التذكرة؟</p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={closeAllModals}>
              إلغاء
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              حذف
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
        <DialogContent dir="rtl" className="max-w-md modal-container">
          <DialogHeader>
            <DialogTitle className="text-right text-2xl font-bold">تفاصيل التذكرة</DialogTitle>
            <DialogDescription className="text-right text-sm text-gray-500">
              هذا الحوار يعرض تفاصيل التذكرة المختارة.
            </DialogDescription>
          </DialogHeader>
          {selectedTicket && (
            <div className="space-y-2">
              <p><strong>الرقم التسلسلي:</strong> {selectedTicket.serial_number}</p>
              <p><strong>نوع التذكرة:</strong> {selectedTicket.ticket_type?.name || '-'}</p>
              <p><strong>السعر:</strong> {selectedTicket.price} جنيه</p>
              <p><strong>وقت الإصدار:</strong> {new Date(selectedTicket.issue_datetime).toLocaleString('ar-EG')}</p>
              <p><strong>ملاحظات:</strong> {selectedTicket.notes}</p>
              <div className="flex justify-end mt-4">
                <Button variant="outline" onClick={closeAllModals}>
                  إغلاق
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TicketModals;