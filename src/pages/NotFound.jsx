import { Link } from 'react-router-dom';
import { useMeta } from '../hooks/useMeta';

export default function NotFound() {
  useMeta('Page introuvable — Valfran Mécanique');
  return (
    <section className="grid min-h-[70vh] place-items-center px-4 pt-24 text-center">
      <div>
        <div className="chrome-text font-display text-8xl font-bold">404</div>
        <p className="mt-4 text-chrome-300">Cette page est en panne… mais nous savons réparer.</p>
        <Link to="/" className="btn-primary mt-6">Retour à l'accueil</Link>
      </div>
    </section>
  );
}
