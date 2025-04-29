import { useState } from 'react';
import SubscriptionList from "./SubscriptionList";
import SubscriptionsTypes from "./SubscriptionsTypes"; // Removed the extra space// Adjust path as needed

export default function Subscriptions() {
  const [activeTab, setActiveTab] = useState('list'); // 'list' or 'types'

  return (
    <div className="max-w-full mx-auto p-4">
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200">
        <button
          className={`py-2 px-4 font-medium text-sm focus:outline-none ${
            activeTab === 'list'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('list')}
        >
          Subscription List
        </button>
        <button
          className={`py-2 px-4 font-medium text-sm focus:outline-none ${
            activeTab === 'types'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('types')}
        >
          Subscription Types
        </button>
      </div>

      {/* Tab Content */}
      <div className="">
        {activeTab === 'list' ? (
          <SubscriptionList />
        ) : (
          <SubscriptionsTypes />
        )}
      </div>
    </div>
  );
}

