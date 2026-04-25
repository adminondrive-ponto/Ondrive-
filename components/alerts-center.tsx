'use client';

import { useState } from 'react';

type Driver = {
  id: string;
  name?: string;
  nome?: string;
  phone?: string;
  telefone?: string;
};

function nomeMotorista(driver?: Driver) {
  return driver?.name || driver?.nome || 'Motorista não vinculado';
}

function telefoneMotorista(driver?: Driver) {
  return driver?.phone || driver?.telefone || '';
}

export default function AlertsCenter() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [phone, setPhone] = useState('');

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

        <div className="empty">
          Nenhum alerta automático no momento.
        </div>
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
          <button>Salvar alerta</button>

          <button onClick={abrirWhatsApp}>
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
          margin-bottom: 12px;
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
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        input,
        textarea {
          border: 1px solid #dbe3ee;
          border-radius: 10px;
          padding: 8px;
          font-size: 13px;
        }

        .messageField {
          margin-top: 10px;
        }

        .actions {
          margin-top: 10px;
          display: flex;
          gap: 10px;
        }

        .actions button {
          background: #2563eb;
          color: white;
          border: none;
          padding: 8px 12px;
          border-radius: 10px;
          cursor: pointer;
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
