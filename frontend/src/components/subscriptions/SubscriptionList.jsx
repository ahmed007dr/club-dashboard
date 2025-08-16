import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchSubscriptions } from "@/redux/slices/subscriptionsSlice";
import { Button } from "@/components/ui/button";
import { CiCircleList } from "react-icons/ci";
import SubscriptionFilters from "./SubscriptionFilters";
import SubscriptionTable from "./SubscriptionTable";
import SubscriptionCards from "./SubscriptionCards";
import PaginationControls from "../dashboard/PaginationControls";
import CreateSubscriptionModal from "./CreateSubscriptionModal";
import UpdateSubscriptionModal from "./UpdateSubscriptionModal";
import DeleteSubscriptionModal from "./DeleteSubscriptionModal";
import FreezeSubscriptionModal from "./FreezeSubscriptionModal";
import SubscriptionDetailsModal from "./SubscriptionDetailsModal";
import usePermission from "@/hooks/usePermission";
import { motion, AnimatePresence } from "framer-motion";

const SubscriptionList = () => {
  const dispatch = useDispatch();
  const { subscriptions, pagination, status, error: reduxError } = useSelector(
    (state) => state.subscriptions
  );
  const canAddSubscription = usePermission("add_subscription");

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isFreezeModalOpen, setIsFreezeModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [detailSubscription, setDetailSubscription] = useState(null);
  const [paymentAmounts, setPaymentAmounts] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    memberName: "",
    startDate: "",
    endDate: "",
    entryCount: "",
    status: "", // دعم تصفية الحالة
  });
  const [error, setError] = useState(null);

  const itemsPerPage = 20;
  const totalItems = pagination.count || 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const paginationRange = useMemo(() => {
    const maxButtons = 5;
    const sideButtons = Math.floor(maxButtons / 2);
    let start = Math.max(1, currentPage - sideButtons);
    let end = Math.min(totalPages, currentPage + sideButtons);
    if (end - start + 1 < maxButtons) {
      if (currentPage <= sideButtons) {
        end = Math.min(totalPages, maxButtons);
      } else {
        start = Math.max(1, totalPages - maxButtons + 1);
      }
    }
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [currentPage, totalPages]);

  const handlePageChange = useCallback((pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
      window.scrollTo(0, 0);
    }
  }, [totalPages]);

  useEffect(() => {
    const query = {
      page: currentPage,
      pageSize: itemsPerPage,
      searchTerm: filters.memberName.trim(),
      startDate: filters.startDate,
      endDate: filters.endDate,
      entryCount: filters.entryCount,
      status: filters.status.toLowerCase(), // تمرير الحالة للـ backend
    };
//     console.log("Fetch query:", query);
    dispatch(fetchSubscriptions(query))
      .unwrap()
      .then((data) => {
//         console.log("Fetched subscriptions:", data.subscriptions);
        if (data.subscriptions.length === 0 && filters.memberName.trim()) {
          setError("لا توجد اشتراكات مطابقة للبحث.");
        } else {
          setError(null);
        }
      })
      .catch((err) => {
        setError(err === "لا يوجد اشتراكات مطابقة للبحث" ? err : "فشل في جلب الاشتراكات: " + (err || "حدث خطأ"));
      });
  }, [dispatch, currentPage, filters, itemsPerPage]);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
    setError(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="mx-auto p-4 sm:p-6 bg-gray-100 min-h-screen"
      dir="rtl"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-3 space-x-reverse">
          <CiCircleList className="text-blue-600 w-8 h-8" />
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-700">قائمة الاشتراكات</h2>
        </div>
        {canAddSubscription && (
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <span className="mr-2">إضافة اشتراك</span>
          </Button>
        )}
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-red-100 text-red-700 p-4 rounded-lg mb-6 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <SubscriptionFilters
        filters={filters}
        setFilters={handleFilterChange}
        setCurrentPage={setCurrentPage}
        setError={setError}
        isLoading={status === "loading"}
        itemsPerPage={itemsPerPage}
      />

      <motion.div
        className="bg-white rounded-lg shadow-sm"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="hidden md:block">
          <SubscriptionTable
            subscriptions={subscriptions}
            isLoading={status === "loading"}
            paymentAmounts={paymentAmounts}
            setPaymentAmounts={setPaymentAmounts}
            setSelectedSubscription={setSelectedSubscription}
            setIsUpdateModalOpen={setIsUpdateModalOpen}
            setIsDeleteModalOpen={setIsDeleteModalOpen}
            setIsFreezeModalOpen={setIsFreezeModalOpen}
            setIsDetailModalOpen={setIsDetailModalOpen}
            setDetailSubscription={setDetailSubscription}
          />
        </div>
        <div className="md:hidden">
          <SubscriptionCards
            subscriptions={subscriptions}
            isLoading={status === "loading"}
            paymentAmounts={paymentAmounts}
            setPaymentAmounts={setPaymentAmounts}
            setSelectedSubscription={setSelectedSubscription}
            setIsUpdateModalOpen={setIsUpdateModalOpen}
            setIsDeleteModalOpen={setIsDeleteModalOpen}
            setIsFreezeModalOpen={setIsFreezeModalOpen}
            setIsDetailModalOpen={setIsDetailModalOpen}
            setDetailSubscription={setDetailSubscription}
          />
        </div>
      </motion.div>

      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        paginationRange={paginationRange}
        handlePageChange={handlePageChange}
      />

      <AnimatePresence>
        {isCreateModalOpen && canAddSubscription && (
          <CreateSubscriptionModal
            isOpen={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
          />
        )}
        {isUpdateModalOpen && selectedSubscription && (
          <UpdateSubscriptionModal
            isOpen={isUpdateModalOpen}
            onClose={() => setIsUpdateModalOpen(false)}
            subscription={selectedSubscription}
            setCurrentPage={setCurrentPage}
            filters={filters}
            itemsPerPage={itemsPerPage}
          />
        )}
        {isDeleteModalOpen && selectedSubscription && (
          <DeleteSubscriptionModal
            isOpen={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
            subscription={selectedSubscription}
            setCurrentPage={setCurrentPage}
            filters={filters}
            itemsPerPage={itemsPerPage}
            subscriptionsLength={subscriptions.length}
          />
        )}
        {isFreezeModalOpen && selectedSubscription && (
          <FreezeSubscriptionModal
            isOpen={isFreezeModalOpen}
            onClose={() => setIsFreezeModalOpen(false)}
            subscription={selectedSubscription}
            filters={filters}
            itemsPerPage={itemsPerPage}
            currentPage={currentPage}
          />
        )}
        {isDetailModalOpen && detailSubscription && (
          <SubscriptionDetailsModal
            isOpen={isDetailModalOpen}
            onClose={() => setIsDetailModalOpen(false)}
            subscription={detailSubscription}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default SubscriptionList;