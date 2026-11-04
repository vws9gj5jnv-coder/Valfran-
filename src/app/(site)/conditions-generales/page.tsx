import type { Metadata } from 'next';
import { LegalPage, V } from '@/components/layout/LegalPage';
import { getSite } from '@/lib/site';

export const metadata: Metadata = { title: 'Conditions générales de prestation', alternates: { canonical: '/conditions-generales' } };

export default async function Page() {
  const { business: b, pricing } = await getSite();
  return (
    <LegalPage title="Conditions générales de prestation">
      <p className="rounded-sm border border-champagne/60 bg-[#f4efe6] p-4 text-[0.9688rem]"><strong>Modèle à faire valider.</strong> Ce texte est une base de travail. Il doit être relu et complété par l’entreprise, idéalement avec un professionnel du droit, avant toute utilisation commerciale.</p>
      <h2>1. Objet</h2>
      <p>Les présentes conditions régissent les prestations de mécanique automobile réalisées à domicile par <V v={b.legalName} label="dénomination" /> (« le prestataire »).</p>
      <h2>2. Demande et devis</h2>
      <p>Une demande effectuée en ligne ne constitue pas un rendez-vous confirmé. Le prestataire confirme la faisabilité, la date et le montant. Toute intervention fait l’objet d’un devis préalable lorsque la réglementation l’exige ou lorsque le client le demande. Le devis est valable {pricing.quoteValidityDays} jours ; il devient ferme après acceptation par le client.</p>
      <h2>3. Prix</h2>
      <p>Les estimations affichées sur le site sont indicatives. Le prix applicable est celui du devis accepté. {pricing.vatMode === 'franchise' ? 'TVA non applicable, art. 293 B du CGI (si l’entreprise relève de ce régime).' : 'Les prix sont indiqués TTC.'}</p>
      <h2>4. Conditions d’intervention</h2>
      <p>Le client met à disposition un emplacement permettant de travailler en sécurité (sol plat et stable, espace suffisant, autorisation d’intervenir sur le lieu). Si ces conditions ne sont pas réunies, ou en cas d’intempéries rendant l’intervention dangereuse, le rendez-vous peut être reporté.</p>
      <h2>5. Annulation</h2>
      <p><V v="" label="délai et conditions d’annulation / de report, frais éventuels" /></p>
      <h2>6. Paiement</h2>
      <p><V v="" label="moyens et moment du paiement" /></p>
      <h2>7. Garanties</h2>
      <p>Les garanties légales de conformité et des vices cachés s’appliquent. <V v="" label="garantie commerciale éventuelle sur la main-d’œuvre et les pièces" /></p>
      <h2>8. Droit de rétractation</h2>
      <p><V v="" label="modalités de rétractation applicables aux contrats conclus à distance ou hors établissement (art. L.221-18 et suivants du Code de la consommation), et exceptions (prestation pleinement exécutée avec accord exprès, réparations urgentes demandées par le consommateur)" /></p>
      <h2>9. Médiation</h2>
      <p>En cas de litige, le client peut recourir gratuitement au médiateur de la consommation : <V v={b.mediator} label="médiateur" />.</p>
    </LegalPage>
  );
}
