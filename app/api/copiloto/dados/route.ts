import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

function toNumber(value: unknown) {
  const number = Number(value ?? 0);
  return Number.isNaN(number) ? 0 : number;
}

function money(value: number) {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

async function safeSelect(supabase: any, table: string) {
  const { data, error } = await supabase.from(table).select('*');

  if (error) {
    return [];
  }

  return data ?? [];
}

export async function GET() {
  const supabase = await createSupabaseServerClient();

  const financialEntries = await safeSelect(supabase, 'financial_entries');
  const contracts = await safeSelect(supabase, 'contracts');
  const vehicles = await safeSelect(supabase, 'vehicles');
  const drivers = await safeSelect(supabase, 'drivers');
  const investors = await safeSelect(supabase, 'investors');
  const fines = await safeSelect(supabase, 'fines');

  let totalEntradas = 0;
  let totalDespesas = 0;
  let totalRepasses = 0;

  for (const item of financialEntries) {
    const amount = toNumber(item.amount);
    const rentValue = toNumber(item.rent_value);
    const expenseValue = toNumber(item.expense_value);
    const repasseValue = toNumber(item.repasse_value);

    const type = String(item.type ?? '').toLowerCase();
    const kind = String(item.kind ?? '').toLowerCase();

    if (
      type.includes('entrada') ||
      type.includes('receita') ||
      type.includes('aluguel') ||
      kind.includes('entrada') ||
      kind.includes('receita') ||
      rentValue > 0
    ) {
      totalEntradas += amount || rentValue;
    }

    if (
      type.includes('despesa') ||
      type.includes('saída') ||
      type.includes('saida') ||
      kind.includes('despesa') ||
      kind.includes('saída') ||
      kind.includes('saida') ||
      expenseValue > 0
    ) {
      totalDespesas += amount || expenseValue;
    }

    if (repasseValue > 0) {
      totalRepasses += repasseValue;
    }
  }

  const lucro = totalEntradas - totalDespesas - totalRepasses;

  const multasVencidas = fines.filter((fine: any) => {
    const status = String(fine.status ?? '').toLowerCase();
    const dueDate = fine.due_date ? new Date(`${fine.due_date}T00:00:00`) : null;

    return (
      status.includes('vencida') ||
      (!!dueDate && dueDate < new Date() && !status.includes('paga'))
    );
  });

  const contratosAtivos = contracts.filter((contract: any) => {
    const status = String(contract.status ?? '').toLowerCase();
    return status.includes('ativo') || status.includes('vigente');
  });

  const contexto = `
DADOS REAIS DO BANCO DO ONDRIVE:

Financeiro:
- Total de entradas: ${money(totalEntradas)}
- Total de despesas: ${money(totalDespesas)}
- Total de repasses: ${money(totalRepasses)}
- Lucro estimado: ${money(lucro)}

Cadastros:
- Veículos cadastrados: ${vehicles.length}
- Motoristas cadastrados: ${drivers.length}
- Sócios cadastrados: ${investors.length}
- Contratos cadastrados: ${contracts.length}
- Contratos ativos: ${contratosAtivos.length}
- Multas cadastradas: ${fines.length}
- Multas vencidas/pendentes: ${multasVencidas.length}

Regra de cálculo:
Lucro = total de entradas - total de despesas - total de repasses.
`;

 return NextResponse.json({
  totalEntradas,
  totalDespesas,
  totalRepasses,
  lucro,

  totalEntradasFormatado: money(totalEntradas),
  totalDespesasFormatado: money(totalDespesas),
  totalRepassesFormatado: money(totalRepasses),
  lucroFormatado: money(lucro),

  totalVeiculos: vehicles.length,
  totalMotoristas: drivers.length,
  totalSocios: investors.length,
  totalContratos: contracts.length,
  contratosAtivos: contratosAtivos.length,
  totalMultas: fines.length,
  multasVencidas: multasVencidas.length,
  contexto,
});
}