'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ToastProvider';
import { Mail, Phone, MapPin, Send } from 'lucide-react';

export default function ContactPage() {
    const [loading, setLoading] = useState(false);
    const { showToast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // Simulate API submission
        setTimeout(() => {
            setLoading(false);
            showToast('Message sent successfully! Our team will contact you shortly.', 'success');
            (e.target as HTMLFormElement).reset();
        }, 1500);
    };

    return (
        <div className="min-h-screen bg-background py-16 px-6 lg:px-8">
            <div className="max-w-6xl mx-auto space-y-12">
                <div className="text-center space-y-4 max-w-2xl mx-auto">
                    <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground">
                        Get in <span className="text-primary">Touch</span>
                    </h1>
                    <p className="text-xl text-muted-foreground">
                        Have questions about our AI models, enterprise pricing, or partnership opportunities? Our team is ready to help.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* Contact Information */}
                    <div className="space-y-8">
                        <Card className="bg-card/40 border-border/50 h-full flex flex-col justify-center p-4">
                            <CardHeader>
                                <CardTitle className="text-2xl font-bold">Global Headquarters</CardTitle>
                                <CardDescription>We operate remotely with core infrastructure anchored globally.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex items-start space-x-4 p-4 rounded-lg bg-background/50 border border-border/30">
                                    <MapPin className="h-6 w-6 text-primary mt-1" />
                                    <div>
                                        <h4 className="font-semibold text-foreground">San Francisco, CA</h4>
                                        <p className="text-sm text-muted-foreground">100 Market Street<br />Suite 300<br />San Francisco, CA 94103</p>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-4 p-4 rounded-lg bg-background/50 border border-border/30">
                                    <Mail className="h-6 w-6 text-primary" />
                                    <div>
                                        <h4 className="font-semibold text-foreground">Email Inquiries</h4>
                                        <p className="text-sm text-muted-foreground"><a href="mailto:hello@invoiceiq.ai" className="hover:text-primary transition-colors">hello@invoiceiq.ai</a></p>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-4 p-4 rounded-lg bg-background/50 border border-border/30">
                                    <Phone className="h-6 w-6 text-primary" />
                                    <div>
                                        <h4 className="font-semibold text-foreground">Phone</h4>
                                        <p className="text-sm text-muted-foreground">+1 (800) 555-0199</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Contact Form */}
                    <Card className="bg-card/40 border-border/50">
                        <CardHeader>
                            <CardTitle className="text-2xl font-bold">Send a Message</CardTitle>
                            <CardDescription>Fill out the form below and an AI specialist will reach out.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label htmlFor="firstName" className="text-sm font-medium text-foreground">First Name</label>
                                        <Input id="firstName" name="firstName" required placeholder="John" className="bg-background/50" />
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="lastName" className="text-sm font-medium text-foreground">Last Name</label>
                                        <Input id="lastName" name="lastName" required placeholder="Doe" className="bg-background/50" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="email" className="text-sm font-medium text-foreground">Work Email</label>
                                    <Input id="email" name="email" type="email" required placeholder="john@company.com" className="bg-background/50" />
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="company" className="text-sm font-medium text-foreground">Company Name</label>
                                    <Input id="company" name="company" placeholder="Acme Corp" className="bg-background/50" />
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="message" className="text-sm font-medium text-foreground">How can we help?</label>
                                    <textarea
                                        id="message"
                                        name="message"
                                        required
                                        rows={4}
                                        className="w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                        placeholder="Describe your cashflow or accounts receivable challenges..."
                                    />
                                </div>

                                <Button type="submit" className="w-full" loading={loading}>
                                    {!loading && <Send className="mr-2 h-4 w-4" />} Send Message
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
