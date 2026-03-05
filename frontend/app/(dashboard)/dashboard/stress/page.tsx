'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ToastProvider';
import { runStressTest } from '@/lib/api';
import { Shield, Zap, AlertTriangle, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function StressTestPage() {
    const [loading, setLoading] = useState(false);
    const [params, setParams] = useState({ balance: '10000', expenses: '3000' });
    const [results, setResults] = useState<any>(null);
    const { showToast } = useToast();

    const handleTest = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setLoading(true);

        try {
            const data = await runStressTest({
                current_balance: parseFloat(params.balance),
                monthly_expenses: parseFloat(params.expenses)
            });
            setResults(data);
            showToast('GAN Stress Test completed.', 'success');
        } catch (error) {
            console.error(error);
            showToast('Failed to run stress test', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        handleTest();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">AI Stress Testing</h1>
                <p className="text-muted-foreground">Generative Adversarial Network simulates worst-case economic scenarios.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-1 border-primary/20">
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <Zap className="h-5 w-5 mr-2 text-primary" /> Parameters
                        </CardTitle>
                        <CardDescription>Input your current baselines for the simulation model.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleTest} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Current Cash Balance (PKR)</label>
                                <Input
                                    type="number"
                                    value={params.balance}
                                    onChange={e => setParams({ ...params, balance: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Fixed Monthly Expenses (PKR)</label>
                                <Input
                                    type="number"
                                    value={params.expenses}
                                    onChange={e => setParams({ ...params, expenses: e.target.value })}
                                    required
                                />
                            </div>
                            <Button type="submit" className="w-full mt-4" loading={loading}>
                                Run GAN Simulation
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <Shield className="h-5 w-5 mr-2 text-primary" /> Simulation Results
                        </CardTitle>
                        <CardDescription>Adversarial generated macro-economic shock scenarios.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-12">
                                <div className="relative w-24 h-24">
                                    <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
                                    <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                                    <Shield className="absolute inset-0 m-auto h-8 w-8 text-primary animate-pulse" />
                                </div>
                                <h3 className="text-lg font-medium mt-6">Generating Adversarial Scenarios</h3>
                                <p className="text-sm text-muted-foreground mt-2">The GAN Discriminator is evaluating shock impacts...</p>
                            </div>
                        ) : results ? (
                            <div className="space-y-4">
                                {results.scenarios.map((scenario: any, idx: number) => (
                                    <div key={idx} className="border border-border rounded-lg p-4 bg-muted/20">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h4 className="font-semibold text-lg flex items-center">
                                                    {scenario.scenario_id}
                                                    <span className={`ml-3 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${scenario.severity === 'Extreme' ? 'bg-red-500/10 text-red-500' :
                                                        scenario.severity === 'High' ? 'bg-amber-500/10 text-amber-500' :
                                                            'bg-emerald-500/10 text-emerald-500'
                                                        }`}>
                                                        {scenario.severity} Impact
                                                    </span>
                                                </h4>
                                                <p className="text-sm text-muted-foreground mt-1">{scenario.description}</p>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-2xl font-bold font-mono">
                                                    {scenario.survivability_score.toFixed(1)}/100
                                                </div>
                                                <p className="text-[10px] uppercase text-muted-foreground font-semibold">Survivability</p>
                                            </div>
                                        </div>

                                        <div className="mt-4 pt-4 border-t border-border flex justify-between items-center text-sm">
                                            <div className="flex flex-col">
                                                <span className="text-muted-foreground text-xs uppercase">Day 30 Cash</span>
                                                <span className="font-medium font-mono">{Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 }).format(scenario.days[30])}</span>
                                            </div>
                                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                            <div className="flex flex-col">
                                                <span className="text-muted-foreground text-xs uppercase">Day 60 Cash</span>
                                                <span className="font-medium font-mono">{Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 }).format(scenario.days[60])}</span>
                                            </div>
                                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                            <div className="flex flex-col">
                                                <span className="text-muted-foreground text-xs uppercase">Day 90 Cash</span>
                                                <span className={`font-medium font-mono ${scenario.days[89] < 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                                                    {Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 }).format(scenario.days[89])}
                                                </span>
                                            </div>
                                        </div>

                                        {scenario.days[89] < 0 && (
                                            <div className="mt-3 text-xs text-red-400 flex items-center bg-red-500/5 p-2 rounded">
                                                <AlertTriangle className="h-3 w-3 mr-1.5" /> Model indicates insolvency under these conditions.
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 text-muted-foreground">
                                <Shield className="h-12 w-12 mx-auto mb-4 opacity-20" />
                                <p>Enter parameters and run simulation to view stress test results.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
