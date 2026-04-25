import { createSupabaseServerClient } from '@/lib/supabase/server';

type Vehicle = {
  id: string;
  plate: string | null;
  model: string | null;
  brand: string | null;
  status: string | null;
};

type Person = {
  id: string;
  name: string | null;
  status: string | null;
};

function normalize(value: string | null | undefined) {
  return String(value ?? '').toLowerCase();
}

function statusVeiculo(status: string | null) {
  const s = normalize(status);

  if (s.includes('rent') || s.includes('alug')) return 'Alugado';
  if (s.includes('available') || s.includes('dispon')) return 'Disponível';
  if (s.includes('maintenance') || s.includes('manut')) return 'Em manutenção';
  if (s.includes('sale') || s.includes('vend')) return 'Vendido por aluguel';

  return status || 'Não informado';
}

function statusPessoa(status: string | null) {
  const s = normalize(status);

  if (s.includes('inactive') || s.includes('inativo')) return 'Inativo';
  if (s.includes('active') || s.includes('ativo')) return 'Ativo';

  return status || 'Ativo';
}

function dotColor(status: string) {
  const s = normalize(status);

  if (s.includes('dispon') || s.includes('ativo')) return '#22c55e';
  if (s.includes('alug')) return '#2563eb';
  if (s.includes('vend')) return '#7c3aed';
  if (s.includes('manut') || s.includes('inativo')) return '#f59e0b';

  return '#64748b';
}

function Card({ title, value }: { title: string; value: number }) {
  return (
    <div className="metric-card">
      <span>{title}</span>
      <strong>{value}</strong>
    </div>
  );
}

export default async function DashboardOverview() {
  const supabase = await createSupabaseServerClient();

  const [vehiclesRes, driversRes, investorsRes] = await Promise.all([
    supabase.from('vehicles').select('id, plate, model, brand, status'),
    supabase.from('drivers').select('id, name, status'),
    supabase.from('investors').select('id, name, status'),
  ]);

  const vehicles = (vehiclesRes.data ?? []) as Vehicle[];
  const drivers = (driversRes.data ?? []) as Person[];
  const investors = (investorsRes.data ?? []) as Person[];

  const alugados = vehicles.filter((v) => normalize(v.status).includes('rent') || normalize(v.status).includes('alug')).length;
  const disponiveis = vehicles.filter((v) => normalize(v.status).includes('available') || normalize(v.status).includes('dispon')).length;
  const manutencao = vehicles.filter((v) => normalize(v.status).includes('maintenance') || normalize(v.status).includes('manut')).length;
  const vendaAluguel = vehicles.filter((v) => normalize(v.status).includes('sale') || normalize(v.status).includes('vend')).length;

  return (
    <section className="dashboard-box">
      <h2>Painel operacional</h2>

      <div className="metrics-grid">
        <Card title="Total de veículos" value={vehicles.length} />
        <Card title="Veículos alugados" value={alugados} />
        <Card title="Veículos venda por forma de aluguel" value={vendaAluguel} />
        <Card title="Veículos disponíveis" value={disponiveis} />
        <Card title="Veículos em manutenção" value={manutencao} />
        <Card title="Motoristas" value={drivers.length} />
        <Card title="Sócios" value={investors.length} />
      </div>

      <div className="divider" />

      <div className="lists-grid">
        <div className="list-card">
          <h3>Veículos</h3>
          <div className="head">
            <span>Nome</span>
            <span>Status</span>
          </div>

          {vehicles.map((v) => {
            const label = statusVeiculo(v.status);

            return (
              <div className="row" key={v.id}>
                <span>{v.plate || 'Sem placa'} - {[v.brand, v.model].filter(Boolean).join(' ')}</span>
                <span className="status">
                  <i style={{ background: dotColor(label) }} />
                  {label}
                </span>
              </div>
            );
          })}
        </div>

        <div className="list-card">
          <h3>Sócios</h3>
          <div className="head">
            <span>Nome</span>
            <span>Status</span>
          </div>

          {investors.length === 0 ? (
            <p className="empty">Nenhum registro encontrado.</p>
          ) : (
            investors.map((s) => {
              const label = statusPessoa(s.status);

              return (
                <div className="row" key={s.id}>
                  <span>{s.name || 'Nome não informado'}</span>
                  <span className="status">
                    <i style={{ background: dotColor(label) }} />
                    {label}
                  </span>
                </div>
              );
            })
          )}
        </div>

        <div className="list-card">
          <h3>Motoristas</h3>
          <div className="head">
            <span>Nome</span>
            <span>Status</span>
          </div>

          {drivers.map((d) => {
            const label = statusPessoa(d.status);

            return (
              <div className="row" key={d.id}>
                <span>{d.name || 'Nome não informado'}</span>
                <span className="status">
                  <i style={{ background: dotColor(label) }} />
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        .dashboard-box {
          background: #fff;
          border-radius: 18px;
          padding: 22px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 18px 45px rgba(15, 23, 42, 0.08);
        }

        .dashboard-box h2 {
          margin: 0 0 22px;
          font-size: 28px;
          font-weight: 800;
          color: #020617;
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(6, minmax(0, 1fr));
          gap: 16px;
        }

        .metric-card {
          min-height: 92px;
          border: 1px solid #e2e8f0;
          border-radius: 18px;
          padding: 20px;
          background: #fff;
        }

        .metric-card span {
          display: block;
          font-size: 14px;
          font-weight: 700;
          color: #64748b;
          margin-bottom: 12px;
        }

        .metric-card strong {
          font-size: 32px;
          font-weight: 900;
          color: #020617;
        }

        .divider {
          height: 1px;
          background: #e5e7eb;
          margin: 22px 0;
        }

        .lists-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }

        .list-card {
          border: 1px solid #e2e8f0;
          border-radius: 18px;
          padding: 18px;
          background: #fff;
        }

        .list-card h3 {
          margin: 0 0 14px;
          font-size: 22px;
          font-weight: 800;
        }

        .head,
        .row {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 12px;
          align-items: center;
        }

        .head {
          padding: 10px 0;
          border-bottom: 1px solid #e5e7eb;
          font-size: 14px;
          font-weight: 800;
          color: #64748b;
        }

        .row {
          padding: 12px 0;
          font-size: 15px;
          color: #020617;
        }

        .status {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          white-space: nowrap;
        }

        .status i {
          width: 10px;
          height: 10px;
          border-radius: 999px;
          display: inline-block;
        }

        .empty {
          color: #64748b;
          font-weight: 600;
          font-size: 14px;
        }

        @media (max-width: 1200px) {
          .metrics-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        @media (max-width: 900px) {
          .metrics-grid,
          .lists-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </section>
  );
}
