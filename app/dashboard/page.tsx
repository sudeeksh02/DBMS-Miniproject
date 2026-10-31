'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function DashboardRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        if (data.authenticated && data.user) {
          if (data.user.role === 'ADMIN') router.replace('/admin/dashboard');
          else if (data.user.role === 'LAWYER') router.replace('/lawyer/dashboard');
          else router.replace('/client/dashboard');
        } else {
          router.replace('/login');
        }
      } catch (err) {
        router.replace('/login');
      }
    }
    checkAuth();
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400">
      <Loader2 className="w-8 h-8 animate-spin text-amber-500 mb-4" />
      <p className="text-sm">Directing to your authorized workspace...</p>
    </div>
  );
}
