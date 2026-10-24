'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getPortalAnnouncements, markPortalAnnouncementRead, PortalSessionExpiredError, type PortalAnnouncement } from '../lib/portalApi';
import { useManageStore } from '../store/manageStore';
import { portalLocale, portalText } from '../lib/portalLanguage';
import type { PortalLanguage } from '../store/manageStore';
import { buttonTextColor } from '../lib/companyProfile';

function dateLabel(value: string, language: PortalLanguage) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : new Intl.DateTimeFormat(portalLocale(language), {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Ljubljana',
  }).format(date);
}

export default function Announcements() {
  const slug = useParams()?.slug as string;
  const { customerEmail, theme, language, setAuthenticated, setCurrentView } = useManageStore();
  const t = (sl: string, en: string) => portalText(language, sl, en);
  const [items, setItems] = useState<PortalAnnouncement[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    if (!slug || !customerEmail) return;
    let active = true;
    getPortalAnnouncements(slug, customerEmail).then((data) => {
      if (active) { setItems(data); setError(false); }
    }).catch((cause) => {
      if (!active) return;
      if (cause instanceof PortalSessionExpiredError) {
        setAuthenticated(false); setCurrentView('auth');
      } else setError(true);
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [slug, customerEmail, refresh, setAuthenticated, setCurrentView]);

  const open = (item: PortalAnnouncement) => {
    if (openId === item.id) { setOpenId(null); return; }
    setOpenId(item.id);
    if (item.read_at) return;
    markPortalAnnouncementRead(slug, customerEmail, item.id).then(() => {
      setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, read_at: new Date().toISOString() } : entry));
    }).catch((cause) => {
      if (cause instanceof PortalSessionExpiredError) { setAuthenticated(false); setCurrentView('auth'); }
    });
  };

  const unread = items.filter((item) => !item.read_at).length;
  const visible = showAll ? items : items.slice(0, 3);

  return (
    <section className="mb-9" aria-label={t('Obvestila podjetja', 'Company updates')}>
      <div className="mb-4 flex items-center gap-2">
        <h2 className="text-xs font-medium uppercase tracking-widest text-gray-400">{t('Obvestila', 'Updates')}</h2>
        {unread > 0 && <span className="rounded-full px-2 py-0.5 text-xs font-semibold" style={{ backgroundColor: theme.primaryColor, color: buttonTextColor(theme.primaryColor) }}>{unread} {t('novo', 'new')}</span>}
      </div>
      {loading ? <p className="text-sm text-gray-400">{t('Nalagam obvestila...', 'Loading updates...')}</p> : error ? (
        <div className="flex items-center justify-between gap-3 text-sm text-gray-500">
          <span>{t('Obvestil trenutno ni mogoče naložiti.', 'Updates are temporarily unavailable.')}</span>
          <button type="button" className="underline" onClick={() => { setLoading(true); setRefresh((n) => n + 1); }}>{t('Poskusi znova', 'Try again')}</button>
        </div>
      ) : items.length === 0 ? (
        <p className="rounded-xl border border-gray-100 bg-white p-4 text-sm text-gray-500">{t('Za zdaj ni novih obvestil.', 'There are no updates yet.')}</p>
      ) : (
        <div className="space-y-3">
          {visible.map((item) => (
            <article key={item.id} className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
              <button type="button" onClick={() => open(item)} aria-expanded={openId === item.id}
                className="flex w-full items-start gap-3 p-4 text-left transition-colors hover:bg-gray-50">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: item.read_at ? '#D1D5DB' : theme.primaryColor }} />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-gray-900">{item.title}</span>
                  <span className="mt-1 block text-xs text-gray-500">{dateLabel(item.published_at, language)}</span>
                </span>
                <span className="text-sm text-gray-400">{openId === item.id ? '−' : '+'}</span>
              </button>
              {openId === item.id && (
                <div className="border-t border-gray-100 p-4 pt-3">
                  {item.image_url && (
                    // The server returns a short-lived signed URL after session verification.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.image_url} alt={item.title} className="mb-4 max-h-72 w-full rounded-xl object-cover" />
                  )}
                  <p className="whitespace-pre-wrap break-words text-sm leading-6 text-gray-700">{item.body}</p>
                </div>
              )}
            </article>
          ))}
          {items.length > 3 && (
            <button type="button" onClick={() => setShowAll((value) => !value)} className="text-sm font-medium underline" style={{ color: theme.primaryColor }}>
              {showAll ? t('Prikaži manj', 'Show less') : t(`Prikaži vsa obvestila (${items.length})`, `Show all updates (${items.length})`)}
            </button>
          )}
        </div>
      )}
    </section>
  );
}
