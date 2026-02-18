import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useToast } from '../components/Toast';
import Sidebar from '../components/Sidebar';
import LoadingSpinner from '../components/LoadingSpinner';

function getWorkingDaysInMonth(year, month) {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    let workingDays = 0;
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        if (date.getDay() !== 0) {
            workingDays++;
        }
    }
    return workingDays;
}

function getMonthOptions() {
    const options = [];
    const now = new Date();
    for (let i = -2; i <= 2; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
        const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const label = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        options.push({ value, label });
    }
    return options;
}

export default function SalaryManagement() {
    const addToast = useToast();
    const [employees, setEmployees] = useState([]);
    const [salaryData, setSalaryData] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState({});

    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const [selectedMonth, setSelectedMonth] = useState(currentMonth);

    const monthOptions = getMonthOptions();

    const getWorkingDays = useCallback(() => {
        const [year, month] = selectedMonth.split('-').map(Number);
        return getWorkingDaysInMonth(year, month - 1);
    }, [selectedMonth]);

    useEffect(() => {
        fetchData();
    }, [selectedMonth]);

    async function fetchData() {
        setLoading(true);

        const { data: empData, error: empError } = await supabase
            .from('users')
            .select('id, name, username')
            .eq('role', 'employee')
            .order('name');

        if (empError) {
            addToast('Failed to load employees', 'error');
            setLoading(false);
            return;
        }

        const { data: salData, error: salError } = await supabase
            .from('salaries')
            .select('*')
            .eq('month', selectedMonth);

        if (salError) {
            addToast('Failed to load salary data', 'error');
            setLoading(false);
            return;
        }

        setEmployees(empData || []);

        const map = {};
        (salData || []).forEach((s) => {
            map[s.user_id] = {
                id: s.id,
                monthly_salary: s.monthly_salary,
                leave_days: s.leave_days,
            };
        });
        setSalaryData(map);
        setLoading(false);
    }

    function calculateSalary(monthlySalary, leaveDays) {
        const workingDays = getWorkingDays();
        const dailySalary = workingDays > 0 ? monthlySalary / workingDays : 0;
        const effectiveDays = Math.max(0, workingDays - leaveDays);
        const finalSalary = dailySalary * effectiveDays;
        return { dailySalary, finalSalary, workingDays };
    }

    async function saveSalary(userId, monthlySalary, leaveDays) {
        setSaving((prev) => ({ ...prev, [userId]: true }));

        const { dailySalary, finalSalary } = calculateSalary(monthlySalary, leaveDays);
        const existing = salaryData[userId];

        let error;

        if (existing?.id) {
            ({ error } = await supabase
                .from('salaries')
                .update({
                    monthly_salary: monthlySalary,
                    daily_salary: parseFloat(dailySalary.toFixed(2)),
                    leave_days: leaveDays,
                    final_salary: parseFloat(finalSalary.toFixed(2)),
                })
                .eq('id', existing.id));
        } else {
            ({ error } = await supabase.from('salaries').insert({
                user_id: userId,
                month: selectedMonth,
                monthly_salary: monthlySalary,
                daily_salary: parseFloat(dailySalary.toFixed(2)),
                leave_days: leaveDays,
                final_salary: parseFloat(finalSalary.toFixed(2)),
            }));
        }

        if (error) {
            addToast('Failed to save salary', 'error');
        } else {
            addToast('Salary saved', 'success');
            fetchData();
        }

        setSaving((prev) => ({ ...prev, [userId]: false }));
    }

    function handleFieldChange(userId, field, value) {
        setSalaryData((prev) => ({
            ...prev,
            [userId]: {
                ...prev[userId],
                [field]: value,
            },
        }));
    }

    const workingDays = getWorkingDays();

    return (
        <div className="flex min-h-screen bg-gray-950">
            <Sidebar />
            <main className="flex-1 p-4 md:p-8 pt-16 md:pt-8">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-white">Salary Management</h1>
                    <p className="text-gray-400 mt-1">
                        Manage employee salaries. Working days (excl. Sundays) this month: {workingDays}
                    </p>
                </div>

                {/* Month Selector */}
                <div className="mb-6">
                    <select
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        {monthOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Salary Table */}
                <div className="bg-gray-900 rounded-2xl border border-gray-800">
                    <div className="px-6 py-4 border-b border-gray-800">
                        <h2 className="text-lg font-semibold text-white">
                            Employee Salaries ({employees.length})
                        </h2>
                    </div>

                    {loading ? (
                        <LoadingSpinner />
                    ) : employees.length === 0 ? (
                        <div className="px-6 py-12 text-center text-gray-500">
                            No employees found.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-800">
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                            Employee
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                            Monthly Salary
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                            Daily Salary
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                            Leave Days
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                            Final Salary
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800">
                                    {employees.map((emp) => {
                                        const data = salaryData[emp.id] || { monthly_salary: 0, leave_days: 0 };
                                        const monthlySalary = parseFloat(data.monthly_salary) || 0;
                                        const leaveDays = parseInt(data.leave_days) || 0;
                                        const { dailySalary, finalSalary } = calculateSalary(monthlySalary, leaveDays);

                                        return (
                                            <tr key={emp.id} className="hover:bg-gray-800/50">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 bg-indigo-600/30 text-indigo-400 rounded-full flex items-center justify-center text-sm font-bold">
                                                            {emp.name[0].toUpperCase()}
                                                        </div>
                                                        <span className="text-sm text-white font-medium">{emp.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={data.monthly_salary || ''}
                                                        onChange={(e) =>
                                                            handleFieldChange(emp.id, 'monthly_salary', e.target.value)
                                                        }
                                                        placeholder="0"
                                                        className="w-28 px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                    />
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-300">
                                                    {monthlySalary > 0 ? `${dailySalary.toFixed(2)}` : '—'}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max={workingDays}
                                                        value={data.leave_days || ''}
                                                        onChange={(e) =>
                                                            handleFieldChange(emp.id, 'leave_days', e.target.value)
                                                        }
                                                        placeholder="0"
                                                        className="w-20 px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                    />
                                                </td>
                                                <td className="px-6 py-4 text-sm font-medium text-emerald-400">
                                                    {monthlySalary > 0 ? `${finalSalary.toFixed(2)}` : '—'}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        onClick={() => saveSalary(emp.id, monthlySalary, leaveDays)}
                                                        disabled={saving[emp.id]}
                                                        className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
                                                    >
                                                        {saving[emp.id] ? 'Saving...' : 'Save'}
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
