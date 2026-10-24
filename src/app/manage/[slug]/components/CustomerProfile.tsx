'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getPortalProfile, savePortalProfile, PortalProfileConflictError, PortalSessionExpiredError, type PortalProfile } from '../lib/portalApi';
import { buttonTextColor } from '../lib/companyProfile';
import { useManageStore } from '../store/manageStore';
import { portalText } from '../lib/portalLanguage';

export default function CustomerProfile() {
  const slug = useParams()?.slug as string;
  const { customerEmail, theme, language, setCustomerFirstName, setAuthenticated, setCurrentView } = useManageStore();
  const t = (sl: string, en: string) => portalText(language, sl, en);
  const [profile, setProfile] = useState<PortalProfile | null>(null);
  const [draft, setDraft] = useState<PortalProfile | null>(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    if (!slug || !customerEmail) return;
    let active = true;
    getPortalProfile(slug, customerEmail).then((data) => {
      if (active) { setProfile(data); setDraft(data); setMessage(''); }
    }).catch((error) => {
      if (!active) return;
      if (error instanceof PortalSessionExpiredError) {
        setAuthenticated(false); setCurrentView('auth');
      } else if (error instanceof PortalProfileConflictError) {
        setMessage(error.reason === 'ambiguous_customer'
          ? t('Za ta e-naslov je več profilov. Za popravek se obrnite na podjetje.', 'Several profiles use this email. Please contact the company.')
          : t('Profila ni mogoče povezati z vašim e-naslovom. Obrnite se na podjetje.', 'We could not match a profile to your email. Please contact the company.'));
      } else setMessage(t('Profila trenutno ni mogoče naložiti.', 'Your profile could not be loaded.'));
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [slug, customerEmail, refresh, language, setAuthenticated, setCurrentView]);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft || saving) return;
    setSaving(true); setMessage('');
    try {
      const updated = await savePortalProfile(slug, customerEmail, draft);
      setProfile(updated); setDraft(updated); setCustomerFirstName(updated.firstName);
      setEditing(false); setMessage(t('Profil je shranjen.', 'Profile saved.'));
    } catch (error) {
      if (error instanceof PortalSessionExpiredError) {
        setAuthenticated(false); setCurrentView('auth');
      } else setMessage(error instanceof PortalProfileConflictError
        ? t('Profila ni mogoče varno povezati z vašim e-naslovom. Obrnite se na podjetje.', 'We could not safely match your profile. Please contact the company.')
        : t('Shranjevanje ni uspelo. Poskusite znova.', 'Saving failed. Please try again.'));
    } finally { setSaving(false); }
  };

  return (
    <section className="mb-9 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm" aria-labelledby="profile-title">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.17em] text-gray-400">{t('Vaš račun', 'Your account')}</p>
          <h2 id="profile-title" className="mt-2 text-lg font-semibold text-gray-900">{t('Profil in privolitve', 'Profile and consent')}</h2>
        </div>
        {profile && !editing && <button type="button" onClick={() => { setDraft(profile); setMessage(''); setEditing(true); }} className="text-sm font-medium underline" style={{ color: theme.primaryColor }}>{t('Uredi', 'Edit')}</button>}
      </div>
      {loading ? <p className="mt-5 text-sm text-gray-500">{t('Nalagam profil...', 'Loading profile...')}</p> : !profile ? (
        <div className="mt-5 text-sm text-gray-500"><p>{message}</p><button type="button" className="mt-2 underline" onClick={() => { setLoading(true); setRefresh((value) => value + 1); }}>{t('Poskusi znova', 'Try again')}</button></div>
      ) : editing && draft ? (
        <form onSubmit={save} className="mt-5 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm text-gray-600">{t('Ime', 'First name')}<input required maxLength={50} value={draft.firstName} onChange={(event) => setDraft({ ...draft, firstName: event.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-gray-900" /></label>
            <label className="block text-sm text-gray-600">{t('Priimek', 'Last name')}<input maxLength={50} value={draft.lastName} onChange={(event) => setDraft({ ...draft, lastName: event.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-gray-900" /></label>
          </div>
          <label className="block text-sm text-gray-600">{t('Telefon', 'Phone')}<input type="tel" maxLength={20} value={draft.phone} onChange={(event) => setDraft({ ...draft, phone: event.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-gray-900" /></label>
          <p className="text-xs text-gray-500">{t(`E-poštni naslov ${profile.email} se uporablja za prijavo in ga tukaj ni mogoče spremeniti.`, `Your email ${profile.email} is used to sign in and cannot be changed here.`)}</p>
          <label className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3 text-sm text-gray-700">
            <input type="checkbox" checked={draft.marketingConsent} onChange={(event) => setDraft({ ...draft, marketingConsent: event.target.checked })} className="mt-1" />
            <span>{t('Želim prejemati promocijska e-poštna sporočila podjetja. Privolitev lahko kadar koli prekličem tukaj.', 'I want to receive promotional emails from this company. I can withdraw consent here at any time.')}</span>
          </label>
          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="rounded-xl px-5 py-2.5 text-sm font-medium disabled:opacity-60" style={{ backgroundColor: theme.primaryColor, color: buttonTextColor(theme.primaryColor) }}>{saving ? t('Shranjujem...', 'Saving...') : t('Shrani', 'Save')}</button>
            <button type="button" onClick={() => { setEditing(false); setDraft(profile); setMessage(''); }} className="text-sm text-gray-500">{t('Prekliči', 'Cancel')}</button>
          </div>
        </form>
      ) : (
        <div className="mt-5 space-y-2 text-sm text-gray-700">
          <p><span className="text-gray-500">{t('Ime:', 'Name:')}</span> {[profile.firstName, profile.lastName].filter(Boolean).join(' ') || '—'}</p>
          <p className="break-all"><span className="text-gray-500">{t('E-pošta:', 'Email:')}</span> {profile.email}</p>
          <p><span className="text-gray-500">{t('Telefon:', 'Phone:')}</span> {profile.phone || '—'}</p>
          <p><span className="text-gray-500">{t('Promocijska e-pošta:', 'Promotional emails:')}</span> {profile.marketingConsent ? t('Dovoljena', 'Allowed') : t('Ni dovoljena', 'Not allowed')}</p>
        </div>
      )}
      {profile && message && <p role="status" className="mt-4 text-sm text-gray-600">{message}</p>}
    </section>
  );
}
