import { createSupabaseServerClient } from '@/lib/supabase/server';
import { formatMoney } from '@/lib/format';
import { ModuleCrud } from '@/components/module-crud';
import { moduleConfigs } from '@/lib/module-config';

type FinanceRow = {
  date?: string | null;
  rent_value?: number | string | null;
  expense_value?: number | string | null;
  adm_fee?: number | string | null; // % motorista/adm
  repasse_value?: number | string | null; // % sócio
};

function daysFromToday(days: number) {
  const date = new Date();
  date.setHours(23, 59, 59, 999);
  date.setDate(date.getDate() + days);
  return date;
}

function toDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function FinancialDashboard() {
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from('financial_entries')
    .select('date,rent_value,expense_value,adm_fee,repasse_value');

  const rows = (data ?? []) as FinanceRow[];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 🔥 ENTRADAS E DESPESAS
  const revenue = rows.reduce((sum, r) => sum + (Number(r.rent_value) || 0), 0);
  const expense = rows.reduce((sum, r) => sum + (Number(r.expense_value) || 0), 0);

  // 🔥 RESULTADO (LUCRO REAL)
  const result = revenue - expense;

  // 🔥 REPASSE SÓCIO (BASEADO EM %)
  const repasseSocio = rows.reduce((sum, r) => {
    const rent = Number(r.rent_value) || 0;
    const cost = Number(r.expense_value) || 0;
    const percent = Number(r.repasse_value) || 0;

    const lucro = rent - cost;
    return sum + lucro * (percent / 100);
  }, 0);

  // 🔥 REPASSE MOTORISTA/ADM (BASEADO EM %)
  const repasseAdm = rows.reduce((sum, r) => {
    const rent = Number(r.rent_value) || 0;
    const cost = Number(r.expense_value) || 0;
    const percent = Number(r.adm_fee) || 0;

    const lucro = rent - cost;
    return sum + lucro * (percent / 100);
  }, 0);

  // 🔥 PREVISÃO (SÓ ENTRADAS FUTURAS)
  const forecast = [30, 90, 120].map((days) => {
    const limit = daysFromToday(days);

    const value = rows.reduce((sum, r) => {
      const date = toDate(r.date);
      const rent = Number(r.rent_value) || 0;

      if (date && date >= today && date <= limit) {
        return sum + rent;
      }

      return sum;
    }, 0);

    return { days, value };
  });

  return (
    <div>
      {/* 🔥 CARDS */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 16,
          marginBottom: 20,
        }}
      >
        <div className="card"><h3>Entradas</h3><strong>{formatMoney(revenue)}</strong></div>
        <div className="card"><h3>Despesas</h3><strong>{formatMoney(expense)}</strong></div>
       <div
  className="card"
  style={{
    background: result < 0 ? '#fee2e2' : '#ecfdf5',
    color: result < 0 ? '#991b1b' : '#065f46',
  }}
>
  <h3>Resultado</h3>
  <strong>{formatMoney(result)}</strong>
</div>
        <div className="card"><h3>Repasse sócios</h3><strong>{formatMoney(repasseSocio)}</strong></div>
      </section>

      {/* 🔥 PREVISÃO */}
      <section className="card" style={{ marginBottom: 20 }}>
        <h2>Previsão de entrada</h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 16,
          }}
        >
          {forecast.map((item) => (
            <div className="card" key={item.days}>
              <h3>Próximos {item.days} dias</h3>
              <strong>{formatMoney(item.value)}</strong>
            </div>
          ))}

          <div className="card">
            <h3>Repasse ADM</h3>
            <strong>{formatMoney(repasseAdm)}</strong>
          </div>
        </div>
      </section>

      {/* 🔥 FORM + TABELA (já 50/50 pelo outro ajuste) */}
      <ModuleCrud config={moduleConfigs.financeiro} />
    </div>
  );
}