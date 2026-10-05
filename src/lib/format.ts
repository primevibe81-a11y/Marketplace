export function formatRupiah(n: number | null | undefined): string | null {
  if (n === null || n === undefined) return null;
  if (n < 0 || !Number.isInteger(n)) return null; // Reject negative and decimal

  return `Rp ${n.toLocaleString('id-ID', { maximumFractionDigits: 0 }).replace(/,/g, '.')}`;
}

export function parseRupiah(s: string | null | undefined): number | null {
  if (!s || s.trim() === '') return null;

  // Reject negative and decimal markers
  if (s.includes('-') || s.includes(',')) return null;

  const cleaned = s.replace(/[^0-9]/g, '');
  if (cleaned === '') return null;

  const num = parseInt(cleaned, 10);
  if (isNaN(num)) return null;

  return num;
}
