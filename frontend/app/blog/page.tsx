'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Calendar, Clock, ChevronRight } from 'lucide-react';

const BLOG_POSTS = [
    {
        id: 1,
        title: 'How Deep Learning is Solving the Accounts Receivable Crisis',
        excerpt: 'Late payments suppress business growth globally. Discover how cutting-edge Long Short-Term Memory (LSTM) networks are finally giving finance teams the predictive visibility they need to survive.',
        category: 'AI Research',
        date: 'March 15, 2026',
        readTime: '6 min read',
        image: 'bg-gradient-to-br from-blue-900 to-slate-900',
    },
    {
        id: 2,
        title: 'Unsupervised Client Profiling: Beyond the Credit Score',
        excerpt: 'Traditional credit scores are lagging indicators. Learn how we utilize KMeans Clustering to segment client payment behaviors dynamically, allowing you to identify erratic clients before they cost you.',
        category: 'Machine Learning',
        date: 'February 28, 2026',
        readTime: '8 min read',
        image: 'bg-gradient-to-br from-indigo-900 to-purple-900',
    },
    {
        id: 3,
        title: 'Stress Testing Your Cashflow Against Economic Shocks',
        excerpt: 'In a volatile economy, hope is not a strategy. We breakdown how Generative Adversarial Networks (GANs) can simulate hyper-inflationary periods and supply chain shocks to test your portfolios survivability.',
        category: 'Finance Strategy',
        date: 'February 10, 2026',
        readTime: '5 min read',
        image: 'bg-gradient-to-br from-emerald-900 to-teal-900',
    }
];

export default function BlogPage() {
    return (
        <div className="min-h-screen bg-background py-16 px-6 lg:px-8">
            <div className="max-w-5xl mx-auto space-y-12">
                <div className="text-center space-y-4">
                    <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground">
                        The Intelligence <span className="text-primary">Ledger</span>
                    </h1>
                    <p className="text-xl text-muted-foreground">
                        Insights, research, and technical deep-dives at the intersection of Artificial Intelligence and corporate finance.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {BLOG_POSTS.map((post) => (
                        <Card key={post.id} className="bg-card/40 border-border/50 hover:border-primary/50 transition-all duration-300 group flex flex-col h-full overflow-hidden">
                            <div className={`h-48 w-full ${post.image} flex items-center justify-center relative overflow-hidden`}>
                                <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-500"></div>
                                <Badge variant="default" className="absolute top-4 left-4 bg-background/80 backdrop-blur-md">
                                    {post.category}
                                </Badge>
                            </div>

                            <CardHeader className="flex-none">
                                <CardTitle className="text-xl font-bold leading-tight group-hover:text-primary transition-colors">
                                    {post.title}
                                </CardTitle>
                                <div className="flex items-center text-xs text-muted-foreground space-x-4 pt-2">
                                    <span className="flex items-center"><Calendar className="h-3 w-3 mr-1" /> {post.date}</span>
                                    <span className="flex items-center"><Clock className="h-3 w-3 mr-1" /> {post.readTime}</span>
                                </div>
                            </CardHeader>

                            <CardContent className="flex-1 flex flex-col">
                                <CardDescription className="text-sm line-clamp-4 mb-6">
                                    {post.excerpt}
                                </CardDescription>

                                <div className="mt-auto pt-4 border-t border-border/50">
                                    <Link href={`#`} className="text-primary font-medium text-sm flex items-center hover:text-primary/80 transition-colors">
                                        Read Article <ChevronRight className="h-4 w-4 ml-1" />
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}
