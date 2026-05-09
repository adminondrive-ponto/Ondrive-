import { unstable_noStore as noStore } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { formatMoney } from '@/lib/format';
import { ModuleCrud } from '@/components/module-crud';
import { moduleConfigs } from '@/lib/module-config';

type ContractRow = {
  active?: boolean | null;
  status?: string | null;
  rent_value?: number | string | null;
  repasse_value?: number | string | null;
  adm_repasse_value?: number | string | null;
  next_due_date?: string | null;
};

type FinanceRow = {
  rent_value?: number | string | null;
  expense_value?: number | string | null;
};

function toNumber(value: unknown) {
  const number = Number(value ?? 0);
  return Number.isNaN(number) ? 0 : number;
}

function isActiveContract(contract: ContractRow) {
  return (
    contract.active === true ||
    String(contract.status ?? '').toLowerCase() === 'active'
  );
}

export async function FinancialDashboard() {
  noStore();

  const supabase = await createSupabaseServerClient();

  const { data: contractsData } = await supabase
    .from('contracts')
    .select('active,status,rent_value,repasse_value,adm_repasse_value,next_due_date');

  const { data: financialData } = await supabase
    .from('financial_entries')
    .select('rent_value,expense_value');

  const contracts = ((contractsData ?? []) as ContractRow[]).filter(isActiveContract);
  const financialRows = (financialData ?? []) as FinanceRow[];

  const contractRevenue = contracts.reduce((sum, item) => sum + toNumber(item.rent_value), 0);

  const manualRevenue = financialRows.reduce((sum, item) => {
    const rentValue = toNumber(item.rent_value);
    const expenseValue = toNumber(item.expense_value);
    if (expenseValue > 0) return sum;
    return sum + rentValue;
  }, 0);

  const expense = financialRows.reduce((sum, item) => sum + toNumber(item.expense_value), 0);

  const revenue = contractRevenue + manualRevenue;
  const result = revenue - expense;

  const grossRepasseSocio = contracts.reduce((sum, item) => {
    const rent = toNumber(item.rent_value);
    const percent = toNumber(item.repasse_value);
    return sum + rent * (percent / 100);
  }, 0);

  const grossRepasseAdm = contracts.reduce((sum, item) => {
    const rent = toNumber(item.rent_value);
    const percent = toNumber(item.adm_repasse_value);
    return sum + rent * (percent / 100);
  }, 0);

  const totalPercentSocio = revenue > 0 ? grossRepasseSocio / revenue : 0;
  const totalPercentAdm = revenue > 0 ? grossRepasseAdm / revenue : 0;

  const repasseSocio = result * totalPercentSocio;
  const repasseAdm = result * totalPercentAdm;

  const forecast = [
    { days: 30, value: repasseAdm },
    { days: 60, value: repasseAdm + grossRepasseAdm },
    { days: 90, value: repasseAdm + grossRepasseAdm * 2 },
  ];

  return (
    <div>
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 20 }}>
        <div className="card">
          <h3 style={{ color: '#8b949e', margin: '0 0 6px' }}>Entradas</h3>
          <strong style={{ fontSize: 24, color: '#3b82f6' }}>{formatMoney(revenue)}</strong>
        </div>

        <div className="card">
          <h3 style={{ color: '#8b949e', margin: '0 0 6px' }}>Despesas</h3>
          <strong style={{ fontSize: 24, color: '#f85149' }}>{formatMoney(expense)}</strong>
        </div>

        <div className="card" style={{ borderLeft: `4px solid ${result < 0 ? '#f85149' : '#3fb950'}` }}>
          <h3 style={{ color: '#8b949e', margin: '0 0 6px' }}>Resultado</h3>
          <strong style={{ fontSize: 24, color: result < 0 ? '#f85149' : '#3fb950' }}>
            {formatMoney(result)}
          </strong>
        </div>

        <div className="card">
          <h3 style={{ color: '#8b949e', margin: '0 0 6px' }}>Repasse sócios</h3>
          <strong style={{ fontSize: 24, color: '#f0a732' }}>{formatMoney(repasseSocio)}</strong>
        </div>
      </section>

      <section className="card" style={{ marginBottom: 20 }}>
        <h2 style={{ color: '#ffffff', margin: '0 0 16px' }}>Previsão de entrada</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {forecast.map((item) => (
            <div className="card" key={item.days}>
              <h3 style={{ color: '#8b949e', margin: '0 0 6px' }}>Próximos {item.days} dias</h3>
              <strong style={{ fontSize: 20, color: '#f0a732' }}>{formatMoney(item.value)}</strong>
            </div>
          ))}
          <div className="card">
            <h3 style={{ color: '#8b949e', margin: '0 0 6px' }}>Repasse ADM</h3>
            <strong style={{ fontSize: 20, color: '#f0a732' }}>{formatMoney(repasseAdm)}</strong>
          </div>
        </div>
      </section>

      <ModuleCrud config={moduleConfigs.financeiro} />
    </div>
  );
}