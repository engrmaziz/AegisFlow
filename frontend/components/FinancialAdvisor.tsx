'use client';

import { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, MessageCircle, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type Message = {
    role: 'user' | 'assistant';
    content: string;
};

export default function FinancialAdvisor() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: 'Hello! I am your AegisFlow AI Financial Advisor. How can I assist you with your cash flow forecasting or risk profiling today?' }
    ]);
    const [query, setQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen, isLoading, error]);

    const handleSend = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!query.trim() || isLoading) return;

        const userMessage = query.trim();
        setQuery('');
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setIsLoading(true);
        setError(null);

        try {
            const res = await fetch('https://invoiceiq.up.railway.app/chat/ask', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ query: userMessage })
            });

            if (!res.ok) {
                throw new Error('Backend is unreachable or returned an error.');
            }

            const data = await res.json();
            setMessages(prev => [...prev, { role: 'assistant', content: data.answer }]);
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Failed to connect to AI Advisor.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-[100]">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute bottom-20 right-0 w-[350px] sm:w-[400px] bg-slate-900/80 backdrop-blur-xl border border-blue-500/20 rounded-xl shadow-[0_0_40px_-10px_rgba(59,130,246,0.3)] flex flex-col overflow-hidden"
                        style={{ height: '550px', maxHeight: '80vh' }}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-md">
                            <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30 shadow-inner">
                                    <Bot className="w-5 h-5 text-blue-400" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold text-white">AI Financial Advisor</h3>
                                    <p className="text-xs text-blue-300">AegisFlow Intelligence</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-slate-400 hover:text-white transition-colors p-1.5 rounded-full hover:bg-white/10"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 font-sans">
                            {messages.map((msg, idx) => (
                                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                        <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center shadow-lg ${msg.role === 'user' ? 'bg-gradient-to-br from-indigo-500 to-purple-600' : 'bg-slate-800 border border-blue-500/30'}`}>
                                            {msg.role === 'user' ? <MessageCircle className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-blue-400" />}
                                        </div>
                                        <div className={`p-3.5 rounded-2xl text-[13px] shadow-md backdrop-blur-sm ${msg.role === 'user'
                                                ? 'bg-blue-600/80 text-white rounded-tr-none border border-blue-500/30'
                                                : 'bg-slate-800/80 border border-white/10 text-slate-200 rounded-tl-none'
                                            } whitespace-pre-wrap leading-relaxed overflow-x-hidden`}>
                                            {msg.role === 'user' ? (
                                                msg.content
                                            ) : (
                                                <ReactMarkdown
                                                    remarkPlugins={[remarkGfm]}
                                                    components={{
                                                        p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                                                        strong: ({ node, ...props }) => <strong className="font-semibold text-white" {...props} />,
                                                        h1: ({ node, ...props }) => <h1 className="font-bold text-white text-base mt-3 mb-2" {...props} />,
                                                        h2: ({ node, ...props }) => <h2 className="font-semibold text-white text-sm mt-3 mb-2" {...props} />,
                                                        h3: ({ node, ...props }) => <h3 className="font-semibold text-white text-sm mt-2 mb-1" {...props} />,
                                                        ul: ({ node, ...props }) => <ul className="list-disc list-outside ml-4 space-y-1 mb-2" {...props} />,
                                                        ol: ({ node, ...props }) => <ol className="list-decimal list-outside ml-4 space-y-1 mb-2" {...props} />,
                                                        li: ({ node, ...props }) => <li className="text-slate-200" {...props} />,
                                                        a: ({ node, ...props }) => <a className="text-blue-400 hover:text-blue-300 underline underline-offset-2" {...props} />,
                                                        code: ({ node, className, children, ...props }: any) => {
                                                            const isInline = !className;
                                                            return !isInline ? (
                                                                <div className="bg-slate-900/50 rounded-md border border-white/10 p-2 my-2 overflow-x-auto text-[12px] font-mono">
                                                                    <code className={className} {...props}>
                                                                        {children}
                                                                    </code>
                                                                </div>
                                                            ) : (
                                                                <code className="bg-slate-900/50 text-blue-300 px-1 py-0.5 rounded text-xs font-mono" {...props}>
                                                                    {children}
                                                                </code>
                                                            )
                                                        }
                                                    }}
                                                >
                                                    {msg.content}
                                                </ReactMarkdown>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* Loading State */}
                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="flex gap-3 max-w-[85%] flex-row items-end">
                                        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-slate-800 border border-blue-500/30 flex items-center justify-center shadow-lg">
                                            <Bot className="w-4 h-4 text-blue-400" />
                                        </div>
                                        <div className="p-3.5 rounded-2xl rounded-tl-none bg-slate-800/80 border border-white/10 flex items-center gap-2 shadow-md">
                                            <span className="text-[13px] text-blue-300 animate-pulse font-medium tracking-wide">System is analyzing...</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Error State */}
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex items-center gap-2.5 p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-[13px] shadow-sm mt-2"
                                >
                                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                    <span>{error}</span>
                                </motion.div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-4 border-t border-white/10 bg-slate-900/50 backdrop-blur-md">
                            <form onSubmit={handleSend} className="relative flex items-center">
                                <input
                                    type="text"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Type your message here..."
                                    className="w-full bg-slate-800/50 border border-white/10 rounded-full pl-5 pr-14 py-3 text-[13px] text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-inner"
                                />
                                <button
                                    type="submit"
                                    disabled={!query.trim() || isLoading}
                                    className="absolute right-2 h-9 w-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white shadow-lg hover:shadow-blue-500/25 disabled:opacity-50 disabled:hover:shadow-none transition-all"
                                >
                                    <Send className="w-4 h-4 ml-0.5" />
                                </button>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Floating Action Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`h-14 w-14 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.5)] transition-all duration-300 relative focus:outline-none ${isOpen
                    ? 'bg-slate-800 text-white border border-white/10 rotate-90 scale-90 shadow-none hover:bg-slate-700'
                    : 'bg-gradient-to-br from-blue-600 to-purple-600 text-white hover:scale-110 hover:shadow-[0_0_30px_rgba(59,130,246,0.6)]'
                    }`}
            >
                {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
            </button>
        </div>
    );
}

