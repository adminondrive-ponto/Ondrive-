'use client';

import { useEffect, useMemo, useState } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';

type Driver = {
  id: string;
  name?: string | null;
  phone?: string | null;
};

type AlertType =
  | 'cnh_vencendo'
  | 'cnh_vencida'
  | 'multa_vencendo'
  | 'multa_vencida'
  | 'aluguel_vencendo'
  | 'aluguel_vencido_rescindido'
  | 'venda_vencendo'
  | 'venda_vencida_rescindido'
  | 'revisao'
  | 'contrato_rescindido';

type AlertTemplate = {
  id: string;
  type: AlertType;
  title: string;
  message: string;
};

const alertTypes: Record<AlertType, { title: string; color: string; bg: string }> = {
  cnh_vencendo: { title: 'CNH vencendo', color: '#1d4ed8', bg: '#dbeafe' },
  cnh_vencida: { title: 'CNH vencida', color: '#b91c1c', bg: '#fee2e2' },
  multa_vencendo: { title: 'Multa vencendo', color: '#b45309', bg: '#fef3c7' },
  multa_vencida: { title: 'Multa vencida', color: '#b91c1c', bg: '#fee2e2' },
  aluguel_vencendo: { title: 'Aluguel vencendo', color: '#7c3aed', bg: '#ede9fe' },
  aluguel_vencido_rescindido: { title: 'Aluguel vencido + rescisão', color: '#b91c1c', bg: '#fee2e2' },
  venda_vencendo: { title: 'Venda vencendo', color: '#047857', bg: '#d1fae5' },
  venda_vencida_rescindido: { title: 'Venda vencida + rescisão', color: '#b91c1c', bg: '#fee2e2' },
  revisao: { title: 'Revisão obrigatória', color: '#0f766e', bg: '#ccfbf1' },
  contrato_rescindido: { title: 'Contrato rescindido', color: '#991b1b', bg: '#fee2e2' },
};

const defaultTemplates: AlertTemplate[] = [
  {
    id: '1',
    type: 'cnh_vencendo',
    title: 'Aviso de CNH vencendo',
    message: 'Sua CNH está próxima do vencimento. Por favor, envie a atualização para evitarmos bloqueios operacionais.',
  },
  {
    id: '2',
    type: 'cnh_vencida',
    title: 'CNH vencida',
    message: 'Sua CNH consta como vencida. É necessário regularizar imediatamente para continuar com a operação.',
  },
  {
    id: '3',
    type: 'multa_vencendo',
    title: 'Multa próxima do vencimento',
    message: 'Existe uma multa próxima do vencimento. Regularize dentro do prazo para evitar juros e restrições.',
  },
  {
    id: '4',
    type: 'multa_vencida',
    title: 'Multa vencida',
    message: 'Existe uma multa vencida vinculada ao seu cadastro/veículo. Regularize imediatamente para evitar novas medidas.',
  },
  {
    id: '5',
    type: 'aluguel_vencendo',
    title: 'Aluguel vencendo',
    message: 'Seu aluguel está próximo do vencimento. Pedimos que se organize para manter o pagamento em dia.',
  },
  {
    id: '6',
    type: 'aluguel_vencido_rescindido',
    title: 'Aluguel vencido e contrato rescindido',
    message: 'Seu aluguel está vencido. Caso não haja regularização imediata, seu contrato poderá ser rescindido conforme regras acordadas.',
  },
  {
    id: '7',
    type: 'venda_vencendo',
    title: 'Venda vencendo',
    message: 'Sua parcela da venda está próxima do vencimento. Pedimos atenção ao prazo de pagamento.',
  },
  {
    id: '8',
    type: 'venda_vencida_rescindido',
    title: 'Venda vencida e contrato rescindido',
    message: 'Sua parcela da venda está vencida. Caso não haja regularização imediata, seu contrato poderá ser rescindido conforme regras acordadas.',
  },
  {
    id: '9',
    type: 'revisao',
    title: 'Revisão obrigatória',
    message: 'Seu veículo precisa passar por revisão obrigatória. Agende o quanto antes para evitar bloqueio operacional.',
  },
  {
    id: '10',
    type: 'contrato_rescindido',
    title: 'Contrato rescindido',
    message: 'Informamos que seu contrato foi rescindido. Entre em contato para alinhamento dos próximos passos.',
  },
];

function onlyNumbers(value?: string | null) {
  return String(value ?? '').replace(/\D/g, '');
}

export function AlertsCenter() {
  const supabase = getSupabaseBrowserClient() as any;

  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [driverId, setDriverId] = useState('');
  const [alertType, setAlertType] = useState<AlertType>('cnh_vencendo');
  const [templates, setTemplates] = useState<AlertTemplate[]>(defaultTemplates);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [status, setStatus] = useState('');

  const selectedDriver = useMemo(
    () => drivers.find((d) => String(d.id) === String(driverId)),
    [drivers, driverId],
  );

  const filteredTemplates = templates.filter((item) => item.type === alertType);

  const finalMessage = selectedDriver
    ? `Olá, ${selectedDriver.name || 'motorista'}. ${customMessage}`
    : customMessage;

  useEffect(() => {
    const saved = localStorage.getItem('ondrive_alert_templates');
    if (saved) setTemplates(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('ondrive_alert_templates', JSON.stringify(templates));
  }, [templates]);

  useEffect(() => {
    async function loadDrivers() {
      const { data } = await supabase
        .from('drivers')
        .select('id,name,phone')
        .order('name', { ascending: true });

      setDrivers((data as Driver[]) ?? []);
    }

    void loadDrivers();
  }, [supabase]);

  function selectTemplate(template: AlertTemplate) {
    setSelectedTemplateId(template.id);
    setCustomMessage(template.message);
    setStatus('');
  }

  function saveEditedTemplate() {
    if (!selectedTemplateId) return;

    setTemplates((old) =>
      old.map((item) =>
        item.id === selectedTemplateId ? { ...item, message: customMessage } : item,
      ),
    );

    setStatus('Mensagem editada e salva.');
  }

  function createTemplate() {
    if (!newTitle.trim() || !newMessage.trim()) return;

    setTemplates((old) => [
      ...old,
      {
        id: crypto.randomUUID(),
        type: alertType,
        title: newTitle,
        message: newMessage,
      },
    ]);

    setNewTitle('');
    setNewMessage('');
    setStatus('Nova mensagem criada.');
  }

  async function copyText() {
    await navigator.clipboard.writeText(finalMessage);
    setStatus('Mensagem copiada.');
  }

  const phone = onlyNumbers(selectedDriver?.phone);
  const whatsappUrl = phone
    ? `https://wa.me/55${phone.replace(/^55/, '')}?text=${encodeURIComponent(finalMessage)}`
    : '#';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <section className="card" style={{ padding: 28 }}>
        <h2 style={{ marginTop: 0, fontSize: 28 }}>Central de Alertas</h2>
        <p style={{ color: '#64748b', marginTop: -8 }}>
          Escolha o tipo de alerta, selecione uma mensagem pronta, edite se precisar e envie ao motorista.
        </p>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 22 }}>
          {Object.entries(alertTypes).map(([key, item]) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                setAlertType(key as AlertType);
                setSelectedTemplateId('');
                setCustomMessage('');
              }}
              style={{
                border: '1px solid #dbe3ef',
                background: alertType === key ? item.bg : '#fff',
                color: item.color,
                padding: '12px 16px',
                borderRadius: 14,
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: alertType === key ? '0 10px 24px rgba(15,23,42,.10)' : 'none',
              }}
            >
              {item.title}
            </button>
          ))}
        </div>
      </section>

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: '1.1fr .9fr',
          gap: 22,
          alignItems: 'start',
        }}
      >
        <div className="card" style={{ padding: 28 }}>
          <h3 style={{ marginTop: 0, fontSize: 22 }}>Mensagens prontas</h3>

          <div style={{ display: 'grid', gap: 12 }}>
            {filteredTemplates.map((template) => (
              <button
                key={template.id}
                type="button"
                onClick={() => selectTemplate(template)}
                style={{
                  textAlign: 'left',
                  border: selectedTemplateId === template.id ? '2px solid #2563eb' : '1px solid #dbe3ef',
                  background: selectedTemplateId === template.id ? '#eff6ff' : '#fff',
                  borderRadius: 16,
                  padding: 18,
                  cursor: 'pointer',
                }}
              >
                <strong>{template.title}</strong>
                <p style={{ marginBottom: 0, color: '#475569' }}>{template.message}</p>
              </button>
            ))}
          </div>

          <div style={{ marginTop: 26, borderTop: '1px solid #e5e7eb', paddingTop: 22 }}>
            <h3>Criar nova mensagem</h3>

            <div className="field">
              <label>Título</label>
              <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
            </div>

            <div className="field">
              <label>Mensagem</label>
              <textarea value={newMessage} onChange={(e) => setNewMessage(e.target.value)} />
            </div>

            <button className="btn primary" type="button" onClick={createTemplate}>
              Salvar nova mensagem
            </button>
          </div>
        </div>

        <div className="card" style={{ padding: 28 }}>
          <h3 style={{ marginTop: 0, fontSize: 22 }}>Preparar envio</h3>

          <div className="field">
            <label>Motorista</label>
            <select value={driverId} onChange={(e) => setDriverId(e.target.value)}>
              <option value="">Selecione</option>
              {drivers.map((driver) => (
                <option key={driver.id} value={driver.id}>
                  {driver.name} {driver.phone ? `· ${driver.phone}` : ''}
                </option>
              ))}
            </select>
          </div>

          {selectedDriver ? (
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 14,
                padding: 14,
                marginTop: 12,
              }}
            >
              <strong>Telefone:</strong> {selectedDriver.phone || 'Não cadastrado'}
            </div>
          ) : null}

          <div className="field" style={{ marginTop: 16 }}>
            <label>Mensagem final</label>
            <textarea
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="Clique em uma mensagem pronta ou escreva uma nova..."
              style={{ minHeight: 180 }}
            />
          </div>

          <div
            style={{
              background: alertTypes[alertType].bg,
              color: alertTypes[alertType].color,
              borderRadius: 16,
              padding: 16,
              marginTop: 12,
              fontWeight: 600,
            }}
          >
            Prévia: {finalMessage || 'Nenhuma mensagem selecionada.'}
          </div>

          {status ? <div className="alert success" style={{ marginTop: 12 }}>{status}</div> : null}

          <div className="btn-row" style={{ marginTop: 16 }}>
            <button className="btn" type="button" onClick={saveEditedTemplate} disabled={!selectedTemplateId}>
              Salvar edição
            </button>

            <button className="btn primary" type="button" onClick={() => void copyText()} disabled={!customMessage}>
              Copiar
            </button>

            <a className="btn" href={whatsappUrl} target="_blank" rel="noreferrer">
              Abrir WhatsApp
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
