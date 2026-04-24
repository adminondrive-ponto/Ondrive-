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

  return {
    vehicles: (vehiclesRes.data ?? []) as Vehicle[],
    drivers: (driversRes.data ?? []) as Driver[],
    investors: (investorsRes.data ?? []) as Investor[],
  };
}

function traduzStatus(status?: string | null) {
  if (status === 'rented') return 'Alugado';
  if (status === 'available') return 'Disponível';
  if (status === 'maintenance') return 'Manutenção';
  if (status === 'sold') return 'Vendido';
  return 'Não informado';
}

export async function DashboardOverview() {
  const { vehicles, drivers, investors } = await getDashboardData();

  const veiculosAlugados = vehicles.filter((v) => v.status === 'rented');
  const veiculosDisponiveis = vehicles.filter((v) => v.status === 'available');
  const veiculosManutencao = vehicles.filter((v) => v.status === 'maintenance');

  return (
    <section className="card">
      <h2 style={{ marginTop: 0 }}>Painel operacional</h2>

      <div className="kpi-grid">
        <div className="card kpi-card">
          <h3>Total de veículos</h3>
          <strong>{vehicles.length}</strong>
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
          <strong>{drivers.length}</strong>
        </div>

        <div className="card kpi-card">
          <h3>Sócios</h3>
          <strong>{investors.length}</strong>
        </div>
      </div>

      <div
        style={{
          marginTop: 28,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 20,
          alignItems: 'start',
        }}
      >
        <div>
          <h3>Veículos</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: 10 }}>Marca</th>
                <th style={{ textAlign: 'left', padding: 10 }}>Modelo</th>
                <th style={{ textAlign: 'left', padding: 10 }}>Placa</th>
                <th style={{ textAlign: 'left', padding: 10 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding: 10 }}>
                    Nenhum veículo cadastrado.
                  </td>
                </tr>
              ) : (
                vehicles.map((vehicle) => (
                  <tr key={vehicle.id}>
                    <td style={{ padding: 10 }}>{vehicle.brand || '-'}</td>
                    <td style={{ padding: 10 }}>{vehicle.model || '-'}</td>
                    <td style={{ padding: 10 }}>{vehicle.plate || '-'}</td>
                    <td style={{ padding: 10 }}>{traduzStatus(vehicle.status)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div>
          <h3>Motoristas</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: 10 }}>Nome</th>
              </tr>
            </thead>
            <tbody>
              {drivers.length === 0 ? (
                <tr>
                  <td style={{ padding: 10 }}>Nenhum motorista cadastrado.</td>
                </tr>
              ) : (
                drivers.map((driver) => (
                  <tr key={driver.id}>
                    <td style={{ padding: 10 }}>{driver.name || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <h3 style={{ marginTop: 28 }}>Sócios</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: 10 }}>Nome</th>
              </tr>
            </thead>
            <tbody>
              {investors.length === 0 ? (
                <tr>
                  <td style={{ padding: 10 }}>Nenhum sócio cadastrado.</td>
                </tr>
              ) : (
                investors.map((investor) => (
                  <tr key={investor.id}>
                    <td style={{ padding: 10 }}>{investor.name || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
