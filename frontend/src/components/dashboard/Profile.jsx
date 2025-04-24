import React, { useState, useEffect } from 'react';
import { BsPersonBoundingBox } from 'react-icons/bs';

const Profile = () => {
  const [data, setData] = useState([]);

  // Fake profile data
  const fakeProfileData = [
    {
      id: 1,
      password: "hashedpassword123",
      lastLogin: "2023-04-15T10:30:00Z",
      isSuperuser: true,
      username: "john_doe",
      firstName: "John",
      lastName: "Doe",
      email: "john.doe@example.com",
      isStaff: true,
      isActive: true,
      dateJoined: "2021-06-25T14:10:00Z",
      role: "Admin",
    },
    {
      id: 2,
      password: "hashedpassword456",
      lastLogin: "2023-04-14T08:15:00Z",
      isSuperuser: false,
      username: "jane_smith",
      firstName: "Jane",
      lastName: "Smith",
      email: "jane.smith@example.com",
      isStaff: true,
      isActive: true,
      dateJoined: "2020-08-10T09:20:00Z",
      role: "Manager",
    },
    {
      id: 3,
      password: "hashedpassword789",
      lastLogin: "2023-04-13T12:45:00Z",
      isSuperuser: false,
      username: "alex_brown",
      firstName: "Alex",
      lastName: "Brown",
      email: "alex.brown@example.com",
      isStaff: false,
      isActive: true,
      dateJoined: "2022-01-05T11:50:00Z",
      role: "User",
    }
  ];

  useEffect(() => {
    setData(fakeProfileData);
  }, []);

  return (
    <div className="p-4 overflow-x-auto">
           <div className="flex items-start space-x-3">
        <BsPersonBoundingBox className='btn-pinkish text-2xl' />
        <h1 className="text-2xl font-bold mb-4">Profile</h1>
      </div>
      

      <table className="min-w-full border border-gray-200">
        <thead className=" text-left">
          <tr>
            <th className="p-3 border-b">ID</th>
            <th className="p-3 border-b">Username</th>
            <th className="p-3 border-b">First Name</th>
            <th className="p-3 border-b">Last Name</th>
            <th className="p-3 border-b">Email</th>
            <th className="p-3 border-b">Role</th>
            <th className="p-3 border-b">Is Active</th>
            <th className="p-3 border-b">Date Joined</th>
            <th className="p-3 border-b">Last Login</th>
            <th className="p-3 border-b">Is Superuser</th>
            <th className="p-3 border-b">Is Staff</th>
          </tr>
        </thead>
        <tbody>
          {data.map((profile) => (
            <tr key={profile.id} className="">
              <td className="p-3 border-b">{profile.id}</td>
              <td className="p-3 border-b">{profile.username}</td>
              <td className="p-3 border-b">{profile.firstName}</td>
              <td className="p-3 border-b">{profile.lastName}</td>
              <td className="p-3 border-b">{profile.email}</td>
              <td className="p-3 border-b">{profile.role}</td>
              <td className="p-3 border-b">{profile.isActive ? <span className="bg-light-green">Yes</span> : <span className="bg-light-red">No</span>}</td>
              <td className="p-3 border-b">{new Date(profile.dateJoined).toLocaleDateString()}</td>
              <td className="p-3 border-b">{new Date(profile.lastLogin).toLocaleString()}</td>
              <td className="p-3 border-b">{profile.isSuperuser ? <span className="bg-light-green">Yes</span>  : <span className="bg-light-red">No</span>}</td>
              <td className="p-3 border-b">{profile.isStaff ? <span className="bg-light-green">Yes</span>  : <span className="bg-light-red">No</span>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Profile;
