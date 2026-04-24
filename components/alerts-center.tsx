'use client';

import { useEffect, useMemo, useState } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';

type Driver = {
  id: string;
  name?: string | null;
  phone?: string | null;
  cnh_due_date?: string | null;
};

type AlertType =
  | 'cnh_vencendo'
  | 'multa_vencendo'
  | 'aluguel_vencendo'
  | 'venda_vencendo'
  | 'revisao'
  | 'cnh_vencida';

const alertTemplates: Record<AlertType, { title: string; messages: string[] }> = {
  cnh_vencendo: {
    title: 'CNH vencendo',
    messages: [
      'Olá, sua CNH está próxima do vencimento. Regularize para evitar bloqueios.',
      'Atenção: sua CNH está vencendo em breve. Precisamos da atualização.',
    ],
  },
  cnh_vencida: {
    title: 'CNH vencida',
    messages: [
      'Sua CNH está vencida. Regularização obrigatória imediata.',
    ],
  },
  multa_vencendo: {
    title: 'Multa vencendo',
    messages: [
      'Existe uma multa próxima do vencimento. Regularize para evitar juros.',
    ],
  },
  aluguel_vencendo: {
    title: 'Aluguel vencendo',
    messages: [
      'Seu pagamento está próximo do vencimento. Organize-se para evitar atraso.',
    ],
  },
  venda_vencendo: {
    title: 'Venda vencendo',
    messages: [
      'Parcela da venda próxima do vencimento. Atenção ao prazo.',
    ],
  },
  revisao: {
    title: 'Revisão obrigatória',
    messages: [
      'Seu veículo precisa de revisão obrigatória. Agende o quanto antes.',
    ],
  },
};

function onlyNumbers(value?: string | null) {
  return String(value ?? '').replace(/\D/g, '');
}

export function AlertsCenter() {
  const supabase = getSupabaseBrowserClient() as any;

  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [driverId, setDriverId] = useState('');
  const [alertType, setAlertType] = useState<AlertType>('cnh_vencendo');
  const [selectedMessage, setSelectedMessage] = useState('');
  const [status, setStatus] = useState<string | null>(null);

  const selectedDriver = useMemo(
    () => drivers.find((d) => String(d.id) === String(driverId)),
    [drivers, driverId]
  );

  useEffect(() => {
    async function loadDrivers() {
      const { data } = await supabase.from('drivers').select('id,name,phone');
      setDrivers((data as Driver[]) ?? []);
    }
    void loadDrivers();
  }, [supabase]);

  const finalMessage = selectedDriver
    ? `Olá, ${selectedDriver.name}. ${selectedMessage}`
    : selectedMessage;

  async function copyText() {
    await navigator.clipboard.writeText(finalMessage);
    setStatus('Texto copiado');
  }

  const phone = onlyNumbers(selectedDriver?.phone);
  const whatsappUrl = phone
    ? `https://wa.me/55${phone}?text=${encodeURIComponent(finalMessage)}`
    : '#';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      
      {/* TIPOS DE ALERTA */}
      <section className="card">
        <h2>Tipos de alerta</h2>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {Object.entries(alertTemplates).map(([key, item]) => (
            <button
              key={key}
              className="btn"
              onClick={() => {
                setAlertType(key as AlertType);
                setSelectedMessage('');
              }}
            >
              {item.title}
            </button>
          ))}
        </div>
      </section>

      {/* TEXTOS PRONTOS */}
      <section className="card">
        <h3>Mensagens prontas</h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {alertTemplates[alertType].messages.map((msg, i) => (
            <div
              key={i}
              className="card soft-card"
              style={{ cursor: 'pointer' }}
              onClick={() => setSelectedMessage(msg)}
            >
              {msg}
            </div>
          ))}
        </div>
      </section>

      {/* ENVIO */}
      <section className="card">
        <h3>Envio</h3>

        <div className="field">
          <label>Motorista</label>
          <select value={driverId} onChange={(e) => setDriverId(e.target.value)}>
            <option value="">Selecione</option>
            {drivers.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        {selectedDriver && (
          <div style={{ marginTop: 10 }}>
            <strong>Telefone:</strong> {selectedDriver.phone}
          </div>
        )}

        <div className="field" style={{ marginTop: 10 }}>
          <label>Mensagem</label>
          <textarea value={finalMessage} readOnly />
        </div>

        {status && <div className="alert success">{status}</div>}

        <div className="btn-row" style={{ marginTop: 10 }}>
          <button className="btn primary" onClick={() => void copyText()}>
            Copiar
          </button>

          <a className="btn" href={whatsappUrl} target="_blank">
            WhatsApp
          </a>
        </div>
      </section>
    </div>
  );
}
