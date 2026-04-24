import { createSupabaseServerClient } from '@/lib/supabase/server';
import { formatMoney } from '@/lib/format';
import { ModuleCrud } from '@/components/module-crud';
import { moduleConfigs } from '@/lib/module-config';

type FinanceRow = {
  date?: string | null;
  category?: string | null;
  amount?: number | string | null;
  repasse_value?: number | string | null;
};

function daysFromToday(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

function toDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function sumRows(rows: FinanceRow[], filter: (row: FinanceRow) => boolean, field: 'amount' | 'repasse_value' = 'amount') {
  return rows.filter(filter).reduce((sum, row) => sum + (Number(row[field]) || 0), 0);
}

export async function FinancialDashboard() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from('financial_entries').select('date,category,amount,repasse_value');
  const rows = ((data as FinanceRow[] | null) ?? []);

  const today = new Date();
  const revenue = sumRows(rows, (row) => row.category === 'revenue');
  const expense = sumRows(rows, (row) => row.category === 'expense');
  const repasse = sumRows(rows, () => true, 'repasse_value');

  const forecast = [30, 90, 120].map((days) => {
    const limit = daysFromToday(days);
    const value = sumRows(rows, (row) => {
      const date = toDate(row.date);
      return Boolean(date && date >= today && date <= limit && row.category === 'revenue');
    });
    return { days, value };
  });

  return (
    <>
      <section className="kpi-grid">
        <div className="card kpi-card"><h3>Entradas</h3><strong>{formatMoney(revenue)}</strong></div>
        <div className="card kpi-card"><h3>Despesas</h3><strong>{formatMoney(expense)}</strong></div>
        <div className="card kpi-card"><h3>Resultado</h3><strong>{formatMoney(revenue - expense)}</strong></div>
        <div className="card kpi-card"><h3>Repasse sócios</h3><strong>{formatMoney(repasse)}</strong></div>
      </section>

      <section className="card" style={{ marginBottom: 20 }}>
        <h2 style={{ marginTop: 0 }}>Previsão de entrada</h2>
        <div className="kpi-grid">
          {forecast.map((item) => (
            <div className="card kpi-card" key={item.days}>
              <h3>Próximos {item.days} dias</h3>
              <strong>{formatMoney(item.value)}</strong>
            </div>
          ))}
        </div>
      </section>

      <ModuleCrud config={moduleConfigs.financeiro} />
    </>
  );
}
