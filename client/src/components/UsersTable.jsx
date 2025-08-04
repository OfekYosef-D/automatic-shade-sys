import React, { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";

function UsersTable() {
  const [users, setUsers] = useState([]);
  const { getToken } = useAuth();

  useEffect(() => {
    async function fetchUsers() {
      const token = await getToken();
      const res = await fetch("/api/users", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Network response was not ok");
      const data = await res.json();
      setUsers(data);
    }
    fetchUsers().catch((error) => {
      console.error("Error fetching users:", error);
    });
  }, [getToken]);

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border border-gray-300 rounded-lg shadow-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="py-2 px-4 border-b text-left">ID</th>
            <th className="py-2 px-4 border-b text-left">Name</th>
            <th className="py-2 px-4 border-b text-left">Email</th>
            <th className="py-2 px-4 border-b text-left">Role</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="hover:bg-gray-50">
              <td className="py-2 px-4 border-b">{user.id}</td>
              <td className="py-2 px-4 border-b">{user.name}</td>
              <td className="py-2 px-4 border-b">{user.email}</td>
              <td className="py-2 px-4 border-b">{user.role}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default UsersTable;
