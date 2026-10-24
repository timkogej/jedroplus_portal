import type { PortalLanguage } from '../store/manageStore';

export const portalText = (language: PortalLanguage, sl: string, en: string) => language === 'en' ? en : sl;
export const portalLocale = (language: PortalLanguage) => language === 'en' ? 'en-GB' : 'sl-SI';
