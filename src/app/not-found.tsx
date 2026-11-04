import Link from 'next/link';
import { Wordmark } from '@/components/ui/Wordmark';

export default function NotFound() {
  return (
    <main className="on-dark grid min-h-svh place-items-center bg-graphite px-5 text-paper">
      <div className="max-w-lg text-center">
        <Link href="/" aria-label="Accueil"><Wordmark /></Link>
        <h1 className="mt-12 text-h1 font-light wide">Page introuvable</h1>
        <p className="mt-4 text-paper/70">Cette page n’existe pas ou a été déplacée.</p>
        <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/" className="btn btn-light">Retour à l’accueil</Link>
          <Link href="/rendez-vous" className="btn btn-outline-light">Prendre rendez-vous</Link>
        </div>
      </div>
    </main>
  );
}
