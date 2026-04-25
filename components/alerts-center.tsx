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
};

type Fine = {
  id: string;
  driver_id?: string;
  due_date?: string;
  status?: string;
};

type AutoAlert = {
  tipo: string;
  nivel: 'warning' | 'danger';
  texto: string;
  driver?: Driver;
  driverId?: string;
};

export function AlertsCenter() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [phone, setPhone] = useState('');
  const [driverId, setDriverId] = useState('');
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [autoAlerts, setAutoAlerts] = useState<AutoAlert[]>([]);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );

  useEffect(() => {
    async function carregarDados() {
      const { data: driversData } = await supabase.from('drivers').select('*');
      const { data: finesData } = await supabase.from('fines').select('*');

      const driversList = (driversData || []) as Driver[];
      const finesList = (finesData || []) as Fine[];

      setDrivers(driversList);

      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);

      const alertas: AutoAlert[] = [];

      driversList.forEach((driver) => {
        if (!driver.cnh_due_date) return;

        const vencimento = new Date(driver.cnh_due_date);
        vencimento.setHours(0, 0, 0, 0);

        const diffDias = Math.ceil(
          (vencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24),
        );

        const nome = driver.name || driver.nome || 'Motorista';

        if (diffDias >= 0 && diffDias <= 3) {
          alertas.push({
            tipo: 'CNH chegando no vencimento',
            nivel: 'warning',
            texto: `Aviso: a CNH de ${nome} vence em ${diffDias} dia(s). Regularize antes da data limite.`,
            driver,
          });
        }

        if (diffDias < 0) {
          alertas.push({
            tipo: 'CNH vencida',
            nivel: 'danger',
            texto: `Vencido: a CNH de ${nome} está vencida. Regularize o quanto antes.`,
            driver,
          });
        }
      });

      finesList.forEach((fine) => {
        if (!fine.due_date || fine.status === 'paid') return;

        const vencimento = new Date(fine.due_date);
        vencimento.setHours(0, 0, 0, 0);

        const diffDias = Math.ceil(
          (vencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24),
        );

        const driver = driversList.find(
          (item) => String(item.id) === String(fine.driver_id),
        );

        const nome = driver?.name || driver?.nome || 'motorista';

        if (diffDias >= 0 && diffDias <= 3) {
          alertas.push({
            tipo: 'Multa chegando no vencimento',
            nivel: 'warning',
            texto: `Aviso: existe uma multa de ${nome} vencendo em ${diffDias} dia(s). Verifique o pagamento.`,
            driver,
            driverId: fine.driver_id,
          });
        }

        if (diffDias < 0) {
          alertas.push({
            tipo: 'Multa vencida',
            nivel: 'danger',
            texto: `Vencido: existe uma multa de ${nome} atrasada. Regularize o quanto antes.`,
            driver,
            driverId: fine.driver_id,
          });
        }
      });

      setAutoAlerts(alertas);
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

        {autoAlerts.length === 0 ? (
          <div className="empty">Nenhum alerta automático no momento.</div>
        ) : (
          <div className="templateGrid">
            {autoAlerts.map((alert, index) => (
              <div key={index} className={`templateCard ${alert.nivel}`}>
                <strong>{alert.tipo}</strong>
                <span>{alert.texto}</span>

                <button
                  type="button"
                  style={{ marginTop: 8 }}
                  onClick={() => {
                    const driver =
                      alert.driver ||
                      drivers.find(
                        (item) => String(item.id) === String(alert.driverId),
                      );

                    if (driver) {
                      setDriverId(driver.id);
                      setPhone(driver.phone || driver.telefone || '');
                    }

                    setTitle(alert.tipo);
                    setMessage(alert.texto);
                  }}
                >
                  Enviar alerta
                </button>
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