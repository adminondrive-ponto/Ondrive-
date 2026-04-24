import { createSupabaseServerClient } from '@/lib/supabase/server';
import { formatMoney } from '@/lib/format';

async function getCount(table: string) {
  const supabase = await createSupabaseServerClient();
  const { count } = await supabase.from(table).select('*', { count: 'exact', head: true });
  return count ?? 0;
}

async function getFinanceSummary() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from('financial_entries').select('category, amount');
  const rows = data ?? [];
  return rows.reduce(
    (acc: { revenue: number; expense: number }, row: any) => {
      if (row.category === 'revenue') acc.revenue += Number(row.amount) || 0;
      else acc.expense += Number(row.amount) || 0;
      return acc;
    },
    { revenue: 0, expense: 0 },
  );
}

export async function DashboardOverview() {
  const [vehicles, drivers, contracts, fines, inspections, investors, finance] = await Promise.all([
    getCount('vehicles'),
    getCount('drivers'),
    getCount('contracts'),
    getCount('fines'),
    getCount('inspections'),
    getCount('investors'),
    getFinanceSummary(),
  ]);

  return (
    <>
      <section className="card" style={{ marginBottom: 20 }}>
        <h2 style={{ marginTop: 0 }}>Painel operacional</h2>
        <div className="kpi-grid">
          <div className="card kpi-card"><h3>Veículos</h3><strong>{vehicles}</strong></div>
          <div className="card kpi-card"><h3>Motoristas</h3><strong>{drivers}</strong></div>
          <div className="card kpi-card"><h3>Contratos</h3><strong>{contracts}</strong></div>
          <div className="card kpi-card"><h3>Multas</h3><strong>{fines}</strong></div>
          <div className="card kpi-card"><h3>Vistorias</h3><strong>{inspections}</strong></div>
          <div className="card kpi-card"><h3>Sócios</h3><strong>{investors}</strong></div>
        </div>
      </section>

      <section className="card">
        <h2 style={{ marginTop: 0 }}>Painel financeiro</h2>
        <div className="kpi-grid">
          <div className="card kpi-card"><h3>Entradas</h3><strong>{formatMoney(finance.revenue)}</strong></div>
          <div className="card kpi-card"><h3>Despesas</h3><strong>{formatMoney(finance.expense)}</strong></div>
          <div className="card kpi-card"><h3>Resultado</h3><strong>{formatMoney(finance.revenue - finance.expense)}</strong></div>
        </div>
      </section>
    </>
  );
}
