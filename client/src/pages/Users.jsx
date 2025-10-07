import React, { useEffect, useMemo, useState } from 'react';
import { getAuthHeaders, handleApiError } from '../utils/api';

function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [form, setForm] = useState({ name: '', email: '', role: 'planner', password: '' });
  const [editingId, setEditingId] = useState(null);

  const roles = useMemo(() => ['admin', 'maintenance', 'planner'], []);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/users', { headers: getAuthHeaders() });
      const err = await handleApiError(res);
      if (err) {
        setError(err.message);
        setUsers([]);
        return;
      }
      const data = await res.json();
      setUsers(data);
    } catch (e) {
      setError('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const resetForm = () => {
    setForm({ name: '', email: '', role: 'planner', password: '' });
    setEditingId(null);
  };

  const generatePassword = () => {
    const random = Math.random().toString(36).slice(-8);
    const pw = random.replace(/[^a-z0-9]/gi, '').slice(0, 6) + 'A1';
    setForm({ ...form, password: pw });
    setSuccess('Generated a strong password');
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      role: form.role,
    };
    if (form.password?.trim()) payload.password = form.password.trim();

    try {
      const res = await fetch(editingId ? `/api/users/${editingId}` : '/api/users', {
        method: editingId ? 'PUT' : 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      const err = await handleApiError(res);
      if (err) {
        setError(err.message);
        return;
      }
      await fetchUsers();
      setSuccess(editingId ? 'User updated' : 'User created');
      resetForm();
    } catch (e) {
      setError('Request failed');
    }
  };

  const onEdit = (u) => {
    setEditingId(u.id);
    setForm({ name: u.name, email: u.email, role: u.role, password: '' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const onDelete = async (id) => {
    if (!confirm('Delete this user?')) return;
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
      const err = await handleApiError(res);
      if (err) { setError(err.message); return; }
      await fetchUsers();
      setSuccess('User deleted');
    } catch (e) {
      setError('Delete failed');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Users</h1>
      </div>

      {error && (
        <div className="p-3 rounded-md bg-red-50 text-red-700 text-sm">{error}</div>
      )}
      {success && (
        <div className="p-3 rounded-md bg-green-50 text-green-700 text-sm">{success}</div>
      )}

      <form onSubmit={onSubmit} className="bg-white rounded-lg border p-4 space-y-4 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Role</label>
            <select
              aria-label="New user role"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="w-full border rounded-md px-3 py-2 pr-9 focus:outline-none focus:ring-2 focus:ring-primary appearance-none bg-no-repeat transition-colors hover:border-gray-400"
              style={{backgroundImage: "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e\")", backgroundPosition: "right 0.6rem center", backgroundSize: "1.25rem 1.25rem"}}
            >
              {roles.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password {editingId ? '(leave blank to keep)' : ''}</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder={editingId ? '••••••••' : ''}
            />
          </div>
        </div>
        <div className="flex gap-2">
          <button type="submit" className="px-4 py-2 rounded-md bg-primary text-white shadow-sm transition-all duration-200 ease-out hover:brightness-110 hover:-translate-y-[1px] active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50">
            {editingId ? 'Update User' : 'Create User'}
          </button>
          {!editingId && (
            <button type="button" onClick={generatePassword} className="px-4 py-2 rounded-md border transition-all duration-200 ease-out hover:bg-gray-50 hover:-translate-y-[1px] active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-300">
              Generate Password
            </button>
          )}
          {editingId && (
            <button type="button" onClick={resetForm} className="px-4 py-2 rounded-md border transition-all duration-200 ease-out hover:bg-gray-50 hover:-translate-y-[1px] active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-300">
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="bg-white rounded-lg border shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-50 text-left text-sm">
                <th className="py-2 px-4 border-b">ID</th>
                <th className="py-2 px-4 border-b">Name</th>
                <th className="py-2 px-4 border-b">Email</th>
                <th className="py-2 px-4 border-b">Role</th>
                <th className="py-2 px-4 border-b w-40">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td className="py-4 px-4" colSpan="5">Loading...</td></tr>
              ) : users.length === 0 ? (
                <tr><td className="py-4 px-4" colSpan="5">No users</td></tr>
              ) : (
                users.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-2 px-4 border-b">{u.id}</td>
                    <td className="py-2 px-4 border-b">{u.name}</td>
                    <td className="py-2 px-4 border-b">{u.email}</td>
                    <td className="py-2 px-4 border-b capitalize">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
                        u.role === 'admin' ? 'bg-red-50 text-red-700 border-red-200' :
                        u.role === 'maintenance' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                        u.role === 'planner' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        'bg-gray-50 text-gray-700 border-gray-200'
                      }`}>{u.role}</span>
                    </td>
                    <td className="py-2 px-4 border-b">
                      <div className="flex gap-2">
                        <button className="px-3 py-1 rounded-md border transition-all duration-200 ease-out hover:bg-gray-50 hover:-translate-y-[1px] active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-300" onClick={() => onEdit(u)}>Edit</button>
                        <button className="px-3 py-1 rounded-md border text-red-600 transition-all duration-200 ease-out hover:bg-red-50 hover:-translate-y-[1px] active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-200" onClick={() => onDelete(u.id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Users;


