import React, { useEffect, useState } from 'react';

function UsersTable() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetch('/api/users') // This will be proxied to http://localhost:3000/users
      .then(res => res.json())
      .then(data => setUsers(data));
  }, []);

  return (
    <table>
      <thead>
        <tr>
          {/* Adjust columns based on your users table */}
          <th>ID</th>
          <th>Name</th>
          <th>Email</th>
        </tr>
      </thead>
      <tbody>
        {users.map(user => (
          <tr key={user.id}>
            <td>{user.id}</td>
            <td>{user.name}</td>
            <td>{user.email}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default UsersTable;