import React from 'react';
import AnalyticsFilters from './AnalyticsFilters';
import AnalyticsTabs from './AnalyticsTabs';
import useAnalytics from '../hooks/useAnalytics';

const SubscriptionAnalyticz = () => {
  const {
    analytics,
    subscriptionTypes,
    coaches,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    selectedType,
    setSelectedType,
    selectedCoach,
    setSelectedCoach,
    loading,
    error,
    fetchAnalytics,
    getCsvData,
    exportToPDF,
  } = useAnalytics();

  return (
    <div className="space-y-6">
      <AnalyticsFilters
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        selectedType={selectedType}
        setSelectedType={setSelectedType}
        selectedCoach={selectedCoach}
        setSelectedCoach={setSelectedCoach}
        subscriptionTypes={subscriptionTypes}
        coaches={coaches}
        fetchAnalytics={fetchAnalytics}
        getCsvData={getCsvData}
        exportToPDF={exportToPDF}
      />
      <AnalyticsTabs analytics={analytics} loading={loading} error={error} />
    </div>
  );
};

export default SubscriptionAnalyticz;