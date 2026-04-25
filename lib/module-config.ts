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

export const moduleConfigs = {
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

      // ✅ ÚNICO CAMPO DE DESCRIÇÃO
      {
        key: 'expense_description',
        label: 'Descrição',
        type: 'textarea',
      },

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
