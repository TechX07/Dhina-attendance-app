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
    const [presentDaysByUser, setPresentDaysByUser] = useState({});
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

    const getMonthDateRange = useCallback(() => {
        const [year, month] = selectedMonth.split('-').map(Number);
        const firstDate = `${year}-${String(month).padStart(2, '0')}-01`;
        const lastDate = new Date(year, month, 0).getDate();
        const lastDateString = `${year}-${String(month).padStart(2, '0')}-${String(lastDate).padStart(2, '0')}`;
        return { firstDate, lastDateString };
    }, [selectedMonth]);

    useEffect(() => {
        fetchData();
    }, [selectedMonth]);

    async function fetchData() {
        setLoading(true);

        const { data: empData, error: empError } = await supabase
            .from('users')
            .select('*')
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

        const { firstDate, lastDateString } = getMonthDateRange();
        const { data: attendanceData, error: attendanceError } = await supabase
            .from('attendance')
            .select('user_id, date, status')
            .eq('status', 'Present')
            .gte('date', firstDate)
            .lte('date', lastDateString);

        if (attendanceError) {
            addToast('Failed to load attendance for salary calculation', 'error');
            setLoading(false);
            return;
        }

        setEmployees(empData || []);

        const map = {};
        (salData || []).forEach((s) => {
            map[s.user_id] = {
                id: s.id,
                monthly_salary: s.monthly_salary,
            };
        });
        setSalaryData(map);

        const presentMap = {};
        (attendanceData || []).forEach((record) => {
            if (!presentMap[record.user_id]) {
                presentMap[record.user_id] = new Set();
            }
            presentMap[record.user_id].add(record.date);
        });

        const normalizedPresentMap = {};
        Object.keys(presentMap).forEach((userId) => {
            normalizedPresentMap[userId] = presentMap[userId].size;
        });

        setPresentDaysByUser(normalizedPresentMap);
        setLoading(false);
    }

    function calculateSalary(monthlySalary, presentDays) {
        const workingDays = getWorkingDays();
        const dailySalary = workingDays > 0 ? monthlySalary / workingDays : 0;
        const payableDays = Math.min(workingDays, Math.max(0, presentDays));
        const absentDays = Math.max(0, workingDays - payableDays);
        const finalSalary = dailySalary * payableDays;
        return { dailySalary, finalSalary, workingDays, payableDays, absentDays };
    }

    async function saveSalary(userId, monthlySalary, presentDays) {
        setSaving((prev) => ({ ...prev, [userId]: true }));

        const { dailySalary, finalSalary, absentDays } = calculateSalary(monthlySalary, presentDays);
        const existing = salaryData[userId];

        let error;

        if (existing?.id) {
            ({ error } = await supabase
                .from('salaries')
                .update({
                    monthly_salary: monthlySalary,
                    daily_salary: parseFloat(dailySalary.toFixed(2)),
                    leave_days: absentDays,
                    final_salary: parseFloat(finalSalary.toFixed(2)),
                })
                .eq('id', existing.id));
        } else {
            ({ error } = await supabase.from('salaries').insert({
                user_id: userId,
                month: selectedMonth,
                monthly_salary: monthlySalary,
                daily_salary: parseFloat(dailySalary.toFixed(2)),
                leave_days: absentDays,
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
            <main className="flex-1 p-3 sm:p-4 md:p-8 pt-16 md:pt-8">
                <div className="mb-6 sm:mb-8">
                    <h1 className="text-xl sm:text-2xl font-bold text-white">Salary Management</h1>
                    <p className="text-gray-400 mt-1 text-sm sm:text-base">
                        Monthly salary is auto-calculated from attendance present days. Working days (excl. Sundays): <span className="text-white font-medium">{workingDays}</span>
                    </p>
                </div>

                {/* Month Selector */}
                <div className="mb-6">
                    <select
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="w-full sm:w-auto px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        {monthOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Salary Section */}
                <div className="bg-gray-900 rounded-2xl border border-gray-800">
                    <div className="px-4 sm:px-6 py-4 border-b border-gray-800">
                        <h2 className="text-base sm:text-lg font-semibold text-white">
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
                        <>
                            {/* Desktop table */}
                            <div className="hidden lg:block overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-gray-800">
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                                Employee
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                                Type
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                                Monthly Salary
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                                Daily Salary
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                                Present Days
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                                Absent Days
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
                                            const data = salaryData[emp.id] || { monthly_salary: 0 };
                                            const monthlySalary = parseFloat(data.monthly_salary) || 0;
                                            const presentDays = presentDaysByUser[emp.id] || 0;
                                            const { dailySalary, finalSalary, absentDays } = calculateSalary(monthlySalary, presentDays);

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
                                                    <td className="px-6 py-4 text-sm text-indigo-300 capitalize">
                                                        {(emp.employee_type || 'full_time').replace('_', ' ')}
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
                                                    <td className="px-6 py-4 text-sm text-gray-300">
                                                        {presentDays}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-amber-300">
                                                        {absentDays}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm font-medium text-emerald-400">
                                                        {monthlySalary > 0 ? `${finalSalary.toFixed(2)}` : '—'}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <button
                                                            onClick={() => saveSalary(emp.id, monthlySalary, presentDays)}
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

                            {/* Mobile / Tablet cards */}
                            <div className="lg:hidden divide-y divide-gray-800">
                                {employees.map((emp) => {
                                    const data = salaryData[emp.id] || { monthly_salary: 0 };
                                    const monthlySalary = parseFloat(data.monthly_salary) || 0;
                                    const presentDays = presentDaysByUser[emp.id] || 0;
                                    const { dailySalary, finalSalary, absentDays } = calculateSalary(monthlySalary, presentDays);

                                    return (
                                        <div key={emp.id} className="p-4 animate-fade-in-up">
                                            {/* Employee name */}
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="w-10 h-10 bg-indigo-600/30 text-indigo-400 rounded-full flex items-center justify-center text-sm font-bold shrink-0">
                                                    {emp.name[0].toUpperCase()}
                                                </div>
                                                <div>
                                                    <span className="text-sm text-white font-medium">{emp.name}</span>
                                                    <p className="text-xs text-indigo-300 capitalize">
                                                        {(emp.employee_type || 'full_time').replace('_', ' ')}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Input fields in a grid */}
                                            <div className="grid grid-cols-2 gap-3 mb-3">
                                                <div>
                                                    <label className="block text-xs text-gray-400 mb-1">Monthly Salary</label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={data.monthly_salary || ''}
                                                        onChange={(e) =>
                                                            handleFieldChange(emp.id, 'monthly_salary', e.target.value)
                                                        }
                                                        placeholder="0"
                                                        className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-gray-400 mb-1">Present Days</label>
                                                    <div className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 text-sm">
                                                        {presentDays}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Computed values + save */}
                                            <div className="flex items-center justify-between">
                                                <div className="flex gap-4 text-xs">
                                                    <div>
                                                        <span className="text-gray-400">Daily: </span>
                                                        <span className="text-gray-300">
                                                            {monthlySalary > 0 ? dailySalary.toFixed(2) : '—'}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-400">Absent: </span>
                                                        <span className="text-amber-300">{absentDays}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-400">Final: </span>
                                                        <span className="text-emerald-400 font-medium">
                                                            {monthlySalary > 0 ? finalSalary.toFixed(2) : '—'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => saveSalary(emp.id, monthlySalary, presentDays)}
                                                    disabled={saving[emp.id]}
                                                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
                                                >
                                                    {saving[emp.id] ? 'Saving...' : 'Save'}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}
