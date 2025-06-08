// src/components/dashboard/TicketTable.jsx
import React from 'react';
import { Button } from '../ui/Button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/DropdownMenu';
import { MoreVertical } from 'lucide-react';

// src/components/dashboard/TicketTable.jsx
const TicketTable = ({ tickets, canEditTickets, canDeleteTickets, openViewModal, openEditModal, openDeleteModal }) => {
    return (
      <div className="overflow-x-auto">
        {tickets.length > 0 ? (
          <>
            <table className="min-w-full bg-white shadow rounded hidden lg:table">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-3 px-4 text-right text-sm font-medium text-gray-700">الرقم التسلسلي</th>
                  <th className="py-3 px-4 text-right text-sm font-medium text-gray-700">نوع التذكرة</th>
                  <th className="py-3 px-4 text-right text-sm font-medium text-gray-700">السعر</th>
                  <th className="py-3 px-4 text-right text-sm font-medium text-gray-700">وقت الإصدار</th>
                  <th className="py-3 px-4 text-right text-sm font-medium text-gray-700">ملاحظات</th>
                  <th className="py-3 px-4 text-right text-sm font-medium text-gray-700">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {tickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 text-right text-sm">{ticket.serial_number}</td>
                    <td className="py-3 px-4 text-right text-sm">{ticket.ticket_type?.name || '-'}</td>
                    <td className="py-3 px-4 text-right text-sm">{ticket.price} جنيه</td>
                    <td className="py-3 px-4 text-right text-sm">
                      {new Date(ticket.issue_datetime).toLocaleString('ar-EG')}
                    </td>
                    <td className="py-3 px-4 text-right text-sm">{ticket.notes}</td>
                    <td className="py-3 px-4 text-right">
                      <DropdownMenu dir="rtl">
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-5 w-5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem onClick={(e) => openViewModal(ticket, e)}>
                            عرض التفاصيل
                          </DropdownMenuItem>
                          {canEditTickets && (
                            <DropdownMenuItem onClick={(e) => openEditModal(ticket, e)}>
                              تعديل
                            </DropdownMenuItem>
                          )}
                          {canDeleteTickets && (
                            <DropdownMenuItem onClick={(e) => openDeleteModal(ticket, e)}>
                              حذف
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="lg:hidden space-y-4">
              {tickets.map((ticket) => (
                <div key={ticket.id} className="border rounded-lg p-4 bg-white shadow-sm">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold">{ticket.serial_number}</span>
                    <DropdownMenu dir="rtl">
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-5 w-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem onClick={(e) => openViewModal(ticket, e)}>
                          عرض التفاصيل
                        </DropdownMenuItem>
                        {canEditTickets && (
                          <DropdownMenuItem onClick={(e) => openEditModal(ticket, e)}>
                            تعديل
                          </DropdownMenuItem>
                        )}
                        {canDeleteTickets && (
                          <DropdownMenuItem onClick={(e) => openDeleteModal(ticket, e)}>
                            حذف
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <p className="text-sm">نوع التذكرة: {ticket.ticket_type?.name || '-'}</p>
                  <p className="text-sm">السعر: {ticket.price} جنيه</p>
                  <p className="text-sm">وقت الإصدار: {new Date(ticket.issue_datetime).toLocaleString('ar-EG')}</p>
                  <p className="text-sm">ملاحظات: {ticket.notes}</p>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="text-center text-gray-500">لا توجد تذاكر متاحة</p>
        )}
      </div>
    );
  };
  
export default TicketTable;