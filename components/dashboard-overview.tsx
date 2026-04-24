import { createSupabaseServerClient } from '@/lib/supabase/server';

type Row = Record<string, any>;

async function getCount(table: string) {
  const supabase = await createSupabaseServerClient();

  const { count } = await supabase
    .from(table)
    .select('*', { count: 'exact', head: true });

  return count ?? 0;
}

async function getVehicleStatusCount(status: string) {
  const supabase = await createSupabaseServerClient();

  const { count } = await supabase
    .from('vehicles')
    .select('*', { count: 'exact', head: true })
    .eq('status', status);

  return count ?? 0;
}

async function getVehicleByStatus(status: string) {
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from('vehicles')
    .select('*')
    .eq('status', status)
    .order('created_at', { ascending: false });

  return data ?? [];
}

async function getRows(table: string) {
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from(table)
    .select('*')
    .order('created_at', { ascending: false });

  return data ?? [];
}

function getValue(row: Row, keys: string[]) {
  for (const key of keys) {
    if (row?.[key]) return row[key];
  }

  return '-';
}

function SimpleTable({
  title,
  rows,
  columns,
  emptyText,
}: {
  title: string;
  rows: Row[];
  columns: { label: string; keys: string[] }[];
  emptyText: string;
}) {
  return (
    <div className="card" style={{ marginTop: 16, overflowX: 'auto' }}>
      <h3 style={{ marginTop: 0 }}>{title}</h3>

      {rows.length === 0 ? (
        <p style={{ margin: 0, color: '#666' }}>{emptyText}</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  key={column.label}
                  style={{
                    textAlign: 'left',
                    padding: '10px',
                    borderBottom: '1px solid #ddd',
                  }}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {rows.map((row, index) => (
              <tr key={row.id ?? index}>
                {columns.map((column) => (
                  <td
                    key={column.label}
                    style={{
                      padding: '10px',
                      borderBottom: '1px solid #eee',
                    }}
                  >
                    {getValue(row, column.keys)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export async function DashboardOverview() {
  const [
    totalVeiculos,
    veiculosAlugados,
    veiculosDisponiveis,
    veiculosManutencao,
    totalMotoristas,
    totalSocios,
    listaVeiculosAlugados,
    listaVeiculosDisponiveis,
    listaMotoristas,
    listaSocios,
  ] = await Promise.all([
    getCount('vehicles'),
    getVehicleStatusCount('rented'),
    getVehicleStatusCount('available'),
    getVehicleStatusCount('maintenance'),
    getCount('drivers'),
    getCount('investors'),
    getVehicleByStatus('rented'),
    getVehicleByStatus('available'),
    getRows('drivers'),
    getRows('investors'),
  ]);

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
          <strong>{veiculosAlugados}</strong>
        </div>

        <div className="card kpi-card">
          <h3>Veículos disponíveis</h3>
          <strong>{veiculosDisponiveis}</strong>
        </div>

        <div className="card kpi-card">
          <h3>Veículos em manutenção</h3>
          <strong>{veiculosManutencao}</strong>
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

      <SimpleTable
        title="Veículos alugados"
        rows={listaVeiculosAlugados}
        emptyText="Nenhum veículo alugado encontrado."
        columns={[
          { label: 'Placa', keys: ['plate', 'placa'] },
          { label: 'Veículo', keys: ['model', 'modelo', 'name', 'nome'] },
          { label: 'Marca', keys: ['brand', 'marca'] },
          { label: 'Status', keys: ['status'] },
        ]}
      />

      <SimpleTable
        title="Veículos disponíveis"
        rows={listaVeiculosDisponiveis}
        emptyText="Nenhum veículo disponível encontrado."
        columns={[
          { label: 'Placa', keys: ['plate', 'placa'] },
          { label: 'Veículo', keys: ['model', 'modelo', 'name', 'nome'] },
          { label: 'Marca', keys: ['brand', 'marca'] },
          { label: 'Status', keys: ['status'] },
        ]}
      />

      <SimpleTable
        title="Sócios"
        rows={listaSocios}
        emptyText="Nenhum sócio encontrado."
        columns={[
          { label: 'Nome', keys: ['name', 'nome', 'full_name'] },
          { label: 'Telefone', keys: ['phone', 'telefone'] },
          { label: 'E-mail', keys: ['email'] },
        ]}
      />

      <SimpleTable
        title="Motoristas"
        rows={listaMotoristas}
        emptyText="Nenhum motorista encontrado."
        columns={[
          { label: 'Nome', keys: ['name', 'nome', 'full_name'] },
          { label: 'Telefone', keys: ['phone', 'telefone'] },
          { label: 'CNH', keys: ['license_number', 'cnh'] },
        ]}
      />
    </section>
  );
}
