/**
 * Genera una huella digital básica pero efectiva del navegador
 * combinando características del hardware y software.
 */
export async function getBrowserFingerprint() {
  const navigator_info = window.navigator;
  const screen_info = window.screen;
  
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
  'dispostable.com', 'sharklasers.com', 'burnchecker.com', 'grr.la'
];

export function isDisposableEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase();
  return DISPOSABLE_EMAIL_DOMAINS.includes(domain);
}
