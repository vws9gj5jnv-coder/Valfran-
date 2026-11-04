import Link from 'next/link';
import { asc, desc, eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { faqs, testimonials, realisations, attachments } from '@/db/schema';
import { AdminHeader, Panel } from '@/components/admin/ui';
import { ActionForm } from '@/components/admin/ActionForm';
import { saveBusiness, saveContent, saveFaq, saveTestimonial, saveRealisation } from '@/modules/admin/settings-actions';
import { getSettings, listServices } from '@/modules/settings/repo';

export const metadata = { title: 'Textes et contenus' };
const TABS = [['coordonnees', 'Coordonnées et mentions'], ['textes', 'Textes du site'], ['faq', 'FAQ'], ['realisations', 'Réalisations'], ['avis', 'Avis clients']] as const;

function Input({ name, label, value, hint, area, rows = 3 }: { name: string; label: string; value?: string; hint?: string; area?: boolean; rows?: number }) {
  return <div><label className="field-label" htmlFor={name}>{label}</label>{area ? <textarea id={name} name={name} className="input" rows={rows} defaultValue={value} /> : <input id={name} name={name} className="input" defaultValue={value} />}{hint && <p className="field-hint">{hint}</p>}</div>;
}

export default async function ContentAdmin({ searchParams }: { searchParams: Promise<{ onglet?: string }> }) {
  const tab = (await searchParams).onglet ?? 'coordonnees';
  const s = await getSettings();
  const b = s.business;
  return (
    <>
      <AdminHeader title="Textes et contenus" intro="Tout ce qui s’affiche sur le site public. Les modifications sont visibles en moins d’une minute." />
      <nav aria-label="Rubriques" className="mb-6 flex flex-wrap gap-1.5">
        {TABS.map(([k, l]) => <Link key={k} href={`/admin/contenus?onglet=${k}`} aria-current={tab === k ? 'page' : undefined} className={`inline-flex min-h-[40px] items-center rounded-sm border px-3 text-[0.9375rem] ${tab === k ? 'border-graphite bg-graphite text-paper' : 'border-graphite/15 bg-white'}`}>{l}</Link>)}
      </nav>

      {tab === 'coordonnees' && (
        <Panel>
          <ActionForm action={saveBusiness} className="space-y-8">
            <div className="grid gap-5 md:grid-cols-3">
              <Input name="name" label="Nom commercial" value={b.name} />
              <Input name="phone" label="Téléphone" value={b.phone} hint={b.phoneIsPlaceholder ? 'Numéro fictif (plage réservée ARCEP) : à remplacer.' : undefined} />
              <Input name="email" label="E-mail de contact" value={b.email} />
              <Input name="addressLine" label="Adresse du siège" value={b.addressLine} />
              <Input name="postcode" label="Code postal" value={b.postcode} />
              <Input name="city" label="Commune" value={b.city} />
              <Input name="tagline" label="Signature" value={b.tagline} />
              <Input name="googleBusinessUrl" label="Lien de la fiche Google" value={b.googleBusinessUrl} hint="Adresse commençant par https://" />
            </div>
            <Input name="hours" label="Horaires affichés" area value={b.hours.map((h) => `${h.label} : ${h.value}`).join('\n')} hint="Une ligne par jour ou groupe de jours, au format « Libellé : horaires »." />
            <Input name="qualifications" label="Qualifications vérifiées" area value={b.qualifications.join('\n')} hint="Une par ligne. N’indiquez que des qualifications réelles et justifiables (diplômes, habilitations)." />
            <h2 className="border-t border-graphite/10 pt-6 text-[1.125rem] font-semibold">Mentions légales</h2>
            <div className="grid gap-5 md:grid-cols-3">
              <Input name="legalName" label="Dénomination / nom de l’entrepreneur" value={b.legalName} />
              <Input name="legalForm" label="Forme juridique" value={b.legalForm} />
              <Input name="siret" label="SIRET" value={b.siret} />
              <Input name="registration" label="Immatriculation (RCS / RM)" value={b.registration} />
              <Input name="vatNumber" label="N° de TVA" value={b.vatNumber} />
              <Input name="publicationDirector" label="Directeur de la publication" value={b.publicationDirector} />
              <Input name="hostName" label="Hébergeur" value={b.hostName} />
              <Input name="hostAddress" label="Adresse de l’hébergeur" value={b.hostAddress} />
              <Input name="mediator" label="Médiateur de la consommation" value={b.mediator} />
            </div>
            <Input name="insurance" label="Assurance professionnelle" value={b.insurance} />
          </ActionForm>
        </Panel>
      )}

      {tab === 'textes' && (
        <Panel>
          <ActionForm action={saveContent} className="space-y-5">
            <Input name="heroTitle" label="Accroche de l’accueil" value={s.content.heroTitle} />
            <Input name="heroSubtitle" label="Sous-titre de l’accueil" value={s.content.heroSubtitle} area rows={2} />
            <Input name="bookingIntro" label="Introduction de la prise de rendez-vous" value={s.content.bookingIntro} />
            <Input name="aboutTitle" label="Titre « À propos »" value={s.content.aboutTitle} />
            <Input name="aboutText" label="Texte « À propos »" value={s.content.aboutText} area rows={8} hint="Séparez les paragraphes par une ligne vide." />
            <Input name="realisationsIntro" label="Introduction des réalisations" value={s.content.realisationsIntro} area rows={2} />
          </ActionForm>
        </Panel>
      )}

      {tab === 'faq' && <FaqTab />}

      {tab === 'realisations' && <RealisationsTab />}

      {tab === 'avis' && <AvisTab />}
    </>
  );
}

async function FaqTab() {
  const db = await getDb();
        const list = await db.select().from(faqs).orderBy(asc(faqs.sortOrder));
        return (
          <div className="space-y-4">
            {[...list, null].map((f, i) => (
              <Panel key={f?.id ?? 'new'} title={f ? `Question ${i + 1}` : 'Ajouter une question'}>
                <ActionForm action={saveFaq} resetOnSuccess={!f} className="space-y-3">
                  <input type="hidden" name="id" value={f?.id ?? ''} />
                  <Input name="question" label="Question" value={f?.question} />
                  <Input name="answer" label="Réponse" value={f?.answer} area />
                  <div className="flex flex-wrap items-center gap-5"><label className="flex items-center gap-2">Ordre <input name="sortOrder" type="number" defaultValue={f?.sortOrder ?? list.length} className="input min-h-[40px] w-20" /></label><label className="flex items-center gap-2"><input type="checkbox" name="active" defaultChecked={f?.active ?? true} className="size-5 accent-graphite" /> Affichée</label>{f && <label className="flex items-center gap-2 text-danger"><input type="checkbox" name="delete" className="size-5" /> Supprimer</label>}</div>
                </ActionForm>
              </Panel>
            ))}
          </div>
        );
      }

async function RealisationsTab() {
  const db = await getDb();
        const list = await db.select().from(realisations).orderBy(desc(realisations.createdAt));
        const services = await listServices({ includeInactive: true });
        const photos = await db.select().from(attachments);
        return (
          <div className="space-y-4">
            <p className="text-mute">Uniquement des photographies d’interventions réelles, avec l’accord du client. Évitez les plaques d’immatriculation et visages identifiables.</p>
            {[null, ...list].map((r) => (
              <Panel key={r?.id ?? 'new'} title={r ? r.title : 'Ajouter une réalisation'}>
                <ActionForm action={saveRealisation} resetOnSuccess={!r} className="space-y-3">
                  <input type="hidden" name="id" value={r?.id ?? ''} />
                  <div className="grid gap-3 md:grid-cols-2"><Input name="title" label="Titre" value={r?.title} /><Input name="commune" label="Commune" value={r?.commune} /></div>
                  <Input name="description" label="Description" value={r?.description} area />
                  <div className="grid gap-3 md:grid-cols-3">
                    <div><label className="field-label" htmlFor={`svc-${r?.id}`}>Prestation</label><select id={`svc-${r?.id}`} name="serviceSlug" defaultValue={r?.serviceSlug ?? ''} className="input"><option value="">—</option>{services.map((x) => <option key={x.slug} value={x.slug}>{x.name}</option>)}</select></div>
                    <div><label className="field-label" htmlFor={`date-${r?.id}`}>Date</label><input id={`date-${r?.id}`} name="date" type="date" className="input" defaultValue={r?.date ? r.date.toISOString().slice(0, 10) : ''} /></div>
                    <div><label className="field-label" htmlFor={`photo-${r?.id}`}>Ajouter une photo</label><input id={`photo-${r?.id}`} name="photo" type="file" accept="image/jpeg,image/png,image/webp" className="block w-full pt-3 text-[0.9375rem]" /></div>
                  </div>
                  {r && <p className="text-[0.9375rem] text-mute">{photos.filter((p) => p.realisationId === r.id).length} photo(s)</p>}
                  <div className="flex gap-5"><label className="flex items-center gap-2"><input type="checkbox" name="published" defaultChecked={r?.published} className="size-5 accent-graphite" /> Publiée</label>{r && <label className="flex items-center gap-2 text-danger"><input type="checkbox" name="delete" className="size-5" /> Supprimer</label>}</div>
                </ActionForm>
              </Panel>
            ))}
          </div>
        );
      }

async function AvisTab() {
  const db = await getDb();
        const list = await db.select().from(testimonials);
        void eq;
        return (
          <div className="space-y-4">
            <p className="rounded-sm border border-graphite/15 bg-white p-4">Seuls des avis <strong>authentiques</strong> peuvent être publiés (article L.121-4 du Code de la consommation : publier de faux avis est une pratique commerciale trompeuse). Indiquez leur source (Google, e-mail du client…). La section « Avis » n’apparaît sur le site que si au moins un avis est publié.</p>
            {[null, ...list].map((t) => (
              <Panel key={t?.id ?? 'new'} title={t ? t.author : 'Ajouter un avis'}>
                <ActionForm action={saveTestimonial} resetOnSuccess={!t} className="space-y-3">
                  <input type="hidden" name="id" value={t?.id ?? ''} />
                  <div className="grid gap-3 md:grid-cols-3"><Input name="author" label="Auteur (prénom, initiale)" value={t?.author} /><Input name="source" label="Source" value={t?.source} hint="Ex. : Avis Google" /><Input name="sourceUrl" label="Lien vers l’avis" value={t?.sourceUrl} /></div>
                  <Input name="text" label="Texte exact de l’avis" value={t?.text} area />
                  <div className="flex flex-wrap gap-5"><label className="flex items-center gap-2"><input type="checkbox" name="authentic" className="size-5 accent-graphite" defaultChecked={!!t} /> Je certifie que cet avis est authentique</label><label className="flex items-center gap-2"><input type="checkbox" name="published" defaultChecked={t?.published} className="size-5 accent-graphite" /> Publié</label>{t && <label className="flex items-center gap-2 text-danger"><input type="checkbox" name="delete" className="size-5" /> Supprimer</label>}</div>
                </ActionForm>
              </Panel>
            ))}
          </div>
        );
      }
