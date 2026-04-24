'use client';

import { useState } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';

const baseKnowledge = `IAdrive conhece o Ondrive: Dashboard mostra painel operacional e financeiro; Alertas cria textos para WhatsApp; Veículos cadastra placa, status, financiamento e observações; Motoristas cadastra telefone, CEP, endereço, latitude, longitude, CNH e dia de pagamento apenas em dia útil; Contratos controla motorista, sócio/adm, veículo, início, fim, status, aluguel, venda em forma de aluguel, repasse, atraso, multa, contrato e fotos; Vistorias registra data, veículo, motorista e conclusão; Multas registra valor, vencimento e status; Financeiro controla entradas, despesas, repasses, sócios, veículos, observações e exportação/importação.`;

function localAnswer(question: string) {
  const q = question.toLowerCase();
  if (q.includes('veículo') || q.includes('veiculo')) {
    return 'Para cadastrar veículo: entre em Veículos, preencha placa, marca, modelo, ano e status. Se for financiado, preencha quantidade de parcelas, valor da parcela e data final. Depois clique em Salvar registro.';
  }
  if (q.includes('motorista')) {
    return 'Para cadastrar motorista: entre em Motoristas, preencha nome, CPF, telefone, CEP e endereço. Depois clique em Converter endereço em latitude/longitude, confira os campos preenchidos e salve. O dia de pagamento deve ser de segunda a sexta.';
  }
  if (q.includes('contrato')) {
    return 'Para contrato: entre em Contratos, selecione motorista, sócio ou administrador, veículo, tipo de contrato, data de início, data final se existir e status. Preencha valores de aluguel/repasse e links do contrato assinado/fotos. Depois salve.';
  }
  if (q.includes('alerta') || q.includes('whatsapp') || q.includes('cobran')) {
    return 'Para alertas: entre em Alertas, escolha o motorista, selecione o tipo de mensagem, revise o texto pronto e clique em Copiar texto ou Abrir WhatsApp.';
  }
  if (q.includes('financeiro') || q.includes('repasse') || q.includes('sócio') || q.includes('socio')) {
    return 'No Financeiro você registra entradas e despesas, vincula sócio e veículo, informa valor de repasse e observações. A tela também mostra previsão de entrada para 30, 90 e 120 dias.';
  }
  return 'Me diga o que você quer fazer no Ondrive. Eu te respondo em passo a passo: onde clicar, quais campos preencher e qual botão usar.';
}

export function CopilotChat() {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([
    { role: 'assistant', content: 'Olá. Sou a IAdrive. Posso te orientar no uso do Ondrive passo a passo.' },
  ]);

  async function send() {
    if (!question.trim()) return;
    const content = question.trim();
    setMessages((prev) => [...prev, { role: 'user', content }]);
    setQuestion('');
    setLoading(true);

    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase.functions.invoke('copilot-chat', {
        body: { question: content, context: baseKnowledge },
      });

      if (error) throw error;

      setMessages((prev) => [...prev, { role: 'assistant', content: data?.answer ?? localAnswer(content) }]);
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: localAnswer(content) }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid-two">
      <section className="card">
        <h2 style={{ marginTop: 0 }}>IAdrive</h2>
        <div className="btn-row" style={{ marginBottom: 12 }}>
          {['Como cadastrar um veículo?', 'Como registrar contrato?', 'Como mandar cobrança?', 'Como ver repasse do sócio?'].map((q) => (
            <button key={q} className="btn" type="button" onClick={() => setQuestion(q)}>{q}</button>
          ))}
        </div>
        <div className="field full">
          <label>Pergunta</label>
          <textarea value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Digite sua dúvida sobre o Ondrive..." />
        </div>
        <div className="btn-row">
          <button className="btn primary" type="button" disabled={loading} onClick={send}>{loading ? 'Consultando...' : 'Enviar'}</button>
        </div>
      </section>
      <section className="card">
        <h2 style={{ marginTop: 0 }}>Histórico</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {messages.map((msg, index) => (
            <div key={`${msg.role}-${index}`} className="card" style={{ background: msg.role === 'assistant' ? '#f8fafc' : '#eff6ff' }}>
              <strong>{msg.role === 'assistant' ? 'IAdrive' : 'Você'}</strong>
              <div style={{ marginTop: 8, whiteSpace: 'pre-wrap' }}>{msg.content}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
