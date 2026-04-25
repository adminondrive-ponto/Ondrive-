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
  cnh_expiration?: string;
  license_expiration?: string;
};

type AutoAlert = {
  id: string;
  title: string;
  message: string;
  level: 'warning' | 'danger';
  phone?: string;
  driverId?: string;
};

export function AlertsCenter() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [phone, setPhone] = useState('');
  const [driverId, setDriverId] = useState('');
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [automaticAlerts, setAutomaticAlerts] = useState<AutoAlert[]>([]);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );

  function diasAteVencimento(data: string) {
    const hoje = new Date();
    const vencimento = new Date(data);

    hoje.setHours(0, 0, 0, 0);
    vencimento.setHours(0, 0, 0, 0);

    return Math.ceil(
      (vencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24),
    );
  }

  function formatarData(data: string) {
    return new Date(data).toLocaleDateString('pt-BR', {
      timeZone: 'UTC',
    });
  }

  function criarAlerta(
    id: string,
    tituloBase: string,
    dataVencimento: string,
    motorista?: Driver,
  ): AutoAlert | null {
    const dias = diasAteVencimento(dataVencimento);

    if (dias > 3) return null;

    const vencido = dias < 0;
    const hoje = dias === 0;

    const nomeMotorista =
      motorista?.name || motorista?.nome || 'motorista selecionado';

    return {
      id,
      title: vencido
        ? `${tituloBase} vencido`
        : hoje
          ? `${tituloBase} vence hoje`
          : `${tituloBase} próximo do vencimento`,
      message: vencido
        ? `Vencido: ${tituloBase} de ${nomeMotorista} venceu em ${formatarData(
            dataVencimento,
          )}. Regularize o quanto antes.`
        : `Aviso: ${tituloBase} de ${nomeMotorista} vence em ${formatarData(
            dataVencimento,
          )}. Faltam ${dias} dia(s).`,
      level: vencido ? 'danger' : 'warning',
      phone: motorista?.phone || motorista?.telefone || '',
      driverId: motorista?.id,
    };
  }

  useEffect(() => {
    async function carregarDados() {
      const { data: driversData } = await supabase.from('drivers').select('*');
      const listaMotoristas = (driversData || []) as Driver[];

      setDrivers(listaMotoristas);

      const novosAlertas: AutoAlert[] = [];

      listaMotoristas.forEach((driver) => {
        const dataCnh =
          driver.cnh_due_date ||
          driver.cnh_expiration ||
          driver.license_expiration;

        if (!dataCnh) return;

        const alerta = criarAlerta(
          `cnh-${driver.id}-${dataCnh}`,
          'CNH',
          dataCnh,
          driver,
        );

        if (alerta) novosAlertas.push(alerta);
      });

      const { data: multas } = await supabase.from('fines').select('*');

      multas?.forEach((multa: any) => {
        const dataVencimento =
          multa.due_date || multa.payment_date || multa.date;

        if (!dataVencimento || multa.paid === true) return;

        const motorista = listaMotoristas.find(
          (driver) => String(driver.id) === String(multa.driver_id),
        );

        const alerta = criarAlerta(
          `multa-${multa.id}-${dataVencimento}`,
          'Multa',
          dataVencimento,
          motorista,
        );

        if (alerta) novosAlertas.push(alerta);
      });

      const { data: financeiro } = await supabase
        .from('financial')
        .select('*');

      financeiro?.forEach((pagamento: any) => {
        const dataVencimento =
          pagamento.due_date || pagamento.payment_date || pagamento.date;

        if (!dataVencimento || pagamento.paid === true) return;

        const motorista = listaMotoristas.find(
          (driver) => String(driver.id) === String(pagamento.driver_id),
        );

        const alerta = criarAlerta(
          `pagamento-${pagamento.id}-${dataVencimento}`,
          'Pagamento do aluguel',
          dataVencimento,
          motorista,
        );

        if (alerta) novosAlertas.push(alerta);
      });

      const { data: contratos } = await supabase
        .from('contracts')
        .select('*');

      contratos?.forEach((contrato: any) => {
        const dataVencimento =
          contrato.due_date ||
          contrato.payment_date ||
          contrato.end_date ||
          contrato.date;

        if (!dataVencimento || contrato.paid === true) return;

        const motorista = listaMotoristas.find(
          (driver) => String(driver.id) === String(contrato.driver_id),
        );

        const alerta = criarAlerta(
          `contrato-${contrato.id}-${dataVencimento}`,
          'Contrato',
          dataVencimento,
          motorista,
        );

        if (alerta) novosAlertas.push(alerta);
      });

      setAutomaticAlerts(novosAlertas);
    }

    carregarDados();
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
      message: 'Vencido: o pagamento do aluguel está atrasado. Regularize o quanto antes.',
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

  function selecionarAlertaAutomatico(alerta: AutoAlert) {
    setTitle(alerta.title);
    setMessage(alerta.message);
    setPhone(alerta.phone || '');
    setDriverId(alerta.driverId || '');
  }

  function abrirWhatsApp() {
    const cleanPhone = phone.replace(/\D/g, '');

    if (!cleanPhone) {
      alert('Digite um telefone antes de abrir o WhatsApp');
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

        {automaticAlerts.length === 0 ? (
          <div className="empty">Nenhum alerta automático no momento.</div>
        ) : (
          <div className="templateGrid">
            {automaticAlerts.map((alerta) => (
              <button
                key={alerta.id}
                type="button"
                className={`templateCard ${alerta.level}`}
                onClick={() => selecionarAlertaAutomatico(alerta)}
              >
                <strong>{alerta.title}</strong>
                <span>{alerta.message}</span>
              </button>
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
          <button type="button">Salvar alerta</button>

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
