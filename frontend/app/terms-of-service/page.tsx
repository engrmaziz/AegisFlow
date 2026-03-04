import React from 'react';

export const metadata = {
    title: 'Terms of Service | InvoiceIQ',
    description: 'Terms of Service for InvoiceIQ',
};

export default function TermsOfServicePage() {
    return (
        <div className="min-h-screen bg-background py-16 px-6 lg:px-8">
            <div className="max-w-3xl mx-auto space-y-8">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl text-foreground mb-4">
                        Terms of Service
                    </h1>
                    <p className="text-muted-foreground">Last Updated: March 2026</p>
                </div>

                <div className="prose prose-invert max-w-none space-y-6">
                    <section className="space-y-4">
                        <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2">1. Acceptance of Terms</h2>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                            By accessing or using InvoiceIQ ("the Service"), you agree to be bound by these Terms of Service. If you disagree with any part of the terms, you may not access the Service. InvoiceIQ is provided as a B2B SaaS platform to assist with financial data processing using Artificial Intelligence.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2">2. Use License & Restrictions</h2>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                            Permission is granted to temporarily access the materials and AI tools on InvoiceIQ's website for internal business operations. This is the grant of a license, not a transfer of title. Under this license you may not:
                        </p>
                        <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                            <li>Modify or copy the proprietary Machine Learning algorithms.</li>
                            <li>Attempt to decompile or reverse engineer any software contained on the platform.</li>
                            <li>Remove any copyright or other proprietary notations from the materials.</li>
                            <li>Transfer the materials to another person or "mirror" the materials on any other server.</li>
                        </ul>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2">3. User Data & AI Processing</h2>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                            You retain all rights to the financial data you upload. By submitting invoices and cashflow records, you grant InvoiceIQ a worldwide, highly secure, anonymized license to process this data to provide our predictive analytics (such as Risk Clustering and Default predictions). You are responsible for ensuring you have the legal right to upload any client data to our servers.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2">4. Disclaimer of Financial Advice</h2>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                            The AI-generated insights, including LSTM cashflow forecasts and SVM default probability scores, are provided for informational and analytical purposes only. They do not constitute certified financial, legal, or accounting advice. InvoiceIQ does not guarantee the absolute accuracy of predictive models and we are not liable for business decisions made based on our analytics.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2">5. Service Limitations</h2>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                            We strive to ensure 99.9% uptime, but the Service is provided "as is". We make no warranties, expressed or implied, and hereby disclaim and negate all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
