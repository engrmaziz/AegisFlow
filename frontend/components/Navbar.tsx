'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <div className="flex-shrink-0 flex items-center">
                        <Link href="/" className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-500">
                            InvoiceIQ
                        </Link>
                    </div>
                    <div className="hidden md:flex items-center space-x-8">
                        <a href="/#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</a>
                        <a href="/#pricing" className="text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
                        <Link href="/about" className="text-muted-foreground hover:text-foreground transition-colors">About</Link>
                        <Link href="/auth/signup" className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors">
                            Get Started
                        </Link>
                    </div>
                    <div className="md:hidden flex items-center">
                        <button onClick={() => setIsOpen(!isOpen)} className="text-muted-foreground hover:text-foreground">
                            {isOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </div>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="md:hidden bg-card border-b border-border overflow-hidden"
                    >
                        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                            <a href="/#features" className="block px-3 py-2 text-base font-medium text-muted-foreground hover:text-foreground">Features</a>
                            <a href="/#pricing" className="block px-3 py-2 text-base font-medium text-muted-foreground hover:text-foreground">Pricing</a>
                            <Link href="/about" className="block px-3 py-2 text-base font-medium text-muted-foreground hover:text-foreground">About</Link>
                            <Link href="/auth/signup" className="block px-3 py-2 text-base font-medium text-primary hover:text-primary/80">Get Started</Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
}
