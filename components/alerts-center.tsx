'use client';

import { useEffect, useMemo, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

type Driver = {
  id: string;
  name?: string;
  nome?: string;
  phone?: string;
  telefone?: string;
  status?: string;
  active?: boolean;
  cnh_expiration?: string;
  cnh_vencimento?: string;
};

type Fine = {
  id: string;
  driver_id?: string;
  vehicle_id?: string;
  due_date?: string;
  vencimento?: string;
  date?: string;
  amount?: number;
  value?: number;
  status?: string;
};

type Contract = {
  id: string;
  driver_id?: string;
  vehicle_id?: string;
  rent_due_date?: string;
  payment_due_date?: string;
  due_date?: string;
  vencimento_pagamento?: string;
  status?: string;
};

type SystemAlert = {
  id: string;
  type: string;
  title: string;
  message: string;
  level: 'warning' | 'danger';
  driverId?: string;
  driverName?: string;
  phone?: string;
  dueDate?: string;
  daysLeft?: number;
};

type ManualAlert = {
  id: string;
  title: string;
  message: string;
  driverId: string;
  phone: string;
  level: 'warning' | 'danger';
};

function formatDate(date?: string) {
  if (!date) return 'Sem data';

  const value = new Date(date + 'T00:00:00');

  if (Number.isNaN(value.getTime())) return 'Sem data';

  return value.toLocaleDateString('pt-BR');
}

function daysUntil(date?: string) {
  if (!date) return null;

  const today = new Date();
  const due = new Date(date + 'T00:00:00');

  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);

  if (Number.isNaN(due.getTime())) return null;

  const diff = due.getTime() - today.getTime();

  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function driverName(driver?: Driver) {
  return driver?.name || driver?.nome || 'Motorista não vinculado';
}

function driverPhone(driver?: Driver) {
  return driver?.phone || driver?.telefone || '';
}

function encodeWhatsApp(text: string) {
  return encodeURIComponent(text);
}

function getContractDueDate(contract: Contract) {
  return (
    contract.rent_due_date ||
    contract.payment_due_date ||
    contract.due_date ||
    contract.vencimento_pagamento ||
    ''
  );
}

function getFineDueDate(fine: Fine) {
  return fine.due_date || fine.vencimento || fine.date || '';
}

function getDriverCnhDate(driver: Driver) {
  return driver.cnh_expiration || driver.cnh_vencimento || '';
}

export function AlertsCenter() {
  const supabase = createSupabaseBrowserClient();

  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [fines, setFines] = useState<Fine[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [manualAlerts, setManualAlerts] = useState<ManualAlert[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState<ManualAlert>({
    id: '',
    title: '',
    message: '',
    driverId: '',
    phone: '',
    level: 'warning',
  });

  useEffect(() => {
    async function loadData() {
      const [driversRes, finesRes, contractsRes] = await Promise.all([
        supabase.from('drivers').select('*'),
        supabase.from('fines').select('*'),
        supabase.from('contracts').select('*'),
      ]);

      setDrivers((driversRes.data || []) as Driver[]);
      setFines((finesRes.data || []) as Fine[]);
      setContracts((contractsRes.data || []) as Contract[]);
    }

    loadData();

    const saved = localStorage.getItem('ondrive_manual_alerts');

    if (saved) {
      setManualAlerts(JSON.parse(saved));
    }
  }, [supabase]);

  useEffect(() => {
    localStorage.setItem('ondrive_manual_alerts', JSON.stringify(manualAlerts));
  }, [manualAlerts]);

  const selectedDriver = useMemo(
    () => drivers.find((driver) => String(driver.id) === String(form.driverId)),
    [drivers, form.driverId],
  );

  const systemAlerts = useMemo<SystemAlert[]>(() => {
    const alerts: SystemAlert[] = [];

    drivers.forEach((driver) => {
      const dueDate = getDriverCnhDate(driver);
      const days = daysUntil(dueDate);

      if (days === null) return;

      if (days >= 0 && days <= 3) {
        alerts.push({
          id: `cnh-warning-${driver.id}`,
          type: 'CNH',
          title: 'CNH chegando no vencimento',
          message: `Olá, ${driverName(driver)}. Sua CNH vence em ${formatDate(dueDate)}. Por favor, regularize antes do vencimento.`,
          level: 'warning',
          driverId: driver.id,
          driverName: driverName(driver),
          phone: driverPhone(driver),
          dueDate,
          daysLeft: days,
        });
      }

      if (days < 0) {
        alerts.push({
          id: `cnh-danger-${driver.id}`,
          type: 'CNH',
          title: 'CNH vencida',
          message: `Olá, ${driverName(driver)}. Sua CNH venceu em ${formatDate(dueDate)}. Regularize o quanto antes para evitar bloqueios na operação.`,
          level: 'danger',
          driverId: driver.id,
          driverName: driverName(driver),
          phone: driverPhone(driver),
          dueDate,
          daysLeft: days,
        });
      }
    });

    fines.forEach((fine) => {
      const dueDate = getFineDueDate(fine);
      const days = daysUntil(dueDate);
      const driver = drivers.find((item) => String(item.id) === String(fine.driver_id));

      if (days === null) return;

      if (days >= 0 && days <= 3) {
        alerts.push({
          id: `fine-warning-${fine.id}`,
          type: 'Multa',
          title: 'Multa chegando no vencimento',
          message: `Olá, ${driverName(driver)}. Existe uma multa com vencimento em ${formatDate(dueDate)}. Por favor, verifique o pagamento.`,
          level: 'warning',
          driverId: driver?.id,
          driverName: driverName(driver),
          phone: driverPhone(driver),
          dueDate,
          daysLeft: days,
        });
      }

      if (days < 0) {
        alerts.push({
          id: `fine-danger-${fine.id}`,
          type: 'Multa',
          title: 'Multa vencida',
          message: `Olá, ${driverName(driver)}. Existe uma multa vencida desde ${formatDate(dueDate)}. Regularize o quanto antes.`,
          level: 'danger',
          driverId: driver?.id,
          driverName: driverName(driver),
          phone: driverPhone(driver),
          dueDate,
          daysLeft: days,
        });
      }
    });

    contracts.forEach((contract) => {
      const dueDate = getContractDueDate(contract);
      const days = daysUntil(dueDate);
      const driver = drivers.find((item) => String(item.id) === String(contract.driver_id));

      if (days === null) return;

      if (days >= 0 && days <= 3) {
        alerts.push({
          id: `payment-warning-${contract.id}`,
          type: 'Pagamento',
          title: 'Dia do pagamento chegando',
          message: `Olá, ${driverName(driver)}. O pagamento do aluguel vence em ${formatDate(dueDate)}. Por favor, se programe para evitar atraso.`,
          level: 'warning',
          driverId: driver?.id,
          driverName: driverName(driver),
          phone: driverPhone(driver),
          dueDate,
          daysLeft: days,
        });
      }

      if (days < 0) {
        alerts.push({
          id: `payment-danger-${contract.id}`,
          type: 'Pagamento',
          title: 'Pagamento vencido',
          message: `Olá, ${driverName(driver)}. O pagamento do aluguel está vencido desde ${formatDate(dueDate)}. Regularize o quanto antes.`,
          level: 'danger',
          driverId: driver?.id,
          driverName: driverName(driver),
          phone: driverPhone(driver),
          dueDate,
          daysLeft: days,
        });
      }
    });

    return alerts;
  }, [drivers, fines, contracts]);

  function handleDriverChange(driverId: string) {
    const driver = drivers.find((item) => String(item.id) === String(driverId));

    setForm((current) => ({
      ...current,
      driverId,
      phone: driverPhone(driver),
    }));
  }

  function saveManualAlert() {
    if (!form.title.trim() || !form.message.trim()) return;

    const payload: ManualAlert = {
      ...form,
      id: editingId || crypto.randomUUID(),
    };

    if (editingId) {
      setManualAlerts((current) =>
        current.map((alert) => (alert.id === editingId ? payload : alert)),
      );
    } else {
      setManualAlerts((current) => [payload, ...current]);
    }

    setEditingId(null);
    setForm({
      id: '',
      title: '',
      message: '',
      driverId: '',
      phone: '',
      level: 'warning',
    });
  }

  function editManualAlert(alert: ManualAlert) {
    setEditingId(alert.id);
    setForm(alert);
  }

  function removeManualAlert(id: string) {
    setManualAlerts((current) => current.filter((alert) => alert.id !== id));
  }

  const templates = [
    {
      title: 'CNH chegando no vencimento',
      level: 'warning',
      message:
        'Olá, sua CNH está chegando no vencimento. Por favor, regularize antes da data limite.',
    },
    {
      title: 'Multa chegando no vencimento',
      level: 'warning',
      message:
        'Olá, existe uma multa chegando no vencimento. Por favor, verifique o pagamento.',
    },
    {
      title: 'CNH vencida',
      level: 'danger',
      message:
        'Olá, sua CNH está vencida. Regularize o quanto antes para evitar bloqueios na operação.',
    },
    {
      title: 'Dia do pagamento chegando',
      level: 'warning',
      message:
        'Olá, o dia do pagamento do aluguel está chegando. Por favor, se programe para evitar atraso.',
    },
    {
      title: 'Pagamento vencido',
      level: 'danger',
      message:
        'Olá, o pagamento do aluguel está vencido. Regularize o quanto antes.',
    },
  ];

  return (
    <div className="alertsPage">
      <h1>Alertas</h1>

      <section className="panel">
        <h2>Mensagens prontas</h2>

        <div className="templateGrid">
          {templates.map((template) => (
            <button
              key={template.title}
              className={`templateCard ${template.level}`}
              type="button"
              onClick={() =>
                setForm((current) => ({
                  ...current,
                  title: template.title,
                  message: template.message,
                  level: template.level as 'warning' | 'danger',
                }))
              }
            >
              <strong>{template.title}</strong>
              <span>{template.message}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="sectionHeader">
          <h2>Alertas automáticos do sistema</h2>
          <span>{systemAlerts.length} alerta(s)</span>
        </div>

        <div className="alertList">
          {systemAlerts.length === 0 ? (
            <div className="empty">Nenhum alerta automático no momento.</div>
          ) : (
            systemAlerts.map((alert) => (
              <div key={alert.id} className={`alertCard ${alert.level}`}>
                <div>
                  <strong>{alert.title}</strong>
                  <p>{alert.message}</p>
                  <small>
                    Motorista: {alert.driverName} | Vencimento: {formatDate(alert.dueDate)}
                  </small>
                </div>

                {alert.phone ? (
                  <a
                    className="whatsButton"
                    href={`https://wa.me/55${alert.phone.replace(/\D/g, '')}?text=${encodeWhatsApp(alert.message)}`}
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
        <h2>{editingId ? 'Editar alerta manual' : 'Criar alerta manual'}</h2>

        <div className="formGrid">
          <label>
            Título
            <input
              value={form.title}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
              placeholder="Ex: Pagamento vencido"
            />
          </label>

          <label>
            Motorista
            <select
              value={form.driverId}
              onChange={(event) => handleDriverChange(event.target.value)}
            >
              <option value="">Selecione o motorista</option>
              {drivers.map((driver) => (
                <option key={driver.id} value={driver.id}>
                  {driverName(driver)}
                </option>
              ))}
            </select>
          </label>

          <label>
            Telefone
            <input
              value={form.phone}
              onChange={(event) => setForm({ ...form, phone: event.target.value })}
              placeholder="Telefone do motorista"
            />
          </label>

          <label>
            Tipo
            <select
              value={form.level}
              onChange={(event) =>
                setForm({ ...form, level: event.target.value as 'warning' | 'danger' })
              }
            >
              <option value="warning">Aviso amarelo</option>
              <option value="danger">Vencido vermelho</option>
            </select>
          </label>
        </div>

        <label className="messageField">
          Mensagem
          <textarea
            value={form.message}
            onChange={(event) => setForm({ ...form, message: event.target.value })}
            placeholder="Digite a mensagem do alerta"
          />
        </label>

        <div className="actions">
          <button type="button" onClick={saveManualAlert}>
            {editingId ? 'Salvar edição' : 'Criar alerta'}
          </button>

          {form.phone && form.message ? (
            <a
              href={`https://wa.me/55${form.phone.replace(/\D/g, '')}?text=${encodeWhatsApp(form.message)}`}
              target="_blank"
            >
              Enviar WhatsApp
            </a>
          ) : null}
        </div>

        <div className="manualList">
          {manualAlerts.map((alert) => {
            const driver = drivers.find((item) => String(item.id) === String(alert.driverId));

            return (
              <div key={alert.id} className={`manualCard ${alert.level}`}>
                <div>
                  <strong>{alert.title}</strong>
                  <p>{alert.message}</p>
                  <small>Motorista: {driverName(driver)}</small>
                </div>

                <div className="manualActions">
                  <button type="button" onClick={() => editManualAlert(alert)}>
                    Editar
                  </button>
                  <button type="button" onClick={() => removeManualAlert(alert.id)}>
                    Excluir
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <style>{`
        .alertsPage {
          padding: 10px 26px 18px;
          background: #eef3f8;
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
          text-align: left;
          background: white;
          cursor: pointer;
        }

        .templateCard strong {
          display: block;
          font-size: 13px;
          margin-bottom: 6px;
        }

        .templateCard span {
          display: block;
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

        .alertCard,
        .manualCard {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          border-radius: 13px;
          padding: 11px 12px;
          border: 1px solid #e6edf5;
          align-items: center;
        }

        .alertCard.warning,
        .manualCard.warning {
          background: #fefce8;
          border-left: 5px solid #facc15;
        }

        .alertCard.danger,
        .manualCard.danger {
          background: #fef2f2;
          border-left: 5px solid #ef4444;
        }

        .alertCard strong,
        .manualCard strong {
          font-size: 13px;
        }

        .alertCard p,
        .manualCard p {
          font-size: 12px;
          color: #344054;
          margin: 4px 0;
        }

        .alertCard small,
        .manualCard small {
          font-size: 11px;
          color: #667085;
        }

        .whatsButton,
        .actions a,
        .actions button {
          border: 0;
          background: #22c55e;
          color: white;
          padding: 8px 12px;
          border-radius: 10px;
          font-size: 12px;
          font-weight: 700;
          text-decoration: none;
          cursor: pointer;
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
          min-height: 72px;
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

        .manualList {
          display: grid;
          gap: 9px;
          margin-top: 12px;
        }

        .manualActions {
          display: flex;
          gap: 8px;
        }

        .manualActions button {
          border: 0;
          background: #f1f5f9;
          color: #06142f;
          padding: 7px 10px;
          border-radius: 9px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
        }

        .empty {
          text-align: center;
          color: #667085;
          font-size: 13px;
          padding: 18px;
          background: #f8fafc;
          border-radius: 13px;
        }

        @media (max-width: 1300px) {
          .templateGrid {
            grid-template-columns: repeat(2, 1fr);
          }

          .formGrid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
    </div>
  );
}

export default AlertsCenter;
