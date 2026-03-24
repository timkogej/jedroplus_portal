'use client';

import { Suspense, useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { portalVerify } from '../../manage/[slug]/lib/portalApi';
import { savePortalSession } from '../../manage/[slug]/lib/portalSession';

function VerifyInner() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const slug = params?.slug as string;
  const token = searchParams?.get('token') ?? '';
  const email = searchParams?.get('email') ?? '';

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug || !token || !email) {
      setError('Manjkajoči parametri za preverjanje.');
      return;
    }

    const verify = async () => {
      try {
        await portalVerify(slug, email, token);
        savePortalSession(slug, email);
        router.replace(`/manage/${slug}`);
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : 'Napaka pri preverjanju povezave.';
        setError(msg);
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
          <p className="text-gray-800 mb-4">{error}</p>
          <a
            href={`/manage/${slug}`}
            className="text-sm text-gray-500 underline"
          >
            Nazaj na prijavo
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
      <p className="text-gray-500 text-sm">Preverjam...</p>
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
