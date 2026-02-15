
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { id } from 'date-fns/locale';

export default function DashboardPage() {
    const router = useRouter();

    const [stats, setStats] = useState({
        totalCreated: 0,
        totalPlayed: 0,
        totalCompleted: 0,
        totalWins: 0,
        totalVisitors: 0,
    });
    const [chartData, setChartData] = useState<any[]>([]);
    const [topLocations, setTopLocations] = useState<{ city: string, count: number }[]>([]);
    const [timeRange, setTimeRange] = useState<'7D' | '30D' | '1Y'>('7D');
    const [loading, setLoading] = useState(true);

    // Check Auth
    useEffect(() => {
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push('/login');
            } else {
                fetchStats(); // Fetch stats only if authenticated
            }
        };
        checkUser();
    }, [router]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    const fetchStats = async () => {
        try {
            // 1. Get Total Created
            const { count: createdCount } = await supabase.from('games_created').select('*', { count: 'exact', head: true });
            // 2. Get Total Played
            const { count: playedCount } = await supabase.from('games_played').select('*', { count: 'exact', head: true });
            // 3. Get Total Completed
            const { count: completedCount } = await supabase.from('games_completed').select('*', { count: 'exact', head: true });
            // 4. Get Total Wins
            const { count: winsCount } = await supabase.from('games_completed').select('*', { count: 'exact', head: true }).eq('is_win', true);
            // 5. Get Total Visitors
            const { count: visitorsCount } = await supabase.from('visitor_logs').select('*', { count: 'exact', head: true });

            setStats({
                totalCreated: createdCount || 0,
                totalPlayed: playedCount || 0,
                totalCompleted: completedCount || 0,
                totalWins: winsCount || 0,
                totalVisitors: visitorsCount || 0,
            });

            // FETCH CHART DATA
            const now = new Date();
            let startDate = subDays(now, 7);

            if (timeRange === '30D') startDate = subDays(now, 30);
            if (timeRange === '1Y') startDate = subDays(now, 365);

            const startDateISO = startDate.toISOString();

            // Fetch generic logs for each category within range
            const [createdRes, playedRes, visitorRes] = await Promise.all([
                supabase.from('games_created').select('created_at').gte('created_at', startDateISO),
                supabase.from('games_played').select('played_at').gte('played_at', startDateISO),
                supabase.from('visitor_logs').select('visited_at, city, country').gte('visited_at', startDateISO),
            ]);

            const createdData = createdRes.data || [];
            const playedData = playedRes.data || [];
            const visitorData = visitorRes.data || [];

            // Process Locations
            const locationMap = new Map<string, number>();
            visitorData.forEach((item: any) => {
                const loc = item.city ? `${item.city}, ${item.country || ''}` : 'Unknown';
                if (loc !== 'Unknown') {
                    locationMap.set(loc, (locationMap.get(loc) || 0) + 1);
                }
            });

            // Sort and take top 5
            const sortedLocations = Array.from(locationMap.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([city, count]) => ({ city, count }));

            setTopLocations(sortedLocations);

            // Group by Date for Chart
            const dataMap = new Map<string, { date: string, Created: number, Played: number, Visitors: number }>();

            // Initialize map with all dates in range
            for (let d = startDate; d <= now; d = new Date(d.setDate(d.getDate() + 1))) {
                const dateKey = format(d, 'yyyy-MM-dd');
                const displayDate = format(d, 'd MMM', { locale: id });
                dataMap.set(dateKey, { date: displayDate, Created: 0, Played: 0, Visitors: 0 });
            }

            // Populate Data
            const getWIBDateKey = (utcString: string) => {
                const date = new Date(utcString);
                return format(date, 'yyyy-MM-dd');
            };

            createdData.forEach(item => {
                const key = getWIBDateKey(item.created_at);
                if (dataMap.has(key)) dataMap.get(key)!.Created++;
            });

            playedData.forEach(item => {
                const key = getWIBDateKey(item.played_at);
                if (dataMap.has(key)) dataMap.get(key)!.Played++;
            });

            visitorData.forEach((item: any) => {
                const key = getWIBDateKey(item.visited_at);
                if (dataMap.has(key)) dataMap.get(key)!.Visitors++;
            });

            setChartData(Array.from(dataMap.values()));

        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, [timeRange]);

    const completionRate = stats.totalPlayed > 0
        ? Math.round((stats.totalCompleted / stats.totalPlayed) * 100)
        : 0;

    const winRate = stats.totalCompleted > 0
        ? Math.round((stats.totalWins / stats.totalCompleted) * 100)
        : 0;

    return (
        <div className="min-h-screen bg-gray-50 p-8 font-sans">
            <div className="max-w-6xl mx-auto">
                <header className="mb-8 flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900">📊 AyangQuest Dashboard</h1>
                        <p className="text-gray-500 text-sm">Pantau performa bucinmu secara realtime!</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold animate-pulse">
                            ● Live
                        </div>
                        <button
                            onClick={handleLogout}
                            className="bg-red-50 text-red-600 hover:bg-red-100 px-4 py-2 rounded-xl text-sm font-bold transition-colors border border-red-100"
                        >
                            Log Out 🚪
                        </button>
                    </div>
                </header>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-32 bg-gray-200 rounded-xl animate-pulse"></div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                        {/* Card 1: Games Created */}
                        <div className="bg-white p-6 rounded-2xl border-2 border-blue-100 shadow-[4px_4px_0px_#bfdbfe] transition-transform hover:-translate-y-1">
                            <h3 className="text-gray-500 font-bold text-sm uppercase mb-2">Total Game Dibuat</h3>
                            <p className="text-4xl font-black text-blue-600">{stats.totalCreated}</p>
                            <p className="text-xs text-gray-400 mt-2">✨ Pasangan yang berusaha romantis</p>
                        </div>

                        {/* Card 2: Games Played */}
                        <div className="bg-white p-6 rounded-2xl border-2 border-purple-100 shadow-[4px_4px_0px_#e9d5ff] transition-transform hover:-translate-y-1">
                            <h3 className="text-gray-500 font-bold text-sm uppercase mb-2">Total Dimainkan</h3>
                            <p className="text-4xl font-black text-purple-600">{stats.totalPlayed}</p>
                            <p className="text-xs text-gray-400 mt-2">🎮 Ayang yang ditantang</p>
                        </div>

                        {/* Card 3: Completion Rate */}
                        <div className="bg-white p-6 rounded-2xl border-2 border-green-100 shadow-[4px_4px_0px_#bbf7d0] transition-transform hover:-translate-y-1">
                            <h3 className="text-gray-500 font-bold text-sm uppercase mb-2">Tingkat Penyelesaian</h3>
                            <p className="text-4xl font-black text-green-600">{completionRate}%</p>
                            <p className="text-xs text-gray-400 mt-2">🚀 Yang main sampai kelar</p>
                        </div>

                        {/* Card 4: Win Rate */}
                        <div className="bg-white p-6 rounded-2xl border-2 border-pink-100 shadow-[4px_4px_0px_#fbcfe8] transition-transform hover:-translate-y-1">
                            <h3 className="text-gray-500 font-bold text-sm uppercase mb-2">Win Rate</h3>
                            <p className="text-4xl font-black text-pink-600">{winRate}%</p>
                            <p className="text-xs text-gray-400 mt-2">🏆 Yang berhasil menang</p>
                        </div>

                        {/* Card 5: Total Visitors (Traffic) */}
                        <div className="bg-white p-6 rounded-2xl border-2 border-orange-100 shadow-[4px_4px_0px_#fdba74] transition-transform hover:-translate-y-1 md:col-span-2 lg:col-span-1">
                            <h3 className="text-gray-500 font-bold text-sm uppercase mb-2">Total Pengunjung</h3>
                            <p className="text-4xl font-black text-orange-600">{stats.totalVisitors}</p>
                            <p className="text-xs text-gray-400 mt-2">👀 Traffic website</p>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
                    {/* CHART SECTION */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm lg:col-span-2">
                        <div className="flex flex-col md:flex-row justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-900">📈 Grafik Aktivitas</h2>
                            <div className="flex gap-2 mt-4 md:mt-0">
                                {(['7D', '30D', '1Y'] as const).map((range) => (
                                    <button
                                        key={range}
                                        onClick={() => setTimeRange(range)}
                                        className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${timeRange === range
                                            ? 'bg-blue-600 text-white shadow-md'
                                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                            }`}
                                    >
                                        {range === '7D' ? '7 Hari' : range === '30D' ? '30 Hari' : '1 Tahun'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                    <XAxis
                                        dataKey="date"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#6B7280', fontSize: 12 }}
                                        dy={10}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#6B7280', fontSize: 12 }}
                                    />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                    />
                                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                    <Line
                                        type="monotone"
                                        dataKey="Created"
                                        stroke="#2563EB"
                                        strokeWidth={3}
                                        dot={{ r: 4, fill: '#2563EB', strokeWidth: 2, stroke: '#fff' }}
                                        activeDot={{ r: 6 }}
                                        name="Game Dibuat"
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="Played"
                                        stroke="#9333EA"
                                        strokeWidth={3}
                                        dot={{ r: 4, fill: '#9333EA', strokeWidth: 2, stroke: '#fff' }}
                                        name="Game Dimainkan"
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="Visitors"
                                        stroke="#EA580C"
                                        strokeWidth={3}
                                        dot={{ r: 4, fill: '#EA580C', strokeWidth: 2, stroke: '#fff' }}
                                        name="Pengunjung/Traffic"
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* TOP LOCATIONS SECTION */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                        <h2 className="text-xl font-bold text-gray-900 mb-6">🌍 Lokasi Teratas</h2>
                        {topLocations.length > 0 ? (
                            <ul className="space-y-4">
                                {topLocations.map((loc, index) => (
                                    <li key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <span className="flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 rounded-full text-xs font-bold">
                                                {index + 1}
                                            </span>
                                            <span className="font-semibold text-gray-700 text-sm">{loc.city}</span>
                                        </div>
                                        <span className="font-bold text-gray-900">{loc.count}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-[200px] text-gray-400">
                                <p className="text-4xl mb-2">🗺️</p>
                                <p className="text-sm">Belum ada data lokasi</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                    <p className="text-blue-700 font-bold text-sm">
                        Catatan: Data ini diambil langsung dari Supabase. Pastikan Table Policy sudah di-set ke "Public" atau setup Authentication untuk keamanan lebih lanjut.
                    </p>
                </div>
            </div>
        </div>
    );
}
