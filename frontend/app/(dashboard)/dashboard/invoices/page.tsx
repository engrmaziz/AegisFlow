'use client';

import { useAuth } from '@/components/AuthProvider';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { createClient } from '@/lib/supabase';
import { Plus, Search, Filter, AlertCircle, FileText } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useToast } from '@/components/ToastProvider';
import { useRouter } from 'next/navigation';

export default function InvoicesPage() {
    const { user } = useAuth();
    const router = useRouter();
    const { showToast } = useToast();
    const [invoices, setInvoices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');

    useEffect(() => {
        async function fetchInvoices() {
            if (!user) return;
            const supabase = createClient();

            try {
                const { data: invoicesData } = await supabase
                    .from('invoices')
                    .select('*, clients(name)')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false });

                if (invoicesData) {
                    const formattedData = invoicesData.map(inv => ({
                        ...inv,
                        client_name: inv.clients?.name || 'Unknown Client'
                    }));
                    setInvoices(formattedData);
                }
            } catch (error) {
                console.error("Error fetching invoices:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchInvoices();
    }, [user]);

    const handleMarkAsPaid = async (invoiceId: string) => {
        const supabase = createClient();

        try {
            const { error } = await supabase
                .from('invoices')
                .update({
                    status: 'Paid',
                    paid_date: new Date().toISOString().split('T')[0]
                })
                .eq('id', invoiceId);

            if (error) throw error;

            showToast('Invoice marked as Paid successfully.', 'success');

            // Optimistic local update
            setInvoices((prev: any[]) => prev.map((inv: any) =>
                inv.id === invoiceId ? { ...inv, status: 'Paid', paid_date: new Date().toISOString().split('T')[0] } : inv
            ));

            router.refresh();
        } catch (error) {
            console.error("Error marking invoice as paid:", error);
            showToast('Failed to update invoice status.', 'error');
        }
    };

    const filteredInvoices = invoices.filter((inv: any) => {
        const matchesSearch = inv.client_name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'All' || inv.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
                    <p className="text-muted-foreground">Manage and track your invoices with AI risk analysis.</p>
                </div>
                <Link href="/dashboard/invoices/new">
                    <Button className="w-full sm:w-auto">
                        <Plus className="mr-2 h-4 w-4" /> New Invoice
                    </Button>
                </Link>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search clients..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                    />
                </div>
                <div className="relative w-full sm:w-48">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm appearance-none"
                    >
                        <option value="All">All Statuses</option>
                        <option value="Pending">Pending</option>
                        <option value="Paid">Paid</option>
                        <option value="Overdue">Overdue</option>
                    </select>
                </div>
            </div>

            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
                            <tr>
                                <th className="px-6 py-4 font-medium">Client / Invoice</th>
                                <th className="px-6 py-4 font-medium">Amount</th>
                                <th className="px-6 py-4 font-medium">Due Date</th>
                                <th className="px-6 py-4 font-medium">Status</th>
                                <th className="px-6 py-4 font-medium">AI Risk Assessment</th>
                                <th className="px-6 py-4 font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="border-b border-border">
                                        <td className="px-6 py-4"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-20 mt-2" /></td>
                                        <td className="px-6 py-4"><Skeleton className="h-4 w-16" /></td>
                                        <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                                        <td className="px-6 py-4"><Skeleton className="h-6 w-16 rounded-full" /></td>
                                        <td className="px-6 py-4"><Skeleton className="h-6 w-24 rounded-full" /></td>
                                        <td className="px-6 py-4"><Skeleton className="h-8 w-24" /></td>
                                    </tr>
                                ))
                            ) : filteredInvoices.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                                        <div className="flex flex-col items-center justify-center">
                                            <FileText className="h-10 w-10 mb-2 opacity-20" />
                                            <p>No invoices found matching your criteria.</p>
                                            <Link href="/dashboard/invoices/new" className="text-primary hover:underline mt-2">
                                                Create your first invoice
                                            </Link>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredInvoices.map((inv: any) => (
                                    <tr key={inv.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-foreground">{inv.client_name}</div>
                                            <div className="text-xs text-muted-foreground mt-1 text-ellipsis overflow-hidden max-w-[200px] whitespace-nowrap">
                                                Extract metadata if available...
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-medium">
                                            {Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR' }).format(inv.amount)}
                                        </td>
                                        <td className="px-6 py-4 text-muted-foreground">
                                            {new Date(inv.due_date).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${inv.status === 'Paid' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' :
                                                inv.status === 'Overdue' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                                                    'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                                                }`}>
                                                {inv.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {inv.ai_risk_label && inv.ai_risk_label !== 'Unanalyzed' ? (
                                                <div className="flex items-center">
                                                    {inv.ai_risk_label === 'High Risk' && <AlertCircle className="w-4 h-4 text-red-500 mr-1.5" />}
                                                    {inv.ai_risk_label === 'Medium Risk' && <AlertCircle className="w-4 h-4 text-amber-500 mr-1.5" />}
                                                    {inv.ai_risk_label === 'Low Risk' && <AlertCircle className="w-4 h-4 text-green-500 mr-1.5" />}
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border ${inv.ai_risk_label === 'Low Risk' ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-900/20 dark:text-emerald-400' :
                                                        inv.ai_risk_label === 'High Risk' ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400' :
                                                            'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-900/20 dark:text-amber-400'
                                                        }`}>
                                                        {inv.ai_risk_label}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground">Unanalyzed</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {inv.status !== 'Paid' && (
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    onClick={() => handleMarkAsPaid(inv.id)}
                                                    className="text-xs h-8"
                                                >
                                                    Mark as Paid
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
