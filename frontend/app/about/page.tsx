'use client';

import React from 'react';
import { Bot, LineChart, Network, ShieldCheck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-background">
            {/* Hero Section */}
            <section className="py-20 px-6 lg:px-8 bg-card/30 border-b border-border">
                <div className="max-w-4xl mx-auto text-center space-y-6">
                    <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground">
                        Pioneering the Future of <span className="text-primary italic">Financial Intelligence</span>
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                        InvoiceIQ is transforming how businesses manage accounts receivable. We fuse state-of-the-art Deep Learning with enterprise finance to end cash flow unpredictability.
                    </p>
                </div>
            </section>

            {/* Our Mission */}
            <section className="py-20 px-6 lg:px-8 max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                <div className="space-y-6">
                    <h2 className="text-3xl font-bold text-foreground">Our Mission</h2>
                    <p className="text-muted-foreground leading-relaxed">
                        Late payments cost the global economy trillions annually. We built InvoiceIQ because we believe businesses shouldn't have to guess when they'll get paid. Our mission is to democratize institutional-grade AI, giving every finance team the predictive power to secure their cash flow, identify risks early, and operate with absolute certainty.
                    </p>
                </div>
                <div className="relative h-64 rounded-xl overflow-hidden bg-gradient-to-br from-primary/20 to-purple-500/10 border border-primary/20 flex items-center justify-center">
                    <div className="absolute inset-0 bg-[url('https://transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                    <Network className="h-24 w-24 text-primary opacity-80" />
                </div>
            </section>

            {/* Technology Stack */}
            <section className="py-20 px-6 lg:px-8 bg-card/20 border-t border-b border-border">
                <div className="max-w-6xl mx-auto space-y-12">
                    <div className="text-center space-y-4">
                        <h2 className="text-3xl font-bold text-foreground">Powered by Advanced AI</h2>
                        <p className="text-muted-foreground">We utilize a multi-model architecture to extract precise financial insights.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <Card className="bg-background/50 border-border/50 hover:border-primary/50 transition-colors">
                            <CardContent className="p-6 space-y-4">
                                <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                                    <LineChart className="h-6 w-6" />
                                </div>
                                <h3 className="text-xl font-bold text-foreground">LSTM Forecasting</h3>
                                <p className="text-sm text-muted-foreground">
                                    Our PyTorch-based Long Short-Term Memory networks analyze historical payment sequences to accurately project 90-day cash flow trajectories.
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="bg-background/50 border-border/50 hover:border-primary/50 transition-colors">
                            <CardContent className="p-6 space-y-4">
                                <div className="h-12 w-12 rounded-lg bg-green-500/10 flex items-center justify-center text-green-500">
                                    <ShieldCheck className="h-6 w-6" />
                                </div>
                                <h3 className="text-xl font-bold text-foreground">SVM Classification</h3>
                                <p className="text-sm text-muted-foreground">
                                    Support Vector Machines and Decision Trees predict localized invoice default probabilities in real-time, highlighting high-risk transactions.
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="bg-background/50 border-border/50 hover:border-primary/50 transition-colors">
                            <CardContent className="p-6 space-y-4">
                                <div className="h-12 w-12 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500">
                                    <Network className="h-6 w-6" />
                                </div>
                                <h3 className="text-xl font-bold text-foreground">KMeans Clustering</h3>
                                <p className="text-sm text-muted-foreground">
                                    Unsupervised learning automatically segments your client base into Reliable, Erratic, and High-Risk tiers based on historical behavior.
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="bg-background/50 border-border/50 hover:border-primary/50 transition-colors">
                            <CardContent className="p-6 space-y-4">
                                <div className="h-12 w-12 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-500">
                                    <Bot className="h-6 w-6" />
                                </div>
                                <h3 className="text-xl font-bold text-foreground">GAN Generation</h3>
                                <p className="text-sm text-muted-foreground">
                                    Generative Adversarial Networks (GANs) simulate extreme economic stress-test scenarios to evaluate portfolio resilience.
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </section>

            {/* Team */}
            <section className="py-20 px-6 lg:px-8 max-w-4xl mx-auto text-center space-y-8">
                <h2 className="text-3xl font-bold text-foreground">Built by Experts</h2>
                <p className="text-muted-foreground leading-relaxed">
                    Our team consists of leading Machine Learning researchers from top quantitative firms and seasoned software engineers. We are dedicated to bridging the gap between theoretical AI models and practical B2B financial applications, pushing the boundaries of what is possible on the web.
                </p>
            </section>
        </div>
    );
}
