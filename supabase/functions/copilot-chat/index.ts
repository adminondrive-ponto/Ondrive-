// Supabase Edge Function: copilot-chat
// Deploy: supabase functions deploy copilot-chat --no-verify-jwt=false
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { question } = await req.json();
    const authHeader = req.headers.get('Authorization');

    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Usuário não autenticado.' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const [vehicles, drivers, contracts, investors, financialEntries] = await Promise.all([
      supabase.from('vehicles').select('id, plate, brand, model, status').limit(20),
      supabase.from('drivers').select('id, name, phone, status').limit(20),
      supabase.from('contracts').select('id, driver_id, vehicle_id, amount, payment_status, start_date, next_due_date, active').limit(20),
      supabase.from('investors').select('id, name, rent_value, adm_fee').limit(20),
      supabase.from('financial_entries').select('date, category, amount, description').limit(30),
    ]);

    const context = {
      sections: [
        'Veículos: cadastro e gestão da frota',
        'Motoristas: cadastro e controle de condutores',
        'Tipos de contrato: regras de cobrança, multa e repasse',
        'Contratos: vínculo entre motorista e veículo',
        'Multas: histórico de infrações',
        'Vistorias: histórico de inspeções',
        'Sócios: repasses e valores do parceiro',
        'Financeiro: receitas e despesas',
      ],
      rules: [
        'Se houver contrato ativo, não excluir veículo ou motorista sem encerrar o contrato.',
        'Contratos definem cobrança, atraso, multa diária, limite de multa e retomada.',
        'Multas e vistorias devem ser registradas nas telas próprias.',
        'O financeiro consolida receitas, despesas, investimento, manutenção e repasses.',
        'A tela de sócios mostra o extrato do parceiro.',
      ],
      metrics: {
        vehicles: vehicles.data ?? [],
        drivers: drivers.data ?? [],
        contracts: contracts.data ?? [],
        investors: investors.data ?? [],
        financialEntries: financialEntries.data ?? [],
      },
    };

    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');

    let answer = '';

    if (anthropicKey) {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': anthropicKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-latest',
          max_tokens: 900,
          system: `Você é o copiloto oficial do sistema OnDrive.
Responda sempre em português do Brasil.
Seja objetiva, clara e prática.
Sempre diga ONDE clicar no sistema.
Sempre explique em passos numerados quando a pergunta for operacional.
Não invente funções que não existem.
Use o contexto abaixo:\n${JSON.stringify(context)}`,
          messages: [{ role: 'user', content: String(question || '') }],
        }),
      });

      const json = await response.json();
      answer = json?.content?.[0]?.text ?? '';
    }

    if (!answer) {
      answer = [
        'Modo local do copiloto ativado.',
        '1. Vá ao menu lateral e abra a área mais próxima da sua dúvida.',
        '2. Se for cadastro, comece preenchendo os campos obrigatórios primeiro.',
        '3. Se for contrato, confirme motorista, veículo, tipo de contrato e datas.',
        '4. Se for financeiro, confira categoria, valor e descrição.',
        `Pergunta recebida: ${String(question || '')}`,
      ].join('\n');
    }

    await supabase.from('ia_history').insert({
      role: 'assistant',
      content: answer,
      question: String(question || ''),
    });

    return new Response(JSON.stringify({ answer }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Falha inesperada.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
