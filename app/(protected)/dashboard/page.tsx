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
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function statusLabel(status: string | null | undefined) {
  const s = normalize(status);

  if (s.includes('vend') && s.includes('alug')) return 'Vendido por aluguel';
  if (s.includes('alug')) return 'Alugado';
  if (s.includes('dispon')) return 'Disponível';
  if (s.includes('manut')) return 'Em manutenção';
  if (s.includes('ativo')) return 'Ativo';
  if (s.includes('inativo')) return 'Inativo';

  return status || 'Não informado';
}

function statusClass(status: string | null | undefined) {
  const s = normalize(status);

  if (s.includes('dispon') || s.includes('ativo')) return 'ok';
  if (s.includes('alug')) return 'info';
  if (s.includes('vend')) return 'purple';
  if (s.includes('manut') || s.includes('inativo')) return 'warn';

  return 'neutral';
}

function Card({
  title,
  value,
}: {
  title: string;
  value: number;
}) {
  return (
    <div className="metric-card">
      <span>{title}</span>
      <strong>{value}</strong>
    </div>
  );
}

function ListBox({
  title,
  items,
  type,
}: {
  title: string;
  items: Array<Vehicle | Person>;
  type: 'vehicles' | 'people';
}) {
  return (
    <div className="list-box">
      <h3>{title}</h3>

      <div className="list-content">
        {items.length === 0 ? (
          <p className="empty">Nenhum registro encontrado.</p>
        ) : (
          items.map((item) => {
            const isVehicle = type === 'vehicles';
            const vehicle = item as Vehicle;
            const person = item as Person;

            const mainText = isVehicle
              ? `${vehicle.brand || ''} ${vehicle.model || ''}`.trim() || 'Veículo sem nome'
              : person.name || 'Nome não informado';

            const secondText = isVehicle
              ? vehicle.plate || 'Placa não informada'
              : statusLabel(person.status);

            const currentStatus = isVehicle ? vehicle.status : person.status;

            return (
              <div className="list-item" key={item.id}>
                <div>
                  <strong>{mainText}</strong>
                  <small>{secondText}</small>
                </div>

                <span className={`badge ${statusClass(currentStatus)}`}>
                  {statusLabel(currentStatus)}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default async function DashboardOverview() {
  const supabase = await createSupabaseServerClient();

  const [vehiclesRes, driversRes, investorsRes] = await Promise.all([
    supabase
      .from('vehicles')
      .select('id, plate, model, brand, status')
      .order('created_at', { ascending: false }),

    supabase
      .from('drivers')
      .select('id, name, status')
      .order('created_at', { ascending: false }),

    supabase
      .from('investors')
      .select('id, name, status')
      .order('created_at', { ascending: false }),
  ]);

  const vehicles = (vehiclesRes.data ?? []) as Vehicle[];
  const drivers = (driversRes.data ?? []) as Person[];
  const investors = (investorsRes.data ?? []) as Person[];

  const rentedVehicles = vehicles.filter((v) =>
    normalize(v.status).includes('alug'),
  ).length;

  const availableVehicles = vehicles.filter((v) =>
    normalize(v.status).includes('dispon'),
  ).length;

  const maintenanceVehicles = vehicles.filter((v) =>
    normalize(v.status).includes('manut'),
  ).length;

  const soldByRentalVehicles = vehicles.filter((v) => {
    const status = normalize(v.status);
    return status.includes('vend') && status.includes('alug');
  }).length;

  return (
    <section className="dashboard">
      <h2>Painel operacional</h2>

      <div className="metrics-grid">
        <Card title="Total de veículos" value={vehicles.length} />
        <Card title="Veículos alugados" value={rentedVehicles} />
        <Card title="Veículos disponíveis" value={availableVehicles} />
        <Card title="Venda por forma de aluguel" value={soldByRentalVehicles} />
        <Card title="Veículos em manutenção" value={maintenanceVehicles} />
        <Card title="Motoristas" value={drivers.length} />
        <Card title="Sócios" value={investors.length} />
      </div>

      <div className="lists-grid">
        <ListBox title="Veículos" items={vehicles} type="vehicles" />
        <ListBox title="Sócios" items={investors} type="people" />
        <ListBox title="Motoristas" items={drivers} type="people" />
      </div>

      <style>{`
        .dashboard {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 18px;
          padding: 24px;
          box-shadow: 0 18px 45px rgba(15, 23, 42, 0.08);
        }

        .dashboard h2 {
          margin: 0 0 22px;
          font-size: 28px;
          font-weight: 800;
          color: #020617;
          letter-spacing: -0.03em;
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(5, minmax(180px, 1fr));
          gap: 16px;
          margin-bottom: 22px;
        }

        .metric-card {
          min-height: 92px;
          border: 1px solid #e2e8f0;
          border-radius: 18px;
          padding: 20px;
          background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
          box-shadow: 0 12px 28px rgba(15, 23, 42, 0.06);
        }

        .metric-card span {
          display: block;
          font-size: 14px;
          font-weight: 700;
          color: #64748b;
          margin-bottom: 12px;
        }

        .metric-card strong {
          display: block;
          font-size: 34px;
          line-height: 1;
          color: #020617;
          font-weight: 900;
        }

        .lists-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
        }

        .list-box {
          border: 1px solid #e2e8f0;
          border-radius: 18px;
          background: #ffffff;
          box-shadow: 0 12px 28px rgba(15, 23, 42, 0.06);
          overflow: hidden;
        }

        .list-box h3 {
          margin: 0;
          padding: 18px 18px 12px;
          font-size: 18px;
          font-weight: 800;
          color: #020617;
          border-bottom: 1px solid #eef2f7;
        }

        .list-content {
          padding: 10px;
          max-height: 340px;
          overflow-y: auto;
        }

        .list-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 12px;
          border-radius: 14px;
          background: #f8fafc;
          margin-bottom: 10px;
          border: 1px solid #eef2f7;
        }

        .list-item strong {
          display: block;
          font-size: 14px;
          font-weight: 800;
          color: #0f172a;
          margin-bottom: 4px;
        }

        .list-item small {
          display: block;
          font-size: 12px;
          font-weight: 600;
          color: #64748b;
        }

        .badge {
          flex-shrink: 0;
          padding: 6px 10px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 800;
          white-space: nowrap;
        }

        .badge.ok {
          color: #166534;
          background: #dcfce7;
        }

        .badge.info {
          color: #1d4ed8;
          background: #dbeafe;
        }

        .badge.purple {
          color: #6d28d9;
          background: #ede9fe;
        }

        .badge.warn {
          color: #92400e;
          background: #fef3c7;
        }

        .badge.neutral {
          color: #475569;
          background: #e2e8f0;
        }

        .empty {
          margin: 0;
          padding: 16px;
          color: #64748b;
          font-size: 14px;
          font-weight: 600;
        }

        @media (max-width: 1300px) {
          .metrics-grid {
            grid-template-columns: repeat(3, minmax(180px, 1fr));
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
