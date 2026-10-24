export interface CompanyProfile {
  name: string;
  slug: string;
  phone: string;
  email: string;
  address: string;
  website: string | null;
  logoUrl: string | null;
  bookingEnabled: boolean;
}

export interface CompanyTheme {
  primaryColor: string | null;
  secondaryColor: string | null;
  bgFrom: string | null;
  bgTo: string | null;
}

export interface CompanyProfileResponse {
  company: CompanyProfile | null;
  theme: CompanyTheme | null;
}

export async function getCompanyProfile(slug: string): Promise<CompanyProfileResponse> {
  const response = await fetch(`/api/company/${encodeURIComponent(slug)}`);
  if (!response.ok) throw new Error('Podatkov podjetja trenutno ni mogoče naložiti.');
  return (await response.json()) as CompanyProfileResponse;
}

export function bookingUrl(slug: string): string {
  return `https://rezervacije.jedroplus.com/${encodeURIComponent(slug)}`;
}

export function buttonTextColor(hex: string): '#111827' | '#FFFFFF' {
  const value = hex.replace('#', '');
  if (!/^[0-9a-f]{6}$/i.test(value)) return '#FFFFFF';
  const rgb = [0, 2, 4].map((offset) => {
    const channel = parseInt(value.slice(offset, offset + 2), 16) / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  const luminance = rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
  return luminance > 0.179 ? '#111827' : '#FFFFFF';
}
