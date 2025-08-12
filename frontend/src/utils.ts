export const noop = () => {};

export function formatBRL(cents?: number | null) {
  if (cents == null) return "—";
  const v = cents / 100;
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function shortDate(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

export function parseBRLtoCents(input: string): number | null {
    if (!input) return null;
    // remove tudo que não for dígito
    const digits = input.replace(/\D+/g, "");
    if (!digits) return null;
    // último 2 = centavos
    const value = parseInt(digits, 10);
    return Number.isNaN(value) ? null : value;
  }
  