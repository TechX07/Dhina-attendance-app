import { NavLink, useNavigate } from 'react-router-dom';
import { getSession, logout } from '../utils/auth';
import { useState } from 'react';

export default function Sidebar() {
    const session = getSession();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const adminLinks = [
        { to: '/admin', label: 'Dashboard' },
        { to: '/admin/salary', label: 'Salary' },
    ];

    const employeeLinks = [
        { to: '/employee', label: 'Dashboard' },
    ];

    const links = session?.role === 'admin' ? adminLinks : employeeLinks;

    return (
        <>
            {/* Mobile toggle */}
            <button
                onClick={() => setOpen(!open)}
                className="md:hidden fixed top-4 left-4 z-50 bg-indigo-600 text-white p-2 rounded-lg shadow-lg"
            >
                {open ? '✕' : '☰'}
            </button>

            {/* Overlay */}
            {open && (
                <div
                    className="md:hidden fixed inset-0 bg-black/40 z-30"
                    onClick={() => setOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed md:static inset-y-0 left-0 z-40 w-64 bg-gray-900 text-white flex flex-col transform transition-transform duration-200 ${open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
                    }`}
            >
                <div className="px-6 py-6 border-b border-gray-800">
                    <h1 className="text-xl font-bold tracking-tight">Attendance</h1>
                    <p className="text-sm text-gray-400 mt-1">Management System</p>
                </div>

                <nav className="flex-1 px-4 py-4 space-y-1">
                    {links.map(link => (
                        <NavLink
                            key={link.to}
                            to={link.to}
                            end
                            onClick={() => setOpen(false)}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive
                                    ? 'bg-indigo-600 text-white'
                                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                                }`
                            }
                        >

                            {link.label}
                        </NavLink>
                    ))}
                </nav>

                <div className="px-4 py-4 border-t border-gray-800">
                    <div className="flex items-center gap-3 px-3 py-2 mb-3">
                        <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-sm font-bold">
                            {session?.name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{session?.name}</p>
                            <p className="text-xs text-gray-400 capitalize">{session?.role}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-300 hover:bg-red-600/20 hover:text-red-400 transition-colors cursor-pointer"
                    >
                        Logout
                    </button>
                </div>
            </aside>
        </>
    );
}
