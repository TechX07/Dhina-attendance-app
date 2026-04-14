import { supabase } from '../lib/supabaseClient';

const STORAGE_PREFIX = 'app_setting:';

function parseBoolean(value, fallback) {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
        if (value.toLowerCase() === 'true') return true;
        if (value.toLowerCase() === 'false') return false;
    }
    return fallback;
}

function getLocalSetting(key, fallback) {
    const local = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
    return parseBoolean(local, fallback);
}

function setLocalSetting(key, value) {
    localStorage.setItem(`${STORAGE_PREFIX}${key}`, String(Boolean(value)));
}

function canUseRemoteSettings(error) {
    if (!error) return true;

    const message = (error.message || '').toLowerCase();
    // Fallback if table is missing or inaccessible in the current Supabase setup.
    if (message.includes('app_settings') || message.includes('relation')) {
        return false;
    }

    return true;
}

export async function getBooleanSetting(key, fallback = false) {
    const localValue = getLocalSetting(key, fallback);

    try {
        const { data, error } = await supabase
            .from('app_settings')
            .select('value')
            .eq('key', key)
            .maybeSingle();

        if (error && canUseRemoteSettings(error)) {
            console.error('Failed to load app setting from remote:', error);
            return localValue;
        }

        if (!data || data.value === null || typeof data.value === 'undefined') {
            return localValue;
        }

        const remoteValue = parseBoolean(data.value, localValue);
        setLocalSetting(key, remoteValue);
        return remoteValue;
    } catch (error) {
        console.error('Error loading app setting:', error);
        return localValue;
    }
}

export async function setBooleanSetting(key, value) {
    const normalized = Boolean(value);
    setLocalSetting(key, normalized);

    try {
        const { error } = await supabase
            .from('app_settings')
            .upsert({ key, value: String(normalized) }, { onConflict: 'key' });

        if (error && canUseRemoteSettings(error)) {
            console.error('Failed to persist app setting remotely:', error);
            return { success: false, remoteSaved: false };
        }

        return { success: true, remoteSaved: !error };
    } catch (error) {
        console.error('Error saving app setting:', error);
        return { success: false, remoteSaved: false };
    }
}
