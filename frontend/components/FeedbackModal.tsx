import { useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { createClient } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ToastProvider';
import { X, Send } from 'lucide-react';

interface FeedbackModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        if (!message.trim()) {
            showToast('Please enter a message.', 'error');
            return;
        }

        setLoading(true);
        const supabase = createClient();

        try {
            const { error } = await supabase
                .from('feedback')
                .insert({
                    user_id: user.id,
                    message: message.trim()
                });

            if (error) throw error;

            showToast('Feedback sent successfully!', 'success');
            setMessage('');
            onClose();
        } catch (error: any) {
            console.error('Error sending feedback:', error);
            showToast(error.message || 'Failed to send feedback.', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-center p-4 border-b border-white/10">
                    <h2 className="text-lg font-semibold text-white">Send Feedback</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>
                <div className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="message" className="text-sm font-medium text-slate-300">Your Message</label>
                            <textarea
                                id="message"
                                rows={4}
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Tell us what you think or report an issue..."
                                required
                                className="w-full bg-slate-800/50 border border-white/10 rounded-md px-4 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-none"
                            />
                        </div>
                        <div className="flex justify-end gap-3 pt-2">
                            <Button type="button" variant="ghost" onClick={onClose} className="text-slate-300 hover:text-white" disabled={loading}>
                                Cancel
                            </Button>
                            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white" disabled={loading}>
                                {loading ? (
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                                ) : (
                                    <Send className="w-4 h-4 mr-2" />
                                )}
                                Submit
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
