import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { getSession } from '../utils/auth';
import { useToast } from '../components/Toast';
import Sidebar from '../components/Sidebar';
import LoadingSpinner from '../components/LoadingSpinner';

export default function EmployeeDashboard() {
    const session = getSession();
    const addToast = useToast();
    const [attendance, setAttendance] = useState([]);
    const [loading, setLoading] = useState(true);
    const [marking, setMarking] = useState(false);
    const [markedToday, setMarkedToday] = useState(false);

    useEffect(() => {
        fetchAttendance();
    }, []);

    async function fetchAttendance() {
        setLoading(true);
        const { data, error } = await supabase
            .from('attendance')
            .select('*')
            .eq('user_id', session.id)
            .order('date', { ascending: false });

        if (error) {
            addToast('Failed to load attendance', 'error');
        } else {
            setAttendance(data);
            const today = new Date().toISOString().split('T')[0];
            setMarkedToday(data.some(a => a.date === today));
        }
        setLoading(false);
    }

    async function markAttendance() {
        setMarking(true);
        const today = new Date().toISOString().split('T')[0];

        const { error } = await supabase.from('attendance').insert({
            user_id: session.id,
            date: today,
            status: 'Present',
        });

        if (error) {
            if (error.code === '23505') {
                addToast('Attendance already marked for today', 'error');
            } else {
                addToast('Failed to mark attendance', 'error');
            }
        } else {
            addToast('Attendance marked successfully!', 'success');
            setMarkedToday(true);
            fetchAttendance();
        }
        setMarking(false);
    }

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
            <main className="flex-1 p-4 md:p-8 pt-16 md:pt-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-white">
                        Welcome, {session.name}
                    </h1>
                    <p className="text-gray-400 mt-1">
                        Track your attendance and stay on top of your schedule.
                    </p>
                </div>

                {/* Mark Attendance Card */}
                <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 mb-8">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h2 className="text-lg font-semibold text-white">
                                Today&apos;s Attendance
                            </h2>
                            <p className="text-sm text-gray-400">
                                {new Date().toLocaleDateString('en-US', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                })}
                            </p>
                        </div>
                        <button
                            onClick={markAttendance}
                            disabled={markedToday || marking}
                            className={`px-6 py-3 rounded-xl font-semibold text-sm transition-colors cursor-pointer ${markedToday
                                ? 'bg-emerald-600/20 text-emerald-400 cursor-default'
                                : 'bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50'
                                }`}
                        >
                            {markedToday
                                ? 'Marked Present'
                                : marking
                                    ? 'Marking...'
                                    : 'Mark Attendance'}
                        </button>
                    </div>
                </div>

                {/* Attendance History */}
                <div className="bg-gray-900 rounded-2xl border border-gray-800">
                    <div className="px-6 py-4 border-b border-gray-800">
                        <h2 className="text-lg font-semibold text-white">
                            Attendance History
                        </h2>
                    </div>

                    {loading ? (
                        <LoadingSpinner />
                    ) : attendance.length === 0 ? (
                        <div className="px-6 py-12 text-center text-gray-500">
                            No attendance records yet.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-800">
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                            Date
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                            Check-in Time
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800">
                                    {attendance.map((record) => (
                                        <tr key={record.id} className="hover:bg-gray-800/50">
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
                    )}
                </div>
            </main>
        </div>
    );
}
