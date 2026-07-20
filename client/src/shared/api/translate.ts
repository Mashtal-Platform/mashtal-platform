import { apiPost } from './client';

export async function translateText(text: string, to: 'en' | 'ar') {
  return apiPost<{
    translatedText: string;
    from: string | null;
    to: string;
    translated: boolean;
  }>('/translate', { text, to });
}
