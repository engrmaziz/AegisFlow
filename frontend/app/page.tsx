'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Shield, TrendingUp, Brain, Zap, CheckCircle, Star, Menu, X } from 'lucide-react';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function LandingPage() {
    const featuresRef = useRef(null);
    const isFeaturesInView = useInView(featuresRef, { once: true, amount: 0.2 });

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    };

    return (
        <div className="min-h-screen bg-background text-foreground scroll-smooth">
            <Navbar />

            {/* HERO SECTION */}
            <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col items-center text-center">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <div className="inline-flex items-center space-x-2 bg-muted/50 rounded-full px-4 py-1.5 mb-8 border border-border">
                        <span className="text-xl">🚀</span>
                        <span className="text-sm font-medium">AI-Powered Financial Intelligence</span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6">
                        Know Which Invoices Will Default<br />
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-500">Before They Do</span>
                    </h1>

                    <p className="mt-4 max-w-2xl mx-auto text-xl text-muted-foreground mb-10">
                        Stop chasing late payments. InvoiceIQ uses machine learning to predict invoice defaults, forecast your cash flow 90 days ahead, and identify your riskiest clients automatically.
                    </p>

                    <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4 mb-16">
                        <Link href="/auth/signup" className="inline-flex items-center justify-center px-8 py-4 text-base font-medium rounded-lg text-white bg-primary hover:bg-primary/90 transition-all">
                            Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
                        </Link>
                        <a href="#demo" className="inline-flex items-center justify-center px-8 py-4 text-base font-medium rounded-lg text-foreground border border-border hover:bg-muted transition-all">
                            Watch Demo
                        </a>
                    </div>

                    <div className="flex flex-wrap justify-center gap-6 sm:gap-12 text-sm font-medium text-muted-foreground">
                        <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 4 }} className="flex items-center gap-2"><CheckCircle className="h-5 w-5 text-primary" /> 94% Prediction Accuracy</motion.div>
                        <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 4, delay: 1 }} className="flex items-center gap-2"><CheckCircle className="h-5 w-5 text-accent" /> 90-Day Forecasting</motion.div>
                        <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 4, delay: 2 }} className="flex items-center gap-2"><CheckCircle className="h-5 w-5 text-green-500" /> Real-time Risk Scoring</motion.div>
                    </div>
                </motion.div>

                {/* Hero image placeholder */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3, duration: 0.8 }}
                    className="mt-20 w-full max-w-5xl rounded-xl border border-border bg-card p-4 shadow-2xl overflow-hidden relative"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 z-0"></div>
                    <div className="relative z-10 h-64 sm:h-96 w-full rounded-lg border border-border/50 bg-[#0a0a0f]/80 backdrop-blur flex flex-col items-center justify-center">
                        {/* Fake chart visualization */}
                        <div className="w-full h-full flex items-end justify-between px-10 pb-10 pt-20">
                            {[40, 60, 45, 80, 50, 90, 70, 110, 85, 120].map((h, i) => (
                                <div key={i} className="w-12 bg-gradient-to-t from-primary/20 to-primary/80 rounded-t-sm" style={{ height: `${h}%` }}></div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            </section>

            {/* FEATURES SECTION */}
            <section id="features" ref={featuresRef} className="py-24 bg-card border-y border-border">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-foreground">
                            Everything You Need to Stay Financially Safe
                        </h2>
                    </div>

                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate={isFeaturesInView ? "visible" : "hidden"}
                        className="grid grid-cols-1 md:grid-cols-2 gap-8"
                    >
                        <motion.div variants={itemVariants} className="bg-background border border-border p-8 rounded-2xl hover:-translate-y-1 hover:border-primary/50 transition-all group relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <Shield className="h-10 w-10 text-primary mb-4" />
                            <h3 className="text-xl font-bold text-foreground mb-3">Invoice Risk Scoring</h3>
                            <p className="text-muted-foreground text-base">Our SVM model predicts default probability with 94% accuracy, alerting you before you even send the invoice.</p>
                        </motion.div>

                        <motion.div variants={itemVariants} className="bg-background border border-border p-8 rounded-2xl hover:-translate-y-1 hover:border-accent/50 transition-all group relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <TrendingUp className="h-10 w-10 text-accent mb-4" />
                            <h3 className="text-xl font-bold text-foreground mb-3">90-Day Cash Flow Forecast</h3>
                            <p className="text-muted-foreground text-base">LSTM neural network projects your bank balance weeks ahead using historical transaction patterns.</p>
                        </motion.div>

                        <motion.div variants={itemVariants} className="bg-background border border-border p-8 rounded-2xl hover:-translate-y-1 hover:border-primary/50 transition-all group relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <Brain className="h-10 w-10 text-primary mb-4" />
                            <h3 className="text-xl font-bold text-foreground mb-3">Smart Client Tiers</h3>
                            <p className="text-muted-foreground text-base">K-Means clustering auto-groups clients into Reliable, Erratic, or High Risk based on their payment habits.</p>
                        </motion.div>

                        <motion.div variants={itemVariants} className="bg-background border border-border p-8 rounded-2xl hover:-translate-y-1 hover:border-accent/50 transition-all group relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <Zap className="h-10 w-10 text-accent mb-4" />
                            <h3 className="text-xl font-bold text-foreground mb-3">Stress Testing</h3>
                            <p className="text-muted-foreground text-base">GAN-generated disaster scenarios test your financial survivability against unexpected market shocks.</p>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* HOW IT WORKS SECTION */}
            <section className="py-24 bg-background">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-foreground">
                            How It Works
                        </h2>
                    </div>
                    <div className="flex flex-col md:flex-row gap-8 justify-between relative">
                        <div className="hidden md:block absolute top-12 left-10 right-10 h-0.5 bg-border z-0"></div>

                        <div className="flex-1 relative z-10 flex flex-col items-center text-center">
                            <div className="w-24 h-24 rounded-full bg-card border-2 border-primary flex items-center justify-center text-3xl font-bold text-primary mb-6 shadow-lg shadow-primary/20">1</div>
                            <h3 className="text-xl font-bold mb-2">Connect Your Data</h3>
                            <p className="text-muted-foreground">Upload invoices safely or connect your existing accounting tools in minutes.</p>
                        </div>

                        <div className="flex-1 relative z-10 flex flex-col items-center text-center">
                            <div className="w-24 h-24 rounded-full bg-card border-2 border-accent flex items-center justify-center text-3xl font-bold text-accent mb-6 shadow-lg shadow-accent/20">2</div>
                            <h3 className="text-xl font-bold mb-2">AI Analyzes Everything</h3>
                            <p className="text-muted-foreground">Our distributed PyTorch models run across your history in seconds to identify patterns.</p>
                        </div>

                        <div className="flex-1 relative z-10 flex flex-col items-center text-center">
                            <div className="w-24 h-24 rounded-full bg-card border-2 border-green-500 flex items-center justify-center text-3xl font-bold text-green-500 mb-6 shadow-lg shadow-green-500/20">3</div>
                            <h3 className="text-xl font-bold mb-2">Get Actionable Insights</h3>
                            <p className="text-muted-foreground">Receive clear risk scores, precise forecasts, and alerts about risky clients.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* PRICING SECTION */}
            <section id="pricing" className="py-24 bg-card border-y border-border">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-foreground">
                            Pricing Plans
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Free Plan */}
                        <div className="bg-background border border-border rounded-2xl p-8 flex flex-col">
                            <h3 className="text-2xl font-bold mb-2">Free</h3>
                            <p className="text-muted-foreground mb-6">Perfect for testing the waters.</p>
                            <div className="text-4xl font-extrabold mb-6">$0<span className="text-xl text-muted-foreground font-normal">/mo</span></div>
                            <ul className="space-y-4 flex-1 mb-8">
                                <li className="flex items-start gap-2"><CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" /> <span>5 invoices/month</span></li>
                                <li className="flex items-start gap-2"><CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" /> <span>Basic risk scoring</span></li>
                                <li className="flex items-start gap-2"><CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" /> <span>Email support</span></li>
                            </ul>
                            <Link href="/auth/signup" className="w-full text-center px-4 py-3 rounded-md bg-muted text-foreground hover:bg-muted/80 font-medium transition-colors">Select Free</Link>
                        </div>

                        {/* Pro Plan */}
                        <div className="bg-background border-2 border-primary rounded-2xl p-8 flex flex-col relative transform md:-translate-y-4 shadow-xl shadow-primary/10">
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-primary to-accent text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg">Most Popular</div>
                            <h3 className="text-2xl font-bold mb-2">Pro</h3>
                            <p className="text-muted-foreground mb-6">For freelancers and small businesses.</p>
                            <div className="text-4xl font-extrabold mb-6">$29<span className="text-xl text-muted-foreground font-normal">/mo</span></div>
                            <ul className="space-y-4 flex-1 mb-8">
                                <li className="flex items-start gap-2"><CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" /> <span>Unlimited invoices</span></li>
                                <li className="flex items-start gap-2"><CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" /> <span>All AI features included</span></li>
                                <li className="flex items-start gap-2"><CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" /> <span>Cash flow forecasting</span></li>
                                <li className="flex items-start gap-2"><CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" /> <span>Stress testing</span></li>
                                <li className="flex items-start gap-2"><CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" /> <span>Priority support</span></li>
                            </ul>
                            <Link href="/auth/signup" className="w-full text-center px-4 py-3 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 font-medium transition-colors">Start Free Trial</Link>
                        </div>

                        {/* Enterprise Plan */}
                        <div className="bg-background border border-border rounded-2xl p-8 flex flex-col">
                            <h3 className="text-2xl font-bold mb-2">Enterprise</h3>
                            <p className="text-muted-foreground mb-6">For larger operations.</p>
                            <div className="text-4xl font-extrabold mb-6">Custom</div>
                            <ul className="space-y-4 flex-1 mb-8">
                                <li className="flex items-start gap-2"><CheckCircle className="h-5 w-5 text-accent shrink-0 mt-0.5" /> <span>Everything in Pro</span></li>
                                <li className="flex items-start gap-2"><CheckCircle className="h-5 w-5 text-accent shrink-0 mt-0.5" /> <span>Custom integrations</span></li>
                                <li className="flex items-start gap-2"><CheckCircle className="h-5 w-5 text-accent shrink-0 mt-0.5" /> <span>Dedicated support</span></li>
                                <li className="flex items-start gap-2"><CheckCircle className="h-5 w-5 text-accent shrink-0 mt-0.5" /> <span>Custom model fine-tuning</span></li>
                            </ul>
                            <Link href="#contact" className="w-full text-center px-4 py-3 rounded-md bg-muted text-foreground hover:bg-muted/80 font-medium transition-colors">Contact Us</Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* TESTIMONIALS */}
            <section className="py-24 bg-background">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-foreground">
                            Trusted by Businesses
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="bg-card border border-border p-6 rounded-xl">
                            <div className="flex gap-1 mb-4">
                                {[1, 2, 3, 4, 5].map(i => <Star key={i} className="h-5 w-5 text-yellow-500 fill-yellow-500" />)}
                            </div>
                            <p className="text-muted-foreground mb-6 italic">"The risk scoring caught a client who was about to default on a $15k project. InvoiceIQ literally saved my month's cash flow."</p>
                            <div className="font-bold">Sarah Jenkins</div>
                            <div className="text-sm text-muted-foreground">Founder, DesignStudio</div>
                        </div>
                        <div className="bg-card border border-border p-6 rounded-xl">
                            <div className="flex gap-1 mb-4">
                                {[1, 2, 3, 4, 5].map(i => <Star key={i} className="h-5 w-5 text-yellow-500 fill-yellow-500" />)}
                            </div>
                            <p className="text-muted-foreground mb-6 italic">"The 90-day forecast is incredibly accurate. It warned us about a liquidity dip 6 weeks before it happened, giving us time to prepare."</p>
                            <div className="font-bold">Michael Chen</div>
                            <div className="text-sm text-muted-foreground">CEO, TechFlow</div>
                        </div>
                        <div className="bg-card border border-border p-6 rounded-xl">
                            <div className="flex gap-1 mb-4">
                                {[1, 2, 3, 4, 5].map(i => <Star key={i} className="h-5 w-5 text-yellow-500 fill-yellow-500" />)}
                            </div>
                            <p className="text-muted-foreground mb-6 italic">"Uploading invoices and having the OCR just read everything and run it through the ML pipeline is like magic."</p>
                            <div className="font-bold">David Wright</div>
                            <div className="text-sm text-muted-foreground">Freelance Developer</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* FOOTER */}
            {/* FOOTER */}
            <Footer />
        </div>
    );
}
