'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { createClient } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/components/ToastProvider';

export default function AddClientPage() {
    const { user } = useAuth();
    const router = useRouter();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setLoading(true);
        setError(null);

        // Basic validation
        if (!formData.name.trim()) {
            setError("Client Name is required.");
            setLoading(false);
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (formData.email && !emailRegex.test(formData.email)) {
            setError("Please enter a valid email address.");
            setLoading(false);
            return;
        }

        const supabase = createClient();

        try {
            const { error: insertError } = await supabase
                .from('clients')
                .insert({
                    user_id: user.id,
                    name: formData.name,
                    email: formData.email,
                    phone: formData.phone
                });

            if (insertError) throw insertError;

            showToast('Success! Client added.', 'success');

            router.push('/dashboard/clients');
            router.refresh();
        } catch (err: any) {
            console.error("Error adding client:", err);
            setError(err.message || 'Failed to add client. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/clients" className="text-muted-foreground hover:text-white transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Add New Client</h1>
                    <p className="text-muted-foreground">Create a new client profile for your workspace.</p>
                </div>
            </div>

            <Card className="border-blue-500/20 shadow-[0_0_40px_-10px_rgba(59,130,246,0.1)] bg-slate-900/50 backdrop-blur-xl">
                <form onSubmit={handleSubmit}>
                    <CardHeader>
                        <CardTitle>Client Details</CardTitle>
                        <CardDescription>Enter the primary information for this client.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {error && (
                            <div className="p-3 text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-md">
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label htmlFor="name" className="text-sm font-medium text-slate-300">Client Name <span className="text-red-400">*</span></label>
                            <input
                                id="name"
                                name="name"
                                type="text"
                                required
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="e.g. Acme Corp"
                                className="w-full bg-slate-800/50 border border-white/10 rounded-md px-4 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-inner"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label htmlFor="email" className="text-sm font-medium text-slate-300">Email Address</label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="contact@acme.com"
                                    className="w-full bg-slate-800/50 border border-white/10 rounded-md px-4 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-inner"
                                />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="phone" className="text-sm font-medium text-slate-300">Phone</label>
                                <input
                                    id="phone"
                                    name="phone"
                                    type="tel"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    placeholder="+1 (555) 000-0000"
                                    className="w-full bg-slate-800/50 border border-white/10 rounded-md px-4 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-inner"
                                />
                            </div>
                        </div>

                    </CardContent>
                    <div className="flex justify-end gap-3 p-6 border-t border-white/5 mt-2">
                        <Link href="/dashboard/clients">
                            <Button type="button" variant="ghost" className="text-slate-300 hover:text-white">Cancel</Button>
                        </Link>
                        <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white min-w-[120px]">
                            {loading ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                            ) : (
                                <Save className="w-4 h-4 mr-2" />
                            )}
                            {loading ? 'Saving...' : 'Save Client'}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
}
