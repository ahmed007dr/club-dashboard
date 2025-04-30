// import React, { useState } from "react";

// // Dialog Context for managing open/close state
// const DialogContext = React.createContext();

// // Dialog Provider Component
// export const DialogProvider = ({ children }) => {
//   const [isOpen, setIsOpen] = useState(false);

//   const openDialog = () => setIsOpen(true);
//   const closeDialog = () => setIsOpen(false);

//   return (
//     <DialogContext.Provider value={{ isOpen, openDialog, closeDialog }}>
//       {children}
//     </DialogContext.Provider>
//   );
// };

// // Dialog Component
// export const Dialog = ({ children }) => {
//   const { isOpen } = React.useContext(DialogContext);

//   if (!isOpen) return null;

//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
//       <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">{children}</div>
//     </div>
//   );
// };

// // Dialog Trigger Component
// export const DialogTrigger = ({ children }) => {
//   const { openDialog } = React.useContext(DialogContext);

//   return React.cloneElement(children, { onClick: openDialog });
// };

// // Dialog Content Component
// export const DialogContent = ({ children }) => {
//   return <div>{children}</div>;
// };

// // Dialog Header Component
// export const DialogHeader = ({ children }) => {
//   return <div className="mb-4">{children}</div>;
// };

// // Dialog Title Component
// export const DialogTitle = ({ children }) => {
//   return <h3 className="text-lg font-semibold">{children}</h3>;
// };

// // Dialog Description Component
// export const DialogDescription = ({ children }) => {
//   return <p className="text-sm text-gray-500">{children}</p>;
// };

// // Dialog Footer Component
// export const DialogFooter = ({ children }) => {
//   return <div className="mt-6 flex justify-end space-x-2">{children}</div>;
// };