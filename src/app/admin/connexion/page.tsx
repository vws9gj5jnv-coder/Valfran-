import { redirect } from 'next/navigation';
import { Wordmark } from '@/components/ui/Wordmark';
import { currentAdmin } from '@/modules/auth/session';
import { LoginForm } from './LoginForm';
import { env } from '@/lib/env';
import { DEMO_ADMIN_EMAIL, DEMO_ADMIN_PASSWORD_DEV } from '@/db/demo-data';

export const metadata = { title: 'Connexion' };

export default async function LoginPage() {
  if (await currentAdmin()) redirect('/admin');
  const showDemo = env.demoMode && !env.isProd;
  return (
    <main className="grid min-h-svh lg:grid-cols-2">
      <div className="on-dark hidden flex-col justify-between bg-graphite p-12 text-paper lg:flex">
        <Wordmark />
        <p className="max-w-md text-h2 font-light wide">L’atelier, organisé.</p>
        <p className="text-paper/50">Espace réservé à l’équipe VALFRAN.</p>
      </div>
      <div className="flex items-center justify-center px-5 py-16">
        <div className="w-full max-w-sm">
          <div className="mb-10 lg:hidden"><span className="inline-block rounded-sm bg-graphite p-3"><Wordmark /></span></div>
          <h1 className="text-h2 font-light wide">Connexion</h1>
          <p className="mb-8 mt-2 text-mute">Administration de VALFRAN.</p>
          {showDemo && <p className="mb-6 rounded-sm border border-champagne/60 bg-[#f4efe6] p-4 text-[0.9375rem]">Mode démonstration (développement) : compte <strong>{DEMO_ADMIN_EMAIL}</strong> pré-rempli.</p>}
          <LoginForm demoHint={showDemo ? { email: DEMO_ADMIN_EMAIL, password: DEMO_ADMIN_PASSWORD_DEV } : undefined} />
        </div>
      </div>
    </main>
  );
}
