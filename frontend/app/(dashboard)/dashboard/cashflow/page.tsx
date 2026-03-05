'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { fetchCashFlowForecast } from '@/lib/api';
import { useToast } from '@/components/ToastProvider';
import { ResponsiveContainer, Area, XAxis, YAxis, CartesianGrid, Tooltip, ComposedChart } from 'recharts';
import { Activity, AlertOctagon, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function CashFlowPage() {
    const [loading, setLoading] = useState(false);
    const [forecastData, setForecastData] = useState<any>(null);
    const { showToast } = useToast();

    const handleRunForecast = async () => {
        setLoading(true);
        try {
            // Mock historical transactions to send to LSTM model
            const mockTx = Array.from({ length: 60 }, (_, i) => ({
                date: new Date(Date.now() - (60 - i) * 24 * 60 * 60 * 1000).toISOString(),
                amount: Math.random() * 5000 + (Math.random() > 0.5 ? 2000 : -3000),
                type: 'mock'
            }));

            const response = await fetchCashFlowForecast(mockTx);

            // Transform response for charts
            const chartData = response.forecast.map((val, i) => ({
                day: `Day ${i + 1}`,
                prediction: val,
                lower: response.lower_bound[i],
                upper: response.upper_bound[i]
            }));

            setForecastData({
                chartData,
                ...response
            });
            showToast('LSTM Forecast updated successfully.', 'success');
        } catch (error) {
            console.error(error);
            showToast('Failed to generate forecast', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        handleRunForecast();
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Cash Flow Forecast</h1>
                    <p className="text-muted-foreground">LSTM Neural Network 90-day liquidity prediction.</p>
                </div>
                <Button onClick={handleRunForecast} loading={loading}>
                    <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Update Model
                </Button>
            </div>

            {forecastData && forecastData.liquidity_warning && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-start">
                    <AlertOctagon className="h-5 w-5 text-red-500 mr-3 mt-0.5" />
                    <div>
                        <h4 className="font-semibold text-red-500">Liquidity Warning</h4>
                        <p className="text-sm text-red-400 mt-1">The LSTM model predicts a high probability of negative cash balance within the next 45 days. Consider delaying non-essential expenses or expediting collections.</p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">30-Day Projection</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">
                            {forecastData?.projected_30_day ? Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 }).format(forecastData.projected_30_day) : '---'}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">60-Day Projection</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">
                            {forecastData?.projected_60_day ? Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 }).format(forecastData.projected_60_day) : '---'}
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-primary/5 border-primary/20">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-primary flex items-center">
                            <Activity className="h-4 w-4 mr-2" /> 90-Day Target
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-primary">
                            {forecastData?.projected_90_day ? Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 }).format(forecastData.projected_90_day) : '---'}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>90-Day Predictive Trajectory (LSTM)</CardTitle>
                    <CardDescription>Visualizing predicted cash balance with 95% confidence intervals generated by PyTorch.</CardDescription>
                </CardHeader>
                <CardContent className="h-[400px]">
                    {loading && !forecastData ? (
                        <div className="h-full w-full flex items-center justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    ) : forecastData ? (
                        <div className="w-full h-[350px] relative">
                            <ResponsiveContainer width="100%" height="100%" aspect={2.5} minWidth={1} minHeight={1}>
                                <ComposedChart data={forecastData.chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorPred" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                    <XAxis dataKey="day" minTickGap={20} stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v: number) => Intl.NumberFormat('en-PK', { notation: "compact", compactDisplay: "short", minimumFractionDigits: 0 }).format(v)} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                                        formatter={(value: any) => value !== undefined ? [Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 }).format(Number(value)), ''] : ['', '']}
                                    />
                                    <Area type="monotone" dataKey="upper" stroke="none" fill="hsl(var(--primary))" fillOpacity={0.1} />
                                    <Area type="monotone" dataKey="lower" stroke="none" fill="hsl(var(--background))" />
                                    <Area type="monotone" dataKey="prediction" stroke="hsl(var(--primary))" strokeWidth={2} fillOpacity={1} fill="url(#colorPred)" />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    ) : null}
                </CardContent>
            </Card>
        </div>
    );
}
