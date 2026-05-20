/**
 * Genera una huella digital básica pero efectiva del navegador
 * combinando características del hardware y software.
 */
export async function getBrowserFingerprint() {
  const navigator_info = window.navigator;
  const screen_info = window.screen;
  const browserIdKey = "pizza_vote_browser_id";
  let browserId = "";

  try {
    browserId = window.localStorage.getItem(browserIdKey) || "";
    if (!browserId) {
      const bytes = new Uint8Array(16);
      window.crypto.getRandomValues(bytes);
      browserId = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
      window.localStorage.setItem(browserIdKey, browserId);
    }
  } catch {
    browserId = "";
  }
  
  let uid = "";
  
  // 1. Hardware & OS Signals
  uid += navigator_info.userAgent || "";
  uid += navigator_info.language || "";
  uid += navigator_info.platform || "";
  uid += navigator_info.hardwareConcurrency?.toString() || ""; // Number of CPU cores
  
  // 2. Screen & Graphics Signals
  uid += screen_info.height.toString() || "";
  uid += screen_info.width.toString() || "";
  uid += screen_info.colorDepth.toString() || "";
  uid += screen_info.pixelDepth.toString() || "";
  
  // 3. Browser Context Signals
  uid += new Date().getTimezoneOffset().toString(); // Timezone
  uid += (navigator_info.languages || []).join(",");
  uid += (window.devicePixelRatio || 1).toString();
  uid += navigator_info.maxTouchPoints?.toString() || "";
  uid += Intl.DateTimeFormat().resolvedOptions().timeZone || "";
  uid += window.matchMedia?.("(color-gamut: p3)")?.matches ? "p3" : "srgb";
  uid += browserId;

  // Convertimos a un hash robusto usando SHA-256
  const encoder = new TextEncoder();
  const data = encoder.encode(uid);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return hashHex;
}

/**
 * Lista de dominios de correos temporales conocidos para bloquear
 */
export const DISPOSABLE_EMAIL_DOMAINS = [
  'mailinator.com', 'guerrillamail.com', '10minutemail.com', 'temp-mail.org',
  'getnada.com', 'throwawaymail.com', 'yopmail.com', 'maildrop.cc',
  'dispostable.com', 'sharklasers.com', 'burnchecker.com', 'grr.la',
  'tempmail.com', 'throwaway.email', 'trashmail.com', 'fakeinbox.com',
  'guerrillamailblock.com', 'guerrillamail.info', 'guerrillamail.biz',
  'guerrillamail.de', 'guerrillamail.net', 'guerrillamail.org', 'spam4.me',
  'binkmail.com', 'bob.email', 'clrmail.com', 'discard.email', 'filzmail.com',
  'flyspam.com', 'get2mail.fr', 'getonemail.com', 'hatespam.org',
  'inboxclean.com', 'laoeq.com', 'mt2009.com', 'no-spam.ws', 'nobulk.com',
  'noclickemail.com', 'nogmailspam.info', 'nomail2me.com', 'nwldx.com',
  'pecinan.com', 'programmeateur.com', 'proxymail.eu', 'rcpt.at', 'sf-e.ch',
  'smarttalent.pw', 'spamoff.de', 'tempinbox.co.uk', 'tempinbox.com',
  'tempomail.fr', 'temporaryemail.net', 'thanksnospam.info', 'trashdevil.com',
  'trashdevil.de', 'trbvm.com', 'wegwerfadresse.de', 'wegwerfemail.de',
  'wegwerfmail.de', 'wegwerfmail.info', 'wegwerfmail.net', 'wegwerfmail.org',
  'wh4f.org', 'whyspam.me', 'willhackforfood.biz', 'wuzup.net', 'xemaps.com',
  'xent.com', 'xmaily.com', 'xoxy.net'
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SHA_256_HEX_REGEX = /^[a-f0-9]{64}$/;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  const normalized = normalizeEmail(email);
  return normalized.length <= 254 && EMAIL_REGEX.test(normalized);
}

export function isDisposableEmail(email: string): boolean {
  const domain = normalizeEmail(email).split('@')[1];
  return DISPOSABLE_EMAIL_DOMAINS.includes(domain);
}

export function isValidDeviceId(deviceId: string): boolean {
  return SHA_256_HEX_REGEX.test(deviceId);
}
