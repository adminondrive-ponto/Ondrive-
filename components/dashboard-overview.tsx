import { createSupabaseServerClient } from '@/lib/supabase/server';

function normalizarStatus(valor: any) {
  return String(valor || '').toLowerCase().trim();
}

function contarPorStatus(lista: any[], statusBuscado: string) {
  return lista.filter((item) => normalizarStatus(item.status) === statusBuscado).length;
}

function textoStatus(valor: any) {
  const status = normalizarStatus(valor);

  if (status === 'alugado') return 'Alugado';
  if (status === 'disponivel' || status === 'disponível') return 'Disponível';
  if (status === 'vendido') return 'Vendido';
  if (status === 'manutencao' || status === 'manutenção' || status === 'em manutenção') return 'Em manutenção';

  return valor || 'Não informado';
}

function badgeClasse(valor: any) {
  const status = normalizarStatus(valor);

  if (status.includes('ativo') || status.includes('dispon')) return 'badge green';
  if (status.includes('alug')) return 'badge blue';
  if (status.includes('vend')) return 'badge purple';
  if (status.includes('manut')) return 'badge orange';
  if (status.includes('inativo')) return 'badge gray';

  return 'badge gray';
}

export default async function DashboardOverview() {
  const supabase = await createSupabaseServerClient();

  const [
    vehiclesRes,
    driversRes,
    investorsRes,
    contractsRes,
    finesRes,
    inspectionsRes,
  ] = await Promise.all([
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

  const alugados = contarPorStatus(vehicles, 'alugado');
  const disponiveis =
    contarPorStatus(vehicles, 'disponivel') + contarPorStatus(vehicles, 'disponível');
  const vendidos = contarPorStatus(vehicles, 'vendido');
  const manutencao =
    contarPorStatus(vehicles, 'manutencao') +
    contarPorStatus(vehicles, 'manutenção') +
    contarPorStatus(vehicles, 'em manutenção');

  return (
    <div className="dashboard">
      <div className="header">
        <h1>Painel Operacional</h1>
        <p>Visão geral da operação em tempo real</p>
      </div>

      <section className="topCards">
        <div className="bigCard blueLight">
          <div className="icon">🚘</div>
          <div>
            <span>Veículos Alugados</span>
            <strong>{alugados}</strong>
            <small>Total alugados</small>
          </div>
        </div>

        <div className="bigCard greenLight">
          <div className="icon">✅</div>
          <div>
            <span>Disponíveis</span>
            <strong>{disponiveis}</strong>
            <small>Prontos para locação</small>
          </div>
        </div>

        <div className="bigCard purpleLight">
          <div className="icon">🏷️</div>
          <div>
            <span>Vendidos</span>
            <strong>{vendidos}</strong>
            <small>Total vendidos</small>
          </div>
        </div>

        <div className="bigCard orangeLight">
          <div className="icon">🔧</div>
          <div>
            <span>Em Manutenção</span>
            <strong>{manutencao}</strong>
            <small>Em manutenção</small>
          </div>
        </div>
      </section>

      <section className="panel">
        <h2>Painel operacional</h2>

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

      <section className="tablePanel">
        <div className="tableTitle">
          <div>
            <h2>🚘 Veículos</h2>
            <p>Lista de veículos cadastrados</p>
          </div>
        </div>

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

                  const driverName =
                    driver?.name ||
                    driver?.full_name ||
                    driver?.nome ||
                    'Sem motorista';

                  const investorName =
                    investor?.name ||
                    investor?.full_name ||
                    investor?.nome ||
                    'Sem sócio';

                  return (
                    <tr key={vehicle.id}>
                      <td>
                        <div className="vehicleCell">
                          <div className="carIcon">🚗</div>
                          <div>
                            <strong>{vehicleName}</strong>
                            <small>{vehicle.plate || 'Sem placa'}</small>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className={badgeClasse(vehicle.status)}>
                          {textoStatus(vehicle.status)}
                        </span>
                      </td>

                      <td>{driverName}</td>

                      <td>
                        <span className={badgeClasse(driver?.status || driver?.active)}>
                          {driver
                            ? driver?.status || (driver?.active ? 'Ativo' : 'Inativo')
                            : 'Não vinculado'}
                        </span>
                      </td>

                      <td>{investorName}</td>

                      <td>
                        <span className={badgeClasse(investor?.status || investor?.active)}>
                          {investor
                            ? investor?.status || (investor?.active ? 'Ativo' : 'Inativo')
                            : 'Não vinculado'}
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
          width: 100%;
          padding: 28px 34px;
          background: #eef3f8;
          min-height: 100vh;
          color: #06142f;
        }

        .header h1 {
          font-size: 34px;
          font-weight: 800;
          margin: 0;
          letter-spacing: -0.8px;
        }

        .header p {
          margin: 8px 0 26px;
          font-size: 17px;
          color: #667085;
        }

        .topCards {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 20px;
          margin-bottom: 26px;
        }

        .bigCard {
          background: #fff;
          border-radius: 22px;
          padding: 24px;
          display: flex;
          align-items: center;
          gap: 20px;
          box-shadow: 0 10px 28px rgba(15, 23, 42, 0.08);
          border: 1px solid #e6edf5;
        }

        .icon {
          width: 76px;
          height: 76px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 34px;
        }

        .blueLight .icon { background: #e8f0ff; }
        .greenLight .icon { background: #e7f8ef; }
        .purpleLight .icon { background: #f0e7ff; }
        .orangeLight .icon { background: #fff0e5; }

        .bigCard span,
        .smallCard span {
          display: block;
          font-size: 15px;
          font-weight: 700;
          color: #344054;
        }

        .bigCard strong {
          display: block;
          font-size: 38px;
          line-height: 1;
          margin: 8px 0;
          color: #071631;
        }

        .bigCard small,
        .smallCard small {
          color: #667085;
          font-size: 14px;
        }

        .panel,
        .tablePanel {
          background: #fff;
          border-radius: 22px;
          padding: 24px;
          margin-bottom: 26px;
          box-shadow: 0 10px 28px rgba(15, 23, 42, 0.06);
          border: 1px solid #e6edf5;
        }

        .panel h2,
        .tablePanel h2 {
          margin: 0 0 20px;
          font-size: 25px;
          font-weight: 800;
          letter-spacing: -0.4px;
        }

        .cardsGrid {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 18px;
        }

        .smallCard {
          background: #fff;
          border-radius: 18px;
          padding: 20px 22px;
          border: 1px solid #e6edf5;
          box-shadow: 0 8px 20px rgba(15, 23, 42, 0.04);
        }

        .smallCard strong {
          display: block;
          font-size: 32px;
          margin: 8px 0;
          color: #071631;
        }

        .tableTitle {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }

        .tableTitle p {
          margin: -10px 0 0;
          color: #667085;
          font-size: 15px;
        }

        .tableBox {
          overflow-x: auto;
          border: 1px solid #e6edf5;
          border-radius: 18px;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          background: #fff;
        }

        thead {
          background: #f8fafc;
        }

        th {
          text-align: left;
          padding: 17px 20px;
          font-size: 13px;
          text-transform: uppercase;
          color: #667085;
          letter-spacing: 0.5px;
          font-weight: 800;
          border-bottom: 1px solid #e6edf5;
        }

        td {
          padding: 18px 20px;
          font-size: 15px;
          color: #344054;
          border-bottom: 1px solid #eef2f6;
        }

        tr:last-child td {
          border-bottom: none;
        }

        .vehicleCell {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .vehicleCell strong {
          display: block;
          font-size: 16px;
          color: #06142f;
        }

        .vehicleCell small {
          color: #667085;
          font-size: 14px;
        }

        .carIcon {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          background: #f1f5f9;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 23px;
        }

        .badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 92px;
          padding: 8px 13px;
          border-radius: 999px;
          font-size: 14px;
          font-weight: 700;
        }

        .green {
          background: #dcfce7;
          color: #15803d;
        }

        .blue {
          background: #dbeafe;
          color: #1d4ed8;
        }

        .purple {
          background: #ede9fe;
          color: #6d28d9;
        }

        .orange {
          background: #ffedd5;
          color: #c2410c;
        }

        .gray {
          background: #f1f5f9;
          color: #475569;
        }

        .empty {
          text-align: center;
          padding: 32px;
          color: #667085;
        }

        @media (max-width: 1200px) {
          .topCards {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .cardsGrid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }

        @media (max-width: 768px) {
          .dashboard {
            padding: 20px;
          }

          .topCards,
          .cardsGrid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
