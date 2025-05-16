import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addReceipt, fetchReceipts } from "../../redux/slices/receiptsSlice";
import { fetchSubscriptions } from "../../redux/slices/subscriptionsSlice";
import { fetchUsers } from "../../redux/slices/memberSlice";
import { toast } from "react-hot-toast";
import {
  Command,
  CommandInput,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

function AddReceiptForm({ onClose }) {
  const dispatch = useDispatch();
  const { subscriptions } = useSelector((state) => state.subscriptions);

  // Form state
  const [formData, setFormData] = useState({
    club: "",
    member: "",
    subscription: "",
    amount: "",
    payment_method: "cash",
    note: "",
  });

  // Data state
  const [allMembers, setAllMembers] = useState([]);
  const [clubs, setClubs] = useState([]);

  // Member search and pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  

  // Fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        await dispatch(fetchSubscriptions()).unwrap();
        const membersResult = await dispatch(fetchUsers()).unwrap();
        setAllMembers(membersResult);

        // Extract unique clubs
        const uniqueClubs = Array.from(
          new Map(
            membersResult.results.map((m) => [
              m.club,
              { club_id: m.club, club_name: m.club_name },
            ])
          ).values()
        );
        setClubs(uniqueClubs);
      } catch (error) {
        console.error("Failed to fetch initial data:", error.message);
      } finally {
        setIsInitialLoad(false);
      }
    };

    fetchInitialData();
  }, [dispatch]);

  // Filtered and paginated members
  const { filteredMembers, hasMore } = useMemo(() => {
    if (!formData.club) return { filteredMembers: [], hasMore: false };

    const filtered = allMembers.results.filter(
      (member) =>
        member.club === parseInt(formData.club) &&
        (member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (member.rfid_code &&
            member.rfid_code.toLowerCase().includes(searchQuery.toLowerCase())))
    );

    return {
      filteredMembers: filtered.slice(0, page * itemsPerPage),
      hasMore: filtered.length > page * itemsPerPage,
    };
  }, [allMembers, formData.club, searchQuery, page]);

  // Debounced search
  const debouncedSearch = useCallback(
    () =>
      debounce((query) => {
        setSearchQuery(query);
        setPage(1);
      }, 300),
    []
  );

  // Handle infinite scroll
  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    const bottomThreshold = 50;

    if (
      scrollHeight - (scrollTop + clientHeight) < bottomThreshold &&
      hasMore
    ) {
      setPage((prev) => prev + 1);
    }
  };

  // Filter subscriptions based on selected member
  const filteredSubscriptions = formData.member
    ? subscriptions.filter((sub) => sub.member === parseInt(formData.member))
    : [];

  const handleSubmit = async (e) => {
    e.preventDefault();

    const receiptData = {
      ...formData,
      club: parseInt(formData.club),
      member: parseInt(formData.member),
      subscription: parseInt(formData.subscription),
      amount: parseFloat(formData.amount),
    };

    try {
      await dispatch(addReceipt(receiptData)).unwrap();
      await dispatch(fetchReceipts());

      toast.success("تمت إضافة الإيصال بنجاح!");
      onClose();
    } catch (error) {
      console.error("Error adding receipt:", error);
      toast.error("حدث خطأ أثناء إضافة الإيصال");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 p-6 bg-white rounded-lg shadow-md"
    >
      {/* Club Selection */}
      <div>
        <label className="block mb-1 font-medium">النادي</label>
        <select
          name="club"
          value={formData.club}
          onChange={(e) => {
            setFormData({
              ...formData,
              club: e.target.value,
              member: "",
              subscription: "",
            });
          }}
          className="w-full border px-3 py-2 rounded-md"
          required
        >
          <option value="">-- اختر النادي --</option>
          {clubs.map((club) => (
            <option key={club.club_id} value={club.club_id}>
              {club.club_name}
            </option>
          ))}
        </select>
      </div>

      {/* Member Selection */}
      <div>
        <label className="block mb-1 font-medium">العضو</label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              className="w-full justify-between"
              disabled={!formData.club}
            >
              {formData.member
                ? allMembers.results.find((m) => m.id === formData.member)?.name
                : "اختر العضو..."}
              <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0" align="start">
            <Command onScroll={handleScroll}>
              <CommandInput
                placeholder="ابحث عن عضو بالاسم أو رقم RFID..."
                onValueChange={debouncedSearch}
              />
              <CommandList className="max-h-[300px]">
                <CommandGroup>
                  {filteredMembers.map((member) => (
                    <CommandItem
                      key={member.id}
                      value={member.id}
                      onSelect={() => {
                        setFormData((prev) => ({
                          ...prev,
                          member: member.id === prev.member ? "" : member.id,
                          subscription: "",
                        }));
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          formData.member === member.id
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                      <div>
                        <div>{member.name}</div>
                        {member.rfid_code && (
                          <div className="text-xs text-gray-500">
                            RFID: {member.rfid_code}
                          </div>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>

                {!filteredMembers.length && !isInitialLoad && (
                  <CommandEmpty>لا يوجد أعضاء</CommandEmpty>
                )}

                {hasMore && (
                  <CommandItem className="justify-center text-sm text-gray-500">
                    جاري تحميل المزيد...
                  </CommandItem>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* Subscription Selection */}
      <div>
        <label className="block mb-1 font-medium">الاشتراك</label>
        <select
          name="subscription"
          value={formData.subscription}
          onChange={(e) =>
            setFormData({ ...formData, subscription: e.target.value })
          }
          className="w-full border px-3 py-2 rounded-md"
          required
          disabled={!formData.member}
        >
          <option value="">-- اختر الاشتراك --</option>
          {filteredSubscriptions.map((sub) => (
            <option key={sub.id} value={sub.id}>
              {sub.type_details?.name || "نوع غير معروف"}
            </option>
          ))}
        </select>
      </div>

      {/* Rest of the form remains the same */}
      <div>
        <label className="block mb-1 font-medium">المبلغ</label>
        <input
          type="number"
          name="amount"
          value={formData.amount}
          onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
          className="w-full border px-3 py-2 rounded-md"
          required
          step="0.01"
          min="0"
        />
      </div>

      <div>
        <label className="block mb-1 font-medium">طريقة الدفع</label>
        <select
          name="payment_method"
          value={formData.payment_method}
          onChange={(e) =>
            setFormData({ ...formData, payment_method: e.target.value })
          }
          className="w-full border px-3 py-2 rounded-md"
        >
          <option value="cash">نقدي</option>
          <option value="bank">تحويل بنكي</option>
          <option value="visa">فيزا</option>
        </select>
      </div>

      <div>
        <label className="block mb-1 font-medium">ملاحظات</label>
        <textarea
          name="note"
          value={formData.note}
          onChange={(e) => setFormData({ ...formData, note: e.target.value })}
          rows={3}
          className="w-full border px-3 py-2 rounded-md"
        />
      </div>

      <div className="flex justify-end space-x-3 space-x-reverse">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100"
        >
          إلغاء
        </button>
        <button
          type="submit"
          className="btn"
          disabled={
            !formData.club ||
            !formData.member ||
            !formData.subscription ||
            !formData.amount
          }
        >
          إضافة إيصال
        </button>
      </div>
    </form>
  );
}

export default AddReceiptForm;

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
