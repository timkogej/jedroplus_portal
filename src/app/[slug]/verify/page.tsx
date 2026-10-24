'use client';

import { Suspense, useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { portalVerify } from '../../manage/[slug]/lib/portalApi';
import { savePortalSession } from '../../manage/[slug]/lib/portalSession';
import { portalText } from '../../manage/[slug]/lib/portalLanguage';
import { useManageStore } from '../../manage/[slug]/store/manageStore';

function VerifyInner() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const slug = params?.slug as string;
  const token = searchParams?.get('token') ?? '';
  const email = searchParams?.get('email') ?? '';

  const [error, setError] = useState<'missing' | 'failed' | null>(null);
  const { language, setLanguage } = useManageStore();

  useEffect(() => {
    try { if (localStorage.getItem('portal_language') === 'en') setLanguage('en'); } catch { /* unavailable */ }
  }, [setLanguage]);
  useEffect(() => { document.documentElement.lang = language; }, [language]);

  useEffect(() => {
    if (!slug || !token || !email) {
      setError('missing');
      return;
    }

    const verify = async () => {
      try {
        const data = await portalVerify(slug, email, token);
        savePortalSession(slug, email, data.session_token);
        router.replace(`/manage/${slug}`);
      } catch {
        setError('failed');
      }
    };

    verify();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) {
    return (
      <div
        className="min-h-screen bg-[#FAFAFA] flex items-center justify-center"
        style={{ fontFamily: "var(--font-inter, 'Inter', -apple-system, sans-serif)" }}
      >
        <div className="max-w-md w-full px-5 text-center">
          <p className="text-gray-800 mb-4">{error === 'missing'
            ? portalText(language, 'Povezava za prijavo ni popolna.', 'The sign-in link is incomplete.')
            : portalText(language, 'Povezave ni bilo mogoče preveriti.', 'The sign-in link could not be verified.')}</p>
          <a
            href={`/manage/${slug}`}
            className="text-sm text-gray-500 underline"
          >
            {portalText(language, 'Nazaj na prijavo', 'Back to sign in')}
          </a>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-[#FAFAFA] flex items-center justify-center"
      style={{ fontFamily: "var(--font-inter, 'Inter', -apple-system, sans-serif)" }}
    >
      <p className="text-gray-500 text-sm">{portalText(language, 'Preverjam...', 'Verifying...')}</p>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense>
      <VerifyInner />
    </Suspense>
  );
}
