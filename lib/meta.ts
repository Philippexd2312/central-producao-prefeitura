const META_GRAPH_VERSION = process.env.META_GRAPH_VERSION || 'v26.0';

function requireMetaToken() {
  const token = process.env.META_ACCESS_TOKEN;
  if (!token) throw new Error('META_ACCESS_TOKEN não configurado.');
  return token;
}

export type MetaMediaInfo = {
  id: string;
  url: string;
  mime_type?: string;
  sha256?: string;
  file_size?: number;
};

export async function getMetaMediaInfo(mediaId: string): Promise<MetaMediaInfo> {
  const token = requireMetaToken();
  const response = await fetch(`https://graph.facebook.com/${META_GRAPH_VERSION}/${mediaId}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Falha ao consultar mídia da Meta (${response.status}).`);
  }

  return response.json();
}

export async function downloadMetaMedia(mediaId: string) {
  const token = requireMetaToken();
  const info = await getMetaMediaInfo(mediaId);
  const response = await fetch(info.url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Falha ao baixar mídia da Meta (${response.status}).`);
  }

  const bytes = new Uint8Array(await response.arrayBuffer());
  const mimeType = response.headers.get('content-type') || info.mime_type || 'application/octet-stream';

  return { info, bytes, mimeType };
}

export async function sendWhatsAppText(to: string, body: string) {
  const token = requireMetaToken();
  const phoneNumberId = process.env.META_PHONE_NUMBER_ID;
  if (!phoneNumberId) return false;

  const response = await fetch(`https://graph.facebook.com/${META_GRAPH_VERSION}/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body },
    }),
  });

  return response.ok;
}
