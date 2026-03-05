'use client';

import { useAuth } from '@/components/AuthProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { createClient } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line
} from 'recharts';
import { ArrowUpRight, ArrowDownRight, DollarSign, Users, FileText, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import FinancialAdvisor from '@/components/FinancialAdvisor';

export default function DashboardOverview() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalRevenue: 0,
        outstanding: 0,
        totalClients: 0,
        totalInvoices: 0,
        highRiskCount: 0
    });
    const [recentInvoices, setRecentInvoices] = useState<any[]>([]);
    const [cashflowData, setCashflowData] = useState<any[]>([]);
    const [isPredicting, setIsPredicting] = useState(false);

    useEffect(() => {
        async function fetchDashboardData() {
            if (!user) return;
            const supabase = createClient();

            try {
                // Fetch stats
                const { data: invoices } = await supabase
                    .from('invoices')
                    .select('*')
                    .eq('user_id', user.id);

                const { data: clients } = await supabase
                    .from('clients')
                    .select('*')
                    .eq('user_id', user.id);

                if (invoices && clients) {
                    const paid = invoices.filter(i => i.status === 'Paid').reduce((acc, curr) => acc + curr.amount, 0);
                    const outstanding = invoices.filter(i => i.status !== 'Paid').reduce((acc, curr) => acc + curr.amount, 0);
                    const highRisk = invoices.filter(i => i.predicted_risk_tier === 'High Risk').length;

                    setStats({
                        totalRevenue: paid,
                        outstanding: outstanding,
                        totalClients: clients.length,
                        totalInvoices: invoices.length,
                        highRiskCount: highRisk
                    });

                    // Sort for recent invoices
                    const sorted = [...invoices].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5);

                    // Fetch client names for recent invoices
                    const invoicesWithClients = await Promise.all(sorted.map(async (inv) => {
                        const client = clients.find(c => c.id === inv.client_id);
                        return { ...inv, client: client ? client.name : 'Unknown Client' };
                    }));

                    setRecentInvoices(invoicesWithClients);

                    // Fetch real AI cashflow predictions
                    try {
                        setIsPredicting(true);
                        const historical_data = invoices.map(inv => ({
                            amount: inv.amount,
                            created_at: inv.created_at
                        }));

                        const res = await fetch('https://invoiceiq.up.railway.app/predict/cashflow', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                user_id: user.id,
                                historical_data: historical_data
                            })
                        });

                        if (res.ok) {
                            const data = await res.json();
                            setCashflowData(data.forecast || []);
                        } else {
                            console.error("Cashflow prediction failed with status:", res.status);
                        }
                    } catch (apiError) {
                        console.error("Error calling cashflow API:", apiError);
                    } finally {
                        setIsPredicting(false);
                    }
                }
            } catch (error) {
                console.error("Error fetching dashboard data:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchDashboardData();
    }, [user]);

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 w-full" />)}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Skeleton className="h-96 lg:col-span-2" />
                    <Skeleton className="h-96" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
                <p className="text-muted-foreground">Welcome back! Here's your financial summary.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
                        <DollarSign className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${stats.totalRevenue.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground flex items-center mt-1">
                            <ArrowUpRight className="h-3 w-3 text-emerald-500 mr-1" />
                            <span className="text-emerald-500 font-medium">+12.5%</span> from last month
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Outstanding</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${stats.outstanding.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {stats.highRiskCount} high-risk invoices
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Clients</CardTitle>
                        <Users className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalClients}</div>
                        <p className="text-xs text-muted-foreground flex items-center mt-1">
                            <ArrowUpRight className="h-3 w-3 text-emerald-500 mr-1" />
                            <span className="text-emerald-500 font-medium">+2</span> new this month
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Invoices</CardTitle>
                        <FileText className="h-4 w-4 text-indigo-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalInvoices}</div>
                        <p className="text-xs text-muted-foreground flex items-center mt-1">
                            <ArrowDownRight className="h-3 w-3 text-red-500 mr-1" />
                            <span className="text-red-500 font-medium">-4%</span> from last month
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Cash Flow Overview</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        {isPredicting ? (
                            <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground space-y-4">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                <p className="text-sm">Generating AI cashflow forecast...</p>
                            </div>
                        ) : cashflowData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%" aspect={2}>
                                <BarChart data={cashflowData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                                    <Tooltip
                                        cursor={{ fill: 'hsl(var(--muted))' }}
                                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                                    />
                                    <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="expenses" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                <p className="text-sm">Not enough data for forecast</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Recent Invoices</CardTitle>
                        <Link href="/dashboard/invoices" className="text-sm text-primary hover:underline">
                            View all
                        </Link>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {recentInvoices.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-4">No recent invoices.</p>
                            ) : (
                                recentInvoices.map((inv) => (
                                    <div key={inv.id} className="flex items-center justify-between border-b border-border pb-4 last:border-0 last:pb-0">
                                        <div>
                                            <p className="font-medium text-sm">{inv.client}</p>
                                            <p className="text-xs text-muted-foreground">{new Date(inv.created_at).toLocaleDateString()}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-medium text-sm">${inv.amount.toLocaleString()}</p>
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${inv.status === 'Paid' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' :
                                                inv.status === 'Overdue' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                                                    'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                                                }`}>
                                                {inv.status}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <FinancialAdvisor />
        </div>
    );
}
