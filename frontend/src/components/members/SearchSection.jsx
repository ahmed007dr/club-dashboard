import React, { useCallback, useState } from "react";
import { useDispatch } from "react-redux";
import { searchMember, fetchUsers } from "@/redux/slices/memberSlice";
import { fetchMemberSubscriptions } from "@/redux/slices/subscriptionsSlice";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FaSearch, FaPlus } from "react-icons/fa";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import usePermission from "@/hooks/usePermission";
import { debounce } from "lodash";

const SearchSection = ({ searchQuery, setSearchQuery, setSelectedMember, isLoading, setIsLoading, setIsAddMemberModalOpen }) => {
  const dispatch = useDispatch();
  const canAddMember = usePermission("add_member");
  const [searchResults, setSearchResults] = useState([]); // حالة لتخزين نتائج البحث

  const searchMemberDebounced = useCallback(
    debounce(async (query) => {
      setIsLoading(true);
      try {
        console.log("searchMemberDebounced - Query:", query);
        if (query.trim() === "") {
          setSelectedMember(null);
          setSearchResults([]);
          const fetchUsersResponse = await dispatch(fetchUsers({ page: 1 })).unwrap();
          console.log("searchMemberDebounced - fetchUsers Response:", fetchUsersResponse);
        } else {
          const result = await dispatch(searchMember({ query, page: 1 })).unwrap();
          console.log("searchMemberDebounced - searchMember Response:", result);
          if (result.results.length > 0) {
            setSearchResults(result.results); // تخزين جميع النتائج
            if (result.results.length === 1) {
              // إذا كان هناك عضو واحد فقط، حدده تلقائيًا
              setSelectedMember(result.results[0]);
              console.log("searchMemberDebounced - Selected Member:", result.results[0]);
              const fetchSubscriptionsResponse = await dispatch(fetchMemberSubscriptions({ memberId: result.results[0].id, page: 1 })).unwrap();
              console.log("searchMemberDebounced - fetchMemberSubscriptions Response:", fetchSubscriptionsResponse);
            } else {
              // إذا كان هناك أكثر من عضو، لا تحدد أي عضو تلقائيًا
              setSelectedMember(null);
              console.log("searchMemberDebounced - Multiple members found:", result.results);
            }
          } else {
            toast.error("لم يتم العثور على عضو مطابق");
            console.warn("searchMemberDebounced - No members found for query:", query);
            setSelectedMember(null);
            setSearchResults([]);
          }
        }
      } catch (err) {
        const errorMessage = err?.message || "حدث خطأ";
        console.error("searchMemberDebounced - Error:", err);
        toast.error(`فشل في البحث: ${errorMessage}`);
        setSearchResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 1000),
    [dispatch, setSelectedMember, setIsLoading]
  );

  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    console.log("handleSearch - Query Changed:", query);
    searchMemberDebounced(query);
  };

  const handleReset = () => {
    setSearchQuery("");
    setSelectedMember(null);
    setSearchResults([]);
    console.log("handleReset - Resetting search");
    dispatch(fetchUsers({ page: 1 }));
  };

  const handleSelectMember = async (memberId) => {
    const selected = searchResults.find((member) => member.id === memberId);
    if (selected) {
      setSelectedMember(selected);
      console.log("handleSelectMember - Selected Member:", selected);
      try {
        const fetchSubscriptionsResponse = await dispatch(fetchMemberSubscriptions({ memberId: selected.id, page: 1 })).unwrap();
        console.log("handleSelectMember - fetchMemberSubscriptions Response:", fetchSubscriptionsResponse);
      } catch (err) {
        const errorMessage = err?.message || "حدث خطأ";
        console.error("handleSelectMember - Error:", err);
        toast.error(`فشل في جلب الاشتراكات: ${errorMessage}`);
      }
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-bold flex items-center gap-2">
          <FaSearch className="text-blue-600" />
          البحث عن عضو
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <FaSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              value={searchQuery}
              onChange={handleSearch}
              placeholder="ابحث بالاسم، رقم العضوية، أو كود RFID"
              className="pr-10 py-2 text-right"
            />
          </div>
          {canAddMember && (
            <Button
              onClick={() => setIsAddMemberModalOpen(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              <FaPlus className="mr-2" />
              إضافة عضو جديد
            </Button>
          )}
          <Button onClick={handleReset} variant="outline">
            إعادة تعيين
          </Button>
        </div>
        {searchResults.length > 1 && (
          <div className="mt-4">
            <Select onValueChange={handleSelectMember}>
              <SelectTrigger className="w-full text-right">
                <SelectValue placeholder="اختر عضوًا من القائمة" />
              </SelectTrigger>
              <SelectContent>
                {searchResults.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.name} (كارت العضويه: {member.rfid_code || "غير متوفر"})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        {isLoading && (
          <div className="flex justify-center mt-4">
            <Loader2 className="animate-spin w-8 h-8 text-blue-600" />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SearchSection;