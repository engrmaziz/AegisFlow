'use client';

import { useAuth } from '@/components/AuthProvider';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { createClient } from '@/lib/supabase';
import { Users, Search, Plus, Phone, Mail, Box, Activity } from 'lucide-react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useToast } from '@/components/ToastProvider';
import { useRouter } from 'next/navigation';

export default function ClientsPage() {
    const { user } = useAuth();
    const router = useRouter();
    const { showToast } = useToast();
    const [clients, setClients] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        async function loadClients() {
            if (!user) return;
            const supabase = createClient();

            try {
                const { data } = await supabase
                    .from('clients')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false });

                if (data) setClients(data);
            } catch (error) {
                console.error("Error fetching clients:", error);
            } finally {
                setLoading(false);
            }
        }

        loadClients();
    }, [user]);

    const runClusteringAnalysis = async () => {
        if (clients.length === 0) return;
        setLoading(true);

        try {
            const supabase = createClient();

            // Step 1: Fetch ALL invoices for time-sync delay calculations
            const { data: invoicesData, error: invoicesError } = await supabase
                .from('invoices')
                .select('client_id, status, due_date')
                .eq('user_id', user?.id || '');

            if (invoicesError) throw invoicesError;

            const clientDelays: Record<string, { totalDays: number, count: number }> = {};

            if (invoicesData) {
                const today = new Date();
                invoicesData.forEach(inv => {
                    const dueDate = new Date(inv.due_date);
                    if (inv.status !== 'Paid' && dueDate < today) {
                        const daysLate = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 3600 * 24));
                        if (!clientDelays[inv.client_id]) {
                            clientDelays[inv.client_id] = { totalDays: 0, count: 0 };
                        }
                        clientDelays[inv.client_id].totalDays += daysLate;
                        clientDelays[inv.client_id].count += 1;
                    }
                });
            }

            // Step 2: Push Time-Sync updates directly to database
            for (const client of clients) {
                const delayData = clientDelays[client.id];
                const avgDelay = delayData && delayData.count > 0 ? delayData.totalDays / delayData.count : 0;

                await supabase
                    .from('clients')
                    .update({ avg_payment_delay_days: avgDelay })
                    .eq('id', client.id);
            }

            // Step 3: Fetch updated source of truth before AI extraction
            const { data: updatedClientsData, error: clientsError } = await supabase
                .from('clients')
                .select('*')
                .eq('user_id', user?.id || '')
                .order('created_at', { ascending: false });

            if (clientsError) throw clientsError;

            const freshClients = updatedClientsData || clients;

            // Step 4: Feed the AI the Truth
            const payload = freshClients.map((c: any) => ({
                client_id: c.id,
                total_invoice_volume: Number(c.total_value || 0),
                average_payment_delay_days: Number(c.avg_payment_delay_days || 0)
            }));

            const res = await fetch('https://invoiceiq.up.railway.app/risk/cluster', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ clients: payload })
            });

            if (res.ok) {
                const results = await res.json();

                const finalClients = [...freshClients];
                for (const update of results.clustered_clients || []) {
                    const clientIndex = finalClients.findIndex((c: any) => c.id === update.client_id);
                    if (clientIndex !== -1) {
                        finalClients[clientIndex].risk_tier = update.risk_label;
                        supabase.from('clients').update({ risk_tier: update.risk_label }).eq('id', update.client_id).then();
                    }
                }

                setClients(finalClients);
                showToast('Clustering complete! Risk tiers updated.', 'success');
                router.refresh();
            } else {
                console.error("Clustering failed with status:", res.status);
                showToast("Clustering failed with status " + res.status, "error");
            }
        } catch (error: any) {
            console.error("Clustering API error", error);
            showToast(error?.message || "An error occurred during clustering", "error");
        } finally {
            setLoading(false);
        }
    };

    const filteredClients = clients.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
                    <p className="text-muted-foreground">Manage clients and view their KMeans clustering profiles.</p>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto mt-4 sm:mt-0">
                    <Button variant="secondary" onClick={runClusteringAnalysis} disabled={clients.length === 0 || loading}>
                        <Activity className="mr-2 h-4 w-4" /> Re-run Clustering
                    </Button>
                    <Link href="/dashboard/clients/add">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Add Client
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="relative max-w-md mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    Array(6).fill(0).map((_, i) => (
                        <Card key={i} className="overflow-hidden">
                            <CardContent className="p-6">
                                <div className="flex items-center space-x-4 mb-4">
                                    <Skeleton className="h-12 w-12 rounded-full" />
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-32" />
                                        <Skeleton className="h-3 w-20" />
                                    </div>
                                </div>
                                <div className="space-y-2 mt-4">
                                    <Skeleton className="h-3 w-full" />
                                    <Skeleton className="h-3 w-4/5" />
                                </div>
                            </CardContent>
                        </Card>
                    ))
                ) : filteredClients.length === 0 ? (
                    <div className="col-span-full py-16 text-center bg-slate-900/40 rounded-xl border border-white/5 shadow-inner">
                        <div className="flex flex-col items-center justify-center">
                            <div className="bg-slate-800/50 p-4 rounded-full mb-4">
                                <Users className="h-8 w-8 text-slate-400" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">No Clients Found</h3>
                            <p className="text-slate-400 text-sm max-w-md mx-auto mb-6">
                                You haven't added any clients yet, or none match your current search criteria.
                                Start building your network to power AI-driven risk clustering.
                            </p>
                            <Link href="/dashboard/clients/add">
                                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white border-0">
                                    <Plus className="w-4 h-4 mr-2" /> Add Your First Client
                                </Button>
                            </Link>
                        </div>
                    </div>
                ) : (
                    filteredClients.map((client) => (
                        <Card key={client.id} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="font-semibold text-lg">{client.name}</h3>
                                        <div className="flex items-center text-xs text-muted-foreground mt-1">
                                            <Mail className="h-3 w-3 mr-1" />
                                            {client.email || 'No email provided'}
                                        </div>
                                        <div className="flex items-center text-xs text-muted-foreground mt-1">
                                            <Phone className="h-3 w-3 mr-1" />
                                            {client.phone || 'No phone provided'}
                                        </div>
                                    </div>
                                    <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${client.risk_tier?.includes('Low') ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' :
                                        client.risk_tier?.includes('High') ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                                            client.risk_tier?.includes('Medium') ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' :
                                                'bg-muted text-muted-foreground'
                                        }`}>
                                        {client.risk_tier || 'Unanalyzed'}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mt-6 p-3 bg-muted/40 rounded-lg">
                                    <div>
                                        <p className="text-[10px] text-muted-foreground uppercase font-semibold">Avg Delay</p>
                                        <p className="font-mono text-sm">{client.avg_payment_delay_days.toFixed(1)} days</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-muted-foreground uppercase font-semibold">Total Invs</p>
                                        <p className="font-mono text-sm">{client.total_invoices}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
