
import { supabase } from './supabase';

export const trackGameCreated = async (gameId: string, creatorName: string) => {
    try {
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return;

        const { error } = await supabase
            .from('games_created')
            .insert([{ game_id: gameId, creator_name: creatorName }]);

        if (error) console.error('Error tracking game created:', error);
    } catch (e) {
        console.error('Analytics Error:', e);
    }
};

export const trackGamePlayed = async (gameId: string) => {
    try {
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return;

        const { error } = await supabase
            .from('games_played')
            .insert([{ game_id: gameId }]);

        if (error) console.error('Error tracking game played:', error);
    } catch (e) {
        console.error('Analytics Error:', e);
    }
};

export const trackGameCompleted = async (gameId: string, isWin: boolean, attempts: number) => {
    try {
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return;

        const { error } = await supabase
            .from('games_completed')
            .insert([{
                game_id: gameId,
                is_win: isWin,
                attempts: attempts
            }]);

        if (error) console.error('Error tracking game completed:', error);
    } catch (e) {
        console.error('Analytics Error:', e);
    }
};

export const trackPageView = async (url: string) => {
    try {
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return;

        let country = null;
        let city = null;

        try {
            // Simple free IP geolocation
            const res = await fetch('https://ipapi.co/json/');
            if (res.ok) {
                const data = await res.json();
                country = data.country_name;
                city = data.city;
            }
        } catch (geoError) {
            console.warn('Geolocation failed:', geoError);
            // Continue tracking without location
        }

        const { error } = await supabase
            .from('visitor_logs')
            .insert([{
                page_url: url,
                user_agent: window.navigator.userAgent,
                country: country,
                city: city
            }]);

        if (error) console.error('Error tracking page view:', error);
    } catch (e) {
        // console.error('Analytics Error:', e);
    }
};
