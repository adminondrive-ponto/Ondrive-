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

function isActiveContract(contract: any) {
  const status = String(contract.status ?? '').toLowerCase();

  return (
    contract.active === true ||
    status === 'active' ||
    status === 'ativo' ||
    status === 'vigente'
  );
}

function calculatePercent(base: number, percentValue: unknown) {
  const percent = toNumber(percentValue);

  if (percent <= 0) return 0;

  return base * (percent / 100);
}

function getVehicleName(vehicle: any) {
  if (!vehicle) return 'Veículo não identificado';

  return (
    [vehicle.plate, vehicle.model].filter(Boolean).join(' - ') ||
    'Veículo sem identificação'
  );
}

function getInvestorName(investor: any) {
  if (!investor) return 'Sócio não identificado';

  return investor.name ?? investor.full_name ?? 'Sócio sem nome';
}

function getDriverName(driver: any) {
  if (!driver) return 'Sem motorista vinculado';

  return driver.name ?? driver.full_name ?? 'Motorista sem nome';
}

export async function GET() {
  const supabase = await createSupabaseServerClient();

  const financialEntries = await safeSelect(supabase, 'financial_entries');
  const contracts = await safeSelect(supabase, 'contracts');
  const vehicles = await safeSelect(supabase, 'vehicles');
  const drivers = await safeSelect(supabase, 'drivers');
  const investors = await safeSelect(supabase, 'investors');
  const fines = await safeSelect(supabase, 'fines');

  const contratosAtivos = contracts.filter(isActiveContract);

  const vehiclesById = new Map(
    vehicles.map((item: any) => [String(item.id), item]),
  );

  const driversById = new Map(
    drivers.map((item: any) => [String(item.id), item]),
  );

  const investorsById = new Map(
    investors.map((item: any) => [String(item.id), item]),
  );

  const entradasContratos = contratosAtivos.reduce(
    (sum: number, contract: any) => {
      return sum + toNumber(contract.rent_value);
    },
    0,
  );

  let entradasManuais = 0;
  let totalDespesas = 0;

  const despesasPorVeiculo = new Map<string, number>();

  for (const item of financialEntries) {
    const amount = toNumber(item.amount);
    const rentValue = toNumber(item.rent_value);
    const expenseValue = toNumber(item.expense_value);

    const type = String(item.type ?? '').toLowerCase();
    const kind = String(item.kind ?? '').toLowerCase();

    const isDespesa =
      type === 'expense' ||
      type.includes('despesa') ||
      type.includes('saída') ||
      type.includes('saida') ||
      kind === 'expense' ||
      kind.includes('despesa') ||
      kind.includes('saída') ||
      kind.includes('saida') ||
      expenseValue > 0;

    const isEntrada =
      type === 'income' ||
      type.includes('entrada') ||
      type.includes('receita') ||
      type.includes('aluguel') ||
      kind === 'income' ||
      kind.includes('entrada') ||
      kind.includes('receita') ||
      rentValue > 0;

    if (isDespesa) {
      const valorDespesa = expenseValue || amount;
      totalDespesas += valorDespesa;

      if (item.vehicle_id) {
        const vehicleId = String(item.vehicle_id);
        despesasPorVeiculo.set(
          vehicleId,
          (despesasPorVeiculo.get(vehicleId) ?? 0) + valorDespesa,
        );
      }
    }

    if (isEntrada && !isDespesa) {
      entradasManuais += rentValue || amount;
    }
  }

  const totalEntradas = entradasContratos + entradasManuais;

  let repasseSocios = 0;
  let repasseAdm = 0;

  let lucro30Dias = 0;
  let lucro60Dias = 0;
  let lucro90Dias = 0;

  const analisePorVeiculo = contratosAtivos.map((contract: any) => {
    const rent = toNumber(contract.rent_value);
    const vehicleId = String(contract.vehicle_id);

    const despesasContrato = despesasPorVeiculo.get(vehicleId) ?? 0;

    // REGRA ATUAL:
    // Primeiro desconta as despesas registradas do aluguel.
    // Depois aplica o percentual do sócio e o percentual ADM.
    const valorLiquidoAtual = rent - despesasContrato;

    const repasseSocio = calculatePercent(
      valorLiquidoAtual,
      contract.repasse_value,
    );

    const repasseAdmContrato = calculatePercent(
      valorLiquidoAtual,
      contract.adm_repasse_value,
    );

    // REGRA FUTURA:
    // Meses futuros não têm despesa ainda.
    // Então o lucro futuro ADM é calculado sobre o aluguel cheio.
    // Exemplo: aluguel 3600 e ADM 50% = 1800 no mês futuro.
    const repasseAdmMesFuturo = calculatePercent(
      rent,
      contract.adm_repasse_value,
    );

    repasseSocios += repasseSocio;
    repasseAdm += repasseAdmContrato;

    // REGRA CORRETA PARA IA:
    // 30 dias = lucro atual ADM.
    // 60 dias = lucro atual ADM + 1 mês futuro.
    // 90 dias = lucro atual ADM + 2 meses futuros.
    lucro30Dias += repasseAdmContrato;
    lucro60Dias += repasseAdmContrato + repasseAdmMesFuturo;
    lucro90Dias += repasseAdmContrato + repasseAdmMesFuturo * 2;

    const vehicle = vehiclesById.get(vehicleId);
    const driver = driversById.get(String(contract.driver_id));
    const investor = investorsById.get(String(contract.investor_id));

    return {
      vehicleId: contract.vehicle_id,
      veiculo: getVehicleName(vehicle),
      motorista: getDriverName(driver),
      socio: getInvestorName(investor),
      entrada: rent,
      despesas: despesasContrato,
      valorLiquido: valorLiquidoAtual,
      repasseSocio,
      repasseAdm: repasseAdmContrato,
      repasseAdmMesFuturo,
      lucro30Dias: repasseAdmContrato,
      lucro60Dias: repasseAdmContrato + repasseAdmMesFuturo,
      lucro90Dias: repasseAdmContrato + repasseAdmMesFuturo * 2,
      statusContrato: contract.status,
      vencimento: contract.next_due_date ?? null,
    };
  });

  const previsao30Dias = lucro30Dias;
  const previsao60Dias = lucro60Dias;
  const previsao90Dias = lucro90Dias;

  const totalRepassesGeral = repasseSocios + repasseAdm;
  const totalRepasses = repasseSocios;

  const lucro = lucro30Dias;

  const rankingVeiculos = [...analisePorVeiculo].sort(
    (a, b) => b.entrada - a.entrada,
  );

  const analisePorSocioMap = new Map<string, any>();

  for (const item of analisePorVeiculo) {
    const key = item.socio;

    const current = analisePorSocioMap.get(key) ?? {
      socio: key,
      entradas: 0,
      despesas: 0,
      valorLiquido: 0,
      repasseSocio: 0,
      repasseAdm: 0,
      contratos: 0,
    };

    current.entradas += item.entrada;
    current.despesas += item.despesas;
    current.valorLiquido += item.valorLiquido;
    current.repasseSocio += item.repasseSocio;
    current.repasseAdm += item.repasseAdm;
    current.contratos += 1;

    analisePorSocioMap.set(key, current);
  }

  const analisePorSocio = Array.from(analisePorSocioMap.values()).sort(
    (a, b) => b.entradas - a.entradas,
  );

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const contratosEmRisco = contratosAtivos.filter((contract: any) => {
    if (!contract.next_due_date) return false;

    const vencimento = new Date(`${contract.next_due_date}T00:00:00`);
    const paymentStatus = String(contract.payment_status ?? '').toLowerCase();

    return (
      vencimento < hoje &&
      !paymentStatus.includes('paid') &&
      !paymentStatus.includes('pago')
    );
  });

  const veiculosComContratoAtivo = new Set(
    contratosAtivos.map((contract: any) => String(contract.vehicle_id)),
  );

  const veiculosSemContratoAtivo = vehicles.filter((vehicle: any) => {
    return !veiculosComContratoAtivo.has(String(vehicle.id));
  });

  const multasVencidas = fines.filter((fine: any) => {
    const status = String(fine.status ?? '').toLowerCase();
    const dueDate = fine.due_date
      ? new Date(`${fine.due_date}T00:00:00`)
      : null;

    return (
      status.includes('vencida') ||
      (!!dueDate && dueDate < new Date() && !status.includes('paga'))
    );
  });

  const melhorVeiculo = rankingVeiculos[0];
  const alertasFinanceiros = [];

  if (totalDespesas > totalEntradas) {
    alertasFinanceiros.push(
      'As despesas estão maiores que as entradas. Existe prejuízo operacional.',
    );
  }

  if (contratosEmRisco.length > 0) {
    alertasFinanceiros.push(
      `${contratosEmRisco.length} contrato(s) ativo(s) estão com risco de atraso ou vencimento pendente.`,
    );
  }

  if (veiculosSemContratoAtivo.length > 0) {
    alertasFinanceiros.push(
      `${veiculosSemContratoAtivo.length} veículo(s) estão sem contrato ativo.`,
    );
  }

  if (multasVencidas.length > 0) {
    alertasFinanceiros.push(
      `${multasVencidas.length} multa(s) vencida(s) ou pendente(s).`,
    );
  }

  const contexto = `
Resumo financeiro:
- Entradas: ${money(totalEntradas)}
- Despesas: ${money(totalDespesas)}
- Valor líquido atual: ${money(totalEntradas - totalDespesas)}
- Repasses: ${money(repasseSocios)}
- Repasse sócios: ${money(repasseSocios)}
- Repasse ADM: ${money(repasseAdm)}

Previsão de lucro ADM:
- Próximos 30 dias: ${money(lucro30Dias)}
- Próximos 60 dias: ${money(lucro60Dias)}
- Próximos 90 dias: ${money(lucro90Dias)}

Lucro estimado atual: ${money(lucro)}

Lucro previsto por período:
- Lucro em 30 dias: ${money(lucro30Dias)}
- Lucro em 60 dias: ${money(lucro60Dias)}
- Lucro em 90 dias: ${money(lucro90Dias)}

Cálculo usado:
Primeiro subtrair as despesas registradas do aluguel atual.
Depois aplicar o percentual de repasse ADM.

Lucro ADM atual = (Aluguel - Despesas registradas) * Percentual ADM.
Repasse sócio atual = (Aluguel - Despesas registradas) * Percentual sócio.

Para projeção futura:
Lucro em 30 dias = lucro ADM atual.
Lucro em 60 dias = lucro ADM atual + lucro ADM de 1 mês futuro sem novas despesas.
Lucro em 90 dias = lucro ADM atual + lucro ADM de 2 meses futuros sem novas despesas.

Exemplo obrigatório:
Se o aluguel for R$ 3.600, a despesa registrada for R$ 250 e o percentual ADM for 50%:
30 dias = (3600 - 250) * 50% = R$ 1.675.
60 dias = R$ 1.675 + R$ 1.800 = R$ 3.475.
90 dias = R$ 1.675 + R$ 1.800 + R$ 1.800 = R$ 5.275.

Regra obrigatória:
Quando o usuário perguntar lucro em 30, 60 ou 90 dias, responder usando exatamente o lucro previsto do período solicitado.
Quando o usuário perguntar lucro em 60 dias, usar lucro60Dias.
Quando o usuário perguntar lucro em 90 dias, usar lucro90Dias.
Não responder lucro futuro usando apenas lucro atual.
Quando uma nova despesa for registrada, recalcular automaticamente com base nas despesas atuais da tabela financial_entries.
Quando exibir "Repasses", mostrar somente o repasse dos sócios.
Não somar repasse ADM dentro de "Repasses".
O repasse ADM representa o lucro/previsão da empresa.
`;

  return NextResponse.json({
    totalEntradas,
    totalDespesas,

    repasseSocios,
    repasseAdm,

    totalRepasses,
    totalRepassesGeral,

    lucro,

    previsao30Dias,
    previsao60Dias,
    previsao90Dias,

    lucro30Dias,
    lucro60Dias,
    lucro90Dias,

    previsaoEntrada30Dias: previsao30Dias,
    previsaoEntrada60Dias: previsao60Dias,
    previsaoEntrada90Dias: previsao90Dias,

    proximos30Dias: previsao30Dias,
    proximos60Dias: previsao60Dias,
    proximos90Dias: previsao90Dias,

    entradasContratos,
    entradasManuais,

    entradasContratosFormatado: money(entradasContratos),
    entradasManuaisFormatado: money(entradasManuais),

    totalEntradasFormatado: money(totalEntradas),
    totalDespesasFormatado: money(totalDespesas),

    repasseSociosFormatado: money(repasseSocios),
    repasseAdmFormatado: money(repasseAdm),

    totalRepassesFormatado: money(totalRepasses),
    totalRepassesGeralFormatado: money(totalRepassesGeral),

    lucroFormatado: money(lucro),

    previsao30DiasFormatado: money(previsao30Dias),
    previsao60DiasFormatado: money(previsao60Dias),
    previsao90DiasFormatado: money(previsao90Dias),

    lucro30DiasFormatado: money(lucro30Dias),
    lucro60DiasFormatado: money(lucro60Dias),
    lucro90DiasFormatado: money(lucro90Dias),

    previsaoEntrada30DiasFormatado: money(previsao30Dias),
    previsaoEntrada60DiasFormatado: money(previsao60Dias),
    previsaoEntrada90DiasFormatado: money(previsao90Dias),

    proximos30DiasFormatado: money(previsao30Dias),
    proximos60DiasFormatado: money(previsao60Dias),
    proximos90DiasFormatado: money(previsao90Dias),

    totalVeiculos: vehicles.length,
    totalMotoristas: drivers.length,
    totalSocios: investors.length,
    totalContratos: contracts.length,
    contratosAtivos: contratosAtivos.length,
    veiculosSemContratoAtivo: veiculosSemContratoAtivo.length,
    totalMultas: fines.length,
    multasVencidas: multasVencidas.length,

    melhorVeiculo: melhorVeiculo ?? null,
    rankingVeiculos,
    analisePorVeiculo,
    analisePorSocio,
    contratosEmRisco,
    alertasFinanceiros,

    contexto,
  });
}