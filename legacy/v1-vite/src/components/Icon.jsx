import { BadgeCheck, Circle, CircleDot, Clock, Cog, Cpu, Disc3, Droplets, Eye, FileText, MapPin, ScanLine, ShieldCheck, Wallet, Wrench } from 'lucide-react';

// Table explicite (tree-shaking) : ajouter ici toute icône référencée par nom dans les données.
const ICONS = { BadgeCheck, Circle, CircleDot, Clock, Cog, Cpu, Disc3, Droplets, Eye, FileText, MapPin, ScanLine, ShieldCheck, Wallet, Wrench };

export default function Icon({ name, ...props }) {
  const C = ICONS[name] || Circle;
  return <C aria-hidden="true" {...props} />;
}
