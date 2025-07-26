import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { Table, Button, Tag, Space } from 'antd';
import { useSelector, useDispatch } from 'react-redux';
import { fetchRemainingInvites, deleteInviteById, markInviteAsUsed } from '../../redux/slices/invitesSlice';
import usePermission from '../../hooks/usePermission';
import { toast } from 'react-hot-toast';

/**
 * مكون لعرض جدول الدعوات المجانية مع أزرار التعديل، الحذف، وتعليم كمستخدم.
 * @param {Object} props
 * @param {Array} props.invites - قائمة الدعوات
 * @param {boolean} props.loading - حالة التحميل
 * @param {Function} props.onEdit - دالة لتعديل دعوة
 * @param {Function} props.onDelete - دالة لحذف دعوة
 * @param {Function} props.onMarkUsed - دالة لتعليم الدعوة كمستخدمة
 */
const InviteTable = ({ invites, loading, onEdit, onDelete, onMarkUsed }) => {
  const dispatch = useDispatch();
  const { remainingInvites } = useSelector((state) => state.invites || {});
  const canEditInvites = usePermission('change_freeinvite');
  const canDeleteInvites = usePermission('delete_freeinvite');

  // Fetch remaining invites when an invite is loaded
  React.useEffect(() => {
    const uniqueMemberIds = [...new Set(invites.map((invite) => invite.invited_by?.id).filter(Boolean))];
    uniqueMemberIds.forEach((memberId) => {
      dispatch(fetchRemainingInvites(memberId));
    });
  }, [invites, dispatch]);

  const getRemainingInvites = useMemo(
    () => (subscriptionId) => {
      if (!remainingInvites || !remainingInvites.remaining_invites) return 'غير متوفر';
      const sub = remainingInvites.remaining_invites.find(
        (item) => item.subscription_id === subscriptionId
      );
      return sub ? sub.remaining : 'غير متوفر';
    },
    [remainingInvites]
  );

  const columns = useMemo(
    () => [
      {
        title: 'اسم المشترك',
        dataIndex: ['invited_by_details', 'name'],
        key: 'subscriber_name',
        render: (text) => text || 'غير متوفر',
      },
      {
        title: 'نوع الاشتراك',
        dataIndex: ['subscription_details', 'type_name'],
        key: 'subscription_type',
        render: (text) => text || 'غير متوفر',
      },
      {
        title: 'الدعوات المتبقية',
        key: 'remaining_invites',
        render: (record) => {
          if (!record.subscription) {
            console.warn(`Invite ID ${record.id} has no subscription`, record);
            return 'غير متوفر';
          }
          return getRemainingInvites(record.subscription.id);
        },
      },
      {
        title: 'اسم الضيف',
        dataIndex: 'guest_name',
        key: 'guest_name',
      },
      {
        title: 'RFID Code',
        dataIndex: 'rfid_code',
        key: 'rfid_code',
        render: (text) => text || 'غير متوفر',
      },
      {
        title: 'الحالة',
        dataIndex: 'status',
        key: 'status',
        render: (status) => {
          let color = 'gray';
          let text = status;
          if (status === 'used') {
            color = 'red';
            text = 'مستخدمة';
          } else if (status === 'pending') {
            color = 'green';
            text = 'متاحة';
          } else if (status === 'cancelled') {
            color = 'gray';
            text = 'ملغاة';
          }
          return <Tag color={color}>{text}</Tag>;
        },
      },
      {
        title: 'الإجراءات',
        key: 'actions',
        render: (_, record) => (
          <Space size="middle">
            {canEditInvites && (
              <Button
                type="link"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(record);
                }}
              >
                تعديل
              </Button>
            )}
            <Button
              type="link"
              disabled={record.status === 'used'}
              onClick={(e) => {
                e.stopPropagation();
                onMarkUsed(record);
              }}
            >
              تعليم كمستخدم
            </Button>
            {canDeleteInvites && (
              <Button
                type="link"
                danger
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(record);
                }}
              >
                حذف
              </Button>
            )}
          </Space>
        ),
      },
    ],
    [canEditInvites, canDeleteInvites, getRemainingInvites, onEdit, onDelete, onMarkUsed]
  );

  return (
    <Table
      columns={columns}
      dataSource={invites || []}
      loading={loading}
      rowKey="id"
      pagination={false}
      scroll={{ x: true }}
      locale={{ emptyText: 'لا توجد دعوات تطابق المعايير' }}
    />
  );
};

InviteTable.propTypes = {
  invites: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      guest_name: PropTypes.string.isRequired,
      status: PropTypes.oneOf(['pending', 'used', 'cancelled']).isRequired,
      invited_by: PropTypes.shape({
        id: PropTypes.number,
      }),
      invited_by_details: PropTypes.shape({
        name: PropTypes.string,
        membership_number: PropTypes.string,
      }),
      subscription: PropTypes.shape({
        id: PropTypes.number,
      }),
      subscription_details: PropTypes.shape({
        type_name: PropTypes.string,
      }),
      phone: PropTypes.string,
      date: PropTypes.string,
      rfid_code: PropTypes.string,
    })
  ).isRequired,
  loading: PropTypes.bool.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onMarkUsed: PropTypes.func.isRequired,
};

export default InviteTable;