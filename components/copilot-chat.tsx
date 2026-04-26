'use client';

import { useState } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

const baseKnowledge = `
Você é a IAdrive, copiloto interno do sistema Ondrive.

Responda sempre em português, de forma prática, direta e em passo a passo.

O Ondrive possui:
- Painel Operacional: visão geral de veículos, motoristas, contratos e alertas.
- Alertas: cria cobranças e lembretes automáticos/manuais para WhatsApp.
- Painel Financeiro: mostra entradas, despesas, repasses, lucro e previsões.
- Veículos: cadastro de placa, marca, modelo, ano, status, financiamento, parcelas e observações.
- Motoristas: cadastro de nome, telefone, CPF, CEP, endereço, CNH, veículo vinculado e dia de pagamento.
- Contratos: controla motorista, veículo, sócio/administrador, início, fim, status, aluguel, venda em forma de aluguel, repasse, atraso, multa, contrato assinado e fotos.
- Vistorias: registra veículo, motorista, data, status pendente/concluída e observações.
- Multas: registra motorista, veículo, data de vencimento, valor, status pago/vencida/pendente e gera alerta.
- Sócios: cadastra sócios, telefone, CPF/CNPJ, carros ativos e observações.
- Financeiro: registra entradas, despesas, aluguel, repasse, sócio, veículo, motorista, contrato, valor, data, observação e método de pagamento.

Regras importantes:
- Lucro = entradas recebidas menos despesas.
- Repasse do sócio = valor destinado ao sócio conforme contrato ou lançamento financeiro.
- Multas vencidas devem gerar alerta.
- Pagamentos próximos do vencimento devem gerar alerta.
- Contratos ativos devem alimentar painel operacional e financeiro.
- Veículos vinculados a motorista/sócio devem aparecer nas telas relacionadas.
`;

function localAnswer(question: string) {
  const q = question.toLowerCase();

  if (
    q.includes('lucro') ||
    q.includes('ganho') ||
    q.includes('resultado') ||
    q.includes('faturamento')
  ) {
    return `Para ver seu lucro no Ondrive:

1. Entre em Painel Financeiro.
2. Confira o total de entradas.
3. Confira o total de despesas.
4. Veja o resultado final.

A lógica é:

Lucro = entradas recebidas - despesas - repasses.

Se o sistema ainda não estiver mostrando isso do jeito certo, precisamos ajustar o Painel Financeiro para calcular com base nos lançamentos salvos no banco.`;
  }

  if (q.includes('financeiro') || q.includes('repasse') || q.includes('sócio') || q.includes('socio')) {
    return `No Financeiro você controla entradas, despesas, repasses e lucro.

Para ver repasse do sócio:

1. Entre em Painel Financeiro.
2. Filtre pelo sócio.
3. Veja os lançamentos vinculados a ele.
4. Confira valor recebido, despesas e valor de repasse.

O repasse precisa estar ligado ao contrato, veículo ou lançamento financeiro para aparecer corretamente.`;
  }

  if (q.includes('veículo') || q.includes('veiculo') || q.includes('carro')) {
    return `Para cadastrar veículo:

1. Entre em Veículos.
2. Preencha placa, marca, modelo, ano e status.
3. Se for financiado, preencha parcelas, valor da parcela e data final.
4. Vincule motorista ou sócio quando necessário.
5. Clique em Salvar registro.`;
  }

  if (q.includes('motorista')) {
    return `Para cadastrar motorista:

1. Entre em Motoristas.
2. Preencha nome, CPF, telefone, CEP e endereço.
3. Vincule o veículo, se já existir.
4. Preencha CNH e dia de pagamento.
5. Salve o registro.`;
  }

  if (q.includes('contrato')) {
    return `Para registrar contrato:

1. Entre em Contratos.
2. Selecione motorista, veículo e sócio/administrador.
3. Informe tipo de contrato, início, fim e status.
4. Preencha aluguel, repasse, multa e atraso permitido.
5. Anexe contrato/fotos se tiver.
6. Clique em Salvar registro.`;
  }

  if (q.includes('alerta') || q.includes('whatsapp') || q.includes('cobran')) {
    return `Para mandar cobrança:

1. Entre em Alertas.
2. Escolha o motorista.
3. Selecione o tipo de mensagem.
4. Revise o texto automático.
5. Clique em Copiar texto ou Abrir WhatsApp.

Alertas automáticos devem aparecer quando houver vencimento próximo, multa vencida ou pendência cadastrada.`;
  }

  if (q.includes('multa')) {
    return `Para registrar multa:

1. Entre em Multas.
2. Selecione motorista e veículo.
3. Informe data de vencimento.
4. Informe valor.
5. Marque o status: pendente, paga ou vencida.
6. Salve.

Se estiver vencida ou próxima do vencimento, o sistema deve criar alerta automático.`;
  }

  return `Posso te orientar como copiloto do Ondrive.

Você pode me perguntar, por exemplo:

- Qual é meu lucro?
- Como ver repasse do sócio?
- Como cadastrar veículo?
- Como registrar contrato?
- Como mandar cobrança?
- Como saber quais multas estão vencidas?`;
}

export function CopilotChat() {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Olá. Sou a IAdrive, seu copiloto do Ondrive. Posso te ajudar com financeiro, lucro, repasses, veículos, motoristas, contratos, multas e alertas.',
    },
  ]);

  async function send(customQuestion?: string) {
    const content = (customQuestion ?? question).trim();
    if (!content) return;

    setMessages((prev) => [...prev, { role: 'user', content }]);
    setHistory((prev) => [content, ...prev.filter((item) => item !== content)].slice(0, 12));
    setQuestion('');
    setLoading(true);

    try {
      const supabase = getSupabaseBrowserClient();

let realContext = '';
let realData: any = null;

try {
  const response = await fetch('/api/copiloto/dados');
  realData = await response.json();
  realContext = realData?.contexto ?? '';
} catch {
  realContext = '';
  realData = null;
}

const perguntaFinanceira =
  content.toLowerCase().includes('lucro') ||
  content.toLowerCase().includes('entrada') ||
  content.toLowerCase().includes('despesa') ||
  content.toLowerCase().includes('repasse') ||
  content.toLowerCase().includes('financeiro');

if (perguntaFinanceira && realData) {
  setMessages((prev) => [
    ...prev,
    {
      role: 'assistant',
      content: `Com base nos dados cadastrados no sistema:

Entradas: ${realData.totalEntradasFormatado ?? realData.totalEntradas}
Despesas: ${realData.totalDespesasFormatado ?? realData.totalDespesas}
Repasses: ${realData.totalRepassesFormatado ?? realData.totalRepasses}

Lucro estimado: ${realData.lucroFormatado ?? realData.lucro}

Cálculo usado:
Lucro = Entradas - Despesas - Repasses`,
    },
  ]);

  setLoading(false);
  return;
}

const { data, error } = await supabase.functions.invoke('copilot-chat', {
  body: {
    question: content,
    context: `${baseKnowledge}

${realContext}`,
  },
});
      if (error) throw error;

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data?.answer || localAnswer(content),
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: localAnswer(content),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  const suggestions = [
    'Quero saber os valores do meu lucro',
    'Como ver repasse do sócio?',
    'Como mandar cobrança?',
    'Como cadastrar um veículo?',
    'Como registrar contrato?',
    'Quais multas estão vencidas?',
  ];

  return (
    <div className="grid-two" style={{ alignItems: 'start' }}>
      <section>
        <div className="card">
          <h2 style={{ marginTop: 0 }}>IAdrive</h2>

          <p style={{ marginTop: 0, color: '#475569' }}>
            Pergunte sobre lucro, financeiro, repasses, contratos, veículos, motoristas, multas e alertas.
          </p>

          <div className="btn-row" style={{ marginBottom: 12 }}>
            {suggestions.map((item) => (
              <button
                key={item}
                className="btn"
                type="button"
                onClick={() => send(item)}
                disabled={loading}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="field full">
            <label>Pergunta</label>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Digite sua dúvida sobre o Ondrive..."
            />
          </div>

          <div className="btn-row">
            <button className="btn primary" type="button" disabled={loading} onClick={() => send()}>
              {loading ? 'Consultando...' : 'Enviar'}
            </button>
          </div>
        </div>

        <div className="card" style={{ marginTop: 16 }}>
          <h2 style={{ marginTop: 0 }}>Conversa</h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {messages.map((msg, index) => (
              <div
                key={`${msg.role}-${index}`}
                className="card"
                style={{
                  background: msg.role === 'assistant' ? '#f8fafc' : '#eff6ff',
                  boxShadow: 'none',
                }}
              >
                <strong>{msg.role === 'assistant' ? 'IAdrive' : 'Você'}</strong>
                <div style={{ marginTop: 8, whiteSpace: 'pre-wrap' }}>{msg.content}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="card">
        <h2 style={{ marginTop: 0 }}>Histórico de conversas</h2>

        {history.length === 0 ? (
          <p style={{ color: '#64748b' }}>As perguntas feitas vão aparecer aqui.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {history.map((item, index) => (
              <button
                key={`${item}-${index}`}
                type="button"
                className="btn"
                style={{ textAlign: 'left', justifyContent: 'flex-start' }}
                onClick={() => setQuestion(item)}
              >
                {item}
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}