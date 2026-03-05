'use client';

import { useAuth } from '@/components/AuthProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
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
import { ArrowUpRight, ArrowDownRight, DollarSign, Users, FileText, AlertTriangle, Download, Plus } from 'lucide-react';
import Link from 'next/link';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
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
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

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

                        if (invoices.length === 0) {
                            setCashflowData([]);
                            setIsPredicting(false);
                            return; // Guard early and prevent API call
                        }

                        const transactions = invoices.map(inv => ({
                            date: inv.issue_date || new Date(inv.created_at).toISOString().split('T')[0],
                            amount: parseFloat(String(inv.amount)),
                            type: 'income'
                        }));

                        const res = await fetch('https://invoiceiq.up.railway.app/predict/cashflow', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                transactions: transactions
                            })
                        });

                        if (res.ok) {
                            const data = await res.json();
                            const forecastChartData = (data.forecast || []).map((val: number, idx: number) => ({
                                name: `D${idx + 1}`,
                                revenue: val > 0 ? val : 0,
                                expenses: val < 0 ? Math.abs(val) : 0
                            }));
                            setCashflowData(forecastChartData);
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

    const handleDownloadReport = async () => {
        setIsGeneratingPdf(true);
        const element = document.getElementById('financial-report-content');
        if (!element) {
            setIsGeneratingPdf(false);
            return;
        }

        try {
            const canvas = await html2canvas(element, {
                scale: 2,
                backgroundColor: '#ffffff', // White/Light background for better printing per user request
                windowWidth: element.scrollWidth,
                windowHeight: element.scrollHeight
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();

            // Provide a margin and scale the image to fit
            const margin = 10;
            const contentWidth = pdfWidth - (margin * 2);
            const imgProps = pdf.getImageProperties(imgData);
            const contentHeight = (imgProps.height * contentWidth) / imgProps.width;

            // Header with High-end Serif font
            pdf.setFont("times", "bold");
            pdf.setFontSize(22);
            pdf.setTextColor(15, 23, 42); // slate-900
            pdf.text("InvoiceIQ", margin, 20);

            pdf.setFont("helvetica", "normal");
            pdf.setFontSize(12);
            pdf.setTextColor(100);
            pdf.text("Financial Overview Report", margin, 28);

            pdf.setFontSize(9);
            pdf.text(`Generated on: ${new Date().toLocaleString()}`, margin, 34);

            // Chart/Cards Image
            pdf.addImage(imgData, 'PNG', margin, 42, contentWidth, Math.min(contentHeight, pdfHeight - 55));

            // Footer
            const pageCount = (pdf as any).internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                pdf.setPage(i);
                pdf.setFontSize(9);
                pdf.setTextColor(150);

                const footerText = 'Report generated by InvoiceIQ — https://iq-invoice.vercel.app/';
                const textWidth = pdf.getStringUnitWidth(footerText) * 9 / pdf.internal.scaleFactor;
                pdf.text(footerText, (pdfWidth - textWidth) / 2, pdfHeight - 10);
            }

            pdf.save("Financial_Overview_Report.pdf");
        } catch (error) {
            console.error("Error generating PDF:", error);
        } finally {
            setIsGeneratingPdf(false);
        }
    };

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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
                    <p className="text-muted-foreground">Welcome back! Here's your financial summary.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Link href="/dashboard/clients/add">
                        <Button variant="secondary" className="flex items-center gap-2">
                            <Plus className="w-4 h-4" />
                            Add Client
                        </Button>
                    </Link>
                    <Button onClick={handleDownloadReport} disabled={isGeneratingPdf} className="flex items-center gap-2">
                        {isGeneratingPdf ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Generating PDF...
                            </>
                        ) : (
                            <>
                                <Download className="w-4 h-4" />
                                Download PDF Report
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* Container to capture for PDF */}
            <div id="financial-report-content" className="space-y-6 p-4 -ml-4 rounded-xl">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
                            <DollarSign className="h-4 w-4 text-emerald-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 }).format(stats.totalRevenue)}</div>
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
                            <div className="text-2xl font-bold">{Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 }).format(stats.outstanding)}</div>
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
                                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => Intl.NumberFormat('en-PK', { notation: "compact", compactDisplay: "short", minimumFractionDigits: 0 }).format(value)} />
                                        <Tooltip
                                            cursor={{ fill: 'hsl(var(--muted))' }}
                                            contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                                            formatter={(value: any) => Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 }).format(Number(value || 0))}
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
                                                <p className="font-medium text-sm">{Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 }).format(inv.amount)}</p>
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
            </div> {/* End of financial-report-content */}

            <FinancialAdvisor />
        </div>
    );
}
