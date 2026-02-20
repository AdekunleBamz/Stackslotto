export function formatMicroStxToStx(microstx: number | string, decimals = 6): string {
  const m = typeof microstx === 'string' ? parseInt(microstx, 10) : microstx;
  if (Number.isNaN(m)) return '0';
  const stx = m / Math.pow(10, decimals);
  return stx % 1 === 0 ? stx.toFixed(0) : stx.toFixed(6).replace(/(?:\.0+|(?<=\.[0-9]*?)0+)$/, '');
}

export function formatStxDisplay(microstx: number | string): string {
  const stx = formatMicroStxToStx(microstx);
  return `${stx} STX`;
}

export function shortenAddress(address: string | null, visible = 6): string {
  if (!address) return '';
  if (address.length <= visible * 2) return address;
  return `${address.slice(0, visible)}...${address.slice(-visible)}`;
}

export function copyToClipboard(text: string): Promise<void> {
  if (typeof navigator === 'undefined' || !navigator.clipboard) {
    return Promise.reject(new Error('Clipboard not available'));
  }
  return navigator.clipboard.writeText(text);
}

export async function fetchJson<T = any>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Fetch error: ${res.status} ${text}`);
  }
  return res.json();
}

export function ucfirst(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}
