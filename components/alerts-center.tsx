'use client';

import { useEffect, useMemo, useState } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';

type Driver = {
  id: string;
  name?: string | null;
  phone?: string | null;
  cnh_due_date?: string | null;
  payment_weekday?: string | null;
};

type TemplateKey = 'cobranca' | 'pagamento_chegando' | 'cnh' | 'multa' | 'vistoria';

const templates: Record<TemplateKey, { title: string; build: (driver: Driver) => string }> = {
  cobranca: {
    title: 'Cobrança em atraso',
    build: (driver) =>
      `Olá, ${driver.name ?? 'motorista'}. Identificamos pendência de pagamento no sistema Ondrive. Por favor, regularize o quanto antes ou fale com o suporte para alinharmos a situação.`,
  },
  pagamento_chegando: {
    title: 'Pagamento chegando',
    build: (driver) =>
      `Olá, ${driver.name ?? 'motorista'}. Passando para lembrar que o dia do pagamento está chegando. Pedimos que se programe para manter tudo em dia.`,
  },
  cnh: {
    title: 'Vencimento de CNH',
    build: (driver) =>
      `Olá, ${driver.name ?? 'motorista'}. Consta no sistema que sua CNH precisa de atenção quanto ao vencimento. Envie a atualização para evitarmos bloqueios operacionais.`,
  },
  multa: {
    title: 'Aviso de multa',
    build: (driver) =>
      `Olá, ${driver.name ?? 'motorista'}. Existe uma multa vinculada ao seu cadastro/veículo no sistema Ondrive. Por favor, entre em contato para orientações.`,
  },
  vistoria: {
    title: 'Aviso de vistoria',
    build: (driver) =>
      `Olá, ${driver.name ?? 'motorista'}. Sua vistoria precisa ser realizada/regularizada. Por favor, combine o melhor horário com o time de suporte.`,
  },
};

function onlyNumbers(value?: string | null) {
  return String(value ?? '').replace(/\D/g, '');
}

export function AlertsCenter() {
  const supabase = getSupabaseBrowserClient() as any;
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [driverId, setDriverId] = useState('');
  const [template, setTemplate] = useState<TemplateKey>('pagamento_chegando');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<string | null>(null);

  const selectedDriver = useMemo(
    () => drivers.find((driver) => String(driver.id) === String(driverId)),
    [drivers, driverId]
  );

  useEffect(() => {
    async function loadDrivers() {
      const { data } = await supabase
        .from('drivers')
        .select('id,name,phone,cnh_due_date,payment_weekday')
        .order('name', { ascending: true });
      setDrivers((data as Driver[]) ?? []);
    }

    void loadDrivers();
  }, [supabase]);

  useEffect(() => {
    if (!selectedDriver) {
      setMessage('');
      return;
    }
    setMessage(templates[template].build(selectedDriver));
  }, [selectedDriver, template]);

  async function copyText() {
    await navigator.clipboard.writeText(message);
    setStatus('Texto copiado. Agora é só colar no WhatsApp.');
  }

  const phone = onlyNumbers(selectedDriver?.phone);
  const whatsappUrl = phone
    ? `https://wa.me/55${phone.replace(/^55/, '')}?text=${encodeURIComponent(message)}`
    : 'https://wa.me/5511940256385';

  return (
    <div className="grid-two">
      <section className="card">
        <h2 style={{ marginTop: 0 }}>Central de alertas</h2>

        <div className="form-grid">
          <div className="field full">
            <label>Motorista</label>
            <select value={driverId} onChange={(event) => setDriverId(event.target.value)}>
              <option value="">Selecione</option>
              {drivers.map((driver) => (
                <option key={driver.id} value={driver.id}>
                  {driver.name ?? 'Sem nome'} {driver.phone ? `· ${driver.phone}` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="field full">
            <label>Tipo de alerta</label>
            <select value={template} onChange={(event) => setTemplate(event.target.value as TemplateKey)}>
              {Object.entries(templates).map(([key, item]) => (
                <option key={key} value={key}>
                  {item.title}
                </option>
              ))}
            </select>
          </div>

          <div className="field full">
            <label>Texto pronto</label>
            <textarea value={message} onChange={(event) => setMessage(event.target.value)} />
          </div>
        </div>

        {selectedDriver ? (
          <div className="card soft-card" style={{ marginTop: 16 }}>
            <strong>Telefone:</strong> {selectedDriver.phone || 'Não cadastrado'}
          </div>
        ) : null}

        {status ? <div className="alert success">{status}</div> : null}

        <div className="btn-row" style={{ marginTop: 16 }}>
          <button type="button" className="btn primary" onClick={() => void copyText()} disabled={!message}>
            Copiar texto
          </button>
          <a className="btn" href={whatsappUrl} target="_blank" rel="noreferrer">
            Abrir WhatsApp
          </a>
        </div>
      </section>

      <section className="card">
        <h2 style={{ marginTop: 0 }}>Suporte Ondrive</h2>
        <p>Telefone: 11 94025-6385</p>
        <img
          src="https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=https://wa.me/5511940256385"
          alt="QR Code WhatsApp suporte"
          style={{ maxWidth: 220, width: '100%', borderRadius: 16 }}
        />
      </section>
    </div>
  );
}
