import React from "react";
import { FaUsers, FaCalendarCheck, FaTicketAlt, FaCheckCircle } from "react-icons/fa"; // Import icons from React Icons
import SubscriptionComponent from './SubscriptionComponent'
import ReceiptsList from './ReceiptsList'
import AddReceiptForm from './AddReceiptForm'
const Main = () => {
  return (
    <div className="p-4">
      <h2 className="text-2xl font-semibold mb-4">Dashboard Overview</h2>
    

     
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
  {/* Card 1: Members */}
  <div className="rounded-xl bg-white/0 ring-1 ring-black/5 backdrop-blur-3xl p-6 shadow-md flex items-center justify-between">
    <div className="text-center">
      <div className="text-green-600 text-4xl mb-4">
        <FaUsers className="btn-indigo text-2xl" />
      </div>
      <h3 className="text-xl font-semibold">Members</h3>
    </div>
  </div>

  {/* Card 2: Subscription */}
  <div className="rounded-xl bg-white/0 ring-1 ring-black/5 backdrop-blur-3xl p-6 shadow-md flex items-center justify-between">
    <div className="text-center">
      <div className="text-blue-600 text-4xl mb-4">
        <FaCalendarCheck className="btn-yellow text-2xl" />
      </div>
      <h3 className="text-xl font-semibold">Subscription</h3>
    </div>
  </div>

  {/* Card 3: Ticket */}
  <div className="rounded-xl bg-white/0 ring-1 ring-black/5 backdrop-blur-3xl p-6 shadow-md flex items-center justify-between">
    <div className="text-center">
      <div className="text-red-600 text-4xl mb-4">
        <FaTicketAlt className="btn-pinkish text-2xl" />
      </div>
      <h3 className="text-xl font-semibold">Tickets</h3>
    </div>
  </div>

  {/* Card 4: Attendance */}
  <div className="rounded-xl bg-white/0 ring-1 ring-black/5 backdrop-blur-3xl p-6 shadow-md flex items-center justify-between">
    <div className="text-center">
      <div className="text-yellow-600 text-4xl mb-4">
        <FaCheckCircle className="btn-orange text-2xl" />
      </div>
      <h3 className="text-xl font-semibold">Attendance</h3>
    </div>
  </div>

  {/* <MembersList /> */}
</div>
<ReceiptsList  />
<AddReceiptForm  />
    </div>
  );
};

export default Main;
