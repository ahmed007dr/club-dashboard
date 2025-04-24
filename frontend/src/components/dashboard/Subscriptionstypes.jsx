import React, { useState } from 'react';
import { FaEye } from 'react-icons/fa'; 
import { CiTrash } from 'react-icons/ci';
import { CiEdit } from 'react-icons/ci';
const SubscriptionsTypes = () => {
  const [subscriptions, setSubscriptions] = useState([
    {
      id: 1,
      name: "Basic",
      durationDays: 30,
      price: 19.99,
      includesGym: true,
      includesPool: false,
      includesClasses: false
    },
    {
      id: 2,
      name: "Premium",
      durationDays: 90,
      price: 49.99,
      includesGym: true,
      includesPool: true,
      includesClasses: true
    },
    {
      id: 3,
      name: "Elite",
      durationDays: 365,
      price: 119.99,
      includesGym: true,
      includesPool: true,
      includesClasses: true
    }
  ]);

  const [newSubscription, setNewSubscription] = useState({
    name: '',
    durationDays: '',
    price: '',
    includesGym: false,
    includesPool: false,
    includesClasses: false
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalData, setModalData] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const openEditModal = (subscription) => {
    setModalData(subscription);
    setIsModalOpen(true);
  };

  const openDeleteModal = (subscription) => {
    setSelectedSubscription(subscription);
    setIsDeleteModalOpen(true);
  };

  const openDetailsModal = (subscription) => {
    setModalData(subscription);
    setIsDetailsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsDeleteModalOpen(false);
    setIsDetailsModalOpen(false);
    setIsAddModalOpen(false);
  };

  const handleDelete = () => {
    setSubscriptions(subscriptions.filter(sub => sub.id !== selectedSubscription.id));
    closeModal();
  };

  const handleEdit = () => {
    const updatedSubscriptions = subscriptions.map((sub) =>
      sub.id === modalData.id ? modalData : sub
    );
    setSubscriptions(updatedSubscriptions);
    closeModal();
  };

  const handleAdd = () => {
    const newId = Math.max(...subscriptions.map(s => s.id)) + 1;
    const newSub = { ...newSubscription, id: newId };
    setSubscriptions([...subscriptions, newSub]);
    setNewSubscription({
      name: '',
      durationDays: '',
      price: '',
      includesGym: false,
      includesPool: false,
      includesClasses: false
    });
    closeModal();
  };

  return (
    <div>
      
      <button
          className="btn"
          onClick={() => setIsAddModalOpen(true)}
        >
          + Add Subscription Type
        </button>
      <table className="min-w-full table-auto">
        <thead>
          <tr>
            <th className="border px-4 py-2">Name</th>
            <th className="border px-4 py-2">Duration (days)</th>
            <th className="border px-4 py-2">Price</th>
            <th className="border px-4 py-2">Gym</th>
            <th className="border px-4 py-2">Pool</th>
            <th className="border px-4 py-2">Classes</th>
            <th className="border px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {subscriptions.map((subscription) => (
            <tr key={subscription.id}>
              <td className="border px-4 py-2">{subscription.name}</td>
              <td className="border px-4 py-2">{subscription.durationDays}</td>
              <td className="border px-4 py-2">${subscription.price}</td>
              <td className="border px-4 py-2">{subscription.includesGym ? "Included" : "Not Included"}</td>
              <td className="border px-4 py-2">{subscription.includesPool ? "Included" : "Not Included"}</td>
              <td className="border px-4 py-2">{subscription.includesClasses ? "Included" : "Not Included"}</td>
              <td className="border px-4 py-2">
                <button
                  className="btn-green"
                  onClick={() => openEditModal(subscription)}
                >
                  <CiEdit />
                </button>
                <button
                  className="btn-red"
                  onClick={() => openDeleteModal(subscription)}
                >
                  <CiTrash />
                </button>
                <button
                  className="btn-blue"
                  onClick={() => openDetailsModal(subscription)}
                >
                  <FaEye /> 
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Add Subscription Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 flex justify-center items-center z-40" style={{ backgroundColor: "rgba(0, 0, 0, 0.2)" }}>
          <div className="modal">
            <h3 className="text-lg font-bold mb-4">Add Subscription</h3>
            <div className="mb-2">
              <label className="block">Name</label>
              <input type="text" className="border px-2 py-1 w-full" value={newSubscription.name} onChange={(e) => setNewSubscription({ ...newSubscription, name: e.target.value })} />
            </div>
            <div className="mb-2">
              <label className="block">Duration (days)</label>
              <input type="number" className="border px-2 py-1 w-full" value={newSubscription.durationDays} onChange={(e) => setNewSubscription({ ...newSubscription, durationDays: +e.target.value })} />
            </div>
            <div className="mb-2">
              <label className="block">Price</label>
              <input type="number" className="border px-2 py-1 w-full" value={newSubscription.price} onChange={(e) => setNewSubscription({ ...newSubscription, price: +e.target.value })} />
            </div>
            <div className="mb-1">
              <label><input type="checkbox" checked={newSubscription.includesGym} onChange={(e) => setNewSubscription({ ...newSubscription, includesGym: e.target.checked })} /> Gym</label>
            </div>
            <div className="mb-1">
              <label><input type="checkbox" checked={newSubscription.includesPool} onChange={(e) => setNewSubscription({ ...newSubscription, includesPool: e.target.checked })} /> Pool</label>
            </div>
            <div className="mb-4">
              <label><input type="checkbox" checked={newSubscription.includesClasses} onChange={(e) => setNewSubscription({ ...newSubscription, includesClasses: e.target.checked })} /> Classes</label>
            </div>
            <div>
              <button className="btn" onClick={handleAdd}>Add</button>
              <button className="bg-gray-500 text-white px-4 py-2 rounded" onClick={closeModal}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 flex justify-center items-center z-40"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.2)" }}>
          <div className="modal">
            <h3>Edit Subscription</h3>
            <div>
              <label className="block">Name</label>
              <input
                type="text"
                className="border px-2 py-1 w-full"
                value={modalData.name}
                onChange={(e) => setModalData({ ...modalData, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block">Duration (days)</label>
              <input
                type="number"
                className="border px-2 py-1 w-full"
                value={modalData.durationDays}
                onChange={(e) => setModalData({ ...modalData, durationDays: +e.target.value })}
              />
            </div>
            <div>
              <label className="block">Price</label>
              <input
                type="number"
                className="border px-2 py-1 w-full"
                value={modalData.price}
                onChange={(e) => setModalData({ ...modalData, price: +e.target.value })}
              />
            </div>
            <div>
              <label className="block">Gym</label>
              <input
                type="checkbox"
                checked={modalData.includesGym}
                onChange={(e) => setModalData({ ...modalData, includesGym: e.target.checked })}
              />
            </div>
            <div>
              <label className="block">Pool</label>
              <input
                type="checkbox"
                checked={modalData.includesPool}
                onChange={(e) => setModalData({ ...modalData, includesPool: e.target.checked })}
              />
            </div>
            <div>
              <label className="block">Classes</label>
              <input
                type="checkbox"
                checked={modalData.includesClasses}
                onChange={(e) => setModalData({ ...modalData, includesClasses: e.target.checked })}
              />
            </div>
            <div className="mt-4">
              <button
                className="btn"
                onClick={handleEdit}
              >
                Save
              </button>
              <button
                className="bg-gray-500 text-white px-4 py-2 rounded"
                onClick={closeModal}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 flex justify-center items-center z-40"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.2)" }}>
          <div className="modal">
            <h3>Are you sure you want to delete this subscription?</h3>
            <div className="mt-4">
              <button
                className="btn mr-2"
                onClick={handleDelete}
              >
                Yes, Delete
              </button>
              <button
                className="bg-gray-500 text-white px-4 py-2 rounded"
                onClick={closeModal}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Subscription Details Modal */}
      {isDetailsModalOpen && (
        <div className="fixed inset-0 flex justify-center items-center z-40"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.2)" }}>
          <div className="modal">
            <h3>Subscription Details</h3>
            <div>
              <strong>Name:</strong> {modalData.name}
            </div>
            <div>
              <strong>Duration (days):</strong> {modalData.durationDays}
            </div>
            <div>
              <strong>Price:</strong> ${modalData.price}
            </div>
            <div>
              <strong>Includes Gym:</strong> {modalData.includesGym ? 'Yes' : 'No'}
            </div>
            <div>
              <strong>Includes Pool:</strong> {modalData.includesPool ? 'Yes' : 'No'}
            </div>
            <div>
              <strong>Includes Classes:</strong> {modalData.includesClasses ? 'Yes' : 'No'}
            </div>
            <div className="mt-4">
              <button
                className="bg-gray-500 text-white px-4 py-2 rounded"
                onClick={closeModal}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionsTypes;
