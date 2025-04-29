import { useSearchParams, useNavigate } from 'react-router-dom';
import SubscriptionList from "./SubscriptionList";
import SubscriptionsTypes from "./SubscriptionsTypes";

export default function Subscriptions() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'list';

  const handleTabChange = (tab) => {
    setSearchParams({ tab }); 
  };

  return (
    <div className="max-w-full mx-auto p-4" dir="rtl">
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200">
        <button
          className={`py-2 px-4 font-medium text-sm focus:outline-none ${
            activeTab === 'list'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => handleTabChange('list')}
        >
          قائمة الاشتراكات
        </button>
        <button
          className={`py-2 px-4 font-medium text-sm focus:outline-none ${
            activeTab === 'types'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => handleTabChange('types')}
        >
          أنواع الاشتراكات
        </button>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'list' ? <SubscriptionList /> : <SubscriptionsTypes />}
      </div>
    </div>
  );
}

