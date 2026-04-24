import { createSupabaseServerClient } from '@/lib/supabase/server';

type Vehicle = {
  id: string;
  plate?: string | null;
  model?: string | null;
  brand?: string | null;
  status?: string | null;
};

type Driver = {
  id: string;
  name?: string | null;
};

type Investor = {
  id: string;
  name?: string | null;
};

async function getDashboardData() {
  const supabase = await createSupabaseServerClient();

  const [vehiclesRes, driversRes, investorsRes] = await Promise.all([
    supabase.from('vehicles').select('id, plate, model, brand, status'),
    supabase.from('drivers').select('id, name'),
    supabase.from('investors').select('id, name'),
  ]);

  const vehicles = (vehiclesRes.data ?? []) as Vehicle[];
  const drivers = (driversRes.data ?? []) as Driver[];
  const investors = (investorsRes.data ?? []) as Investor[];

  return { vehicles, drivers, investors };
}

export async function DashboardOverview() {
  const { vehicles, drivers, investors } = await getDashboardData();

  const veiculosAlugados = vehicles.filter((v) => v.status === 'rented');
  const veiculosDisponiveis = vehicles.filter((v) => v.status === 'available');
  const veiculosManutencao = vehicles.filter((v) => v.status === 'maintenance');

  const totalVeiculos = vehicles.length;
  const totalMotoristas = drivers.length;
  const totalSocios = investors.length;

  function vehicleLabel(vehicle: Vehicle) {
    return [vehicle.brand, vehicle.model, vehicle.plate]
      .filter(Boolean)
      .join(' - ') || 'Veículo sem identificação';
  }

  return (
    <section className="card">
      <h2 style={{ marginTop: 0 }}>Painel operacional</h2>

      <div className="kpi-grid">
        <div className="card kpi-card">
          <h3>Total de veículos</h3>
          <strong>{totalVeiculos}</strong>
        </div>

        <div className="card kpi-card">
          <h3>Veículos alugados</h3>
          <strong>{veiculosAlugados.length}</strong>
        </div>

        <div className="card kpi-card">
          <h3>Veículos disponíveis</h3>
          <strong>{veiculosDisponiveis.length}</strong>
        </div>

        <div className="card kpi-card">
          <h3>Veículos em manutenção</h3>
          <strong>{veiculosManutencao.length}</strong>
        </div>

        <div className="card kpi-card">
          <h3>Motoristas</h3>
          <strong>{totalMotoristas}</strong>
        </div>

        <div className="card kpi-card">
          <h3>Sócios</h3>
          <strong>{totalSocios}</strong>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 16,
          marginTop: 24,
        }}
      >
        <div className="card">
          <h3>Carros alugados</h3>
          {veiculosAlugados.length === 0 ? (
            <p>Nenhum carro alugado.</p>
          ) : (
            <ul>
              {veiculosAlugados.map((vehicle) => (
                <li key={vehicle.id}>{vehicleLabel(vehicle)}</li>
              ))}
            </ul>
          )}
        </div>

        <div className="card">
          <h3>Carros disponíveis</h3>
          {veiculosDisponiveis.length === 0 ? (
            <p>Nenhum carro disponível.</p>
          ) : (
            <ul>
              {veiculosDisponiveis.map((vehicle) => (
                <li key={vehicle.id}>{vehicleLabel(vehicle)}</li>
              ))}
            </ul>
          )}
        </div>

        <div className="card">
          <h3>Sócios</h3>
          {investors.length === 0 ? (
            <p>Nenhum sócio cadastrado.</p>
          ) : (
            <ul>
              {investors.map((investor) => (
                <li key={investor.id}>{investor.name || 'Sócio sem nome'}</li>
              ))}
            </ul>
          )}
        </div>

        <div className="card">
          <h3>Motoristas</h3>
          {drivers.length === 0 ? (
            <p>Nenhum motorista cadastrado.</p>
          ) : (
            <ul>
              {drivers.map((driver) => (
                <li key={driver.id}>{driver.name || 'Motorista sem nome'}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
