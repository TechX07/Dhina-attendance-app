import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { getSession } from '../utils/auth';
import { useToast } from '../components/Toast';
import Sidebar from '../components/Sidebar';
import LoadingSpinner from '../components/LoadingSpinner';
import {
    OFFICE_LOCATION,
    LOCATION_RADIUS_METERS,
    ENABLE_LOCATION_RESTRICTION,
    ALLOW_LOCALHOST_LOCATION_BYPASS,
} from '../config/allowedLocation';
import { verifyLocationInRadius } from '../utils/locationVerification';
import { getBooleanSetting } from '../utils/appSettings';

const LOCATION_SETTING_KEY = 'location_restriction_enabled';

export default function EmployeeDashboard() {
    const session = getSession();
    const addToast = useToast();
    const [attendance, setAttendance] = useState([]);
    const [loading, setLoading] = useState(true);
    const [marking, setMarking] = useState(false);
    const [markedToday, setMarkedToday] = useState(false);
    const [checkingLocation, setCheckingLocation] = useState(false);
    const [locationRestrictionEnabled, setLocationRestrictionEnabled] = useState(ENABLE_LOCATION_RESTRICTION);
    const [locationAllowed, setLocationAllowed] = useState(!ENABLE_LOCATION_RESTRICTION);
    const [locationMessage, setLocationMessage] = useState('Location verification not required.');

    useEffect(() => {
        fetchAttendance();
        initializeLocationVerification();
    }, []);

    async function getLatestRestrictionSetting() {
        const enabled = await getBooleanSetting(LOCATION_SETTING_KEY, ENABLE_LOCATION_RESTRICTION);
        setLocationRestrictionEnabled(enabled);
        return enabled;
    }

    async function initializeLocationVerification() {
        const enabled = await getLatestRestrictionSetting();
        verifyAttendanceLocation(enabled);
    }

    async function verifyAttendanceLocation(settingOverride = null) {
        const restrictionEnabled =
            typeof settingOverride === 'boolean' ? settingOverride : await getLatestRestrictionSetting();

        if (!restrictionEnabled) {
            setLocationAllowed(true);
            setLocationMessage('Location restriction is disabled.');
            return true;
        }

        if (ALLOW_LOCALHOST_LOCATION_BYPASS && window.location.hostname === 'localhost') {
            setLocationAllowed(true);
            setLocationMessage('Location check bypassed on localhost.');
            return true;
        }

        if (OFFICE_LOCATION.latitude === 0 || OFFICE_LOCATION.longitude === 0) {
            setLocationAllowed(false);
            setLocationMessage('Office location is not configured. Ask admin to set latitude/longitude.');
            return false;
        }

        try {
            setCheckingLocation(true);
            const result = await verifyLocationInRadius({
                targetLatitude: OFFICE_LOCATION.latitude,
                targetLongitude: OFFICE_LOCATION.longitude,
                radiusMeters: LOCATION_RADIUS_METERS,
            });

            if (result.isWithinRadius) {
                setLocationAllowed(true);
                setLocationMessage(
                    `You are inside office range (${Math.round(result.distance)}m away).`
                );
                return true;
            }

            setLocationAllowed(false);
            setLocationMessage(
                `You are outside office range (${Math.round(result.distance)}m away). Move closer to mark attendance.`
            );
            return false;
        } catch (error) {
            setLocationAllowed(false);
            setLocationMessage(error.message || 'Unable to verify your location.');
            return false;
        } finally {
            setCheckingLocation(false);
        }
    }

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
        const isAllowedByLocation = await verifyAttendanceLocation();
        if (!isAllowedByLocation) {
            addToast('Attendance can only be marked from office location', 'error');
            return;
        }

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
            <main className="flex-1 p-3 sm:p-4 md:p-8 pt-16 md:pt-8">
                {/* Header */}
                <div className="mb-6 sm:mb-8">
                    <h1 className="text-xl sm:text-2xl font-bold text-white">
                        Welcome, {session.name}
                    </h1>
                    <p className="text-gray-400 mt-1 text-sm sm:text-base">
                        Track your attendance and stay on top of your schedule.
                    </p>
                </div>

                {/* Mark Attendance Card */}
                <div className="bg-gray-900 rounded-2xl p-4 sm:p-6 border border-gray-800 mb-6 sm:mb-8">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h2 className="text-base sm:text-lg font-semibold text-white">
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
                            <p className={`text-xs mt-2 ${locationAllowed ? 'text-emerald-400' : 'text-amber-400'}`}>
                                {checkingLocation ? 'Checking your current location...' : locationMessage}
                            </p>
                            <p className="text-xs mt-1 text-gray-500">
                                Restriction status: {locationRestrictionEnabled ? 'ON' : 'OFF (Testing)'}
                            </p>
                            {OFFICE_LOCATION.mapsLink && (
                                <a
                                    href={OFFICE_LOCATION.mapsLink}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-xs text-indigo-400 hover:text-indigo-300 underline"
                                >
                                    Open office location in map
                                </a>
                            )}
                        </div>
                        <div className="w-full sm:w-auto flex gap-2">
                            <button
                                onClick={verifyAttendanceLocation}
                                disabled={checkingLocation}
                                className="px-4 py-3 rounded-xl font-semibold text-sm bg-gray-800 hover:bg-gray-700 active:bg-gray-600 text-gray-100 disabled:opacity-50"
                            >
                                {checkingLocation ? 'Checking...' : 'Verify Location'}
                            </button>
                            <button
                                onClick={markAttendance}
                                disabled={markedToday || marking || checkingLocation || !locationAllowed}
                                className={`px-6 py-3 rounded-xl font-semibold text-sm transition-colors cursor-pointer ${markedToday
                                    ? 'bg-emerald-600/20 text-emerald-400 cursor-default'
                                    : 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white disabled:opacity-50'
                                    }`}
                            >
                                {markedToday
                                    ? '✓ Marked Present'
                                    : marking
                                        ? 'Marking...'
                                        : 'Mark Attendance'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Attendance History */}
                <div className="bg-gray-900 rounded-2xl border border-gray-800">
                    <div className="px-4 sm:px-6 py-4 border-b border-gray-800">
                        <h2 className="text-base sm:text-lg font-semibold text-white">
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
                        <>
                            {/* Desktop table */}
                            <div className="hidden md:block overflow-x-auto">
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

                            {/* Mobile cards */}
                            <div className="md:hidden divide-y divide-gray-800">
                                {attendance.map((record) => (
                                    <div key={record.id} className="p-4 animate-fade-in-up">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-medium text-white">
                                                {formatDate(record.date)}
                                            </span>
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-600/20 text-emerald-400">
                                                {record.status}
                                            </span>
                                        </div>
                                        <div className="text-xs text-gray-400">
                                            Check-in: {formatTime(record.check_in)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}
