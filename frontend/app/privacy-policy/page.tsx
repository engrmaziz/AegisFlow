import React from 'react';

export const metadata = {
    title: 'Privacy Policy | InvoiceIQ',
    description: 'Privacy Policy and Data Handling for InvoiceIQ',
};

export default function PrivacyPolicyPage() {
    return (
        <div className="min-h-screen bg-background py-16 px-6 lg:px-8">
            <div className="max-w-3xl mx-auto space-y-8">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl text-foreground mb-4">
                        Privacy Policy
                    </h1>
                    <p className="text-muted-foreground">Last Updated: March 2026</p>
                </div>

                <div className="prose prose-invert max-w-none space-y-6">
                    <section className="bg-card/50 border border-border p-6 rounded-lg">
                        <h2 className="text-2xl font-bold text-foreground mb-4">1. Information We Collect</h2>
                        <p className="text-muted-foreground mb-4">
                            At InvoiceIQ, we prioritize the security and privacy of your financial data. We collect information that you proactively provide to us, including your name, email address, company details, and the financial invoice records you upload for AI processing.
                        </p>
                        <p className="text-muted-foreground">
                            Our systems may also automatically collect usage metrics, IP addresses, and interaction logs to improve the performance of our Deep Learning algorithms.
                        </p>
                    </section>

                    <section className="bg-card/50 border border-border p-6 rounded-lg">
                        <h2 className="text-2xl font-bold text-foreground mb-4">2. How We Use Your Data</h2>
                        <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                            <li>To provide, maintain, and improve our AI-driven invoice classification and cash flow forecasting services.</li>
                            <li>To train and optimize our internal Machine Learning models (LSTM, SVM, KMeans) ensuring all user-data is properly anonymized.</li>
                            <li>To detect, prevent, and address fraud, security breaches, and technical issues.</li>
                            <li>To communicate with you regarding account updates, support inquiries, and platform changes.</li>
                        </ul>
                    </section>

                    <section className="bg-card/50 border border-border p-6 rounded-lg">
                        <h2 className="text-2xl font-bold text-foreground mb-4">3. Data Security & Storage</h2>
                        <p className="text-muted-foreground">
                            We implement industry-standard encryption protocols (AES-256) to safeguard your financial records both in transit and at rest. Our infrastructure is hosted on secure cloud providers compliant with strict regulatory standards (SOC 2, GDPR).
                        </p>
                    </section>

                    <section className="bg-card/50 border border-border p-6 rounded-lg">
                        <h2 className="text-2xl font-bold text-foreground mb-4">4. Sharing Your Information</h2>
                        <p className="text-muted-foreground">
                            We do not sell your personal or financial data to third parties. Information may only be shared with trusted third-party service providers (such as hosting partners or payment processors) strictly for the purpose of operating our platform, or when required by law to comply with legal obligations.
                        </p>
                    </section>

                    <section className="bg-card/50 border border-border p-6 rounded-lg">
                        <h2 className="text-2xl font-bold text-foreground mb-4">5. Your Rights</h2>
                        <p className="text-muted-foreground">
                            Depending on your jurisdiction, you have the right to access, correct, port, or securely delete your personal data. Please contact our Data Protection Officer at privacy@invoiceiq.ai to exercise these rights.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
