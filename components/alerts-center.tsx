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
  cnh_vencendo: { title: 'CNH vencendo', color: '#1d4ed8', bg: '#eff6ff' },
  cnh_vencida: { title: 'CNH vencida', color: '#b91c1c', bg: '#fef2f2' },
  multa_vencendo: { title: 'Multa vencendo', color: '#b45309', bg: '#fffbeb' },
  multa_vencida: { title: 'Multa vencida', color: '#b91c1c', bg: '#fef2f2' },
  aluguel_vencendo: { title: 'Aluguel vencendo', color: '#7c3aed', bg: '#f5f3ff' },
  aluguel_vencido_rescindido: { title: 'Aluguel vencido + rescisão', color: '#b91c1c', bg: '#fef2f2' },
  venda_vencendo: { title: 'Venda vencendo', color: '#047857', bg: '#ecfdf5' },
  venda_vencida_rescindido: { title: 'Venda vencida + rescisão', color: '#b91c1c', bg: '#fef2f2' },
  revisao: { title: 'Revisão obrigatória', color: '#0f766e', bg: '#f0fdfa' },
  contrato_rescindido: { title: 'Contrato rescindido', color: '#991b1b', bg: '#fef2f2' },
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

    if (saved) {
      setTemplates(JSON.parse(saved));
    }
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
        item.id === selectedTemplateId
          ? { ...item, message: customMessage }
          : item,
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
        title: newTitle.trim(),
        message: newMessage.trim(),
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <section className="card" style={{ padding: 24 }}>
        <h2 style={{ marginTop: 0, marginBottom: 6, fontSize: 22, fontWeight: 700 }}>
          Central de Alertas
        </h2>

        <p style={{ color: '#64748b', fontSize: 14, marginTop: 0 }}>
          Selecione o tipo de alerta, escolha uma mensagem pronta, edite se precisar e copie o texto.
        </p>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 18 }}>
          {Object.entries(alertTypes).map(([key, item]) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                setAlertType(key as AlertType);
                setSelectedTemplateId('');
                setCustomMessage('');
                setStatus('');
              }}
              style={{
                border: alertType === key ? `1px solid ${item.color}` : '1px solid #dbe3ef',
                background: alertType === key ? item.bg : '#fff',
                color: alertType === key ? item.color : '#334155',
                padding: '9px 13px',
                borderRadius: 12,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
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
          gridTemplateColumns: '1.15fr .85fr',
          gap: 18,
          alignItems: 'start',
        }}
      >
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ marginTop: 0, fontSize: 17, fontWeight: 700 }}>
            Mensagens prontas
          </h3>

          <div style={{ display: 'grid', gap: 10 }}>
            {filteredTemplates.map((template) => (
              <button
                key={template.id}
                type="button"
                onClick={() => selectTemplate(template)}
                style={{
                  textAlign: 'left',
                  border: selectedTemplateId === template.id ? '1px solid #2563eb' : '1px solid #e2e8f0',
                  background: selectedTemplateId === template.id ? '#eff6ff' : '#fff',
                  borderRadius: 14,
                  padding: 14,
                  cursor: 'pointer',
                }}
              >
                <strong style={{ display: 'block', fontSize: 14, marginBottom: 6 }}>
                  {template.title}
                </strong>
                <span style={{ color: '#475569', fontSize: 13, lineHeight: 1.45 }}>
                  {template.message}
                </span>
              </button>
            ))}
          </div>

          <div style={{ marginTop: 22, borderTop: '1px solid #e5e7eb', paddingTop: 18 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700 }}>Criar nova mensagem</h3>

            <div className="field">
              <label>Título</label>
              <input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Ex: Aviso amigável de pagamento"
                style={{ fontSize: 14 }}
              />
            </div>

            <div className="field">
              <label>Mensagem</label>
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Digite a nova mensagem pronta..."
                style={{ fontSize: 14, lineHeight: 1.5, minHeight: 90 }}
              />
            </div>

            <button className="btn primary" type="button" onClick={createTemplate}>
              Salvar nova mensagem
            </button>
          </div>
        </div>

        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ marginTop: 0, fontSize: 17, fontWeight: 700 }}>
            Preparar envio
          </h3>

          <div className="field">
            <label>Motorista</label>
            <select
              value={driverId}
              onChange={(e) => setDriverId(e.target.value)}
              style={{ fontSize: 14 }}
            >
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
                borderRadius: 12,
                padding: 12,
                marginTop: 10,
                fontSize: 14,
              }}
            >
              <strong>Telefone:</strong> {selectedDriver.phone || 'Não cadastrado'}
            </div>
          ) : null}

          <div className="field" style={{ marginTop: 14 }}>
            <label>Mensagem final</label>
            <textarea
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="Clique em uma mensagem pronta ou escreva uma nova..."
              style={{ fontSize: 14, lineHeight: 1.5, minHeight: 150 }}
            />
          </div>

          <div
            style={{
              background: '#f8fafc',
              color: '#0f172a',
              border: '1px solid #e2e8f0',
              borderRadius: 14,
              padding: 14,
              marginTop: 12,
              fontSize: 13,
              lineHeight: 1.5,
            }}
          >
            <strong>Prévia:</strong>{' '}
            {finalMessage || 'Nenhuma mensagem selecionada.'}
          </div>

          {status ? (
            <div className="alert success" style={{ marginTop: 12, fontSize: 13 }}>
              {status}
            </div>
          ) : null}

          <div className="btn-row" style={{ marginTop: 14 }}>
            <button
              className="btn"
              type="button"
              onClick={saveEditedTemplate}
              disabled={!selectedTemplateId}
            >
              Salvar edição
            </button>

            <button
              className="btn primary"
              type="button"
              onClick={() => void copyText()}
              disabled={!customMessage}
            >
              Copiar
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
