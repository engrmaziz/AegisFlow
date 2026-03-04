'use client';

import { useAuth } from '@/components/AuthProvider';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import {
    BarChart3,
    FileText,
    Users,
    Settings,
    LogOut,
    Activity,
    Menu,
    X,
    CreditCard
} from 'lucide-react';
import { useState } from 'react';

const navigation = [
    { name: 'Overview', href: '/dashboard', icon: BarChart3 },
    { name: 'Invoices', href: '/dashboard/invoices', icon: FileText },
    { name: 'Clients', href: '/dashboard/clients', icon: Users },
    { name: 'Cash Flow', href: '/dashboard/cashflow', icon: Activity },
    { name: 'Stress Test', href: '/dashboard/stress', icon: CreditCard },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    const pathname = usePathname();
    const router = useRouter();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const supabase = createClient();

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!user) {
        router.push('/login');
        return null;
    }

    return (
        <div className="flex h-screen bg-background overflow-hidden relative">
            {/* Mobile sidebar backdrop */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    } fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:block`}
            >
                <div className="flex flex-col h-full h-screen">
                    <div className="flex items-center justify-between h-16 px-6 border-b border-border">
                        <Link href="/dashboard" className="flex items-center space-x-2">
                            <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-500">
                                InvoiceIQ
                            </span>
                        </Link>
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="lg:hidden text-muted-foreground hover:text-foreground"
                        >
                            <X className="h-6 w-6" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                        {navigation.map((item) => {
                            const isActive = pathname === item.href;
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${isActive
                                        ? 'bg-primary/10 text-primary'
                                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                        }`}
                                    onClick={() => setSidebarOpen(false)}
                                >
                                    <Icon className={`mr-3 h-5 w-5 flex-shrink-0 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </div>

                    <div className="p-4 border-t border-border">
                        <div className="flex items-center space-x-3 mb-4 px-3 text-sm">
                            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                                {user.email?.charAt(0).toUpperCase()}
                            </div>
                            <div className="truncate flex-1">
                                <p className="font-medium text-foreground truncate">{user.email}</p>
                                <p className="text-xs text-muted-foreground truncate">Free Plan</p>
                            </div>
                        </div>
                        <button
                            onClick={handleSignOut}
                            className="flex items-center w-full px-3 py-2 text-sm font-medium text-muted-foreground rounded-md hover:bg-muted hover:text-foreground transition-colors"
                        >
                            <LogOut className="mr-3 h-5 w-5 flex-shrink-0" />
                            Sign out
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main content */}
            <div className="flex-1 flex flex-col w-0 overflow-hidden h-screen">
                {/* Mobile top bar */}
                <div className="lg:hidden flex items-center justify-between h-16 px-4 border-b border-border bg-card">
                    <Link href="/dashboard" className="flex items-center">
                        <span className="text-xl font-bold text-primary">InvoiceIQ</span>
                    </Link>
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="text-muted-foreground hover:text-foreground focus:outline-none"
                    >
                        <Menu className="h-6 w-6" />
                    </button>
                </div>

                <main className="flex-1 overflow-y-auto bg-background/50 focus:outline-none">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
