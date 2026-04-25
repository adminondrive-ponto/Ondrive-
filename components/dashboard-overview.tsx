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

type Contract = {
  id: string;
  contract_kind?: string | null;
  vehicle_id?: string | null;
  status?: string | null;
};

export default async function DashboardOverview() {
  const supabase = await createSupabaseServerClient();

  const [vehiclesRes, driversRes, investorsRes, contractsRes] = await Promise.all([
    supabase.from('vehicles').select('id, plate, model, brand, status'),
    supabase.from('drivers').select('id, name'),
    supabase.from('investors').select('id, name'),
    supabase.from('contracts').select('id, contract_kind, vehicle_id, status'),
  ]);

  const vehicles = (vehiclesRes.data ?? []) as Vehicle[];
  const drivers = (driversRes.data ?? []) as Driver[];
  const investors = (investorsRes.data ?? []) as Investor[];
  const contracts = (contractsRes.data ?? []) as Contract[];

  const totalVehicles = vehicles.length;
  const rentedVehicles = vehicles.filter((v) => v.status === 'rented').length;
  const availableVehicles = vehicles.filter((v) => v.status === 'available').length;
  const maintenanceVehicles = vehicles.filter((v) => v.status === 'maintenance').length;
  const soldRentVehicles = contracts.filter(
    (c) => c.contract_kind === 'venda_aluguel' && c.status !== 'inactive',
  ).length;

  const cardStyle = {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: 18,
    padding: 22,
    boxShadow: '0 10px 25px rgba(15, 23, 42, 0.06)',
  };

  return (
    <section
      style={{
        background: '#ffffff',
        borderRadius: 22,
        padding: 28,
        border: '1px solid #e2e8f0',
        boxShadow: '0 18px 45px rgba(15, 23, 42, 0.08)',
      }}
    >
      <div style={{ marginBottom: 26 }}>
        <h2
          style={{
            margin: 0,
            fontSize: 28,
            fontWeight: 800,
            color: '#0f172a',
            letterSpacing: '-0.03em',
          }}
        >
          Painel operacional
        </h2>

        <p
          style={{
            marginTop: 8,
            marginBottom: 0,
            fontSize: 15,
            color: '#64748b',
          }}
        >
          Visão geral da frota, motoristas e sócios cadastrados.
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 18,
          marginBottom: 34,
        }}
      >
        <div style={cardStyle}>
          <span style={{ color: '#64748b', fontSize: 14, fontWeight: 700 }}>
            Total de veículos
          </span>
          <strong style={{ display: 'block', marginTop: 12, fontSize: 34 }}>
            {totalVehicles}
          </strong>
        </div>

        <div style={cardStyle}>
          <span style={{ color: '#64748b', fontSize: 14, fontWeight: 700 }}>
            Veículos alugados
          </span>
          <strong style={{ display: 'block', marginTop: 12, fontSize: 34 }}>
            {rentedVehicles}
          </strong>
        </div>

        <div style={cardStyle}>
          <span style={{ color: '#64748b', fontSize: 14, fontWeight: 700 }}>
            Veículos disponíveis
          </span>
          <strong style={{ display: 'block', marginTop: 12, fontSize: 34 }}>
            {availableVehicles}
          </strong>
        </div>

        <div style={cardStyle}>
          <span style={{ color: '#64748b', fontSize: 14, fontWeight: 700 }}>
            Veículos em manutenção
          </span>
          <strong style={{ display: 'block', marginTop: 12, fontSize: 34 }}>
            {maintenanceVehicles}
          </strong>
        </div>

        <div style={cardStyle}>
          <span style={{ color: '#64748b', fontSize: 14, fontWeight: 700 }}>
            Venda em forma de aluguel
          </span>
          <strong style={{ display: 'block', marginTop: 12, fontSize: 34 }}>
            {soldRentVehicles}
          </strong>
        </div>

        <div style={cardStyle}>
          <span style={{ color: '#64748b', fontSize: 14, fontWeight: 700 }}>
            Motoristas
          </span>
          <strong style={{ display: 'block', marginTop: 12, fontSize: 34 }}>
            {drivers.length}
          </strong>
        </div>

        <div style={cardStyle}>
          <span style={{ color: '#64748b', fontSize: 14, fontWeight: 700 }}>
            Sócios
          </span>
          <strong style={{ display: 'block', marginTop: 12, fontSize: 34 }}>
            {investors.length}
          </strong>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
          gap: 20,
        }}
      >
        <div style={cardStyle}>
          <h3 style={{ marginTop: 0, fontSize: 20, fontWeight: 800 }}>Veículos</h3>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ color: '#64748b', textAlign: 'left' }}>
                <th style={{ padding: '10px 0', borderBottom: '1px solid #e2e8f0' }}>
                  Veículo
                </th>
                <th style={{ padding: '10px 0', borderBottom: '1px solid #e2e8f0' }}>
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {vehicles.length === 0 ? (
                <tr>
                  <td colSpan={2} style={{ padding: '14px 0', color: '#64748b' }}>
                    Nenhum veículo cadastrado.
                  </td>
                </tr>
              ) : (
                vehicles.map((vehicle) => (
                  <tr key={vehicle.id}>
                    <td style={{ padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
                      <strong>{vehicle.plate || '-'}</strong>
                      <br />
                      <span style={{ color: '#64748b' }}>
                        {vehicle.brand || ''} {vehicle.model || ''}
                      </span>
                    </td>
                    <td style={{ padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
                      {vehicle.status === 'available'
                        ? 'Disponível'
                        : vehicle.status === 'rented'
                          ? 'Alugado'
                          : vehicle.status === 'maintenance'
                            ? 'Manutenção'
                            : vehicle.status === 'sold'
                              ? 'Vendido'
                              : vehicle.status || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div style={cardStyle}>
          <h3 style={{ marginTop: 0, fontSize: 20, fontWeight: 800 }}>Motoristas</h3>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ color: '#64748b', textAlign: 'left' }}>
                <th style={{ padding: '10px 0', borderBottom: '1px solid #e2e8f0' }}>
                  Nome
                </th>
              </tr>
            </thead>
            <tbody>
              {drivers.length === 0 ? (
                <tr>
                  <td style={{ padding: '14px 0', color: '#64748b' }}>
                    Nenhum motorista cadastrado.
                  </td>
                </tr>
              ) : (
                drivers.map((driver) => (
                  <tr key={driver.id}>
                    <td style={{ padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
                      {driver.name || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div style={cardStyle}>
          <h3 style={{ marginTop: 0, fontSize: 20, fontWeight: 800 }}>Sócios</h3>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ color: '#64748b', textAlign: 'left' }}>
                <th style={{ padding: '10px 0', borderBottom: '1px solid #e2e8f0' }}>
                  Nome
                </th>
              </tr>
            </thead>
            <tbody>
              {investors.length === 0 ? (
                <tr>
                  <td style={{ padding: '14px 0', color: '#64748b' }}>
                    Nenhum sócio cadastrado.
                  </td>
                </tr>
              ) : (
                investors.map((investor) => (
                  <tr key={investor.id}>
                    <td style={{ padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
                      {investor.name || '-'}
                    </td>
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
