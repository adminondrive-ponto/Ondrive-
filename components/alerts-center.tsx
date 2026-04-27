'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';

type Driver = {
  id: string;
  name?: string;
  nome?: string;
  phone?: string;
  telefone?: string;
  cnh_due_date?: string;
  cnh_expiry?: string;
};

type Fine = {
  id: string;
  driver_id?: string;
  due_date?: string;
  date?: string;
  status?: string;
};

type Contract = {
  id: string;
  driver_id?: string | null;
  vehicle_id?: string | null;
  next_due_date?: string | null;
  payment_status?: string | null;
  status?: string | null;
  active?: boolean | null;
  amount?: number | string | null;
  rent_value?: number | string | null;
};

type AlertRow = {
  id: string;
  alert_key?: string | null;
  source?: string | null;
  level?: 'warning' | 'danger' | null;
  alert_type?: string | null;
  title: string;
  message: string;
  driver_id?: string | null;
  phone?: string | null;
  status?: string | null;
};

export function AlertsCenter() {
  function formatarData(data?: string | null) {
    if (!data) return '';
    const d = new Date(`${data}T00:00:00`);
    return d.toLocaleDateString('pt-BR');
  }

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [phone, setPhone] = useState('');
  const [driverId, setDriverId] = useState('');
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [alerts, setAlerts] = useState<AlertRow[]>([]);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );

  async function carregarDados() {
    const { data: driversData } = await supabase.from('drivers').select('*');
    const { data: finesData } = await supabase.from('fines').select('*');
    const { data: vehiclesData } = await supabase.from('vehicles').select('*');
    const { data: inspectionsData } = await supabase.from('inspections').select('*');
    const { data: contractsData } = await supabase.from('contracts').select('*');

    const { data: existingAlertsData } = await supabase
      .from('alerts')
      .select('alert_key, status, alert_type');

    const driversList = (driversData || []) as Driver[];
    const finesList = (finesData || []) as Fine[];
    const vehiclesList = vehiclesData || [];
    const inspectionsList = inspectionsData || [];
    const contractsList = (contractsData || []) as Contract[];
    const existingAlerts = existingAlertsData || [];

    setDrivers(driversList);

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const newAutoAlerts: Partial<AlertRow>[] = [];

    async function criarOuAtualizarAlerta({
      alertKey,
      diffDias,
      driverId,
      phone,
      warningTitle,
      warningMessage,
      dangerTitle,
      dangerMessage,
    }: {
      alertKey: string;
      diffDias: number;
      driverId?: string | null;
      phone?: string | null;
      warningTitle: string;
      warningMessage: string;
      dangerTitle: string;
      dangerMessage: string;
    }) {
      if (diffDias > 3) return;

      const alreadyExists = existingAlerts.find(
        (a) => a.alert_key === alertKey,
      );

      if (alreadyExists?.status === 'done') return;

      const novoAlerta =
        diffDias >= 0
          ? {
              level: 'warning' as const,
              alert_type: warningTitle,
              title: warningTitle,
              message: warningMessage,
            }
          : {
              level: 'danger' as const,
              alert_type: dangerTitle,
              title: dangerTitle,
              message: dangerMessage,
            };

      if (!alreadyExists) {
        newAutoAlerts.push({
          alert_key: alertKey,
          source: 'auto',
          level: novoAlerta.level,
          alert_type: novoAlerta.alert_type,
          title: novoAlerta.title,
          message: novoAlerta.message,
          driver_id: driverId || null,
          phone: phone || null,
          status: 'active',
        });

        return;
      }

      if (
        alreadyExists.status === 'active' &&
        alreadyExists.alert_type !== novoAlerta.alert_type
      ) {
        await supabase
          .from('alerts')
          .update({
            level: novoAlerta.level,
            alert_type: novoAlerta.alert_type,
            title: novoAlerta.title,
            message: novoAlerta.message,
            phone: phone || null,
          })
          .eq('alert_key', alertKey)
          .eq('status', 'active');
      }
    }

    for (const driver of driversList) {
      const dataCNH = driver.cnh_due_date || driver.cnh_expiry;

      if (!dataCNH) continue;

      const vencimento = new Date(`${dataCNH}T00:00:00`);
      vencimento.setHours(0, 0, 0, 0);

      const diffDias = Math.ceil(
        (vencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24),
      );

      const nome = driver.name || driver.nome || 'Motorista';
      const telefone = driver.phone || driver.telefone || null;

      await criarOuAtualizarAlerta({
        alertKey: `cnh-${driver.id}-${dataCNH}`,
        diffDias,
        driverId: driver.id,
        phone: telefone,
        warningTitle: 'CNH chegando no vencimento',
        warningMessage: `Aviso: a CNH de ${nome} vence em ${diffDias} dia(s).`,
        dangerTitle: 'CNH vencida',
        dangerMessage: `Vencido: a CNH de ${nome} está vencida.`,
      });
    }

    for (const fine of finesList) {
      const dataMulta = fine.due_date || fine.date;

      if (
        !dataMulta ||
        ['paid', 'paga', 'pago', 'quitada', 'quitado'].includes(
          String(fine.status ?? '').toLowerCase(),
        )
      ) {
        continue;
      }

      const vencimento = new Date(`${dataMulta}T00:00:00`);
      vencimento.setHours(0, 0, 0, 0);

      const diffDias = Math.ceil(
        (vencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24),
      );

      const driver = driversList.find(
        (item) => String(item.id) === String(fine.driver_id),
      );

      const nome = driver?.name || driver?.nome || 'motorista';
      const telefone = driver?.phone || driver?.telefone || null;

      await criarOuAtualizarAlerta({
        alertKey: `fine-${fine.id}-${dataMulta}`,
        diffDias,
        driverId: fine.driver_id || null,
        phone: telefone,
        warningTitle: 'Multa chegando no vencimento',
        warningMessage: `Aviso: existe uma multa de ${nome} vencendo em ${diffDias} dia(s). Verifique o pagamento.`,
        dangerTitle: 'Multa vencida',
        dangerMessage: `Vencido: existe uma multa de ${nome} atrasada. Regularize o quanto antes.`,
      });
    }

    for (const vistoria of inspectionsList as any[]) {
      const dataVistoria =
        vistoria.date ||
        vistoria.due_date ||
        vistoria.inspection_due_date ||
        vistoria.next_revision;

      if (!dataVistoria) continue;

      const vencimento = new Date(`${dataVistoria}T00:00:00`);
      vencimento.setHours(0, 0, 0, 0);

      const diffDias = Math.ceil(
        (vencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24),
      );

      const vehicle = vehiclesList.find(
        (v: any) => String(v.id) === String(vistoria.vehicle_id),
      );

      const driver = driversList.find(
        (d: any) => String(d.id) === String(vistoria.driver_id),
      );

      const telefone = driver?.phone || driver?.telefone || null;
      const placa = vehicle?.plate || 'sem placa';

      await criarOuAtualizarAlerta({
        alertKey: `vistoria-${vistoria.id}-${dataVistoria}`,
        diffDias,
        driverId: vistoria.driver_id || null,
        phone: telefone,
        warningTitle: 'Vistoria próxima do vencimento',
        warningMessage: `Aviso: a vistoria do veículo ${placa} vence em ${diffDias} dia(s).`,
        dangerTitle: 'Vistoria vencida',
        dangerMessage: `Vencido: a vistoria do veículo ${placa} está atrasada.`,
      });
    }

    for (const contract of contractsList) {
      if (!contract.next_due_date) continue;

      if (contract.active === false) continue;

      if (
        ['paid', 'paga', 'pago', 'quitada', 'quitado'].includes(
          String(contract.payment_status ?? contract.status ?? '').toLowerCase(),
        )
      ) {
        continue;
      }

      const vencimento = new Date(`${contract.next_due_date}T00:00:00`);
      vencimento.setHours(0, 0, 0, 0);

      const diffDias = Math.ceil(
        (vencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24),
      );

      const driver = driversList.find(
        (item) => String(item.id) === String(contract.driver_id),
      );

      const nome = driver?.name || driver?.nome || 'motorista';
      const telefone = driver?.phone || driver?.telefone || null;
      const valor = Number(contract.rent_value ?? contract.amount ?? 0);

      await criarOuAtualizarAlerta({
        alertKey: `payment-${contract.id}-${contract.next_due_date}`,
        diffDias,
        driverId: contract.driver_id || null,
        phone: telefone,
        warningTitle: 'Pagamento chegando no vencimento',
        warningMessage: `Aviso: o pagamento de ${nome} vence em ${diffDias} dia(s), na data ${formatarData(contract.next_due_date)}.${valor > 0 ? ` Valor: R$ ${valor.toFixed(2)}.` : ''}`,
        dangerTitle: 'Pagamento vencido',
        dangerMessage: `Vencido: o pagamento de ${nome} está atrasado desde ${formatarData(contract.next_due_date)}.${valor > 0 ? ` Valor: R$ ${valor.toFixed(2)}.` : ''}`,
      });
    }

    if (newAutoAlerts.length > 0) {
      await supabase.from('alerts').insert(newAutoAlerts);
    }

    const { data: activeAlertsData } = await supabase
      .from('alerts')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    setAlerts((activeAlertsData || []) as AlertRow[]);
  }

  useEffect(() => {
    carregarDados();

    const interval = setInterval(() => {
      carregarDados();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const templates = [
    {
      title: 'CNH chegando no vencimento',
      message:
        'Aviso: sua CNH está chegando no vencimento. Por favor, regularize antes da data limite.',
      level: 'warning',
    },
    {
      title: 'Multa chegando no vencimento',
      message:
        'Aviso: existe uma multa chegando no vencimento. Por favor, verifique o pagamento.',
      level: 'warning',
    },
    {
      title: 'Dia do pagamento chegando',
      message:
        'Aviso: o dia do pagamento do aluguel está chegando. Por favor, se programe para evitar atraso.',
      level: 'warning',
    },
    {
      title: 'CNH vencida',
      message: 'Vencido: sua CNH está vencida. Regularize o quanto antes.',
      level: 'danger',
    },
    {
      title: 'Pagamento vencido',
      message:
        'Vencido: o pagamento do aluguel está atrasado. Regularize o quanto antes.',
      level: 'danger',
    },
  ];

  function selecionarMotorista(id: string) {
    setDriverId(id);

    const driver = drivers.find((item) => String(item.id) === String(id));

    if (driver) {
      setPhone(driver.phone || driver.telefone || '');
    }
  }

  async function salvarAlerta() {
    if (!title.trim()) {
      window.alert('Preencha o título do alerta.');
      return;
    }

    if (!message.trim()) {
      window.alert('Preencha a mensagem do alerta.');
      return;
    }

    const { error } = await supabase.from('alerts').insert({
      alert_key: `manual-${Date.now()}`,
      source: 'manual',
      level: 'warning',
      alert_type: title,
      title,
      message,
      driver_id: driverId || null,
      phone: phone || null,
      status: 'active',
    });

    if (error) {
      window.alert(`Erro ao salvar alerta: ${error.message}`);
      return;
    }

    setTitle('');
    setMessage('');
    setPhone('');
    setDriverId('');

    await carregarDados();
  }

  async function concluirAlerta(alerta: AlertRow) {
    const { error } = await supabase
      .from('alerts')
      .update({
        status: 'done',
        resolved_at: new Date().toISOString(),
      })
      .eq('id', alerta.id);

    if (error) {
      window.alert(`Erro ao concluir alerta: ${error.message}`);
      return;
    }

    setAlerts((prev) => prev.filter((item) => item.id !== alerta.id));
  }

  function abrirWhatsApp() {
    const cleanPhone = phone.replace(/\D/g, '');

    if (!cleanPhone) {
      window.alert('Digite um telefone antes de abrir o WhatsApp');
      return;
    }

    const url =
      'https://wa.me/55' + cleanPhone + '?text=' + encodeURIComponent(message);

    window.open(url, '_blank');
  }

  return (
    <div className="alertsPage">
      <section className="panel">
        <h2>Mensagens prontas</h2>

        <div className="templateGrid">
          {templates.map((item) => (
            <button
              key={item.title}
              type="button"
              className={`templateCard ${item.level}`}
              onClick={() => {
                setTitle(item.title);
                setMessage(item.message);
              }}
            >
              <strong>{item.title}</strong>
              <span>{item.message}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="panel">
        <h2>Alertas automáticos do sistema</h2>

        {alerts.length === 0 ? (
          <div className="empty">Nenhum alerta automático no momento.</div>
        ) : (
          <div className="templateGrid">
            {alerts.map((alerta) => (
              <div
                key={alerta.id}
                className={`templateCard ${alerta.level || 'warning'}`}
              >
                <strong>{alerta.title}</strong>
                <span>{alerta.message}</span>

                <div className="alertActions">
                  <button
                    type="button"
                    onClick={() => {
                      const driver = drivers.find(
                        (item) => String(item.id) === String(alerta.driver_id),
                      );

                      if (driver) {
                        setDriverId(driver.id);
                        setPhone(driver.phone || driver.telefone || '');
                      } else if (alerta.phone) {
                        setPhone(alerta.phone);
                      }

                      setTitle(alerta.title);
                      setMessage(alerta.message);
                    }}
                  >
                    Enviar alerta
                  </button>

                  <button type="button" onClick={() => concluirAlerta(alerta)}>
                    OK
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="panel">
        <h2>Criar ou editar alerta</h2>

        <div className="formGrid">
          <label>
            Título
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Pagamento vencido"
            />
          </label>

          <label>
            Motorista
            <select
              value={driverId}
              onChange={(e) => selecionarMotorista(e.target.value)}
            >
              <option value="">Selecione o motorista</option>
              {drivers.map((driver) => (
                <option key={driver.id} value={driver.id}>
                  {driver.name || driver.nome || 'Motorista sem nome'}
                </option>
              ))}
            </select>
          </label>

          <label>
            Telefone
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Digite o telefone com DDD"
            />
          </label>
        </div>

        <label className="messageField">
          Mensagem
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Mensagem do alerta"
          />
        </label>

        <div className="actions">
          <button type="button" onClick={salvarAlerta}>
            Salvar alerta
          </button>

          <button type="button" onClick={abrirWhatsApp}>
            Abrir WhatsApp
          </button>
        </div>
      </section>

      <style>{`
        .alertsPage {
          color: #06142f;
        }

        .panel {
          background: white;
          border-radius: 16px;
          padding: 14px;
          margin-bottom: 14px;
          border: 1px solid #e6edf5;
        }

        h2 {
          font-size: 18px;
          margin: 0 0 12px;
        }

        .templateGrid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 10px;
        }

        .templateCard {
          border-radius: 13px;
          padding: 11px;
          cursor: pointer;
          text-align: left;
          border: 1px solid #e6edf5;
          background: white;
        }

        .templateCard.warning {
          border-left: 5px solid #facc15;
        }

        .templateCard.danger {
          border-left: 5px solid #ef4444;
        }

        .templateCard strong {
          font-size: 13px;
          display: block;
          margin-bottom: 5px;
        }

        .templateCard span {
          font-size: 12px;
          color: #667085;
        }

        .templateCard button {
          background: #2563eb;
          color: white;
          border: none;
          padding: 7px 10px;
          border-radius: 9px;
          cursor: pointer;
          font-weight: 600;
          font-size: 12px;
        }

        .alertActions {
          margin-top: 8px;
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .formGrid {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr;
          gap: 12px;
          align-items: end;
        }

        label {
          display: flex;
          flex-direction: column;
          gap: 5px;
          font-size: 13px;
          font-weight: 600;
        }

        input,
        select,
        textarea {
          border: 1px solid #dbe3ee;
          border-radius: 10px;
          padding: 10px;
          font-size: 13px;
          width: 100%;
        }

        .messageField {
          margin-top: 12px;
          width: 100%;
        }

        .messageField textarea {
          width: 100%;
          min-height: 80px;
        }

        .actions {
          margin-top: 12px;
          display: flex;
          gap: 10px;
          justify-content: flex-start;
        }

        .actions button {
          background: #2563eb;
          color: white;
          border: none;
          padding: 8px 12px;
          border-radius: 10px;
          cursor: pointer;
          font-weight: 600;
        }

        .actions button:last-child {
          background: #22c55e;
        }

        .empty {
          text-align: center;
          padding: 15px;
          color: #667085;
        }
      `}</style>
    </div>
  );
}

export default AlertsCenter;