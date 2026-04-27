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

const statusOptions = [
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
        key: 'driver_id',
        label: 'Motorista vinculado',
        type: 'select',
        relation: {
          table: 'drivers',
          valueKey: 'id',
          labelKey: 'name',
          secondaryLabelKey: 'phone',
          orderBy: { column: 'name', ascending: true },
        },
      },

      { key: 'chassis', label: 'Chassi', type: 'text' },
      { key: 'renavan', label: 'Renavam', type: 'text' },
      { key: 'color', label: 'Cor do carro', type: 'text' },
      { key: 'km_initial', label: 'KM inicial', type: 'number' },
      { key: 'km_per_month', label: 'KM mensal', type: 'number' },
      { key: 'last_maintenance', label: 'Data da última vistoria', type: 'date' },
      { key: 'next_revision', label: 'Data da próxima vistoria', type: 'date' },
      { key: 'vehicle_photo_url', label: 'Foto do documento do carro (JPG)', type: 'file' },

      {
        key: 'status',
        label: 'Status',
        type: 'select',
        options: [
          { label: 'Disponível', value: 'available' },
          { label: 'Alugado', value: 'rented' },
          { label: 'Vendido em forma de aluguel', value: 'sold' },
          { label: 'Manutenção', value: 'maintenance' },
        ],
      },
      {
        key: 'financing_status',
        label: 'Quitado ou financiado',
        type: 'select',
        options: [
          { label: 'Quitado', value: 'quitado' },
          { label: 'Financiado', value: 'financiado' },
        ],
      },
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
      'driver_id',
      'color',
      'km_initial',
      'km_per_month',
      'last_maintenance',
      'next_revision',
      'status',
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

      {
        key: 'payment_weekday',
        label: 'Dia da semana do pagamento',
        type: 'select',
        options: [
          { label: 'Segunda-feira', value: 'monday' },
          { label: 'Terça-feira', value: 'tuesday' },
          { label: 'Quarta-feira', value: 'wednesday' },
          { label: 'Quinta-feira', value: 'thursday' },
          { label: 'Sexta-feira', value: 'friday' },
        ],
      },

      {
        key: 'rental_mode',
        label: 'Tipo de contrato do motorista',
        type: 'select',
        options: [
          { label: 'Aluguel', value: 'aluguel' },
          { label: 'Venda em forma de aluguel', value: 'venda_aluguel' },
        ],
      },

      { key: 'rent_amount', label: 'Valor da parcela que deve pagar', type: 'number' },

      {
        key: 'vehicle_id',
        label: 'Veículo alugado/comprado',
        type: 'select',
        relation: {
          table: 'vehicles',
          valueKey: 'id',
          labelKey: 'plate',
          secondaryLabelKey: 'model',
          orderBy: { column: 'plate', ascending: true },
        },
      },

      {
        key: 'insurance_primary_driver',
        label: 'Principal condutor no seguro',
        type: 'checkbox',
      },

      { key: 'driver_score', label: 'Score do motorista', type: 'number' },

      { key: 'reference1_name', label: 'Referência 1 - Nome', type: 'text' },
      { key: 'reference1_phone', label: 'Referência 1 - Telefone', type: 'text' },

      { key: 'reference2_name', label: 'Referência 2 - Nome', type: 'text' },
      { key: 'reference2_phone', label: 'Referência 2 - Telefone', type: 'text' },

      { key: 'social_media_link', label: 'Link da rede social', type: 'text' },
{
  key: 'cnh_file_url',
  label: 'CNH do motorista (foto ou PDF)',
  type: 'file',
},

      { key: 'app_photo_path', label: 'Foto do app (JPG)', type: 'file' },
      { key: 'residence_photo_path', label: 'Comprovante de residência (JPG)', type: 'file' },

      {
        key: 'residence_front_photo_path',
        label: 'Foto da frente da residência (JPG)',
        type: 'file',
      },

      {
        key: 'signed_contract_pdf_path',
        label: 'Contrato assinado (PDF)',
        type: 'file',
      },
{
  key: 'criminal_record_photo_path',
  label: 'Antecedentes criminais (PDF)',
  type: 'file',
},

      { key: 'notes', label: 'Observações', type: 'textarea' },
    ],
    listColumns: [
      'name',
      'cpf',
      'phone',
      'vehicle_id',
      'rental_mode',
      'rent_amount',
      'payment_weekday',
      'cnh_due_date',
      'driver_score',
    ],
  },

  vistorias: {
    slug: 'vistorias',
    title: 'Vistorias',
    table: 'inspections',
    orderBy: { column: 'created_at', ascending: false },
    fields: [
      {
        key: 'vehicle_id',
        label: 'Veículo',
        type: 'select',
        relation: {
          table: 'vehicles',
          valueKey: 'id',
          labelKey: 'plate',
          secondaryLabelKey: 'model',
          orderBy: { column: 'plate', ascending: true },
        },
      },
      {
        key: 'driver_id',
        label: 'Motorista',
        type: 'select',
        relation: {
          table: 'drivers',
          valueKey: 'id',
          labelKey: 'name',
          orderBy: { column: 'name', ascending: true },
        },
      },
      {
  key: 'concluida',
  label: 'Status da vistoria',
  type: 'select',
  options: [
    { label: 'Pendente', value: 'Pendente' },
    { label: 'Concluída', value: 'Concluída' },
  ],
},
{
  key: 'date',
  label: 'Data da vistoria',
  type: 'date',
  required: true,
},
],
listColumns: ['vehicle_id', 'driver_id', 'concluida', 'date'],
},

  multas: {
    slug: 'multas',
    title: 'Multas',
    table: 'fines',
    orderBy: { column: 'created_at', ascending: false },
    fields: [
      {
        key: 'driver_id',
        label: 'Motorista',
        type: 'select',
        relation: {
          table: 'drivers',
          valueKey: 'id',
          labelKey: 'name',
          secondaryLabelKey: 'phone',
          orderBy: { column: 'name', ascending: true },
        },
      },
      {
        key: 'vehicle_id',
        label: 'Veículo',
        type: 'select',
        relation: {
          table: 'vehicles',
          valueKey: 'id',
          labelKey: 'plate',
          secondaryLabelKey: 'model',
          orderBy: { column: 'plate', ascending: true },
        },
      },
      {
        key: 'due_date',
        label: 'Data de vencimento',
        type: 'date',
        required: true,
      },
      {
        key: 'amount',
        label: 'Valor da multa',
        type: 'number',
        required: true,
      },
      {
        key: 'status',
        label: 'Status da multa',
        type: 'select',
        options: [
          { label: 'Pendente', value: 'pendente' },
          { label: 'Paga', value: 'paga' },
          { label: 'Vencida', value: 'vencida' },
        ],
      },
      {
        key: 'description',
        label: 'Observações',
        type: 'textarea',
      },
    ],
    listColumns: ['driver_id', 'vehicle_id', 'due_date', 'amount', 'status'],
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

    {
      key: 'active_cars',
      label: 'Carros ativos',
      type: 'multiselect',
      relation: {
        table: 'vehicles',
        valueKey: 'id',
        labelKey: 'plate',
        secondaryLabelKey: 'model',
        orderBy: { column: 'plate', ascending: true },
      },
    },

    { key: 'adm_percentage', label: '% Administração', type: 'number' },
    { key: 'partner_percentage', label: '% Sócio', type: 'number' },

    { key: 'notes', label: 'Observações', type: 'textarea' },
  ],
  listColumns: ['name', 'phone', 'cpf', 'active_cars', 'adm_percentage', 'partner_percentage'],
},

  financeiro: {
    slug: 'financeiro',
    title: 'Financeiro',
    table: 'financial_entries',
    orderBy: { column: 'date', ascending: false },
    fields: [
      { key: 'date', label: 'Data', type: 'date', required: true },
      { key: 'rent_value', label: 'Valor do aluguel', type: 'number' },
     { key: 'adm_fee', label: '% Repasse ADM/Motorista', type: 'number' },
{ key: 'repasse_value', label: '% Repasse do sócio', type: 'number' },
      { key: 'expense_value', label: 'Valor da despesa', type: 'number' },
      { key: 'description', label: 'Descrição da despesa', type: 'textarea' },
      {
        key: 'vehicle_id',
        label: 'Veículo',
        type: 'select',
        relation: {
          table: 'vehicles',
          valueKey: 'id',
          labelKey: 'plate',
          secondaryLabelKey: 'model',
          orderBy: { column: 'plate', ascending: true },
        },
      },
      {
        key: 'driver_id',
        label: 'Motorista',
        type: 'select',
        relation: {
          table: 'drivers',
          valueKey: 'id',
          labelKey: 'name',
          orderBy: { column: 'name', ascending: true },
        },
      },
      { key: 'nf_photo', label: 'Foto da NF (JPG)', type: 'file' },
    ],
    listColumns: [
      'date',
      'rent_value',
      'adm_fee',
      'repasse_value',
      'expense_value',
      'vehicle_id',
      'driver_id',
    ],
  },

  contratos: {
    slug: 'contratos',
    title: 'Contratos',
    table: 'contracts',
    orderBy: { column: 'created_at', ascending: false },
    fields: [
      {
        key: 'driver_id',
        label: 'Motorista',
        type: 'select',
        relation: {
          table: 'drivers',
          valueKey: 'id',
          labelKey: 'name',
          secondaryLabelKey: 'phone',
          orderBy: { column: 'name', ascending: true },
        },
      },
      {
        key: 'investor_id',
        label: 'Sócio',
        type: 'select',
        relation: {
          table: 'investors',
          valueKey: 'id',
          labelKey: 'name',
          orderBy: { column: 'name', ascending: true },
        },
      },
      {
        key: 'vehicle_id',
        label: 'Veículo',
        type: 'select',
        relation: {
          table: 'vehicles',
          valueKey: 'id',
          labelKey: 'plate',
          secondaryLabelKey: 'model',
          orderBy: { column: 'plate', ascending: true },
        },
      },
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
      { key: 'status', label: 'Status', type: 'select', options: statusOptions },
      { key: 'rent_value', label: 'Valor do aluguel', type: 'number' },
    { key: 'repasse_value', label: 'Repasse sócio', type: 'number' },
{ key: 'adm_repasse_value', label: 'Repasse ADM', type: 'number' },
      {
        key: 'payment_weekday',
        label: 'Dia da semana do pagamento do aluguel',
        type: 'select',
        options: [
          { label: 'Segunda-feira', value: 'monday' },
          { label: 'Terça-feira', value: 'tuesday' },
          { label: 'Quarta-feira', value: 'wednesday' },
          { label: 'Quinta-feira', value: 'thursday' },
          { label: 'Sexta-feira', value: 'friday' },
        ],
      },
      { key: 'monthly_payment_day', label: 'Dia mensal do pagamento de venda', type: 'number' },
      { key: 'allowed_delay_days', label: 'Dias de atraso permitido', type: 'number' },
      { key: 'late_fee', label: 'Multa por atraso', type: 'number' },
      { key: 'contract_pdf_path', label: 'Contrato assinado (PDF)', type: 'file' },
      { key: 'notes', label: 'Observações', type: 'textarea' },
    ],
    listColumns: [
      'driver_id',
      'vehicle_id',
      'contract_kind',
      'start_date',
      'end_date',
      'status',
      'rent_value',
      'repasse_value',
    ],
  },
} satisfies Record<string, CrudModuleConfig>;

export type ModuleSlug = keyof typeof moduleConfigs;