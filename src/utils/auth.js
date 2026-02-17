import { supabase } from '../lib/supabaseClient';

export async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function login(username, password) {
    const hash = await hashPassword(password);

    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .eq('password_hash', hash)
        .single();

    if (error || !data) {
        throw new Error('Invalid username or password');
    }

    const session = {
        id: data.id,
        name: data.name,
        username: data.username,
        role: data.role,
    };

    localStorage.setItem('session', JSON.stringify(session));
    return session;
}

export function getSession() {
    const session = localStorage.getItem('session');
    return session ? JSON.parse(session) : null;
}

export function logout() {
    localStorage.removeItem('session');
}

export function isAdmin() {
    const session = getSession();
    return session?.role === 'admin';
}

export function isEmployee() {
    const session = getSession();
    return session?.role === 'employee';
}
