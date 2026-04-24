import { createSupabaseServerClient } from '@/lib/supabase/server';

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

export async function DashboardOverview() {
  const [
    totalVeiculos,
    veiculosAlugados,
    veiculosDisponiveis,
    veiculosManutencao,
    totalMotoristas,
    totalSocios,
  ] = await Promise.all([
    getCount('vehicles'),
    getVehicleStatusCount('rented'),
    getVehicleStatusCount('available'),
    getVehicleStatusCount('maintenance'),
    getCount('drivers'),
    getCount('investors'),
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
    </section>
  );
}
