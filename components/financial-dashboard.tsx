import { unstable_noStore as noStore } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { formatMoney } from '@/lib/format';
import { ModuleCrud } from '@/components/module-crud';
import { moduleConfigs } from '@/lib/module-config';

function toNumber(value: unknown) {
  const n = Number(value ?? 0);
  return Number.isNaN(n) ? 0 : n;
}

function isActiveContract(contract: any) {
  return (
    contract.active === true ||
    String(contract.status ?? '').toLowerCase() === 'active' ||
    String(contract.status ?? '').toLowerCase() === 'ativo'
  );
}

export async function FinancialDashboard() {
  noStore();

  const supabase = await createSupabaseServerClient();

  const [contractsRes, financialRes, vehiclesRes, investorsRes] = await Promise.all([
    supabase.from('contracts').select('*'),
    supabase.from('financial_entries').select('*'),
    supabase.from('vehicles').select('id, plate, model, brand'),
    supabase.from('investors').select('id, name'),
  ]);

  const contracts = (contractsRes.data ?? []).filter(isActiveContract);
  const financialRows = financialRes.data ?? [];
  const vehicles = vehiclesRes.data ?? [];
  const investors = investorsRes.data ?? [];

  // ── Totais gerais ──
  const totalEntradas = financialRows.reduce((s: number, r: any) => s + toNumber(r.rent_value), 0);
  const totalDespesas = financialRows.reduce((s: number, r: any) => s + toNumber(r.expense_value), 0);
  const resultado = totalEntradas - totalDespesas;

  const repasseSocioTotal = contracts.reduce((s: number, c: any) => {
    return s + toNumber(c.rent_value) * (toNumber(c.repasse_value) / 100);
  }, 0);

  const repasseAdmTotal = contracts.reduce((s: number, c: any) => {
    return s + toNumber(c.rent_value) * (toNumber(c.adm_repasse_value) / 100);
  }, 0);

  // ── Previsão de caixa (baseada nos contratos ativos) ──
  const receitaMensalContratos = contracts.reduce((s: number, c: any) => s + toNumber(c.rent_value), 0);
  const forecast = [
    { label: '30 dias', value: receitaMensalContratos },
    { label: '60 dias', value: receitaMensalContratos * 2 },
    { label: '120 dias', value: receitaMensalContratos * 4 },
  ];

  // ── Breakdown por veículo ──
  const vehicleBreakdown = vehicles.map((v: any) => {
    const vContracts = contracts.filter((c: any) => String(c.vehicle_id) === String(v.id));
    const vFinancial = financialRows.filter((r: any) => String(r.vehicle_id) === String(v.id));

    const aluguel = vContracts.reduce((s: number, c: any) => s + toNumber(c.rent_value), 0);
    const despesas = vFinancial.reduce((s: number, r: any) => s + toNumber(r.expense_value), 0);
    const repasseSocio = vContracts.reduce((s: number, c: any) => {
      return s + toNumber(c.rent_value) * (toNumber(c.repasse_value) / 100);
    }, 0);
    const repasseAdm = vContracts.reduce((s: number, c: any) => {
      return s + toNumber(c.rent_value) * (toNumber(c.adm_repasse_value) / 100);
    }, 0);
    const saldo = aluguel - despesas - repasseSocio - repasseAdm;

    const investorId = vContracts[0]?.investor_id;
    const investor = investors.find((i: any) => String(i.id) === String(investorId));

    return {
      id: v.id,
      label: `${v.plate} · ${v.model}`,
      aluguel,
      despesas,
      repasseSocio,
      repasseAdm,
      saldo,
      socio: investor?.name ?? null,
    };
  }).filter((v: any) => v.aluguel > 0 || v.despesas > 0);

  return (
    <div>
      {/* ── KPIs gerais ── */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 20 }}>
        <div className="card">
          <h3 style={{ color: '#8b949e', margin: '0 0 6px', fontSize: 12, textTransform: 'uppercase' }}>Entradas</h3>
          <strong style={{ fontSize: 24, color: '#3b82f6' }}>{formatMoney(totalEntradas)}</strong>
        </div>
        <div className="card">
          <h3 style={{ color: '#8b949e', margin: '0 0 6px', fontSize: 12, textTransform: 'uppercase' }}>Despesas</h3>
          <strong style={{ fontSize: 24, color: '#f85149' }}>{formatMoney(totalDespesas)}</strong>
        </div>
        <div className="card" style={{ borderLeft: `4px solid ${resultado < 0 ? '#f85149' : '#3fb950'}` }}>
          <h3 style={{ color: '#8b949e', margin: '0 0 6px', fontSize: 12, textTransform: 'uppercase' }}>Resultado</h3>
          <strong style={{ fontSize: 24, color: resultado < 0 ? '#f85149' : '#3fb950' }}>
            {formatMoney(resultado)}
          </strong>
        </div>
        <div className="card">
          <h3 style={{ color: '#8b949e', margin: '0 0 6px', fontSize: 12, textTransform: 'uppercase' }}>Repasse sócios</h3>
          <strong style={{ fontSize: 24, color: '#f0a732' }}>{formatMoney(repasseSocioTotal)}</strong>
        </div>
      </section>

      {/* ── Repasse ADM + Previsão de caixa ── */}
      <section className="card" style={{ marginBottom: 20 }}>
        <h2 style={{ color: '#ffffff', margin: '0 0 16px', fontSize: 16 }}>📊 Previsão de caixa — contratos ativos</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          <div className="card" style={{ background: '#1c2128' }}>
            <h3 style={{ color: '#8b949e', margin: '0 0 6px', fontSize: 12, textTransform: 'uppercase' }}>Repasse ADM</h3>
            <strong style={{ fontSize: 20, color: '#f0a732' }}>{formatMoney(repasseAdmTotal)}</strong>
            <p style={{ color: '#8b949e', fontSize: 11, margin: '4px 0 0' }}>por mês</p>
          </div>
          {forecast.map((item) => (
            <div className="card" key={item.label} style={{ background: '#1c2128' }}>
              <h3 style={{ color: '#8b949e', margin: '0 0 6px', fontSize: 12, textTransform: 'uppercase' }}>
                Próximos {item.label}
              </h3>
              <strong style={{ fontSize: 20, color: '#3b82f6' }}>{formatMoney(item.value)}</strong>
              <p style={{ color: '#8b949e', fontSize: 11, margin: '4px 0 0' }}>receita bruta prevista</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Breakdown por veículo ── */}
      {vehicleBreakdown.length > 0 && (
        <section className="card" style={{ marginBottom: 20 }}>
          <h2 style={{ color: '#ffffff', margin: '0 0 16px', fontSize: 16 }}>🚗 Resultado por veículo</h2>
          <div style={{ display: 'grid', gap: 12 }}>
            {vehicleBreakdown.map((v: any) => (
              <div key={v.id} style={{
                background: '#1c2128',
                border: '1px solid #30363d',
                borderRadius: 12,
                padding: 16,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div>
                    <strong style={{ color: '#ffffff', fontSize: 15 }}>{v.label}</strong>
                    {v.socio && (
                      <span style={{ color: '#f0a732', fontSize: 12, marginLeft: 10 }}>
                        Sócio: {v.socio}
                      </span>
                    )}
                  </div>
                  <span style={{
                    padding: '4px 12px',
                    borderRadius: 999,
                    fontSize: 12,
                    fontWeight: 700,
                    background: v.saldo < 0 ? 'rgba(248,81,73,0.15)' : 'rgba(63,185,80,0.15)',
                    color: v.saldo < 0 ? '#f85149' : '#3fb950',
                    border: `1px solid ${v.saldo < 0 ? '#f85149' : '#3fb950'}`,
                  }}>
                    Saldo: {formatMoney(v.saldo)}
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                  <div>
                    <div style={{ fontSize: 11, color: '#8b949e', marginBottom: 2 }}>Aluguel recebido</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#3b82f6' }}>{formatMoney(v.aluguel)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: '#8b949e', marginBottom: 2 }}>Despesas</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#f85149' }}>{formatMoney(v.despesas)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: '#8b949e', marginBottom: 2 }}>Repasse sócio</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#f0a732' }}>{formatMoney(v.repasseSocio)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: '#8b949e', marginBottom: 2 }}>Repasse ADM</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#f0a732' }}>{formatMoney(v.repasseAdm)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Lançamentos financeiros ── */}
      <ModuleCrud config={moduleConfigs.financeiro} />
    </div>
  );
}