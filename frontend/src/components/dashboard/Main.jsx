import React from "react";
import { FaUsers, FaCalendarCheck, FaTicketAlt, FaCheckCircle } from "react-icons/fa"; // Import icons from React Icons

const Main = () => {
  return (
    <div className="p-4">
      <h2 className="text-2xl font-semibold mb-4">Dashboard Overview</h2>
    

     
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Members */}
        <div className=" p-6 rounded-lg shadow-md flex items-center justify-between">
          <div className="text-center">
            <div className="text-green-600 text-4xl mb-4">
              <FaUsers /> 
            </div>
            <h3 className="text-xl font-semibold">Members</h3>
            
          </div>
        </div>

        {/* Card 2: Subscription */}
        <div className=" p-6 rounded-lg shadow-md flex items-center justify-between">
          <div className="text-center">
            <div className="text-blue-600 text-4xl mb-4">
              <FaCalendarCheck /> 
            </div>
            <h3 className="text-xl font-semibold">Subscription</h3>
            
          </div>
        </div>

        {/* Card 3: Ticket */}
        <div className=" p-6 rounded-lg shadow-md flex items-center justify-between">
          <div className="text-center">
            <div className="text-red-600 text-4xl mb-4">
              <FaTicketAlt /> 
            </div>
            <h3 className="text-xl font-semibold">Tickets</h3>
            
          </div>
        </div>

        {/* Card 4: Attendance */}
        <div className=" p-6 rounded-lg shadow-md flex items-center justify-between">
          <div className="text-center">
            <div className="text-yellow-600 text-4xl mb-4">
              <FaCheckCircle /> 
            </div>
            <h3 className="text-xl font-semibold">Attendance</h3>
           
          </div>
        </div>
      </div>
    </div>
  );
};

export default Main;
