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

function normalizar(valor: string | null | undefined) {
  return String(valor ?? '').toLowerCase();
}

function statusVeiculo(status: string | null | undefined) {
  const s = normalizar(status);

  if (s.includes('available') || s.includes('dispon')) return 'Disponível';
  if (s.includes('rented') || s.includes('alug')) return 'Alugado';
  if (s.includes('maintenance') || s.includes('manut')) return 'Em manutenção';
  if (s.includes('sold') || s.includes('sale') || s.includes('vend')) return 'Vendido por aluguel';

  return status || 'Não informado';
}

function statusPessoa(status: string | null | undefined) {
  const s = normalizar(status);

  if (s.includes('inactive') || s.includes('inativo')) return 'Inativo';
  if (s.includes('active') || s.includes('ativo')) return 'Ativo';

  return 'Ativo';
}

function corStatus(status: string) {
  const s = normalizar(status);

  if (s.includes('dispon') || s.includes('ativo')) return '#22c55e';
  if (s.includes('alug')) return '#2563eb';
  if (s.includes('vend')) return '#7c3aed';
  if (s.includes('manut') || s.includes('inativo')) return '#f59e0b';

  return '#64748b';
}

function Card({ titulo, valor }: { titulo: string; valor: number }) {
  return (
    <div className="card-indicador">
      <span>{titulo}</span>
      <strong>{valor}</strong>
    </div>
  );
}

function ListaVeiculos({ vehicles }: { vehicles: Vehicle[] }) {
  return (
    <div className="lista-card">
      <h3>Veículos</h3>

      <div className="lista-cabecalho">
        <span>Nome</span>
        <span>Status</span>
      </div>

      <div className="lista-corpo">
        {vehicles.length === 0 ? (
          <p className="vazio">Nenhum registro encontrado.</p>
        ) : (
          vehicles.map((v) => {
            const status = statusVeiculo(v.status);

            return (
              <div className="lista-linha" key={v.id}>
                <span>
                  {v.plate || 'Sem placa'} - {[v.brand, v.model].filter(Boolean).join(' ') || 'Veículo'}
                </span>

                <span className="status">
                  <i style={{ backgroundColor: corStatus(status) }} />
                  {status}
                </span>
              </div>
            );
          })
        )}
      </div>

      <div className="lista-rodape">
        <span>Mostrando {vehicles.length} de {vehicles.length}</span>
        <div>
          <button disabled>‹</button>
          <strong>1</strong>
          <button disabled>›</button>
        </div>
      </div>
    </div>
  );
}

function ListaPessoas({
  titulo,
  pessoas,
}: {
  titulo: string;
  pessoas: Person[];
}) {
  return (
    <div className="lista-card">
      <h3>{titulo}</h3>

      <div className="lista-cabecalho">
        <span>Nome</span>
        <span>Status</span>
      </div>

      <div className="lista-corpo">
        {pessoas.length === 0 ? (
          <p className="vazio">Nenhum registro encontrado.</p>
        ) : (
          pessoas.map((p) => {
            const status = statusPessoa(p.status);

            return (
              <div className="lista-linha" key={p.id}>
                <span>{p.name || 'Nome não informado'}</span>

                <span className="status">
                  <i style={{ backgroundColor: corStatus(status) }} />
                  {status}
                </span>
              </div>
            );
          })
        )}
      </div>

      <div className="lista-rodape">
        <span>Mostrando {pessoas.length} de {pessoas.length}</span>
        <div>
          <button disabled>‹</button>
          <strong>1</strong>
          <button disabled>›</button>
        </div>
      </div>
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

  const alugados = vehicles.filter((v) => {
    const s = normalizar(v.status);
    return s.includes('rented') || s.includes('alug');
  }).length;

  const disponiveis = vehicles.filter((v) => {
    const s = normalizar(v.status);
    return s.includes('available') || s.includes('dispon');
  }).length;

  const manutencao = vehicles.filter((v) => {
    const s = normalizar(v.status);
    return s.includes('maintenance') || s.includes('manut');
  }).length;

  const vendaAluguel = vehicles.filter((v) => {
    const s = normalizar(v.status);
    return s.includes('sold') || s.includes('sale') || s.includes('vend');
  }).length;

  return (
    <section className="painel-operacional">
      <h2>Painel operacional</h2>

      <div className="grid-indicadores">
        <Card titulo="Total de veículos" valor={vehicles.length} />
        <Card titulo="Veículos alugados" valor={alugados} />
        <Card titulo="Veículos venda por forma de aluguel" valor={vendaAluguel} />
        <Card titulo="Veículos disponíveis" valor={disponiveis} />
        <Card titulo="Veículos em manutenção" valor={manutencao} />
        <Card titulo="Motoristas" valor={drivers.length} />
        <Card titulo="Sócios" valor={investors.length} />
      </div>

      <div className="divisor" />

      <div className="grid-listas">
        <ListaVeiculos vehicles={vehicles} />
        <ListaPessoas titulo="Sócios" pessoas={investors} />
        <ListaPessoas titulo="Motoristas" pessoas={drivers} />
      </div>

      <style>{`
        .painel-operacional {
          background: #ffffff;
          border-radius: 18px;
          border: 1px solid #e5e7eb;
          padding: 22px;
          box-shadow: 0 18px 45px rgba(15, 23, 42, 0.08);
          width: 100%;
        }

        .painel-operacional h2 {
          margin: 0 0 22px;
          font-size: 28px;
          font-weight: 800;
          color: #020617;
          letter-spacing: -0.03em;
        }

        .grid-indicadores {
          display: grid;
          grid-template-columns: repeat(6, minmax(0, 1fr));
          gap: 16px;
        }

        .card-indicador {
          min-height: 92px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 18px;
          box-shadow: 0 12px 28px rgba(15, 23, 42, 0.05);
        }

        .card-indicador span {
          display: block;
          font-size: 13px;
          font-weight: 700;
          color: #64748b;
          margin-bottom: 12px;
          line-height: 1.35;
        }

        .card-indicador strong {
          display: block;
          font-size: 30px;
          font-weight: 900;
          line-height: 1;
          color: #020617;
        }

        .divisor {
          height: 1px;
          background: #e5e7eb;
          margin: 22px 0;
        }

        .grid-listas {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
        }

        .lista-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 16px;
          box-shadow: 0 12px 28px rgba(15, 23, 42, 0.05);
          min-height: 250px;
        }

        .lista-card h3 {
          margin: 0 0 14px;
          font-size: 20px;
          font-weight: 800;
          color: #020617;
        }

        .lista-cabecalho {
          display: grid;
          grid-template-columns: 1fr 120px;
          gap: 12px;
          padding: 10px 0;
          border-bottom: 1px solid #e5e7eb;
          color: #64748b;
          font-size: 13px;
          font-weight: 800;
        }

        .lista-corpo {
          min-height: 120px;
        }

        .lista-linha {
          display: grid;
          grid-template-columns: 1fr 120px;
          gap: 12px;
          align-items: center;
          padding: 13px 0;
          font-size: 14px;
          color: #020617;
        }

        .status {
          display: flex;
          align-items: center;
          gap: 7px;
          white-space: nowrap;
        }

        .status i {
          width: 8px;
          height: 8px;
          border-radius: 999px;
          display: inline-block;
        }

        .vazio {
          margin: 18px 0;
          color: #64748b;
          font-size: 14px;
          font-weight: 600;
        }

        .lista-rodape {
          border-top: 1px solid #e5e7eb;
          padding-top: 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          color: #64748b;
          font-size: 13px;
        }

        .lista-rodape div {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .lista-rodape button {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
          background: #f8fafc;
          color: #cbd5e1;
        }

        .lista-rodape strong {
          width: 28px;
          height: 32px;
          display: grid;
          place-items: center;
          background: #020617;
          color: white;
          border-radius: 8px;
        }

        @media (max-width: 1300px) {
          .grid-indicadores {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }

        @media (max-width: 900px) {
          .grid-indicadores,
          .grid-listas {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </section>
  );
}
