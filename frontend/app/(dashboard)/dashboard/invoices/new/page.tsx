'use client';

import { useAuth } from '@/components/AuthProvider';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ToastProvider';
import { createClient } from '@/lib/supabase';
import { extractOCRData, fetchInvoiceRisk } from '@/lib/api';
import { UploadCloud, FileText, CheckCircle, AlertTriangle, ArrowRight, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';

export default function NewInvoicePage() {
    const { user } = useAuth();
    const { showToast } = useToast();
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [clients, setClients] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [ocrLoading, setOcrLoading] = useState(false);

    const [formData, setFormData] = useState({
        clientId: '',
        amount: '',
        dueDate: '',
    });

    const [aiPrediction, setAiPrediction] = useState<any>(null);

    useEffect(() => {
        async function loadClients() {
            if (!user) return;
            const supabase = createClient();
            const { data } = await supabase.from('clients').select('id, name, avg_payment_delay_days').eq('user_id', user.id);
            if (data) setClients(data);
        }
        loadClients();
    }, [user]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setOcrLoading(true);
        showToast('Analyzing document...', 'info');

        try {
            const ocrResult = await extractOCRData(file);
            setFormData(prev => ({
                ...prev,
                amount: ocrResult.amount ? ocrResult.amount.toString() : prev.amount,
                dueDate: ocrResult.due_date ? new Date(ocrResult.due_date).toISOString().split('T')[0] : prev.dueDate
            }));
            showToast('Data extracted successfully!', 'success');
        } catch (error) {
            console.error(error);
            showToast('OCR extraction failed. Please enter manually.', 'error');
        } finally {
            setOcrLoading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handlePredictRisk = async () => {
        if (!formData.clientId || !formData.amount || !formData.dueDate) {
            showToast('Please fill all fields to predict risk.', 'warning');
            return;
        }

        const selectedClient = clients.find(c => c.id === formData.clientId);
        if (!selectedClient) return;

        setLoading(true);
        try {
            const today = new Date();
            const dueDate = new Date(formData.dueDate);
            const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 3600 * 24));

            const riskData = await fetchInvoiceRisk({
                client_id: selectedClient.id,
                invoice_amount: parseFloat(formData.amount),
                invoice_age_days: 0,
                days_until_due: daysUntilDue,
                client_avg_delay: selectedClient.avg_payment_delay_days || 0,
                client_late_count: 0 // Simplification for MVP
            });

            setAiPrediction(riskData);
            showToast('AI Risk Assessment complete.', 'success');
        } catch (error) {
            console.error(error);
            showToast('Failed to assess risk. Using defaults.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        if (!formData.clientId || !formData.amount || !formData.dueDate) {
            showToast('Please fill all required fields.', 'warning');
            return;
        }

        setLoading(true);
        try {
            const supabase = createClient();

            const { error } = await supabase.from('invoices').insert({
                user_id: user.id,
                client_id: formData.clientId,
                amount: parseFloat(formData.amount),
                due_date: formData.dueDate,
                status: 'Pending',
                predicted_risk_tier: aiPrediction?.risk_label || 'Unanalyzed',
                predicted_delay_days: aiPrediction?.predicted_days_late || 0,
                metadata: aiPrediction ? { ai_confidence: aiPrediction.confidence } : {}
            });

            if (error) throw error;

            showToast('Invoice created successfully!', 'success');
            router.push('/dashboard/invoices');
        } catch (error: any) {
            console.error(error);
            showToast(error.message || 'Failed to create invoice.', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Create Invoice</h1>
                <p className="text-muted-foreground">Upload a document for OCR or enter details manually.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Smart Upload</CardTitle>
                            <CardDescription>Upload an image or PDF to auto-extract amount and dates.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div
                                className="border-2 border-dashed border-border rounded-lg p-8 text-center bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*,.pdf"
                                    onChange={handleFileUpload}
                                />
                                {ocrLoading ? (
                                    <div className="flex flex-col items-center">
                                        <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
                                        <p className="text-sm font-medium">Running Computer Vision Model...</p>
                                        <p className="text-xs text-muted-foreground mt-1">Extracting key data points</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center">
                                        <UploadCloud className="h-10 w-10 text-muted-foreground mb-4" />
                                        <p className="text-sm font-medium">Click to upload or drag and drop</p>
                                        <p className="text-xs text-muted-foreground mt-1">PNG, JPG, PDF up to 10MB</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <form onSubmit={handleSubmit}>
                            <CardHeader>
                                <CardTitle className="text-lg">Invoice Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Client</label>
                                    <select
                                        value={formData.clientId}
                                        onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                                        className="w-full h-10 px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                                        required
                                    >
                                        <option value="">Select a client...</option>
                                        {clients.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Amount ($)</label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            placeholder="0.00"
                                            value={formData.amount}
                                            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Due Date</label>
                                        <Input
                                            type="date"
                                            value={formData.dueDate}
                                            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-between items-center pt-4 border-t border-border mt-6">
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        onClick={handlePredictRisk}
                                        disabled={loading || ocrLoading}
                                    >
                                        <Activity className="h-4 w-4 mr-2" />
                                        Run AI Risk Analysis
                                    </Button>
                                    <Button type="submit" loading={loading} disabled={ocrLoading}>
                                        Create Invoice
                                    </Button>
                                </div>
                            </CardContent>
                        </form>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card className="bg-primary/5 border-primary/20 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center">
                                <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 mr-2 text-primary" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                AI Risk Engine
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {aiPrediction ? (
                                <div className="space-y-4">
                                    <div className="p-4 rounded-lg bg-background/50 border border-border backdrop-blur-sm">
                                        <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Risk Classification</p>
                                        <div className="flex items-center">
                                            {aiPrediction.risk_label === 'High Risk' && <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />}
                                            {aiPrediction.risk_label === 'Medium Risk' && <AlertTriangle className="h-5 w-5 text-amber-500 mr-2" />}
                                            {aiPrediction.risk_label === 'Low Risk' && <CheckCircle className="h-5 w-5 text-emerald-500 mr-2" />}
                                            <span className={`text-lg font-bold ${aiPrediction.risk_label === 'Low Risk' ? 'text-emerald-500' :
                                                aiPrediction.risk_label === 'High Risk' ? 'text-red-500' : 'text-amber-500'
                                                }`}>
                                                {aiPrediction.risk_label}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="p-3 rounded-lg bg-background/50 border border-border">
                                            <p className="text-[10px] text-muted-foreground uppercase font-semibold mb-1">Delay Prediction</p>
                                            <p className="font-mono text-lg text-foreground">+{Math.round(aiPrediction.predicted_days_late)} <span className="text-xs text-muted-foreground font-sans">days</span></p>
                                        </div>
                                        <div className="p-3 rounded-lg bg-background/50 border border-border">
                                            <p className="text-[10px] text-muted-foreground uppercase font-semibold mb-1">Default Prob.</p>
                                            <p className="font-mono text-lg text-foreground">{(aiPrediction.default_probability * 100).toFixed(1)}%</p>
                                        </div>
                                    </div>

                                    <div className="text-xs text-muted-foreground mt-4 flex items-start">
                                        <div className="min-w-4 pt-0.5"><div className="w-1.5 h-1.5 rounded-full bg-primary/50"></div></div>
                                        <p>Model confidence: {(aiPrediction.confidence * 100).toFixed(0)}%. Based on SVM historical patterns.</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-6 text-muted-foreground">
                                    <Activity className="h-10 w-10 mx-auto mb-3 opacity-20" />
                                    <p className="text-sm">Fill out invoice details and click 'Run AI Risk Analysis' to generate predictions.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

// Need to import Activity since it was missing above
import { Activity } from 'lucide-react';
