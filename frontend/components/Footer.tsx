import Link from 'next/link';

export default function Footer() {
    return (
        <footer className="bg-card border-t border-border py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div className="md:col-span-1">
                        <Link href="/" className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-500 mb-4 inline-block">
                            InvoiceIQ
                        </Link>
                        <p className="text-muted-foreground text-sm">AI financial intelligence for the modern business.</p>
                    </div>
                    <div>
                        <h4 className="font-bold mb-4">Product</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li><a href="/#features" className="hover:text-foreground">Features</a></li>
                            <li><a href="/#pricing" className="hover:text-foreground">Pricing</a></li>
                            <li><Link href="/auth/login" className="hover:text-foreground">Log in</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold mb-4">Company</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li><Link href="/about" className="hover:text-foreground">About Us</Link></li>
                            <li><Link href="/contact" className="hover:text-foreground">Contact</Link></li>
                            <li><Link href="/blog" className="hover:text-foreground">Blog</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold mb-4">Legal</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li><Link href="/privacy-policy" className="hover:text-foreground">Privacy Policy</Link></li>
                            <li><Link href="/terms-of-service" className="hover:text-foreground">Terms of Service</Link></li>
                        </ul>
                    </div>
                </div>
                <div className="mt-12 pt-8 border-t border-border text-center text-sm text-muted-foreground">
                    &copy; {new Date().getFullYear()} InvoiceIQ. All rights reserved.
                </div>
            </div>
        </footer>
    );
}
