
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

  if (status.includes('dispon') || status === 'ativo' || valor === true) return 'badge green';
  if (status.includes('alug')) return 'badge blue';
  if (status.includes('vend')) return 'badge purple';
  if (status.includes('manut')) return 'badge orange';
  if (status.includes('inativo') || valor === false) return 'badge gray';

  return 'badge gray';
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

  const alugados = contarPorStatus(vehicles, 'alugado');
  const disponiveis =
    contarPorStatus(vehicles, 'disponivel') +
    contarPorStatus(vehicles, 'disponível');

  const vendidos = contarPorStatus(vehicles, 'vendido');

  const manutencao =
    contarPorStatus(vehicles, 'manutencao') +
    contarPorStatus(vehicles, 'manutenção') +
    contarPorStatus(vehicles, 'em manutenção');

  return (
    <div className="dashboard">
      <h1>Painel Operacional</h1>
      <p className="subtitle">Visão geral da operação em tempo real</p>

      <div className="topCards">
        <div className="bigCard">
          <div className="icon blueIcon">🚘</div>
          <div>
            <b>Veículos Alugados</b>
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
            <b>Em Manutenção</b>
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
        <p className="subtitle small">Lista de veículos cadastrados</p>

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
                    (d: any) => String(d.id) === String(vehicle.driver_id),
                  );

                  const investor = investors.find(
                    (i: any) => String(i.id) === String(vehicle.investor_id),
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
                          {textoStatus(vehicle.status)}
                        </span>
                      </td>

                      <td>{driver?.name || driver?.nome || 'Sem motorista'}</td>

                      <td>
                        <span className={badgeClasse(driver?.active)}>
                          {driver
                            ? driver?.active
                              ? 'Ativo'
                              : 'Inativo'
                            : 'Não vinculado'}
                        </span>
                      </td>

                      <td>{investor?.name || investor?.nome || 'Sem sócio'}</td>

                      <td>
                        <span className={badgeClasse(investor?.active)}>
                          {investor
                            ? investor?.active
                              ? 'Ativo'
                              : 'Inativo'
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
          padding: 18px 28px;
          background: #eef3f8;
          min-height: 100vh;
          color: #06142f;
        }

        h1 {
          font-size: 28px;
          line-height: 1.1;
          margin: 0 0 6px;
          font-weight: 800;
        }

        .subtitle {
          color: #667085;
          font-size: 15px;
          margin: 0 0 18px;
        }

        .subtitle.small {
          font-size: 13px;
          margin-bottom: 12px;
        }

        .topCards {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
          margin-bottom: 18px;
        }

        .bigCard {
          background: white;
          border-radius: 18px;
          padding: 16px 18px;
          display: flex;
          align-items: center;
          gap: 14px;
          box-shadow: 0 8px 20px rgba(15, 23, 42, 0.06);
          border: 1px solid #e6edf5;
          min-height: 118px;
        }

        .bigCard b {
          font-size: 14px;
          display: block;
          line-height: 1.15;
        }

        .bigCard strong {
          display: block;
          font-size: 30px;
          line-height: 1;
          margin: 6px 0;
        }

        .bigCard small,
        .smallCard small {
          color: #667085;
          font-size: 13px;
        }

        .icon {
          width: 58px;
          height: 58px;
          min-width: 58px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 25px;
        }

        .blueIcon { background: #e8f0ff; }
        .greenIcon { background: #e7f8ef; }
        .purpleIcon { background: #f0e7ff; }
        .orangeIcon { background: #fff0e5; }

        .panel {
          background: white;
          border-radius: 18px;
          padding: 18px;
          margin-bottom: 18px;
          box-shadow: 0 8px 20px rgba(15, 23, 42, 0.05);
          border: 1px solid #e6edf5;
        }

        .cardsGrid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 12px;
        }

        .smallCard {
          border: 1px solid #e6edf5;
          border-radius: 15px;
          padding: 14px 16px;
          background: white;
          min-height: 98px;
        }

        .smallCard span {
          font-size: 14px;
        }

        .smallCard strong {
          display: block;
          font-size: 28px;
          line-height: 1;
          margin: 8px 0;
        }

        .tablePanel h2 {
          font-size: 21px;
          margin: 0 0 4px;
        }

        .tableBox {
          overflow-x: auto;
          border: 1px solid #e6edf5;
          border-radius: 15px;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          background: white;
        }

        th {
          background: #f8fafc;
          text-align: left;
          padding: 12px 14px;
          color: #667085;
          font-size: 12px;
          text-transform: uppercase;
          font-weight: 800;
          white-space: nowrap;
        }

        td {
          padding: 12px 14px;
          border-top: 1px solid #eef2f6;
          color: #344054;
          font-size: 14px;
          white-space: nowrap;
        }

        td b {
          color: #06142f;
          font-size: 14px;
        }

        td small {
          color: #667085;
          font-size: 12px;
        }

        .badge {
          display: inline-flex;
          padding: 6px 11px;
          border-radius: 999px;
          font-weight: 700;
          font-size: 12px;
          min-width: 78px;
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
          padding: 22px;
        }

        @media (max-width: 1300px) {
          .topCards {
            grid-template-columns: repeat(2, 1fr);
          }

          .cardsGrid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
      `}</style>
    </div>
  );
}

export default DashboardOverview;
