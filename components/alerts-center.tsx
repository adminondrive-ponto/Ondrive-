import { createSupabaseServerClient } from '@/lib/supabase/server';

type Driver = {
  id: string;
  name?: string;
  nome?: string;
  phone?: string;
  telefone?: string;
  cnh_expiration?: string;
  cnh_vencimento?: string;
};

type Fine = {
  id: string;
  driver_id?: string;
  due_date?: string;
  vencimento?: string;
  date?: string;
};

type Contract = {
  id: string;
  driver_id?: string;
  rent_due_date?: string;
  payment_due_date?: string;
  due_date?: string;
  vencimento_pagamento?: string;
};

function nomeMotorista(driver?: Driver) {
  return driver?.name || driver?.nome || 'Motorista não vinculado';
}

function telefoneMotorista(driver?: Driver) {
  return driver?.phone || driver?.telefone || '';
}

function formatarData(data?: string) {
  if (!data) return 'Sem data';

  const value = new Date(`${data}T00:00:00`);

  if (Number.isNaN(value.getTime())) return 'Sem data';

  return value.toLocaleDateString('pt-BR');
}

function diasAte(data?: string) {
  if (!data) return null;

  const hoje = new Date();
  const vencimento = new Date(`${data}T00:00:00`);

  hoje.setHours(0, 0, 0, 0);
  vencimento.setHours(0, 0, 0, 0);

  if (Number.isNaN(vencimento.getTime())) return null;

  return Math.ceil((vencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
}

function linkWhatsApp(phone?: string, message?: string) {
  const telefone = String(phone || '').replace(/\D/g, '');

  if (!telefone) return '#';

  return `https://wa.me/55${telefone}?text=${encodeURIComponent(message || '')}`;
}

export default async function AlertsCenter() {
  const supabase = await createSupabaseServerClient();

  const [driversRes, finesRes, contractsRes] = await Promise.all([
    supabase.from('drivers').select('*'),
    supabase.from('fines').select('*'),
    supabase.from('contracts').select('*'),
  ]);

  const drivers = (driversRes.data || []) as Driver[];
  const fines = (finesRes.data || []) as Fine[];
  const contracts = (contractsRes.data || []) as Contract[];

  const automaticAlerts: {
    title: string;
    message: string;
    date?: string;
    driver?: Driver;
    level: 'warning' | 'danger';
  }[] = [];

  drivers.forEach((driver) => {
    const cnhDate = driver.cnh_expiration || driver.cnh_vencimento;
    const days = diasAte(cnhDate);

    if (days !== null && days >= 0 && days <= 3) {
      automaticAlerts.push({
        title: 'CNH chegando no vencimento',
        message: `Olá, ${nomeMotorista(driver)}. Sua CNH vence em ${formatarData(cnhDate)}. Por favor, regularize antes do vencimento.`,
        date: cnhDate,
        driver,
        level: 'warning',
      });
    }

    if (days !== null && days < 0) {
      automaticAlerts.push({
        title: 'CNH vencida',
        message: `Olá, ${nomeMotorista(driver)}. Sua CNH venceu em ${formatarData(cnhDate)}. Regularize o quanto antes.`,
        date: cnhDate,
        driver,
        level: 'danger',
      });
    }
  });

  fines.forEach((fine) => {
    const fineDate = fine.due_date || fine.vencimento || fine.date;
    const days = diasAte(fineDate);
    const driver = drivers.find((item) => String(item.id) === String(fine.driver_id));

    if (days !== null && days >= 0 && days <= 3) {
      automaticAlerts.push({
        title: 'Multa chegando no vencimento',
        message: `Olá, ${nomeMotorista(driver)}. Existe uma multa com vencimento em ${formatarData(fineDate)}. Por favor, verifique o pagamento.`,
        date: fineDate,
        driver,
        level: 'warning',
      });
    }

    if (days !== null && days < 0) {
      automaticAlerts.push({
        title: 'Multa vencida',
        message: `Olá, ${nomeMotorista(driver)}. Existe uma multa vencida desde ${formatarData(fineDate)}. Regularize o quanto antes.`,
        date: fineDate,
        driver,
        level: 'danger',
      });
    }
  });

  contracts.forEach((contract) => {
    const paymentDate =
      contract.rent_due_date ||
      contract.payment_due_date ||
      contract.due_date ||
      contract.vencimento_pagamento;

    const days = diasAte(paymentDate);
    const driver = drivers.find((item) => String(item.id) === String(contract.driver_id));

    if (days !== null && days >= 0 && days <= 3) {
      automaticAlerts.push({
        title: 'Dia do pagamento chegando',
        message: `Olá, ${nomeMotorista(driver)}. O pagamento do aluguel vence em ${formatarData(paymentDate)}. Por favor, se programe para evitar atraso.`,
        date: paymentDate,
        driver,
        level: 'warning',
      });
    }

    if (days !== null && days < 0) {
      automaticAlerts.push({
        title: 'Pagamento vencido',
        message: `Olá, ${nomeMotorista(driver)}. O pagamento do aluguel está vencido desde ${formatarData(paymentDate)}. Regularize o quanto antes.`,
        date: paymentDate,
        driver,
        level: 'danger',
      });
    }
  });

  const templates = [
    {
      title: 'CNH chegando no vencimento',
      text: 'Aviso: a CNH está chegando no vencimento.',
      level: 'warning',
    },
    {
      title: 'Multa chegando no vencimento',
      text: 'Aviso: existe uma multa chegando no vencimento.',
      level: 'warning',
    },
    {
      title: 'Dia do pagamento chegando',
      text: 'Aviso: o dia do pagamento do aluguel está chegando.',
      level: 'warning',
    },
    {
      title: 'CNH vencida',
      text: 'Vencido: a CNH está vencida.',
      level: 'danger',
    },
    {
      title: 'Pagamento vencido',
      text: 'Vencido: o pagamento do aluguel está atrasado.',
      level: 'danger',
    },
  ];

  return (
    <div className="alertsPage">
      <h1>Alertas</h1>

      <section className="panel">
        <h2>Mensagens prontas</h2>

        <div className="templateGrid">
          {templates.map((item) => (
            <div key={item.title} className={`templateCard ${item.level}`}>
              <strong>{item.title}</strong>
              <span>{item.text}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="sectionHeader">
          <h2>Alertas automáticos do sistema</h2>
          <span>{automaticAlerts.length} alerta(s)</span>
        </div>

        <div className="alertList">
          {automaticAlerts.length === 0 ? (
            <div className="empty">Nenhum alerta automático no momento.</div>
          ) : (
            automaticAlerts.map((alert, index) => (
              <div key={index} className={`alertCard ${alert.level}`}>
                <div>
                  <strong>{alert.title}</strong>
                  <p>{alert.message}</p>
                  <small>
                    Motorista: {nomeMotorista(alert.driver)} | Vencimento:{' '}
                    {formatarData(alert.date)}
                  </small>
                </div>

                {telefoneMotorista(alert.driver) ? (
                  <a
                    className="whatsButton"
                    href={linkWhatsApp(telefoneMotorista(alert.driver), alert.message)}
                    target="_blank"
                  >
                    Enviar WhatsApp
                  </a>
                ) : (
                  <span className="noPhone">Sem telefone</span>
                )}
              </div>
            ))
          )}
        </div>
      </section>

      <section className="panel">
        <h2>Criar ou editar alerta</h2>

        <div className="formGrid">
          <label>
            Título
            <input placeholder="Ex: Pagamento vencido" />
          </label>

          <label>
            Motorista
            <select>
              <option>Selecione o motorista</option>
              {drivers.map((driver) => (
                <option key={driver.id}>{nomeMotorista(driver)}</option>
              ))}
            </select>
          </label>

          <label>
            Telefone
            <select>
              <option>Selecione o telefone</option>
              {drivers.map((driver) => (
                <option key={driver.id}>
                  {nomeMotorista(driver)} - {telefoneMotorista(driver) || 'Sem telefone'}
                </option>
              ))}
            </select>
          </label>

          <label>
            Tipo
            <select>
              <option>Aviso amarelo</option>
              <option>Vencido vermelho</option>
            </select>
          </label>
        </div>

        <label className="messageField">
          Mensagem
          <textarea placeholder="Digite ou edite a mensagem do alerta" />
        </label>

        <div className="actions">
          <button type="button">Salvar alerta</button>
          <button type="button" className="secondary">
            Editar alerta
          </button>
        </div>
      </section>

      <style>{`
        .alertsPage {
          color: #06142f;
        }

        h1 {
          font-size: 28px;
          margin: 0 0 18px;
          font-weight: 800;
        }

        .panel {
          background: white;
          border-radius: 16px;
          padding: 14px;
          margin-bottom: 14px;
          border: 1px solid #e6edf5;
          box-shadow: 0 6px 16px rgba(15, 23, 42, 0.04);
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
          border: 1px solid #e6edf5;
          border-radius: 13px;
          padding: 11px;
          background: white;
        }

        .templateCard strong {
          display: block;
          font-size: 13px;
          margin-bottom: 6px;
        }

        .templateCard span {
          font-size: 12px;
          color: #667085;
          line-height: 1.35;
        }

        .templateCard.warning {
          border-left: 5px solid #facc15;
        }

        .templateCard.danger {
          border-left: 5px solid #ef4444;
        }

        .sectionHeader {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .sectionHeader span {
          font-size: 12px;
          color: #667085;
          background: #f1f5f9;
          padding: 5px 9px;
          border-radius: 999px;
        }

        .alertList {
          display: grid;
          gap: 9px;
        }

        .alertCard {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          border-radius: 13px;
          padding: 11px 12px;
          border: 1px solid #e6edf5;
        }

        .alertCard.warning {
          background: #fefce8;
          border-left: 5px solid #facc15;
        }

        .alertCard.danger {
          background: #fef2f2;
          border-left: 5px solid #ef4444;
        }

        .alertCard strong {
          font-size: 13px;
        }

        .alertCard p {
          font-size: 12px;
          color: #344054;
          margin: 4px 0;
        }

        .alertCard small {
          font-size: 11px;
          color: #667085;
        }

        .whatsButton {
          background: #22c55e;
          color: white;
          padding: 8px 12px;
          border-radius: 10px;
          font-size: 12px;
          font-weight: 700;
          text-decoration: none;
          white-space: nowrap;
        }

        .noPhone {
          background: #f1f5f9;
          color: #475569;
          padding: 6px 10px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 700;
        }

        .formGrid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
        }

        label {
          display: flex;
          flex-direction: column;
          font-size: 12px;
          font-weight: 700;
          color: #344054;
          gap: 5px;
        }

        input,
        select,
        textarea {
          border: 1px solid #dbe3ee;
          border-radius: 10px;
          padding: 9px 10px;
          font-size: 13px;
          outline: none;
          background: white;
          color: #06142f;
        }

        textarea {
          min-height: 64px;
          resize: vertical;
        }

        .messageField {
          margin-top: 10px;
        }

        .actions {
          display: flex;
          gap: 10px;
          margin-top: 10px;
        }

        .actions button {
          border: 0;
          background: #2563eb;
          color: white;
          padding: 8px 12px;
          border-radius: 10px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
        }

        .actions .secondary {
          background: #f1f5f9;
          color: #06142f;
        }

        .empty {
          text-align: center;
          color: #667085;
          font-size: 13px;
          padding: 18px;
          background: #f8fafc;
          border-radius: 13px;
        }
      `}</style>
    </div>
  );
}
