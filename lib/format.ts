export function formatDate(value?: string | null) {
  if (!value) return '—';
  return new Date(`${value}T12:00:00`).toLocaleDateString('pt-BR');
}

export function formatMoney(value?: number | null) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(value) || 0);
}

export function toLabel(value: unknown) {
  if (value === null || value === undefined || value === '') return '—';
  return String(value);
}
