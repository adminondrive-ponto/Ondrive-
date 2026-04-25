import type { CrudModuleConfig } from '@/lib/types';

export const menuItems = [
  { label: 'Painel Operacional', href: '/dashboard' },
  { label: 'Alertas', href: '/alertas' },
  { label: 'Painel Financeiro', href: '/financeiro' },
  { label: 'Veículos', href: '/veiculos' },
  { label: 'Motoristas', href: '/motoristas' },
  { label: 'Contratos', href: '/contratos' },
  { label: 'Vistorias', href: '/vistorias' },
  { label: 'Multas', href: '/multas' },
  { label: 'Sócios', href: '/socios' },
  { label: 'IAdrive', href: '/copiloto' },
];

const diasUteisOptions = [
  { label: 'Segunda-feira', value: 'monday' },
  { label: 'Terça-feira', value: 'tuesday' },
  { label: 'Quarta-feira', value: 'wednesday' },
  { label: 'Quinta-feira', value: 'thursday' },
  { label: 'Sexta-feira', value: 'friday' },
];

const statusContratoOptions = [
  { label: 'Ativo', value: 'active' },
  { label: 'Inativo', value: 'inactive' },
];

export const moduleConfigs = {
  veiculos: {
    slug: 'veiculos',
    title: 'Veículos',
    table: 'vehicles',
    orderBy: { column: 'created_at', ascending: false },
    fields: [
      { key: 'plate', label: 'Placa', type: 'text', required: true },
      { key: 'brand', label: 'Marca', type: 'text' },
      { key: 'model', label: 'Modelo', type: 'text' },
      { key: 'year', label: 'Ano', type: 'number' },

      {
        key: 'status',
        label: 'Status',
        type: 'select',
        required: true,
        options: [
          { label: 'Disponível', value: 'available' },
          { label: 'Alugado', value: 'rented' },
          { label: 'Em manutenção', value: 'maintenance' },
          { label: 'Vendido', value: 'sold' },
        ],
      },

      { key: 'chassis', label: 'Chassi', type: 'text' },
      { key: 'color', label: 'Cor', type: 'text' },
      { key: 'initial_km', label: 'KM inicial', type: 'number' },
      { key: 'monthly_km', label: 'KM mensal', type: 'number' },
      { key: 'vehicle_photo_url', label: 'Foto do veículo JPG', type: 'file' },

      {
        key: 'financing_status',
        label: 'Quitado ou financiado',
        type: 'select',
        options: [
          { label: 'Quitado', value: 'quitado' },
          { label: 'Financiado', value: 'financiado' },
        ],
      },

      { key: 'financing_start_date', label: 'Data de início do financiamento', type: 'date' },
      { key: 'installments_total', label: 'Quantidade de parcelas', type: 'number' },
      { key: 'installment_value', label: 'Valor da parcela', type: 'number' },
      { key: 'financing_end_date', label: 'Data final do financiamento', type: 'date' },
      { key: 'notes', label: 'Observações', type: 'textarea' },
    ],
    listColumns: [
      'plate',
      'brand',
      'model',
      'year',
      'status',
      'chassis',
      'color',
      'initial_km',
      'monthly_km',
      'financing_status',
    ],
  },

  motoristas: {
    slug: 'motoristas',
    title: 'Motoristas',
    table: 'drivers',
    orderBy: { column: 'created_at', ascending: false },
    fields: [
      { key: 'name', label: 'Nome', type: 'text', required: true },
      { key: 'cpf', label: 'CPF', type: 'text' },
      { key: 'phone', label: 'Telefone', type: 'text' },
      { key: 'cep', label: 'CEP', type: 'text' },
      { key: 'address', label: 'Endereço', type: 'text' },
      { key: 'latitude', label: 'Latitude', type: 'number' },
      { key: 'longitude', label: 'Longitude', type: 'number' },
      { key: 'cnh_due_date', label: 'Vencimento da CNH', type: 'date' },
      { key: 'payment_weekday', label: 'Dia da semana do pagamento', type: 'select', options: diasUteisOptions },
      { key: 'driver_score', label: 'Score do motorista', type: 'number' },
      { key: 'reference_contact_1', label: 'Contato de referência 1', type: 'text' },
      { key: 'reference_contact_2', label: 'Contato de referência 2', type: 'text' },
      { key: 'notes', label: 'Observações', type: 'textarea' },
    ],
    listColumns: ['name', 'cpf', 'phone', 'payment_weekday', 'cnh_due_date', 'driver_score'],
  },

  contratos: {
    slug: 'contratos',
    title: 'Contratos',
    table: 'contracts',
    orderBy: { column: 'created_at', ascending: false },
    fields: [
      { key: 'driver_id', label: 'Motorista', type: 'select', relation: { table: 'drivers', valueKey: 'id', labelKey: 'name', secondaryLabelKey: 'phone', orderBy: { column: 'name', ascending: true } } },
      { key: 'investor_id', label: 'Sócio', type: 'select', relation: { table: 'investors', valueKey: 'id', labelKey: 'name', orderBy: { column: 'name', ascending: true } } },
      { key: 'vehicle_id', label: 'Veículo', type: 'select', relation: { table: 'vehicles', valueKey: 'id', labelKey: 'plate', secondaryLabelKey: 'model', orderBy: { column: 'plate', ascending: true } } },

      {
        key: 'contract_kind',
        label: 'Tipo de contrato',
        type: 'select',
        options: [
          { label: 'Aluguel', value: 'aluguel' },
          { label: 'Venda em forma de aluguel', value: 'venda_aluguel' },
        ],
      },

      { key: 'start_date', label: 'Data de início', type: 'date', required: true },
      { key: 'end_date', label: 'Data de fim', type: 'date' },
      { key: 'status', label: 'Status', type: 'select', options: statusContratoOptions },
      { key: 'rent_value', label: 'Valor do aluguel', type: 'number' },
      { key: 'repasse_value', label: 'Valor de repasse', type: 'number' },
      { key: 'payment_weekday', label: 'Dia da semana do pagamento do aluguel', type: 'select', options: diasUteisOptions },
      { key: 'monthly_payment_day', label: 'Dia mensal do pagamento de venda', type: 'number' },
      { key: 'allowed_delay_days', label: 'Dias de atraso permitido', type: 'number' },
      { key: 'late_fee', label: 'Multa por atraso', type: 'number' },

      { key: 'signed_contract_file_url', label: 'Contrato assinado/PDF', type: 'file' },
      { key: 'cnh_file_url', label: 'CNH', type: 'file' },
      { key: 'criminal_record_file_url', label: 'Antecedentes criminais', type: 'file' },
      { key: 'app_photos_url', label: 'Fotos dos apps', type: 'file' },
      { key: 'social_media_photo_url', label: 'Foto da rede social', type: 'file' },
      { key: 'house_photo_url', label: 'Foto da casa', type: 'file' },

      { key: 'reference_contact_1', label: 'Contato de referência 1', type: 'text' },
      { key: 'reference_contact_2', label: 'Contato de referência 2', type: 'text' },
      { key: 'notes', label: 'Observações', type: 'textarea' },
    ],
    listColumns: ['driver_id', 'vehicle_id', 'contract_kind', 'start_date', 'end_date', 'status', 'rent_value', 'repasse_value'],
  },

  multas: {
    slug: 'multas',
    title: 'Multas',
    table: 'fines',
    orderBy: { column: 'created_at', ascending: false },
    fields: [
      { key: 'vehicle_id', label: 'Veículo', type: 'select', relation: { table: 'vehicles', valueKey: 'id', labelKey: 'plate', secondaryLabelKey: 'model', orderBy: { column: 'plate', ascending: true } } },
      { key: 'driver_id', label: 'Motorista', type: 'select', relation: { table: 'drivers', valueKey: 'id', labelKey: 'name', secondaryLabelKey: 'phone', orderBy: { column: 'name', ascending: true } } },
      { key: 'date', label: 'Data', type: 'date', required: true },
      { key: 'due_date', label: 'Data de vencimento', type: 'date' },
      { key: 'amount', label: 'Valor', type: 'number', required: true },
      {
        key: 'status',
        label: 'Status',
        type: 'select',
        options: [
          { label: 'Pendente', value: 'pending' },
          { label: 'Pago', value: 'paid' },
          { label: 'Recorrido', value: 'appealed' },
        ],
      },
      { key: 'description', label: 'Descrição', type: 'textarea' },
    ],
    listColumns: ['date', 'vehicle_id', 'driver_id', 'amount', 'due_date', 'status'],
  },

  vistorias: {
    slug: 'vistorias',
    title: 'Vistorias',
    table: 'inspections',
    orderBy: { column: 'created_at', ascending: false },
    fields: [
      { key: 'vehicle_id', label: 'Veículo', type: 'select', relation: { table: 'vehicles', valueKey: 'id', labelKey: 'plate', secondaryLabelKey: 'model', orderBy: { column: 'plate', ascending: true } } },
      { key: 'driver_id', label: 'Motorista', type: 'select', relation: { table: 'drivers', valueKey: 'id', labelKey: 'name', orderBy: { column: 'name', ascending: true } } },
      { key: 'date', label: 'Data', type: 'date', required: true },
      { key: 'completed', label: 'Concluída', type: 'checkbox' },
      { key: 'notes', label: 'Observações', type: 'textarea' },
    ],
    listColumns: ['date', 'vehicle_id', 'driver_id', 'completed', 'notes'],
  },

  socios: {
    slug: 'socios',
    title: 'Sócios',
    table: 'investors',
    orderBy: { column: 'created_at', ascending: false },
    fields: [
      { key: 'name', label: 'Nome do sócio', type: 'text', required: true },
      { key: 'phone', label: 'Telefone', type: 'text' },
      { key: 'cpf', label: 'CPF/CNPJ', type: 'text' },
      { key: 'active_cars', label: 'Carros ativos', type: 'number' },
      { key: 'partnership_type', label: 'Tipo de parceria', type: 'text' },
      { key: 'repasse_value', label: 'Valor de repasse', type: 'number' },
      { key: 'notes', label: 'Observações', type: 'textarea' },
    ],
    listColumns: ['name', 'phone', 'cpf', 'active_cars', 'partnership_type', 'repasse_value'],
  },

  financeiro: {
    slug: 'financeiro',
    title: 'Financeiro',
    table: 'financial_entries',
    orderBy: { column: 'date', ascending: false },
    fields: [
      { key: 'date', label: 'Data', type: 'date', required: true },

      {
        key: 'entry_type',
        label: 'Tipo de lançamento',
        type: 'select',
        required: true,
        options: [
          { label: 'Entrada', value: 'entrada' },
          { label: 'Saída', value: 'saida' },
        ],
      },

      { key: 'vehicle_id', label: 'Veículo', type: 'select', relation: { table: 'vehicles', valueKey: 'id', labelKey: 'plate', secondaryLabelKey: 'model', orderBy: { column: 'plate', ascending: true } } },

      { key: 'investor_id', label: 'Sócio', type: 'select', relation: { table: 'investors', valueKey: 'id', labelKey: 'name', orderBy: { column: 'name', ascending: true } } },

      { key: 'driver_id', label: 'Motorista', type: 'select', relation: { table: 'drivers', valueKey: 'id', labelKey: 'name', orderBy: { column: 'name', ascending: true } } },

      { key: 'expense_type', label: 'Tipo de gasto', type: 'text' },

      { key: 'expense_description', label: 'Descrição do gasto', type: 'textarea' },

      { key: 'rental_value', label: 'Valor do aluguel', type: 'number' },

      { key: 'expense_value', label: 'Valor gasto', type: 'number' },

      { key: 'admin_fee', label: 'Repasse do ADM', type: 'number' },

      { key: 'partner_transfer_value', label: 'Repasse sócio', type: 'number' },

      { key: 'invoice_file_url', label: 'Nota fiscal', type: 'file' },
    ],
    listColumns: [
      'date',
      'entry_type',
      'vehicle_id',
      'investor_id',
      'rental_value',
      'expense_value',
      'admin_fee',
      'partner_transfer_value',
    ],
  },
} satisfies Record<string, CrudModuleConfig>;

export type ModuleSlug = keyof typeof moduleConfigs;
