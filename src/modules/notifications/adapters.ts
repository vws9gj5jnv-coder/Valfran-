import { env } from '@/lib/env';

export interface EmailMessage { to: string; subject: string; text: string; replyTo?: string }
export interface SmsMessage { to: string; text: string }
export type SendResult = { status: 'sent' | 'failed' | 'simulated' | 'disabled'; error?: string };

export interface EmailAdapter { readonly name: string; send(m: EmailMessage): Promise<SendResult> }
export interface SmsAdapter { readonly name: string; send(m: SmsMessage): Promise<SendResult> }

const simulatedEmail: EmailAdapter = { name: 'demo', async send() { return { status: 'simulated' }; } };
const disabledEmail: EmailAdapter = { name: 'none', async send() { return { status: 'disabled' }; } };
const simulatedSms: SmsAdapter = { name: 'demo', async send() { return { status: 'simulated' }; } };
const disabledSms: SmsAdapter = { name: 'none', async send() { return { status: 'disabled' }; } };

async function post(url: string, headers: Record<string, string>, body: unknown): Promise<SendResult> {
  try {
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body), signal: AbortSignal.timeout(10000) });
    if (!res.ok) return { status: 'failed', error: `HTTP ${res.status}` };
    return { status: 'sent' };
  } catch (e) {
    return { status: 'failed', error: (e as Error).message };
  }
}

/** Resend (https://resend.com). Nécessite EMAIL_API_KEY et un domaine d'envoi vérifié. Non testé avec un compte réel. */
const resendEmail: EmailAdapter = {
  name: 'resend',
  send: (m) => post('https://api.resend.com/emails', { Authorization: `Bearer ${env.emailApiKey}` }, { from: env.emailFrom, to: [m.to], subject: m.subject, text: m.text, reply_to: m.replyTo }),
};

/** Brevo (https://brevo.com), e-mail transactionnel. Non testé avec un compte réel. */
const brevoEmail: EmailAdapter = {
  name: 'brevo',
  send: (m) => {
    const match = env.emailFrom.match(/^(.*)<(.+)>$/);
    const sender = match ? { name: match[1].trim(), email: match[2].trim() } : { email: env.emailFrom };
    return post('https://api.brevo.com/v3/smtp/email', { 'api-key': env.emailApiKey }, { sender, to: [{ email: m.to }], subject: m.subject, textContent: m.text, replyTo: m.replyTo ? { email: m.replyTo } : undefined });
  },
};

/** Brevo SMS transactionnel. Non testé avec un compte réel. */
const brevoSms: SmsAdapter = {
  name: 'brevo',
  send: (m) => post('https://api.brevo.com/v3/transactionalSMS/sms', { 'api-key': env.smsApiKey }, { sender: env.smsSender, recipient: m.to.replace(/^0/, '33').replace(/\D/g, ''), content: m.text, type: 'transactional' }),
};

export function getEmailAdapter(): EmailAdapter {
  switch (env.emailProvider) {
    case 'resend': return env.emailApiKey ? resendEmail : disabledEmail;
    case 'brevo': return env.emailApiKey ? brevoEmail : disabledEmail;
    case 'none': return disabledEmail;
    default: return simulatedEmail;
  }
}

export function getSmsAdapter(): SmsAdapter {
  switch (env.smsProvider) {
    case 'brevo': return env.smsApiKey ? brevoSms : disabledSms;
    case 'none': return disabledSms;
    default: return simulatedSms;
  }
}
