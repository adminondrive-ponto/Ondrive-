import { createSupabaseServerClient } from '@/lib/supabase/server';

function normalizar(valor: any) {
  return String(valor || '').toLowerCase().trim();
}

function statusVeiculo(valor: any) {
  const status = normalizar(valor);
  if (['alugado', 'rented', 'locado'].includes(status)) return 'Alugado';
  if (['disponivel', 'disponível', 'available'].includes(status)) return 'Disponível';
  if (['vendido', 'sold'].includes(status)) return 'Vendido';
  if (['manutencao', 'manutenção', 'em manutenção', 'maintenance'].includes(status)) return 'Em manutenção';
  return 'Não informado';
}

function contarStatus(lista: any[], statusFinal: string) {
  return lista.filter((item) => statusVeiculo(item.status) === statusFinal).length;
}

function badgeClasse(valor: any) {
  const texto = statusVeiculo(valor);
  const normal = normalizar(valor);
  if (texto === 'Disponível' || normal === 'ativo' || valor === true) return 'badge green';
  if (texto === 'Alugado') return 'badge blue';
  if (texto === 'Vendido') return 'badge purple';
  if (texto === 'Em manutenção') return 'badge orange';
  return 'badge gray';
}

function contratoAtivo(contract: any) {
  const status = normalizar(contract.status);
  return (
    contract.active === true ||
    status === 'active' ||
    status === 'ativo' ||
    status === 'vigente'
  );
}

export async function DashboardOverview() {
  const supabase = await createSupabaseServerClient();

  const [vehiclesRes, driversRes, investorsRes, contractsRes, finesRes, inspectionsRes] =
    await Promise.all([
      supabase.from('vehicles').select('*'),
      supabase.from('drivers').select('*'),
      supabase.from('investors').select('*'),
      supabase.from('contracts').select('*'),
      supabase.from('fines').select('*'),
      supabase.from('inspections').select('*'),
    ]);

  const vehicles = vehiclesRes.data || [];
  const drivers = driversRes.data || [];
  const investors = investorsRes.data || [];
  const contracts = contractsRes.data || [];
  const fines = finesRes.data || [];
  const inspections = inspectionsRes.data || [];

  const alugados = contarStatus(vehicles, 'Alugado');
  const disponiveis = contarStatus(vehicles, 'Disponível');
  const vendidos = contarStatus(vehicles, 'Vendido');
  const manutencao = contarStatus(vehicles, 'Em manutenção');

  return (
    <div className="dashboard">
      <div className="topCards">
        <div className="bigCard">
          <div className="icon greenIcon">✅</div>
          <div>
            <b>Disponíveis</b>
            <strong>{disponiveis}</strong>
            <small>Prontos para locação</small>
          </div>
        </div>
        <div className="bigCard">
          <div className="icon blueIcon">🚘</div>
          <div>
            <b>Veículos alugados</b>
            <strong>{alugados}</strong>
            <small>Total alugados</small>
          </div>
        </div>
        <div className="bigCard">
          <div className="icon purpleIcon">🏷️</div>
          <div>
            <b>Vendidos</b>
            <strong>{vendidos}</strong>
            <small>Total vendidos</small>
          </div>
        </div>
        <div className="bigCard">
          <div className="icon orangeIcon">🔧</div>
          <div>
            <b>Em manutenção</b>
            <strong>{manutencao}</strong>
            <small>Em manutenção</small>
          </div>
        </div>
      </div>

      <section className="panel">
        <div className="cardsGrid">
          <div className="smallCard">
            <span>Veículos</span>
            <strong>{vehicles.length}</strong>
            <small>Total</small>
          </div>
          <div className="smallCard">
            <span>Motoristas</span>
            <strong>{drivers.length}</strong>
            <small>Total</small>
          </div>
          <div className="smallCard">
            <span>Sócios</span>
            <strong>{investors.length}</strong>
            <small>Total</small>
          </div>
          <div className="smallCard">
            <span>Contratos</span>
            <strong>{contracts.length}</strong>
            <small>Ativos</small>
          </div>
          <div className="smallCard">
            <span>Multas</span>
            <strong>{fines.length}</strong>
            <small>Pendentes</small>
          </div>
          <div className="smallCard">
            <span>Vistorias</span>
            <strong>{inspections.length}</strong>
            <small>Pendentes</small>
          </div>
        </div>
      </section>

      <section className="panel tablePanel">
        <h2>🚘 Veículos</h2>
        <div className="tableBox">
          <table>
            <thead>
              <tr>
                <th>Veículo</th>
                <th>Status do veículo</th>
                <th>Motorista</th>
                <th>Sócio</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.length === 0 ? (
                <tr>
                  <td colSpan={4} className="empty">Nenhum veículo cadastrado.</td>
                </tr>
              ) : (
                vehicles.map((vehicle: any) => {
                  const contract = contracts.find(
                    (c: any) => String(c.vehicle_id) === String(vehicle.id) && contratoAtivo(c),
                  );
                  const driverId = contract?.driver_id || vehicle.driver_id;
                  const investorId = contract?.investor_id || vehicle.investor_id;
                  const driver = drivers.find((d: any) => String(d.id) === String(driverId));
                  const investor = investors.find((i: any) => String(i.id) === String(investorId));
                  const vehicleName =
                    `${vehicle.brand || ''} ${vehicle.model || ''}`.trim() ||
                    vehicle.name ||
                    'Veículo sem nome';

                  return (
                    <tr key={vehicle.id}>
                      <td>
                        <b>{vehicleName}</b><br />
                        <small>{vehicle.plate || 'Sem placa'}</small>
                      </td>
                      <td>
                        <span className={badgeClasse(vehicle.status)}>
                          {statusVeiculo(vehicle.status)}
                        </span>
                      </td>
                      <td>{driver?.name || driver?.nome || 'Sem motorista'}</td>
                      <td>{investor?.name || investor?.nome || 'Sem sócio'}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      <style>{`
        .dashboard {
          padding: 10px 26px 18px;
          background: #0d1117;
          color: #ffffff;
        }
        .topCards {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 14px;
        }
        .bigCard {
          background: #1c2128;
          border-radius: 16px;
          padding: 13px 15px;
          display: flex;
          align-items: center;
          gap: 12px;
          box-shadow: 0 4px 16px rgba(0,0,0,0.4);
          border: 1px solid #30363d;
          min-height: 92px;
        }
        .bigCard b {
          display: block;
          font-size: 13px;
          line-height: 1.15;
          color: #c9d1d9;
        }
        .bigCard strong {
          display: block;
          font-size: 26px;
          line-height: 1;
          margin: 5px 0;
          color: #ffffff;
        }
        .bigCard small, .smallCard small {
          color: #8b949e;
          font-size: 12px;
        }
        .icon {
          width: 48px;
          height: 48px;
          min-width: 48px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 21px;
        }
        .blueIcon   { background: rgba(59,130,246,0.15); }
        .greenIcon  { background: rgba(63,185,80,0.15); }
        .purpleIcon { background: rgba(139,92,246,0.15); }
        .orangeIcon { background: rgba(240,167,50,0.15); }
        .panel {
          background: #161b22;
          border-radius: 16px;
          padding: 14px;
          margin-bottom: 14px;
          box-shadow: 0 4px 16px rgba(0,0,0,0.4);
          border: 1px solid #30363d;
        }
        .cardsGrid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
        }
        .smallCard {
          border: 1px solid #30363d;
          border-radius: 13px;
          padding: 11px 13px;
          background: #1c2128;
          min-height: 78px;
        }
        .smallCard span {
          font-size: 13px;
          color: #8b949e;
        }
        .smallCard strong {
          display: block;
          font-size: 24px;
          line-height: 1;
          margin: 6px 0;
          color: #ffffff;
        }
        .tablePanel h2 {
          font-size: 18px;
          margin: 0 0 10px;
          color: #ffffff;
        }
        .tableBox {
          overflow-x: auto;
          border: 1px solid #30363d;
          border-radius: 13px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          background: #161b22;
        }
        th {
          background: #1c2128;
          text-align: left;
          padding: 10px 12px;
          color: #8b949e;
          font-size: 11px;
          text-transform: uppercase;
          font-weight: 800;
          white-space: nowrap;
        }
        td {
          padding: 10px 12px;
          border-top: 1px solid #30363d;
          color: #c9d1d9;
          font-size: 13px;
          white-space: nowrap;
        }
        td b { color: #ffffff; font-size: 13px; }
        td small { color: #8b949e; font-size: 11px; }
        tr:hover td { background: rgba(255,255,255,0.03); }
        .badge {
          display: inline-flex;
          padding: 5px 9px;
          border-radius: 999px;
          font-weight: 700;
          font-size: 11px;
          min-width: 74px;
          justify-content: center;
        }
        .green  { background: rgba(63,185,80,0.15);   color: #3fb950; border: 1px solid #3fb950; }
        .blue   { background: rgba(59,130,246,0.15);  color: #3b82f6; border: 1px solid #3b82f6; }
        .purple { background: rgba(139,92,246,0.15);  color: #a78bfa; border: 1px solid #a78bfa; }
        .orange { background: rgba(240,167,50,0.15);  color: #f0a732; border: 1px solid #f0a732; }
        .gray   { background: rgba(139,148,158,0.15); color: #8b949e; border: 1px solid #8b949e; }
        .empty { text-align: center; color: #8b949e; padding: 18px; }
      `}</style>
    </div>
  );
}

export default DashboardOverview;