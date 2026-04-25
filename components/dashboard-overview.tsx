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
  const disponiveis = contarPorStatus(vehicles, 'disponivel') + contarPorStatus(vehicles, 'disponível');
  const vendidos = contarPorStatus(vehicles, 'vendido');
  const manutencao =
    contarPorStatus(vehicles, 'manutencao') +
    contarPorStatus(vehicles, 'manutenção') +
    contarPorStatus(vehicles, 'em manutenção');

  return (
    <div style={{ padding: 32, background: '#eef3f8', minHeight: '100vh', color: '#06142f' }}>
      <h1 style={{ fontSize: 34, margin: 0 }}>Painel Operacional</h1>
      <p style={{ color: '#667085', fontSize: 17 }}>Visão geral da operação em tempo real</p>

      <div className="topCards">
        <div className="bigCard"><div className="icon blue">🚘</div><div><b>Veículos Alugados</b><strong>{alugados}</strong><small>Total alugados</small></div></div>
        <div className="bigCard"><div className="icon green">✅</div><div><b>Disponíveis</b><strong>{disponiveis}</strong><small>Prontos para locação</small></div></div>
        <div className="bigCard"><div className="icon purple">🏷️</div><div><b>Vendidos</b><strong>{vendidos}</strong><small>Total vendidos</small></div></div>
        <div className="bigCard"><div className="icon orange">🔧</div><div><b>Em Manutenção</b><strong>{manutencao}</strong><small>Em manutenção</small></div></div>
      </div>

      <section className="panel">
        <div className="cardsGrid">
          <div className="smallCard"><span>Veículos</span><strong>{vehicles.length}</strong><small>Total</small></div>
          <div className="smallCard"><span>Motoristas</span><strong>{drivers.length}</strong><small>Total</small></div>
          <div className="smallCard"><span>Contratos</span><strong>{contracts.length}</strong><small>Ativos</small></div>
          <div className="smallCard"><span>Multas</span><strong>{fines.length}</strong><small>Pendentes</small></div>
          <div className="smallCard"><span>Vistorias</span><strong>{inspections.length}</strong><small>Pendentes</small></div>
          <div className="smallCard"><span>Sócios</span><strong>{investors.length}</strong><small>Total</small></div>
        </div>
      </section>

      <section className="panel">
        <h2>🚘 Veículos</h2>
        <p style={{ color: '#667085' }}>Lista de veículos cadastrados</p>

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
              {vehicles.map((vehicle: any) => {
                const driver = drivers.find((d: any) => String(d.id) === String(vehicle.driver_id));
                const investor = investors.find((i: any) => String(i.id) === String(vehicle.investor_id));

                return (
                  <tr key={vehicle.id}>
                    <td>
                      <b>{`${vehicle.brand || ''} ${vehicle.model || ''}`.trim() || 'Veículo sem nome'}</b>
                      <br />
                      <small>{vehicle.plate || 'Sem placa'}</small>
                    </td>
                    <td><span className={badgeClasse(vehicle.status)}>{textoStatus(vehicle.status)}</span></td>
                    <td>{driver?.name || driver?.nome || 'Sem motorista'}</td>
                    <td><span className={badgeClasse(driver?.active)}>{driver ? (driver?.active ? 'Ativo' : 'Inativo') : 'Não vinculado'}</span></td>
                    <td>{investor?.name || investor?.nome || 'Sem sócio'}</td>
                    <td><span className={badgeClasse(investor?.active)}>{investor ? (investor?.active ? 'Ativo' : 'Inativo') : 'Não vinculado'}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <style>{`
        .topCards {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          margin: 25px 0;
        }

        .bigCard, .panel {
          background: white;
          border-radius: 22px;
          padding: 24px;
          box-shadow: 0 10px 28px rgba(15, 23, 42, 0.08);
          border: 1px solid #e6edf5;
        }

        .bigCard {
          display: flex;
          gap: 18px;
          align-items: center;
        }

        .bigCard strong {
          display: block;
          font-size: 38px;
          margin: 6px 0;
        }

        .bigCard small, .smallCard small {
          color: #667085;
        }

        .icon {
          width: 74px;
          height: 74px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 32px;
        }

        .icon.blue { background: #e8f0ff; }
        .icon.green { background: #e7f8ef; }
        .icon.purple { background: #f0e7ff; }
        .icon.orange { background: #fff0e5; }

        .cardsGrid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 18px;
        }

        .smallCard {
          border: 1px solid #e6edf5;
          border-radius: 18px;
          padding: 20px;
          background: white;
        }

        .smallCard strong {
          display: block;
          font-size: 32px;
          margin: 8px 0;
        }

        .tableBox {
          overflow-x: auto;
          border: 1px solid #e6edf5;
          border-radius: 18px;
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        th {
          background: #f8fafc;
          text-align: left;
          padding: 16px;
          color: #667085;
          font-size: 13px;
          text-transform: uppercase;
        }

        td {
          padding: 18px 16px;
          border-top: 1px solid #eef2f6;
          color: #344054;
        }

        .badge {
          display: inline-flex;
          padding: 8px 14px;
          border-radius: 999px;
          font-weight: 700;
          font-size: 14px;
        }

        .badge.green { background: #dcfce7; color: #15803d; }
        .badge.blue { background: #dbeafe; color: #1d4ed8; }
        .badge.purple { background: #ede9fe; color: #6d28d9; }
        .badge.orange { background: #ffedd5; color: #c2410c; }
        .badge.gray { background: #f1f5f9; color: #475569; }
      `}</style>
    </div>
  );
}

export default DashboardOverview;
