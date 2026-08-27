import crypto from 'node:crypto';
import { db } from '@/lib/db';

function key() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error('AUTH_SECRET não configurado.');
  return crypto.createHash('sha256').update(secret).digest();
}

export function encryptSecret(value: string) {
  if (!value) return null;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key(), iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return ['v1', iv.toString('base64url'), tag.toString('base64url'), encrypted.toString('base64url')].join(':');
}

export function decryptSecret(value?: string | null) {
  if (!value) return '';
  const [version, ivRaw, tagRaw, bodyRaw] = value.split(':');
  if (version !== 'v1' || !ivRaw || !tagRaw || !bodyRaw) return '';
  const decipher = crypto.createDecipheriv('aes-256-gcm', key(), Buffer.from(ivRaw, 'base64url'));
  decipher.setAuthTag(Buffer.from(tagRaw, 'base64url'));
  return Buffer.concat([decipher.update(Buffer.from(bodyRaw, 'base64url')), decipher.final()]).toString('utf8');
}

export async function getWhatsAppSettings() {
  const saved = await db.integrationConfig.findUnique({ where: { provider: 'WHATSAPP' } }).catch(() => null);
  const accessToken = saved?.secretEncrypted ? decryptSecret(saved.secretEncrypted) : (process.env.META_ACCESS_TOKEN || '');
  const verifyToken = saved?.verifyEncrypted ? decryptSecret(saved.verifyEncrypted) : (process.env.META_VERIFY_TOKEN || '');
  return {
    enabled: saved?.enabled ?? Boolean(accessToken && (saved?.phoneNumberId || process.env.META_PHONE_NUMBER_ID)),
    accessToken,
    verifyToken,
    phoneNumberId: saved?.phoneNumberId || process.env.META_PHONE_NUMBER_ID || '',
    businessAccountId: saved?.businessAccountId || process.env.META_WABA_ID || '',
    graphVersion: saved?.graphVersion || process.env.META_GRAPH_VERSION || 'v26.0',
    source: saved ? 'panel' : 'environment',
  };
}

export async function getOpenAISettings() {
  const saved = await db.integrationConfig.findUnique({ where: { provider: 'OPENAI' } }).catch(() => null);
  const apiKey = saved?.secretEncrypted ? decryptSecret(saved.secretEncrypted) : (process.env.OPENAI_API_KEY || '');
  return {
    enabled: saved?.enabled ?? Boolean(apiKey),
    apiKey,
    model: saved?.model || process.env.OPENAI_MODEL || 'gpt-5.6-luna',
    transcribeModel: saved?.transcribeModel || process.env.OPENAI_TRANSCRIBE_MODEL || 'gpt-4o-mini-transcribe',
    source: saved ? 'panel' : 'environment',
  };
}
