import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchSubscriptionTypes, postSubscription } from "../../redux/slices/subscriptionsSlice";
import { fetchUsers } from "../../redux/slices/memberSlice";
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

const CreateSubscription = ({ onClose }) => {
  const dispatch = useDispatch();
  const { subscriptionTypes } = useSelector((state) => state.subscriptions);

  // Form state
  const [formData, setFormData] = useState({
    club: "",
    member: "",
    type: "",
    start_date: "",
    paid_amount: "",
  });

  // Data state
  const [allMembers, setAllMembers] = useState([]);
  const [clubs, setClubs] = useState([]);

  // Member search and pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        await dispatch(fetchSubscriptionTypes()).unwrap();
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
        handleError(error, "Failed to load initial data");
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
  const debouncedSearch = useCallback(() =>
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { club, member, type, start_date, paid_amount } = formData;

    // Client-side validation
    if (!club || !member || !type || !start_date || !paid_amount) {
      setErrorMessage("Please fill in all required fields");
      setIsModalOpen(true);
      return;
    }

    if (isNaN(parseFloat(paid_amount)) || parseFloat(paid_amount) <= 0) {
      setErrorMessage("Paid amount must be a positive number");
      setIsModalOpen(true);
      return;
    }

    setIsSubmitting(true);

    const payload = {
      club: parseInt(club),
      member: parseInt(member),
      type: parseInt(type),
      start_date,
      paid_amount: parseFloat(paid_amount),
    };

    try {
      await dispatch(postSubscription(payload)).unwrap();
      setFormData({
        club: "",
        member: "",
        type: "",
        start_date: "",
        paid_amount: "",
      });
      if (onClose) onClose();
    } catch (error) {
      console.log("Full error object:", JSON.stringify(error, null, 2)); // Debug entire error
      console.log("Error payload:", JSON.stringify(error.payload, null, 2)); // Debug payload
      console.log("Error data:", JSON.stringify(error.data, null, 2)); // Debug data (if exists)
      console.log("Error response:", JSON.stringify(error.response, null, 2)); // Debug response (if exists)

      // Try multiple possible error locations
      let errorData = error.payload || error.data || error.response || error;

      console.log("Final errorData:", JSON.stringify(errorData, null, 2)); // Debug final errorData

      if (
        errorData?.non_field_errors &&
        Array.isArray(errorData.non_field_errors)
      ) {
        console.log("Handling non_field_errors:", errorData.non_field_errors); // Debug
        setErrorMessage(errorData.non_field_errors[0]); // Use raw error message
        setIsModalOpen(true);
      } else {
        console.log("Fallback error:", errorData); // Debug fallback
        setErrorMessage(
          errorData?.message || error.message || "An unexpected error occurred"
        );
        setIsModalOpen(true);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Error handling
  const handleError = (error, defaultMessage) => {
    const errorMessage =
      error?.payload?.message || error?.message || defaultMessage;
    setErrorMessage(errorMessage);
    setIsModalOpen(true);
  };

  return (
    <div className="container mx-auto p-4" dir="rtl">
      <h2 className="text-xl font-bold mb-6">إنشاء اشتراك جديد</h2>

      {/* Error Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">حدث خطأ</h3>
            <p className="text-red-600">{errorMessage}</p>
            <div className="mt-4 flex justify-end">
              <Button
                onClick={() => setIsModalOpen(false)}
                variant="destructive"
              >
                إغلاق
              </Button>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Club Selection */}
        <div>
          <label className="block text-sm font-medium mb-2">النادي</label>
          <select
            value={formData.club}
            onChange={(e) =>
              setFormData({
                ...formData,
                club: e.target.value,
                member: "", // Reset member on club change
              })
            }
            className="w-full p-2.5 border rounded-md focus:ring-2 focus:ring-blue-500"
            disabled={isSubmitting}
          >
            <option value="">اختر النادي</option>
            {clubs.map((club) => (
              <option key={club.club_id} value={club.club_id}>
                {club.club_name}
              </option>
            ))}
          </select>
        </div>

        {/* Member Selection */}
        <div>
          <label className="block text-sm font-medium mb-2">العضو</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                className="w-full justify-between"
                disabled={!formData.club || isSubmitting}
              >
                {formData.member
                  ? allMembers.results.find((m) => m.id === formData.member)
                      ?.name
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

        {/* Subscription Type */}
        <div>
          <label className="block text-sm font-medium mb-2">نوع الاشتراك</label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            className="w-full p-2.5 border rounded-md focus:ring-2 focus:ring-blue-500"
            disabled={isSubmitting}
          >
            <option value="">اختر النوع</option>
            {subscriptionTypes.results
              .filter(
                (type) =>
                  type.club_details.id.toString() === formData.club.toString()
              )
              ?.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name} - {type.price} جنيها
                </option>
              ))}
          </select>
        </div>

        {/* Start Date */}
        <div>
          <label className="block text-sm font-medium mb-2">تاريخ البدء</label>
          <input
            type="date"
            value={formData.start_date}
            onChange={(e) =>
              setFormData({ ...formData, start_date: e.target.value })
            }
            className="w-full p-2.5 border rounded-md focus:ring-2 focus:ring-blue-500"
            min={new Date().toISOString().split("T")[0]}
            disabled={isSubmitting}
          />
        </div>

        {/* Paid Amount */}
        <div>
          <label className="block text-sm font-medium mb-2">
            المبلغ المدفوع
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={formData.paid_amount}
            onChange={(e) =>
              setFormData({ ...formData, paid_amount: e.target.value })
            }
            className="w-full p-2.5 border rounded-md focus:ring-2 focus:ring-blue-500"
            placeholder="0.00"
            disabled={isSubmitting}
          />
        </div>

        {/* Submit Button */}
        <Button type="submit" className="w-full mt-6" disabled={isSubmitting}>
          {isSubmitting ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              جاري الحفظ...
            </span>
          ) : (
            "إنشاء اشتراك"
          )}
        </Button>
      </form>
    </div>
  );
};

export default CreateSubscription;

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