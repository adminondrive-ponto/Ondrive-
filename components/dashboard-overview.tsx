import { createSupabaseServerClient } from '@/lib/supabase/server';

function normalizar(valor: any) {
  return String(valor || '').toLowerCase().trim();
}

function statusVeiculo(valor: any) {
  const status = normalizar(valor);

  if (['alugado', 'rented', 'locado'].includes(status)) return 'Alugado';
  if (['disponivel', 'disponível', 'available'].includes(status)) return 'Disponível';
  if (['vendido', 'sold'].includes(status)) return 'Vendido';
  if (['manutencao', 'manutenção', 'em manutenção', 'maintenance'].includes(status)) {
    return 'Em manutenção';
  }

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

function textoAtivo(valor: any) {
  if (valor === true) return 'Ativo';
  if (valor === false) return 'Inativo';
  return 'Não vinculado';
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
          <div className="icon blueIcon">🚘</div>
          <div>
            <b>Veículos alugados</b>
            <strong>{alugados}</strong>
            <small>Total alugados</small>
          </div>
        </div>

        <div className="bigCard">
          <div className="icon greenIcon">✅</div>
          <div>
            <b>Disponíveis</b>
            <strong>{disponiveis}</strong>
            <small>Prontos para locação</small>
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

          <div className="smallCard">
            <span>Sócios</span>
            <strong>{investors.length}</strong>
            <small>Total</small>
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
                <th>Status motorista</th>
                <th>Sócio</th>
                <th>Status sócio</th>
              </tr>
            </thead>

            <tbody>
              {vehicles.length === 0 ? (
                <tr>
                  <td colSpan={6} className="empty">
                    Nenhum veículo cadastrado.
                  </td>
                </tr>
              ) : (
                vehicles.map((vehicle: any) => {
                  const driver = drivers.find(
                    (d: any) =>
                      String(d.id) === String(vehicle.driver_id) ||
                      String(d.vehicle_id) === String(vehicle.id),
                  );

                  const investor = investors.find(
                    (i: any) =>
                      String(i.id) === String(vehicle.investor_id) ||
                      String(i.vehicle_id) === String(vehicle.id),
                  );

                  const vehicleName =
                    `${vehicle.brand || ''} ${vehicle.model || ''}`.trim() ||
                    vehicle.name ||
                    'Veículo sem nome';

                  return (
                    <tr key={vehicle.id}>
                      <td>
                        <b>{vehicleName}</b>
                        <br />
                        <small>{vehicle.plate || 'Sem placa'}</small>
                      </td>

                      <td>
                        <span className={badgeClasse(vehicle.status)}>
                          {statusVeiculo(vehicle.status)}
                        </span>
                      </td>

                      <td>{driver?.name || driver?.nome || 'Sem motorista'}</td>

                      <td>
                        <span className={badgeClasse(driver?.active)}>
                          {textoAtivo(driver?.active)}
                        </span>
                      </td>

                      <td>{investor?.name || investor?.nome || 'Sem sócio'}</td>

                      <td>
                        <span className={badgeClasse(investor?.active)}>
                          {textoAtivo(investor?.active)}
                        </span>
                      </td>
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
          background: #eef3f8;
          color: #06142f;
        }

        .topCards {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 14px;
        }

        .bigCard {
          background: white;
          border-radius: 16px;
          padding: 13px 15px;
          display: flex;
          align-items: center;
          gap: 12px;
          box-shadow: 0 6px 16px rgba(15, 23, 42, 0.05);
          border: 1px solid #e6edf5;
          min-height: 92px;
        }

        .bigCard b {
          display: block;
          font-size: 13px;
          line-height: 1.15;
        }

        .bigCard strong {
          display: block;
          font-size: 26px;
          line-height: 1;
          margin: 5px 0;
        }

        .bigCard small,
        .smallCard small {
          color: #667085;
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

        .blueIcon { background: #e8f0ff; }
        .greenIcon { background: #e7f8ef; }
        .purpleIcon { background: #f0e7ff; }
        .orangeIcon { background: #fff0e5; }

        .panel {
          background: white;
          border-radius: 16px;
          padding: 14px;
          margin-bottom: 14px;
          box-shadow: 0 6px 16px rgba(15, 23, 42, 0.04);
          border: 1px solid #e6edf5;
        }

        .cardsGrid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 10px;
        }

        .smallCard {
          border: 1px solid #e6edf5;
          border-radius: 13px;
          padding: 11px 13px;
          background: white;
          min-height: 78px;
        }

        .smallCard span {
          font-size: 13px;
        }

        .smallCard strong {
          display: block;
          font-size: 24px;
          line-height: 1;
          margin: 6px 0;
        }

        .tablePanel h2 {
          font-size: 18px;
          margin: 0 0 10px;
        }

        .tableBox {
          overflow-x: auto;
          border: 1px solid #e6edf5;
          border-radius: 13px;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          background: white;
        }

        th {
          background: #f8fafc;
          text-align: left;
          padding: 10px 12px;
          color: #667085;
          font-size: 11px;
          text-transform: uppercase;
          font-weight: 800;
          white-space: nowrap;
        }

        td {
          padding: 10px 12px;
          border-top: 1px solid #eef2f6;
          color: #344054;
          font-size: 13px;
          white-space: nowrap;
        }

        td b {
          color: #06142f;
          font-size: 13px;
        }

        td small {
          color: #667085;
          font-size: 11px;
        }

        .badge {
          display: inline-flex;
          padding: 5px 9px;
          border-radius: 999px;
          font-weight: 700;
          font-size: 11px;
          min-width: 74px;
          justify-content: center;
        }

        .green { background: #dcfce7; color: #15803d; }
        .blue { background: #dbeafe; color: #1d4ed8; }
        .purple { background: #ede9fe; color: #6d28d9; }
        .orange { background: #ffedd5; color: #c2410c; }
        .gray { background: #f1f5f9; color: #475569; }

        .empty {
          text-align: center;
          color: #667085;
          padding: 18px;
        }
      `}</style>
    </div>
  );
}

export default DashboardOverview;