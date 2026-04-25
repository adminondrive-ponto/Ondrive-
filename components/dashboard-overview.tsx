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

function getVehicleStatus(status: string | null) {
  const s = normalize(status);

  if (s.includes('alug')) return 'Alugado';
  if (s.includes('dispon')) return 'Disponível';
  if (s.includes('manut')) return 'Em manutenção';
  if (s.includes('vend')) return 'Vendido por aluguel';

  return status || 'Não informado';
}

function getStatusClass(status: string) {
  const s = normalize(status);

  if (s.includes('dispon') || s.includes('ativo')) return 'green';
  if (s.includes('alug')) return 'blue';
  if (s.includes('vend')) return 'purple';
  if (s.includes('manut') || s.includes('inativo')) return 'orange';

  return 'gray';
}

export default async function DashboardOverview() {
  const supabase = await createSupabaseServerClient();

  const [vehiclesRes, driversRes, investorsRes] = await Promise.all([
    supabase.from('vehicles').select('*'),
    supabase.from('drivers').select('*'),
    supabase.from('investors').select('*'),
  ]);

  const vehicles = vehiclesRes.data || [];
  const drivers = driversRes.data || [];
  const investors = investorsRes.data || [];

  const alugados = vehicles.filter((v) =>
    normalize(v.status).includes('alug')
  ).length;

  const disponiveis = vehicles.filter((v) =>
    normalize(v.status).includes('dispon')
  ).length;

  const manutencao = vehicles.filter((v) =>
    normalize(v.status).includes('manut')
  ).length;

  const vendaAluguel = vehicles.filter((v) =>
    normalize(v.status).includes('vend')
  ).length;

  return (
    <div className="container">
      <h2>Painel operacional</h2>

      <div className="cards">
        <div className="card"><span>Total de veículos</span><strong>{vehicles.length}</strong></div>
        <div className="card"><span>Veículos alugados</span><strong>{alugados}</strong></div>
        <div className="card"><span>Veículos venda por forma de aluguel</span><strong>{vendaAluguel}</strong></div>
        <div className="card"><span>Veículos disponíveis</span><strong>{disponiveis}</strong></div>
        <div className="card"><span>Veículos em manutenção</span><strong>{manutencao}</strong></div>
        <div className="card"><span>Motoristas</span><strong>{drivers.length}</strong></div>
        <div className="card"><span>Sócios</span><strong>{investors.length}</strong></div>
      </div>

      <div className="tables">

        {/* VEICULOS */}
        <div className="table">
          <h3>Veículos</h3>

          <div className="thead">
            <span>Nome</span>
            <span>Status</span>
          </div>

          {vehicles.length === 0 ? (
            <p>Nenhum registro encontrado.</p>
          ) : (
            vehicles.map((v) => {
              const status = getVehicleStatus(v.status);
              return (
                <div className="row" key={v.id}>
                  <span>{v.plate} - {v.model}</span>
                  <span className={`status ${getStatusClass(status)}`}>
                    ● {status}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* SOCIOS */}
        <div className="table">
          <h3>Sócios</h3>

          <div className="thead">
            <span>Nome</span>
            <span>Status</span>
          </div>

          {investors.length === 0 ? (
            <p>Nenhum registro encontrado.</p>
          ) : (
            investors.map((s) => (
              <div className="row" key={s.id}>
                <span>{s.name}</span>
                <span className={`status ${getStatusClass(s.status)}`}>
                  ● {s.status || 'Ativo'}
                </span>
              </div>
            ))
          )}
        </div>

        {/* MOTORISTAS */}
        <div className="table">
          <h3>Motoristas</h3>

          <div className="thead">
            <span>Nome</span>
            <span>Status</span>
          </div>

          {drivers.length === 0 ? (
            <p>Nenhum registro encontrado.</p>
          ) : (
            drivers.map((d) => (
              <div className="row" key={d.id}>
                <span>{d.name}</span>
                <span className={`status ${getStatusClass(d.status)}`}>
                  ● {d.status || 'Ativo'}
                </span>
              </div>
            ))
          )}
        </div>

      </div>

      <style>{`
        .container {
          background: #fff;
          padding: 20px;
          border-radius: 16px;
        }

        h2 {
          margin-bottom: 20px;
        }

        .cards {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 12px;
        }

        .card {
          background: #f8fafc;
          padding: 16px;
          border-radius: 12px;
        }

        .card span {
          font-size: 12px;
          color: #64748b;
        }

        .card strong {
          font-size: 24px;
        }

        .tables {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 16px;
          margin-top: 20px;
        }

        .table {
          background: #f8fafc;
          padding: 16px;
          border-radius: 12px;
        }

        .thead {
          display: flex;
          justify-content: space-between;
          font-weight: bold;
          margin-bottom: 10px;
        }

        .row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
        }

        .status.green { color: green; }
        .status.blue { color: blue; }
        .status.purple { color: purple; }
        .status.orange { color: orange; }
      `}</style>
    </div>
  );
}
