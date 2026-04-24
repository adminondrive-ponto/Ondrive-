export type ModuleFieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'date'
  | 'select'
  | 'checkbox'
  | 'file';

export interface ModuleOption {
  label: string;
  value: string;
}

export interface ModuleRelationConfig {
  table: string;
  valueKey?: string;
  labelKey?: string;
  secondaryLabelKey?: string;
  orderBy?: { column: string; ascending?: boolean };
}

export interface ModuleField {
  key: string;
  label: string;
  type: ModuleFieldType;
  required?: boolean;
  options?: ModuleOption[];
  placeholder?: string;
  readonly?: boolean;
  relation?: ModuleRelationConfig;
  format?: 'money' | 'date' | 'text';
}

export interface CrudModuleConfig {
  slug: string;
  title: string;
  description?: string;
  table: string;
  orderBy?: { column: string; ascending?: boolean };
  fields: ModuleField[];
  listColumns: string[];
}
