import { getWhatsAppSettings } from '@/lib/integrations';

export type MetaMediaInfo = {
  id: string;
  url: string;
  mime_type?: string;
  sha256?: string;
  file_size?: number;
};

async function requireMeta() {
  const settings = await getWhatsAppSettings();
  if (!settings.accessToken) throw new Error('Token do WhatsApp não configurado.');
  return settings;
}

export async function getMetaMediaInfo(mediaId: string): Promise<MetaMediaInfo> {
  const settings = await requireMeta();
  const response = await fetch(`https://graph.facebook.com/${settings.graphVersion}/${mediaId}`, {
    headers: { Authorization: `Bearer ${settings.accessToken}` },
    cache: 'no-store',
  });

  if (!response.ok) throw new Error(`Falha ao consultar mídia da Meta (${response.status}).`);
  return response.json();
}

export async function downloadMetaMedia(mediaId: string) {
  const settings = await requireMeta();
  const info = await getMetaMediaInfo(mediaId);
  const response = await fetch(info.url, {
    headers: { Authorization: `Bearer ${settings.accessToken}` },
    cache: 'no-store',
  });
  if (!response.ok) throw new Error(`Falha ao baixar mídia da Meta (${response.status}).`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  const mimeType = response.headers.get('content-type') || info.mime_type || 'application/octet-stream';
  return { info, bytes, mimeType };
}

export async function sendWhatsAppText(to: string, body: string) {
  const settings = await requireMeta();
  if (!settings.phoneNumberId) return false;
  const response = await fetch(`https://graph.facebook.com/${settings.graphVersion}/${settings.phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${settings.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ messaging_product: 'whatsapp', to, type: 'text', text: { body } }),
  });
  return response.ok;
}

export async function testWhatsAppConnection() {
  const settings = await requireMeta();
  if (!settings.phoneNumberId) throw new Error('Phone Number ID não configurado.');
  const response = await fetch(`https://graph.facebook.com/${settings.graphVersion}/${settings.phoneNumberId}?fields=display_phone_number,verified_name,status,quality_rating`, {
    headers: { Authorization: `Bearer ${settings.accessToken}` },
    cache: 'no-store',
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.error?.message || `Meta retornou ${response.status}.`);
  return data;
}
