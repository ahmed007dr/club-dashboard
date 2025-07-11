import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchUsers } from "@/redux/slices/memberSlice";
import { fetchActiveSubscriptionTypes, fetchPaymentMethods, fetchSpecialOffers } from "@/redux/slices/subscriptionsSlice";
import usePermission from "@/hooks/usePermission";
import { motion } from "framer-motion";
import axios from "axios";
import BASE_URL from "@/config/api";
import SearchSection from "./SearchSection";
import MemberBio from "./MemberBio";
import AttendanceTable from "./AttendanceTable";
import SubscriptionsSection from "./SubscriptionsSection";
import AddSubscriptionModal from "./AddSubscriptionModal";
import AddMemberModal from "./AddMemberModal";

const MemberProfile = () => {
  const dispatch = useDispatch();
  const canViewMembers = usePermission("view_member");
  const canAddSubscription = usePermission("add_subscription");
  // const { member: { items: members, pagination }, subscriptions: { subscriptionStatus, error: subscriptionError } } = useSelector((state) => state);
  const { members, pagination } = useSelector((state) => state.member);
  const { memberSubscriptions, subscriptionStatus, subscriptionError } = useSelector((state) => state.subscriptions);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMember, setSelectedMember] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddSubscriptionModalOpen, setIsAddSubscriptionModalOpen] = useState(false);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [userClub, setUserClub] = useState(null);
  const [coaches, setCoaches] = useState([]);

  // جلب بيانات النادي
  useEffect(() => {
    const fetchUserClub = async () => {
      try {
        const response = await axios.get(`${BASE_URL}accounts/api/profile/`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        setUserClub({ id: response.data.club.id, name: response.data.club.name });
      } catch (err) {
        toast.error("فشل في جلب بيانات النادي");
      }
    };
    fetchUserClub();
  }, []);

  // جلب أنواع الاشتراكات، طرق الدفع، العروض الخاصة، والكباتن
  useEffect(() => {
    if (canAddSubscription) {
      dispatch(fetchActiveSubscriptionTypes());
      dispatch(fetchPaymentMethods());
      dispatch(fetchSpecialOffers());
      const fetchCoaches = async () => {
        try {
          const response = await axios.get(`${BASE_URL}accounts/api/users/`, {
            params: { role: "coach", is_active: true },
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          });
          setCoaches(response.data.results || []);
        } catch (error) {
          toast.error("فشل في جلب قائمة الكباتن");
        }
      };
      fetchCoaches();
    }
  }, [dispatch, canAddSubscription]);

  // التحقق من الصلاحيات
  if (!canViewMembers) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center p-6" dir="rtl">
        <FaExclamation className="text-red-600 text-5xl mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">لا يوجد صلاحية</h2>
        <p className="text-gray-600 max-w-md">ليس لديك الصلاحيات اللازمة لعرض بيانات الأعضاء. تواصل مع المسؤول.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 sm:p-6 max-w-7xl mx-auto" dir="rtl">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="space-y-6">
        <SearchSection
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          setSelectedMember={setSelectedMember}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
          setIsAddMemberModalOpen={setIsAddMemberModalOpen}
        />
        {selectedMember && (
          <>
            <MemberBio selectedMember={selectedMember} subscriptionCount={memberSubscriptions?.count || 0} />
            <AttendanceTable selectedMember={selectedMember} />
            <SubscriptionsSection
            selectedMember={selectedMember}
            setIsAddSubscriptionModalOpen={setIsAddSubscriptionModalOpen}
            subscriptionStatus={subscriptionStatus}
            subscriptionError={subscriptionError}
          />

          </>
        )}
        {isAddSubscriptionModalOpen && (
          <AddSubscriptionModal
            selectedMember={selectedMember}
            userClub={userClub}
            coaches={coaches}
            setIsAddSubscriptionModalOpen={setIsAddSubscriptionModalOpen}
          />
        )}
        {isAddMemberModalOpen && (
          <AddMemberModal
            userClub={userClub}
            setIsAddMemberModalOpen={setIsAddMemberModalOpen}
          />
        )}
      </motion.div>
    </div>
  );
};

export default MemberProfile;