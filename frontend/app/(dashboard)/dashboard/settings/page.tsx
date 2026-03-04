'use client';

import { useAuth } from '@/components/AuthProvider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { createClient } from '@/lib/supabase';
import { useToast } from '@/components/ToastProvider';
import { useEffect, useState } from 'react';

export default function SettingsPage() {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [profile, setProfile] = useState({
        fullName: '',
        email: '',
    });

    useEffect(() => {
        async function loadProfile() {
            if (!user) return;
            const supabase = createClient();
            const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();

            if (data) {
                setProfile({
                    fullName: data.full_name || '',
                    email: user.email || '',
                });
            }
        }
        loadProfile();
    }, [user]);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const supabase = createClient();
            const { error } = await supabase.from('profiles').update({
                full_name: profile.fullName
            }).eq('id', user?.id);

            if (error) throw error;
            showToast('Profile updated successfully', 'success');
        } catch (error) {
            console.error(error);
            showToast('Failed to update profile', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground">Manage your account and preferences.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Profile Information</CardTitle>
                    <CardDescription>Update your personal details.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleUpdate} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Email Address</label>
                            <Input type="email" value={profile.email} disabled className="bg-muted cursor-not-allowed" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Full Name</label>
                            <Input
                                type="text"
                                value={profile.fullName}
                                onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                            />
                        </div>
                        <Button type="submit" loading={loading}>Save Changes</Button>
                    </form>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-red-500">Danger Zone</CardTitle>
                    <CardDescription>Irreversible account actions.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button variant="danger" type="button" onClick={() => showToast('Feature disabled for MVP', 'info')}>
                        Delete Account
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
