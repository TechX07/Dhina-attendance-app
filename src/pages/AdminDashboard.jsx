import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { hashPassword } from '../utils/auth';
import { useToast } from '../components/Toast';
import Sidebar from '../components/Sidebar';
import LoadingSpinner from '../components/LoadingSpinner';

export default function AdminDashboard() {
    const addToast = useToast();
    const [tab, setTab] = useState('employees');

    // Employee state
    const [employees, setEmployees] = useState([]);
    const [loadingEmployees, setLoadingEmployees] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newEmployee, setNewEmployee] = useState({ name: '', username: '', password: '' });
    const [adding, setAdding] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [editData, setEditData] = useState({ name: '', username: '' });

    // Attendance state
    const [attendance, setAttendance] = useState([]);
    const [loadingAttendance, setLoadingAttendance] = useState(true);
    const [filterDate, setFilterDate] = useState('');
    const [filterEmployee, setFilterEmployee] = useState('');

    useEffect(() => {
        fetchEmployees();
        fetchAttendance();
    }, []);

    async function fetchEmployees() {
        setLoadingEmployees(true);
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('role', 'employee')
            .order('created_at', { ascending: false });

        if (error) {
            addToast('Failed to load employees', 'error');
        } else {
            setEmployees(data);
        }
        setLoadingEmployees(false);
    }

    async function fetchAttendance() {
        setLoadingAttendance(true);
        const { data, error } = await supabase
            .from('attendance')
            .select('*, users(name, username)')
            .order('date', { ascending: false });

        if (error) {
            addToast('Failed to load attendance', 'error');
        } else {
            setAttendance(data);
        }
        setLoadingAttendance(false);
    }

    async function addEmployee(e) {
        e.preventDefault();
        setAdding(true);

        try {
            const hash = await hashPassword(newEmployee.password);
            const { error } = await supabase.from('users').insert({
                name: newEmployee.name,
                username: newEmployee.username,
                password_hash: hash,
                role: 'employee',
            });

            if (error) {
                if (error.code === '23505') {
                    addToast('Username already exists', 'error');
                } else {
                    addToast('Failed to add employee', 'error');
                }
            } else {
                addToast('Employee added successfully!', 'success');
                setNewEmployee({ name: '', username: '', password: '' });
                setShowAddForm(false);
                fetchEmployees();
            }
        } catch {
            addToast('Failed to add employee', 'error');
        }
        setAdding(false);
    }

    async function deleteEmployee(id, name) {
        if (!window.confirm(`Delete employee "${name}"? This will also delete their attendance records.`)) {
            return;
        }

        const { error } = await supabase.from('users').delete().eq('id', id);

        if (error) {
            addToast('Failed to delete employee', 'error');
        } else {
            addToast('Employee deleted', 'success');
            fetchEmployees();
            fetchAttendance();
        }
    }

    function startEdit(emp) {
        setEditingId(emp.id);
        setEditData({ name: emp.name, username: emp.username });
    }

    async function saveEdit(id) {
        const { error } = await supabase
            .from('users')
            .update({ name: editData.name, username: editData.username })
            .eq('id', id);

        if (error) {
            if (error.code === '23505') {
                addToast('Username already exists', 'error');
            } else {
                addToast('Failed to update employee', 'error');
            }
        } else {
            addToast('Employee updated', 'success');
            setEditingId(null);
            fetchEmployees();
        }
    }

    const filteredAttendance = attendance.filter((a) => {
        if (filterDate && a.date !== filterDate) return false;
        if (filterEmployee && a.user_id !== filterEmployee) return false;
        return true;
    });

    function formatTime(timestamp) {
        if (!timestamp) return '—';
        return new Date(timestamp).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
        });
    }

    function formatDate(dateStr) {
        return new Date(dateStr).toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    }

    return (
        <div className="flex min-h-screen bg-gray-950">
            <Sidebar />
            <main className="flex-1 p-3 sm:p-4 md:p-8 pt-16 md:pt-8">
                {/* Header */}
                <div className="mb-6 sm:mb-8">
                    <h1 className="text-xl sm:text-2xl font-bold text-white">Admin Dashboard</h1>
                    <p className="text-gray-400 mt-1 text-sm sm:text-base">Manage employees and track attendance.</p>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6">
                    <button
                        onClick={() => setTab('employees')}
                        className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${tab === 'employees'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-800 text-gray-300 hover:bg-gray-700 active:bg-gray-600'
                            }`}
                    >
                        Employees
                    </button>
                    <button
                        onClick={() => setTab('attendance')}
                        className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${tab === 'attendance'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-800 text-gray-300 hover:bg-gray-700 active:bg-gray-600'
                            }`}
                    >
                        Attendance
                    </button>
                </div>

                {/* Employees Tab */}
                {tab === 'employees' && (
                    <div className="bg-gray-900 rounded-2xl border border-gray-800">
                        <div className="px-4 sm:px-6 py-4 border-b border-gray-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <h2 className="text-base sm:text-lg font-semibold text-white">
                                Employees ({employees.length})
                            </h2>
                            <button
                                onClick={() => setShowAddForm(!showAddForm)}
                                className="w-full sm:w-auto px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
                            >
                                {showAddForm ? 'Cancel' : '+ Add Employee'}
                            </button>
                        </div>

                        {/* Add Employee Form */}
                        {showAddForm && (
                            <form onSubmit={addEmployee} className="px-4 sm:px-6 py-4 border-b border-gray-800 bg-gray-800/50">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <input
                                        type="text"
                                        placeholder="Full Name"
                                        value={newEmployee.name}
                                        onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                                        required
                                        className="px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Username"
                                        value={newEmployee.username}
                                        onChange={(e) => setNewEmployee({ ...newEmployee, username: e.target.value })}
                                        required
                                        className="px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                    <input
                                        type="password"
                                        placeholder="Password"
                                        value={newEmployee.password}
                                        onChange={(e) => setNewEmployee({ ...newEmployee, password: e.target.value })}
                                        required
                                        className="px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={adding}
                                    className="mt-3 w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
                                >
                                    {adding ? 'Adding...' : 'Add Employee'}
                                </button>
                            </form>
                        )}

                        {loadingEmployees ? (
                            <LoadingSpinner />
                        ) : employees.length === 0 ? (
                            <div className="px-6 py-12 text-center text-gray-500">
                                No employees added yet.
                            </div>
                        ) : (
                            <>
                                {/* Desktop table */}
                                <div className="hidden md:block overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-gray-800">
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Name</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Username</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Created</th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-800">
                                            {employees.map((emp) => (
                                                <tr key={emp.id} className="hover:bg-gray-800/50">
                                                    <td className="px-6 py-4">
                                                        {editingId === emp.id ? (
                                                            <input
                                                                type="text"
                                                                value={editData.name}
                                                                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                                                                className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                            />
                                                        ) : (
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 bg-indigo-600/30 text-indigo-400 rounded-full flex items-center justify-center text-sm font-bold">
                                                                    {emp.name[0].toUpperCase()}
                                                                </div>
                                                                <span className="text-sm text-white font-medium">{emp.name}</span>
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {editingId === emp.id ? (
                                                            <input
                                                                type="text"
                                                                value={editData.username}
                                                                onChange={(e) => setEditData({ ...editData, username: e.target.value })}
                                                                className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                            />
                                                        ) : (
                                                            <span className="text-sm text-gray-400">{emp.username}</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-400">
                                                        {new Date(emp.created_at).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            {editingId === emp.id ? (
                                                                <>
                                                                    <button
                                                                        onClick={() => saveEdit(emp.id)}
                                                                        className="p-1.5 bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 rounded-lg transition-colors cursor-pointer"
                                                                        title="Save"
                                                                    >
                                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                                                    </button>
                                                                    <button
                                                                        onClick={() => setEditingId(null)}
                                                                        className="p-1.5 bg-gray-700/50 text-gray-400 hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
                                                                        title="Cancel"
                                                                    >
                                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                                                    </button>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <button
                                                                        onClick={() => startEdit(emp)}
                                                                        className="p-1.5 bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30 rounded-lg transition-colors cursor-pointer"
                                                                        title="Edit"
                                                                    >
                                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                                                    </button>
                                                                    <button
                                                                        onClick={() => deleteEmployee(emp.id, emp.name)}
                                                                        className="p-1.5 bg-red-600/20 text-red-400 hover:bg-red-600/30 rounded-lg transition-colors cursor-pointer"
                                                                        title="Delete"
                                                                    >
                                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Mobile cards */}
                                <div className="md:hidden divide-y divide-gray-800">
                                    {employees.map((emp) => (
                                        <div key={emp.id} className="p-4 animate-fade-in-up">
                                            {editingId === emp.id ? (
                                                <div className="space-y-3">
                                                    <input
                                                        type="text"
                                                        value={editData.name}
                                                        onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                                                        placeholder="Name"
                                                        className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={editData.username}
                                                        onChange={(e) => setEditData({ ...editData, username: e.target.value })}
                                                        placeholder="Username"
                                                        className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                    />
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => saveEdit(emp.id)}
                                                            className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
                                                        >
                                                            Save
                                                        </button>
                                                        <button
                                                            onClick={() => setEditingId(null)}
                                                            className="flex-1 py-2.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm font-medium rounded-lg transition-colors cursor-pointer"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <div className="w-10 h-10 bg-indigo-600/30 text-indigo-400 rounded-full flex items-center justify-center text-sm font-bold shrink-0">
                                                            {emp.name[0].toUpperCase()}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-medium text-white truncate">{emp.name}</p>
                                                            <p className="text-xs text-gray-400 truncate">@{emp.username}</p>
                                                            <p className="text-xs text-gray-500 mt-0.5">
                                                                Joined {new Date(emp.created_at).toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                                        <button
                                                            onClick={() => startEdit(emp)}
                                                            className="p-2 bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30 rounded-lg transition-colors cursor-pointer"
                                                            title="Edit"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                                        </button>
                                                        <button
                                                            onClick={() => deleteEmployee(emp.id, emp.name)}
                                                            className="p-2 bg-red-600/20 text-red-400 hover:bg-red-600/30 rounded-lg transition-colors cursor-pointer"
                                                            title="Delete"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* Attendance Tab */}
                {tab === 'attendance' && (
                    <div className="bg-gray-900 rounded-2xl border border-gray-800">
                        <div className="px-4 sm:px-6 py-4 border-b border-gray-800">
                            <h2 className="text-base sm:text-lg font-semibold text-white mb-3">Attendance Records</h2>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <input
                                    type="date"
                                    value={filterDate}
                                    onChange={(e) => setFilterDate(e.target.value)}
                                    className="w-full sm:w-auto px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                                <select
                                    value={filterEmployee}
                                    onChange={(e) => setFilterEmployee(e.target.value)}
                                    className="w-full sm:w-auto px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="">All Employees</option>
                                    {employees.map((emp) => (
                                        <option key={emp.id} value={emp.id}>{emp.name}</option>
                                    ))}
                                </select>
                                {(filterDate || filterEmployee) && (
                                    <button
                                        onClick={() => { setFilterDate(''); setFilterEmployee(''); }}
                                        className="w-full sm:w-auto px-4 py-2.5 bg-gray-700 hover:bg-gray-600 active:bg-gray-500 text-gray-300 text-sm rounded-lg transition-colors cursor-pointer"
                                    >
                                        Clear Filters
                                    </button>
                                )}
                            </div>
                        </div>

                        {loadingAttendance ? (
                            <LoadingSpinner />
                        ) : filteredAttendance.length === 0 ? (
                            <div className="px-6 py-12 text-center text-gray-500">
                                No attendance records found.
                            </div>
                        ) : (
                            <>
                                {/* Desktop table */}
                                <div className="hidden md:block overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-gray-800">
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Employee</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Check-in</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-800">
                                            {filteredAttendance.map((record) => (
                                                <tr key={record.id} className="hover:bg-gray-800/50">
                                                    <td className="px-6 py-4 text-sm text-white font-medium">
                                                        {record.users?.name || '—'}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-300">
                                                        {formatDate(record.date)}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-600/20 text-emerald-400">
                                                            {record.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-300">
                                                        {formatTime(record.check_in)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Mobile cards */}
                                <div className="md:hidden divide-y divide-gray-800">
                                    {filteredAttendance.map((record) => (
                                        <div key={record.id} className="p-4 animate-fade-in-up">
                                            <div className="flex items-center justify-between mb-1.5">
                                                <span className="text-sm font-medium text-white">
                                                    {record.users?.name || '—'}
                                                </span>
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-600/20 text-emerald-400">
                                                    {record.status}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between text-xs text-gray-400">
                                                <span>{formatDate(record.date)}</span>
                                                <span>Check-in: {formatTime(record.check_in)}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
