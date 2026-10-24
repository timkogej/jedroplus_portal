'use client';

import { useManageStore } from '../store/manageStore';
import { portalText } from '../lib/portalLanguage';

export default function CompanyContact() {
  const { companyProfile, theme, language } = useManageStore();
  if (!companyProfile) return null;

  const { phone, email, address, website } = companyProfile;
  const phoneHref = phone.replace(/[^+\d]/g, '');
  const links = [
    phone && phoneHref ? { label: portalText(language, 'Pokliči', 'Call'), detail: phone, href: `tel:${phoneHref}` } : null,
    email ? { label: portalText(language, 'Piši', 'Email'), detail: email, href: `mailto:${email}` } : null,
    address ? {
      label: portalText(language, 'Pot do nas', 'Directions'),
      detail: address,
      href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`,
    } : null,
    website ? { label: portalText(language, 'Spletna stran', 'Website'), detail: new URL(website).hostname, href: website } : null,
  ].filter((link): link is { label: string; detail: string; href: string } => link !== null);
  if (links.length === 0) return null;

  return (
    <section className="mt-10 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm" aria-labelledby="contact-title">
      <div className="flex items-center gap-3 mb-5">
        <span className="h-7 w-1 rounded-full" style={{ backgroundColor: theme.primaryColor }} aria-hidden="true" />
        <div>
          <h2 id="contact-title" className="text-base font-medium text-gray-900">{portalText(language, 'Kontakt podjetja', 'Contact the company')}</h2>
          <p className="text-xs text-gray-400 mt-0.5">{portalText(language, 'Tu smo, če nas potrebujete.', 'Get in touch whenever you need us.')}</p>
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {links.map((link) => (
          <a
            key={link.label}
            href={link.href}
            target={link.href.startsWith('https:') ? '_blank' : undefined}
            rel={link.href.startsWith('https:') ? 'noopener noreferrer' : undefined}
            className="group min-w-0 rounded-xl border border-gray-100 bg-gray-50/70 px-4 py-3 transition-colors hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            style={{ outlineColor: theme.primaryColor }}
          >
            <span className="flex items-center justify-between text-sm font-medium text-gray-800">
              {link.label}<span aria-hidden="true" className="text-gray-400 group-hover:text-gray-700">↗</span>
            </span>
            <span className="mt-1 block break-words text-xs text-gray-500">{link.detail}</span>
          </a>
        ))}
      </div>
    </section>
  );
}
