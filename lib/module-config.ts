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
      { key: 'vehicle_photo_url', label: 'Foto do veículo', type: 'file' },
      { key: 'notes', label: 'Observações', type: 'textarea' },
    ],
    listColumns: ['plate', 'brand', 'model', 'year', 'status'],
  },

  motoristas: {
    slug: 'motoristas',
    title: 'Motoristas',
    table: 'drivers',
    orderBy: { column: 'created_at', ascending: false },
    fields: [
      { key: 'name', label: 'Nome', type: 'text', required: true },
      { key: 'phone', label: 'Telefone', type: 'text' },
      { key: 'cpf', label: 'CPF', type: 'text' },
      { key: 'cnh_due_date', label: 'Vencimento da CNH', type: 'date' },
      { key: 'notes', label: 'Observações', type: 'textarea' },
    ],
    listColumns: ['name', 'phone', 'cpf', 'cnh_due_date'],
  },

  contratos: {
    slug: 'contratos',
    title: 'Contratos',
    table: 'contracts',
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
        },
      },
      { key: 'start_date', label: 'Data início', type: 'date' },
      { key: 'end_date', label: 'Data fim', type: 'date' },
      { key: 'rent_value', label: 'Valor aluguel', type: 'number' },
      { key: 'repasse_value', label: 'Repasse', type: 'number' },
    ],
    listColumns: ['vehicle_id', 'driver_id', 'rent_value', 'repasse_value'],
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
          { label: 'Aluguel', value: 'aluguel' },
          { label: 'Gasto', value: 'gasto' },
        ],
      },

      {
        key: 'vehicle_id',
        label: 'Veículo',
        type: 'select',
        relation: {
          table: 'vehicles',
          valueKey: 'id',
          labelKey: 'plate',
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
        },
      },

      { key: 'expense_type', label: 'Tipo de gasto', type: 'text' },
      { key: 'expense_description', label: 'Descrição', type: 'textarea' },

      { key: 'rental_value', label: 'Valor do aluguel', type: 'number' },
      { key: 'expense_value', label: 'Valor gasto', type: 'number' },
      { key: 'admin_fee', label: 'Administração', type: 'number' },
      { key: 'partner_transfer_value', label: 'Repasse sócio', type: 'number' },

      { key: 'payment_method', label: 'Forma de pagamento', type: 'text' },

      // 🔥 AQUI ESTÁ O UPLOAD REAL
      { key: 'invoice_file_url', label: 'Nota fiscal', type: 'file' },

      { key: 'notes', label: 'Observações', type: 'textarea' },
    ],

    listColumns: [
      'date',
      'entry_type',
      'vehicle_id',
      'rental_value',
      'expense_value',
      'partner_transfer_value',
    ],
  },
} satisfies Record<string, CrudModuleConfig>;

export type ModuleSlug = keyof typeof moduleConfigs;
