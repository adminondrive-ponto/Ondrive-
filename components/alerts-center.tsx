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

export async function AlertsCenter() {
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
    const phone = telefoneMotorista(driver);
    if (!phone) return;

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
    const driver = drivers.find((item) => String(item.id) === String(fine.driver_id));
    const phone = telefoneMotorista(driver);
    if (!driver || !phone) return;

    const fineDate = fine.due_date || fine.vencimento || fine.date;
    const days = diasAte(fineDate);

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
    const driver = drivers.find((item) => String(item.id) === String(contract.driver_id));
    const phone = telefoneMotorista(driver);
    if (!driver || !phone) return;

    const paymentDate =
      contract.rent_due_date ||
      contract.payment_due_date ||
      contract.due_date ||
      contract.vencimento_pagamento;

    const days = diasAte(paymentDate);

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
      text: 'Aviso: sua CNH está chegando no vencimento. Por favor, regularize antes da data limite.',
      level: 'warning',
    },
    {
      title: 'Multa chegando no vencimento',
      text: 'Aviso: existe uma multa chegando no vencimento. Por favor, verifique o pagamento.',
      level: 'warning',
    },
    {
      title: 'Dia do pagamento chegando',
      text: 'Aviso: o dia do pagamento do aluguel está chegando. Por favor, se programe para evitar atraso.',
      level: 'warning',
    },
    {
      title: 'CNH vencida',
      text: 'Vencido: sua CNH está vencida. Regularize o quanto antes.',
      level: 'danger',
    },
    {
      title: 'Pagamento vencido',
      text: 'Vencido: o pagamento do aluguel está atrasado. Regularize o quanto antes.',
      level: 'danger',
    },
  ];

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
              data-title={item.title}
              data-message={item.text}
            >
              <strong>{item.title}</strong>
              <span>{item.text}</span>
            </button>
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

                <a
                  className="whatsButton"
                  href={linkWhatsApp(telefoneMotorista(alert.driver), alert.message)}
                  target="_blank"
                >
                  Enviar WhatsApp
                </a>
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
            <input id="alertTitle" placeholder="Ex: Pagamento vencido" />
          </label>

          <label>
            Motorista
            <select id="driverSelect">
              <option value="">Selecione o motorista</option>
              {drivers.map((driver) => (
                <option key={driver.id} value={driver.id} data-phone={telefoneMotorista(driver)}>
                  {nomeMotorista(driver)}
                </option>
              ))}
            </select>
          </label>

          <label>
            Telefone
            <input id="driverPhone" placeholder="Digite ou selecione o telefone" />
          </label>
        </div>

        <label className="messageField">
          Mensagem
          <textarea id="alertMessage" placeholder="Digite ou edite a mensagem do alerta" />
        </label>

        <div className="actions">
          <button type="button">Salvar alerta</button>
          <a id="manualWhatsApp" href="#" target="_blank">
            Abrir WhatsApp
          </a>
        </div>
      </section>

      <script
        dangerouslySetInnerHTML={{
          __html: `
            function atualizarWhatsApp() {
              const phone = document.getElementById('driverPhone')?.value || '';
              const message = document.getElementById('alertMessage')?.value || '';
              const link = document.getElementById('manualWhatsApp');
              if (!link) return;

              const cleanPhone = phone.replace(/\\D/g, '');

              if (!cleanPhone) {
                link.href = '#';
                return;
              }

              link.href = 'https://wa.me/55' + cleanPhone + '?text=' + encodeURIComponent(message);
            }

            document.querySelectorAll('.templateCard').forEach(function(card) {
              card.addEventListener('click', function() {
                const title = card.getAttribute('data-title') || '';
                const message = card.getAttribute('data-message') || '';

                const titleInput = document.getElementById('alertTitle');
                const messageInput = document.getElementById('alertMessage');

                if (titleInput) titleInput.value = title;
                if (messageInput) messageInput.value = message;

                atualizarWhatsApp();
              });
            });

            const driverSelect = document.getElementById('driverSelect');

            if (driverSelect) {
              driverSelect.addEventListener('change', function() {
                const selected = driverSelect.options[driverSelect.selectedIndex];
                const phone = selected?.getAttribute('data-phone') || '';
                const phoneInput = document.getElementById('driverPhone');

                if (phoneInput) phoneInput.value = phone;

                atualizarWhatsApp();
              });
            }

            const phoneInput = document.getElementById('driverPhone');
            if (phoneInput) {
              phoneInput.addEventListener('input', atualizarWhatsApp);
            }

            const messageInput = document.getElementById('alertMessage');
            if (messageInput) {
              messageInput.addEventListener('input', atualizarWhatsApp);
            }
          `,
        }}
      />

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
          text-align: left;
          cursor: pointer;
        }

        .templateCard:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 14px rgba(15, 23, 42, 0.08);
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

        .whatsButton,
        .actions a,
        .actions button {
          background: #22c55e;
          color: white;
          padding: 8px 12px;
          border-radius: 10px;
          font-size: 12px;
          font-weight: 700;
          text-decoration: none;
          white-space: nowrap;
          border: 0;
          cursor: pointer;
        }

        .actions button {
          background: #2563eb;
        }

        .formGrid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
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

export default AlertsCenter;
