'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getPortalLoyalty, type LoyaltySummary, PortalSessionExpiredError } from '../lib/portalApi';
import { useManageStore } from '../store/manageStore';
import { portalText } from '../lib/portalLanguage';

export default function LoyaltyCard() {
  const slug = useParams()?.slug as string;
  const { customerEmail, theme, language, setAuthenticated, setCurrentView } = useManageStore();
  const t = (sl: string, en: string) => portalText(language, sl, en);
  const [summary, setSummary] = useState<LoyaltySummary | null>(null);
  const [ambiguous, setAmbiguous] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    if (!slug || !customerEmail) return;
    let active = true;
    getPortalLoyalty(slug, customerEmail).then((data) => {
      if (!active) return;
      setSummary(data.loyalty);
      setAmbiguous(data.ambiguous);
      setError(false);
    }).catch((cause) => {
      if (!active) return;
      if (cause instanceof PortalSessionExpiredError) {
        setAuthenticated(false);
        setCurrentView('auth');
      } else {
        setError(true);
      }
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [slug, customerEmail, refresh, setAuthenticated, setCurrentView]);

  const threshold = Math.max(1, summary?.reward_threshold ?? 10);
  const points = summary?.points ?? 0;
  const filled = Math.min(points, threshold);

  return (
    <section className="mb-9 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm" aria-label={t('Kartica zvestobe', 'Loyalty card')}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.17em] text-gray-400">{t('Kartica zvestobe', 'Loyalty card')}</p>
          <h2 className="mt-2 text-lg font-semibold text-gray-900">{t('Vaši obiski in točke', 'Your visits and points')}</h2>
        </div>
        {summary?.enabled && <span className="rounded-full px-3 py-1 text-xs font-medium" style={{ color: theme.primaryColor, backgroundColor: `${theme.primaryColor}14` }}>
          {t('1 obisk = 1 točka', '1 visit = 1 point')}
        </span>}
      </div>

      {loading ? <p className="mt-5 text-sm text-gray-500">{t('Nalagam točke zvestobe...', 'Loading loyalty points...')}</p> : error ? (
        <div className="mt-5 flex items-center justify-between gap-3 text-sm text-gray-500">
          <span>{t('Točk trenutno ni mogoče prikazati.', 'Points are temporarily unavailable.')}</span>
          <button type="button" className="underline" onClick={() => { setLoading(true); setRefresh((n) => n + 1); }}>{t('Poskusi znova', 'Try again')}</button>
        </div>
      ) : ambiguous ? (
        <p className="mt-5 text-sm text-gray-500">{t('Za ta e-naslov je več kartic strank. Za pregled točk se obrnite na podjetje.', 'Several customer cards use this email. Please contact the company to view your points.')}</p>
      ) : !summary ? (
        <p className="mt-5 text-sm text-gray-500">{t('Kartice še ni mogoče povezati z vašim zapisom. Obrnite se na podjetje.', 'We could not match a loyalty card to your account. Please contact the company.')}</p>
      ) : !summary.enabled ? (
        <p className="mt-5 text-sm text-gray-500">{t('Program zvestobe trenutno ni vključen.', 'The loyalty program is not currently active.')}</p>
      ) : (
        <>
          <div className="mt-5 flex gap-6">
            <div><p className="text-3xl font-semibold text-gray-900">{summary.visits}</p><p className="text-xs text-gray-500">{t('opravljenih obiskov', 'completed visits')}</p></div>
            <div className="border-l border-gray-100 pl-6"><p className="text-3xl font-semibold" style={{ color: theme.primaryColor }}>{points}</p><p className="text-xs text-gray-500">{t('razpoložljivih točk', 'available points')}</p></div>
          </div>
          {threshold <= 20 ? (
            <div className="mt-5 grid gap-1.5" style={{ gridTemplateColumns: `repeat(${threshold}, minmax(0, 1fr))` }} aria-label={t(`${filled} od ${threshold} točk za nagrado`, `${filled} of ${threshold} points toward the reward`)}>
              {Array.from({ length: threshold }, (_, index) => (
                <span key={index} className="h-2 rounded-full" style={{ backgroundColor: index < filled ? theme.primaryColor : '#E5E7EB' }} />
              ))}
            </div>
          ) : (
            <div className="mt-5 h-2 overflow-hidden rounded-full bg-gray-200" aria-label={t(`${filled} od ${threshold} točk za nagrado`, `${filled} of ${threshold} points toward the reward`)}>
              <div className="h-full rounded-full" style={{ width: `${filled / threshold * 100}%`, backgroundColor: theme.primaryColor }} />
            </div>
          )}
          <p className="mt-3 text-xs text-gray-500">
            {points >= threshold ? t(`${summary.reward_name} je pripravljena za unovčenje pri podjetju.`, `${summary.reward_name} is ready to redeem with the company.`) : t(`Še ${threshold - points} ${threshold - points === 1 ? 'točka' : 'točk'} do nagrade: ${summary.reward_name}.`, `${threshold - points} more ${threshold - points === 1 ? 'point' : 'points'} until your reward: ${summary.reward_name}.`)}
          </p>
        </>
      )}
    </section>
  );
}
