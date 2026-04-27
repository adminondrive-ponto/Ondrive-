'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';
import type { CrudModuleConfig, ModuleField, ModuleOption } from '@/lib/types';
import { formatDate, formatMoney, toLabel } from '@/lib/format';

type RelationOptionsMap = Record<string, ModuleOption[]>;
type RowData = Record<string, any>;
type FormState = Record<string, any>;
type PayloadData = Record<string, any>;

function isFileField(field: ModuleField) {
  return String(field.type) === 'file';
}

function defaultValue(field: ModuleField) {
  if (field.type === 'checkbox') return false;
  if (field.type === 'multiselect') return [];
  return '';
}

function sanitizeText(value: string) {
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

function normalizeDateForInput(value: unknown) {
  if (!value) return '';
  const text = String(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  const match = text.match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : '';
}

function castValue(field: ModuleField, raw: unknown) {
  if (field.type === 'checkbox') return Boolean(raw);

  if (field.type === 'multiselect') {
    return Array.isArray(raw) ? raw : [];
  }
  if (field.type === 'number') {
    if (raw === '' || raw === null || raw === undefined) return null;
    const parsed = Number(raw);
    return Number.isNaN(parsed) ? null : parsed;
  }

  if (field.type === 'date') {
    if (!raw) return null;
    const normalized = normalizeDateForInput(raw);
    return normalized || null;
  }

  return sanitizeText(String(raw ?? ''));
}

function buildInitialForm(config: CrudModuleConfig): FormState {
  const base: FormState = {};

  config.fields.forEach((field) => {
    base[field.key] = defaultValue(field);
  });

  return base;
}

function getSupabaseErrorMessage(err: unknown, fallback: string) {
  if (err instanceof Error) return err.message;

  if (
    typeof err === 'object' &&
    err !== null &&
    'message' in err &&
    typeof (err as { message?: unknown }).message === 'string'
  ) {
    return (err as { message: string }).message;
  }

  return fallback;
}

function getColumnLabel(config: CrudModuleConfig, column: string) {
  const field = config.fields.find((item) => item.key === column);
  if (field) return field.label;

  const labels: Record<string, string> = {
    id: 'ID',
    date: 'Data',
    category: 'Categoria',
    amount: 'Valor',
    description: 'Descrição',
    notes: 'Observações',
    status: 'Status',
    paid: 'Pago',
    completed: 'Concluída',
    vehicle_id: 'Veículo',
    driver_id: 'Motorista',
    investor_id: 'Sócio',
    start_date: 'Data início',
    end_date: 'Data fim',
    due_date: 'Data vencimento',
    plate: 'Placa',
    brand: 'Marca',
    model: 'Modelo',
    year: 'Ano',
    name: 'Nome',
    phone: 'Telefone',
    cpf: 'CPF',
  repasse_value: 'Repasse sócio',
adm_repasse_value: 'Repasse ADM',
    rent_value: 'Valor aluguel',
    active_cars: 'Carros ativos',
    adm_fee: 'Repasse ADM',
    expense_value: 'Valor despesa',
    nf_photo: 'Foto NF',
    type: 'Tipo',
  };

  return labels[column] ?? toLabel(column);
}

function getDisplayValue(
  config: CrudModuleConfig,
  relationOptions: RelationOptionsMap,
  column: string,
  value: unknown,
) {
  if (value === null || value === undefined || value === '') return '—';

  const field = config.fields.find((item) => item.key === column);

 if (field?.relation) {
  // 🔥 SE FOR ARRAY (multiselect)
  if (Array.isArray(value)) {
    return value
      .map((val) => {
        const option = relationOptions[field.key]?.find(
          (item) => String(item.value) === String(val),
        );
        return option?.label ?? val;
      })
      .join(', ');
  }

  // 🔥 SE FOR VALOR ÚNICO
  const option = relationOptions[field.key]?.find(
    (item) => String(item.value) === String(value),
  );

  return option?.label ?? String(value);

  }

  if (field?.type === 'select') {
    const option = field.options?.find(
      (item) => String(item.value) === String(value),
    );
    return option?.label ?? toLabel(String(value));
  }

  const columnName = column.toLowerCase();

  if (columnName.includes('date') || columnName.includes('data')) {
    return formatDate(String(value));
  }

  if (
    config.table === 'financial_entries' &&
    (column === 'adm_fee' || column === 'repasse_value')
  ) {
    return `${Number(value)}%`;
  }

  if (
    typeof value === 'number' &&
    /amount|value|fee|rent|price|valor|repasse|expense/i.test(columnName)
  ) {
    return formatMoney(value);
  }

  if (typeof value === 'boolean') return value ? 'Sim' : 'Não';

  return toLabel(String(value));
}

function convertRowsToCsv(rows: RowData[], columns: string[]) {
  const header = columns.join(';');

  const body = rows.map((row) =>
    columns
      .map((column) => `"${String(row[column] ?? '').replace(/"/g, '""')}"`)
      .join(';'),
  );

  return [header, ...body].join('\n');
}

function parseCsv(text: string) {
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];

  const separator = lines[0].includes(';') ? ';' : ',';

  const headers = lines[0]
    .split(separator)
    .map((item) => item.trim().replace(/^"|"$/g, ''));

  return lines.slice(1).map((line) => {
    const values = line
      .split(separator)
      .map((item) => item.trim().replace(/^"|"$/g, ''));

    return headers.reduce<RowData>((acc, header, index) => {
      acc[header] = values[index] ?? '';
      return acc;
    }, {});
  });
}

function applyFinancialRules(payload: PayloadData) {
  const expenseValue = Number(payload.expense_value ?? 0);
  const rentValue = Number(payload.rent_value ?? 0);
  const repasseValue = Number(payload.repasse_value ?? 0);
  const admFee = Number(payload.adm_fee ?? 0);

  payload.type = expenseValue > 0 ? 'expense' : 'income';

  payload.amount =
    expenseValue > 0
      ? expenseValue
      : rentValue > 0
        ? rentValue
        : repasseValue > 0
          ? repasseValue
          : admFee > 0
            ? admFee
            : 0;

  return payload;
}

export function ModuleCrud({ config }: { config: CrudModuleConfig }) {
  const supabase = getSupabaseBrowserClient() as any;
  const router = useRouter();
  const initialForm = useMemo(() => buildInitialForm(config), [config]);

  const [rows, setRows] = useState<RowData[]>([]);
  const [form, setForm] = useState<FormState>(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [relationOptions, setRelationOptions] = useState<RelationOptionsMap>({});

  const resetForm = useCallback(() => {
    setForm(buildInitialForm(config));
  }, [config]);

  const loadRows = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let query: any = supabase.from(config.table).select('*');

      if (config.orderBy) {
        query = query.order(config.orderBy.column, {
          ascending: config.orderBy.ascending ?? false,
        });
      }

      const { data, error } = await query;

      if (error) throw new Error(error.message);

      setRows((data as RowData[]) ?? []);
    } catch (err) {
      setRows([]);
      setError(getSupabaseErrorMessage(err, 'Erro ao carregar registros.'));
    } finally {
      setLoading(false);
    }
  }, [config.orderBy, config.table, supabase]);

  const loadRelationOptions = useCallback(async () => {
  const relationFields = config.fields.filter(
  (field) =>
    (field.type === 'select' || field.type === 'multiselect') &&
    field.relation,
);

    if (relationFields.length === 0) {
      setRelationOptions({});
      return;
    }

    const nextOptions: RelationOptionsMap = {};

    for (const field of relationFields) {
      const relation = field.relation!;

      try {
        let query: any = supabase.from(relation.table).select('*');

        if (relation.orderBy) {
          query = query.order(relation.orderBy.column, {
            ascending: relation.orderBy.ascending ?? false,
          });
        }

        const { data, error } = await query;

      if (error) throw new Error(error.message);

nextOptions[field.key] = ((data as RowData[]) ?? []).map((row) => {
  if (relation.table === 'vehicles') {
    return {
      value: String(row.id),
      label: `${row.plate} · ${row.model}`,
    };
  }

  return {
    value: String(row.id),
    label: row.name ?? 'Sem nome',
  };
});

      } catch (err) {
        setError(
          getSupabaseErrorMessage(
            err,
            `Erro ao carregar opções de ${field.label}.`,
          ),
        );
      }
    }

    setRelationOptions(nextOptions);
  }, [config.fields, supabase]);

  useEffect(() => {
    void loadRows();
    void loadRelationOptions();
  }, [loadRows, loadRelationOptions]);

  useEffect(() => {
    setForm(initialForm);
  }, [initialForm]);

function updateField(field: ModuleField, raw: unknown) {
  setForm((prev) => {
    const value = field.type === 'checkbox' ? Boolean(raw) : raw;

    const next = {
      ...prev,
      [field.key]: value,
    };

    if (config.slug === 'financeiro') {
      if (field.key === 'adm_fee') {
        const admPercent = Number(value);

        if (!Number.isNaN(admPercent) && admPercent >= 0 && admPercent <= 100) {
          next.repasse_value = String(100 - admPercent);
        }
      }

      if (field.key === 'repasse_value') {
        const socioPercent = Number(value);

        if (!Number.isNaN(socioPercent) && socioPercent >= 0 && socioPercent <= 100) {
          next.adm_fee = String(100 - socioPercent);
        }
      }
    }

    return next;
  });
}

  function startEdit(row: RowData) {
    const next: FormState = {};

    config.fields.forEach((field) => {
      const value = row[field.key];

      if (field.type === 'checkbox') {
        next[field.key] = Boolean(value);
      } else if (field.type === 'date') {
        next[field.key] = normalizeDateForInput(value);
      } else {
        next[field.key] = value ?? defaultValue(field);
      }
    });

    setEditingId(String(row.id));
    setDeletingId(null);
    setForm(next);
    setError(null);
    setSuccess(null);

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function cancelEdit() {
    setEditingId(null);
    setDeletingId(null);
    setError(null);
    resetForm();
  }

  function buildPayload(): PayloadData {
    const payload: PayloadData = {};

    config.fields.forEach((field) => {
      if (isFileField(field) && !form[field.key]) {
        payload[field.key] = null;
        return;
      }

      payload[field.key] = castValue(field, form[field.key]);
    });

    if (config.table === 'financial_entries') {
      return applyFinancialRules(payload);
    }

    return payload;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSaving(true);
    setError(null);
    setSuccess(null);
if (config.slug === 'financeiro') {
  const admPercent = Number(form.adm_fee ?? 0);
  const socioPercent = Number(form.repasse_value ?? 0);
  const totalPercent = admPercent + socioPercent;

  if (totalPercent !== 100) {
    setSaving(false);
    setError('A soma do % Repasse ADM/Motorista com o % Repasse do sócio precisa ser exatamente 100%.');
    return;
  }
}

try {
  const payload = buildPayload();
if (config.slug === 'multas') {
  if (payload.due_date && !payload.date) {
    payload.date = payload.due_date;
  }
}

  let savedId = editingId;

  if (editingId) {
    const { error } = await supabase
      .from(config.table)
      .update(payload)
      .eq('id', editingId);

    if (error) throw new Error(error.message);

    setSuccess('Registro atualizado com sucesso.');
  } else {
    const { data, error } = await supabase
      .from(config.table)
      .insert(payload)
      .select('id')
      .single();

    if (error) throw new Error(error.message);

    savedId = data?.id ? String(data.id) : null;

    setSuccess('Registro salvo com sucesso.');
  }


if (config.slug === 'motoristas' && savedId) {
  // Remove este motorista de qualquer veículo antigo
  const { error: clearOldVehicleError } = await supabase
    .from('vehicles')
    .update({ driver_id: null })
    .eq('driver_id', savedId);

  if (clearOldVehicleError) throw new Error(clearOldVehicleError.message);

  // Vincula este motorista somente ao veículo novo selecionado
  if (payload.vehicle_id) {
    const { error: vehicleUpdateError } = await supabase
      .from('vehicles')
      .update({ driver_id: savedId })
      .eq('id', payload.vehicle_id);

    if (vehicleUpdateError) throw new Error(vehicleUpdateError.message);
  }
}

      setEditingId(null);
      setDeletingId(null);
      resetForm();
      await loadRows();
      router.refresh();
    } catch (err) {
      setError(getSupabaseErrorMessage(err, 'Erro ao salvar o registro.'));
    } finally {
      setSaving(false);
    }
  }


async function confirmDelete() {
  if (!deletingId) return;

  setSaving(true);
  setError(null);
  setSuccess(null);

  try {
    if (config.slug === 'motoristas') {
      const { error: vehicleError } = await supabase
        .from('vehicles')
        .update({ driver_id: null })
        .eq('driver_id', deletingId);

      if (vehicleError) throw new Error(vehicleError.message);

      const { error: contractError } = await supabase
        .from('contracts')
        .update({ driver_id: null })
        .eq('driver_id', deletingId);

      if (contractError) throw new Error(contractError.message);

      const { error: fineError } = await supabase
        .from('fines')
        .update({ driver_id: null })
        .eq('driver_id', deletingId);

      if (fineError) throw new Error(fineError.message);

      const { error: inspectionError } = await supabase
        .from('inspections')
        .update({ driver_id: null })
        .eq('driver_id', deletingId);

      if (inspectionError) throw new Error(inspectionError.message);
    }

    const { error } = await supabase
      .from(config.table)
      .delete()
      .eq('id', deletingId);

    if (error) throw new Error(error.message);

    if (editingId === deletingId) {
      setEditingId(null);
      resetForm();
    }

    setDeletingId(null);
    setSuccess('Registro excluído com sucesso.');
    await loadRows();
    router.refresh();
  } catch (err) {
    setError(getSupabaseErrorMessage(err, 'Erro ao excluir o registro.'));
  } finally {
    setSaving(false);
  }
}











  function exportRows() {
    const csv = convertRowsToCsv(rows, config.listColumns);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = `${config.slug}-export.csv`;
    link.click();

    URL.revokeObjectURL(url);
  }

  async function importRows(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const text = await file.text();

      const parsedRows = parseCsv(text).map((row) => {
        const payload: PayloadData = {};

        config.fields.forEach((field) => {
          if (isFileField(field) && !row[field.key]) {
            payload[field.key] = null;
            return;
          }

          payload[field.key] = castValue(field, row[field.key]);
        });

        if (config.table === 'financial_entries') {
          return applyFinancialRules(payload);
        }

        return payload;
      });

      if (parsedRows.length === 0) {
        throw new Error(
          'Arquivo vazio ou inválido. Use CSV separado por vírgula ou ponto e vírgula.',
        );
      }

      const { error } = await supabase.from(config.table).insert(parsedRows);

      if (error) throw new Error(error.message);

      setSuccess(`${parsedRows.length} registro(s) importado(s) com sucesso.`);
      await loadRows();
      router.refresh();
    } catch (err) {
      setError(getSupabaseErrorMessage(err, 'Erro ao importar planilha.'));
    } finally {
      setSaving(false);
      event.target.value = '';
    }
  }

  async function convertAddressToCoordinates() {
    const address = [form.address, form.cep].filter(Boolean).join(', ');

    if (!address) {
      setError('Preencha CEP e/ou endereço antes de converter.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(
          address,
        )}`,
      );

      const data = (await response.json()) as Array<{ lat: string; lon: string }>;

      if (!data.length) {
        throw new Error('Não encontrei latitude e longitude para esse endereço.');
      }

      setForm((prev) => ({
        ...prev,
        latitude: Number(data[0].lat),
        longitude: Number(data[0].lon),
      }));

      setSuccess('Latitude e longitude preenchidas. Confira antes de salvar.');
    } catch (err) {
      setError(getSupabaseErrorMessage(err, 'Erro ao converter endereço.'));
    } finally {
      setSaving(false);
    }
  }


 async function uploadFile(field: ModuleField, file: File) {
  setSaving(true);
  setError(null);
  setSuccess(null);

  try {
    const extension = file.name.split('.').pop()?.toLowerCase() ?? '';

const isPdfOnlyField =
  field.key.includes('pdf') || field.key.includes('contract');

const isCnhField = field.key === 'cnh_file_url';

    const allowsImageAndPdf =
      config.slug === 'financeiro' && field.key === 'nf_photo';

    if (isPdfOnlyField && extension !== 'pdf') {
      throw new Error('Envie apenas arquivo PDF para este campo.');
    }
if (
  isCnhField &&
  !['jpg', 'jpeg', 'png', 'webp', 'pdf'].includes(extension)
) {
  throw new Error('Envie imagem ou PDF para a CNH.');
}


    if (
  !isPdfOnlyField &&
  !allowsImageAndPdf &&
  !isCnhField &&
  !['jpg', 'jpeg', 'png', 'webp'].includes(extension)

    ) {
      throw new Error('Envie apenas imagem JPG, JPEG, PNG ou WEBP.');
    }

    if (
      allowsImageAndPdf &&
      !['jpg', 'jpeg', 'png', 'webp', 'pdf'].includes(extension)
    ) {
      throw new Error('Envie apenas imagem ou PDF para a nota fiscal.');
    }

    const bucketName =
  config.slug === 'motoristas'
    ? 'driver-documents'
    : config.slug === 'veiculos'
      ? 'vehicle-photos'
      : config.slug === 'financeiro'
        ? 'notas-fiscais'
        : config.slug === 'contratos'
          ? 'contract-pdfs'
          : 'documents';

    const folderName = `${config.slug}/${field.key}`;

    const fileName = `${folderName}/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
      });

    if (uploadError) throw new Error(uploadError.message);

    updateField(field, fileName);
    setSuccess('Arquivo enviado com sucesso. Agora salve o registro.');
  } catch (err) {
    setError(getSupabaseErrorMessage(err, 'Erro ao enviar arquivo.'));
  } finally {
    setSaving(false);
  }
}

  return (
    <div
      className="grid-two"
   style={
  config.slug === 'financeiro' ||
config.slug === 'veiculos' ||
config.slug === 'motoristas' ||
config.slug === 'vistorias' ||
config.slug === 'multas' ||
config.slug === 'socios'
    ? {
        display: 'grid',
       gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
        gap: 20,
        alignItems: 'start',
        width: '100%',
        maxWidth: '100%',
        overflow: 'hidden',
      }
    : undefined
}

    >
      <section className="card">
        <div className="page-header" style={{ marginBottom: 16 }}>
          <div>
            <h2 style={{ margin: 0 }}>
              {editingId ? 'Editar registro' : `Novo registro em ${config.title}`}
            </h2>
          </div>

          {editingId ? (
            <button type="button" className="btn" onClick={cancelEdit}>
              Cancelar edição
            </button>
          ) : null}
        </div>

        {error ? <div className="alert">{error}</div> : null}
        {success ? <div className="alert success">{success}</div> : null}
{config.slug === 'financeiro' &&
 Number(form.rent_value ?? 0) > 0 &&
 Number(form.expense_value ?? 0) > Number(form.rent_value ?? 0) ? (
  <div className="alert" style={{ background: '#fee2e2', color: '#991b1b' }}>
    ⚠️ Atenção: essa operação está com prejuízo (despesa maior que o aluguel)
  </div>
) : null}

  <form
  onSubmit={handleSubmit}
  className="form-grid"
  style={{
    width: '100%',
    maxWidth: '100%',
    overflow: 'hidden',
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
    gap: '14px 18px',
    alignItems: 'end',
  }}
>
          {config.fields.map((field) => (
  <div
  className={`field ${field.type === 'textarea' ? 'full' : ''}`}
  key={field.key}
 style={{
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
}}

>
              <label htmlFor={field.key}>
                {field.label}
                {field.required ? ' *' : ''}
              </label>

             
{field.type === 'textarea' ? (
  <textarea
    id={field.key}
    name={field.key}
    value={String(form[field.key] ?? '')}
    onChange={(e) => updateField(field, e.target.value)}
    required={field.required}
    placeholder={field.placeholder}
  />

) : field.type === 'select' ? (
  <select
    id={field.key}
    name={field.key}
    value={String(form[field.key] ?? '')}
    onChange={(e) => updateField(field, e.target.value)}
    required={field.required}
  >
    <option value="">Selecione</option>

    {(field.relation
      ? relationOptions[field.key] ?? []
      : field.options ?? []
    ).map((option) => (
      <option key={String(option.value)} value={String(option.value)}>
        {option.label}
      </option>
    ))}
  </select>

) : field.type === 'multiselect' ? (
<div
  style={{
    display: 'grid',
    gap: 8,
    maxHeight: 160,
    overflowY: 'auto',
    border: '1px solid var(--border)',
    borderRadius: 10,
    padding: 10,
    background: '#fff',
  }}
>
  {(field.relation
    ? relationOptions[field.key] ?? []
    : field.options ?? []
  ).map((option) => {
    const selectedValues = Array.isArray(form[field.key])
      ? form[field.key]
      : [];

    const checked = selectedValues.includes(String(option.value));

    return (
      <label
        key={String(option.value)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          cursor: 'pointer',
        }}
      >
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => {
            const currentValues = Array.isArray(form[field.key])
              ? form[field.key]
              : [];

            const newValues = e.target.checked
              ? [...currentValues, String(option.value)]
              : currentValues.filter(
                  (value: string) => value !== String(option.value)
                );

            updateField(field, newValues);
          }}
        />

        <span>{option.label}</span>
      </label>
    );
  })}
</div>

) : field.type === 'checkbox' ? (
  <label
    htmlFor={field.key}
    style={{
      minHeight: 52,
      width: '100%',
      border: '1px solid var(--border)',
      borderRadius: 10,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      cursor: 'pointer',
      fontSize: 16,
      background: '#fff',
    }}
  >
    <input
      id={field.key}
      name={field.key}
      type="checkbox"
      checked={Boolean(form[field.key])}
      onChange={(e) => updateField(field, e.target.checked)}
      style={{ width: 22, height: 22, cursor: 'pointer' }}
    />
    {field.label}
  </label>
) : isFileField(field) ? (
  <>
    <input
      id={field.key}
      name={field.key}
      type="file"
      accept={
  config.slug === 'financeiro' && field.key === 'nf_photo'
    ? 'image/jpeg,image/jpg,image/png,image/webp,application/pdf'
    : field.key === 'cnh_file_url'
      ? 'image/jpeg,image/jpg,image/png,image/webp,application/pdf'
      : field.key.includes('pdf') || field.key.includes('contract')
        ? 'application/pdf'
        : 'image/jpeg,image/jpg,image/png,image/webp'
}
      
      onChange={(e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        void uploadFile(field, file);
      }}
    />

    {form[field.key] ? (
      <small style={{ color: 'var(--muted)' }}>
        Arquivo enviado: {String(form[field.key])}
      </small>
    ) : null}
  </>



   







             ) : field.key === 'address' ? (
  <div style={{ display: 'flex', gap: 8 }}>
    <input
      id={field.key}
      name={field.key}
      type="text"
      value={form[field.key] ?? ''}
      onChange={(e) => updateField(field, e.target.value)}
      required={field.required}
      placeholder={field.placeholder}
      readOnly={field.readonly}
      style={{ flex: 1, minWidth: 0 }}
/>

    <button
      type="button"
      onClick={() => void convertAddressToCoordinates()}
      disabled={saving}
      style={{
  background: '#1e3a8a',
  border: 'none',
  color: '#ffffff',
  fontWeight: 700,
  cursor: 'pointer',
  borderRadius: 8,
  padding: '6px 12px',
fontSize: 13,
}}
    >
      Converter
    </button>
  </div>
) : (
  <input
    id={field.key}
    name={field.key}
    type={String(field.type)}
    value={form[field.key] ?? ''}
    onChange={(e) => updateField(field, e.target.value)}
    required={field.required}
    placeholder={field.placeholder}
    readOnly={field.readonly}
  />
)}
            </div>
          ))}

          <div className="btn-row" style={{ gridColumn: '1 / -1' }}>
            <button className="btn primary" disabled={saving} type="submit">
              {saving
                ? 'Salvando...'
                : editingId
                  ? 'Salvar alterações'
                  : 'Salvar registro'}
            </button>

            <button
              className="btn"
              type="button"
              onClick={() => void loadRows()}
              disabled={loading || saving}
            >
              Recarregar lista
            </button>
          </div>
        </form>
      </section>

      <section className="card">
        <div className="page-header" style={{ marginBottom: 16 }}>
          <div>
            <h2 style={{ margin: 0 }}>Registros cadastrados</h2>
            <p style={{ margin: '6px 0 0', color: 'var(--muted)' }}>
              {rows.length} registro(s)
            </p>
          </div>

          <div className="btn-row">
            <button
              type="button"
              className="btn"
              onClick={exportRows}
              disabled={rows.length === 0}
            >
              Exportar Excel/CSV
            </button>

            <label className="btn" style={{ cursor: 'pointer' }}>
              Importar Excel/CSV
              <input
                type="file"
                accept=".csv,.txt"
                onChange={(e) => void importRows(e)}
                style={{ display: 'none' }}
              />
            </label>
          </div>
        </div>

        {loading ? (
          <div className="empty">Carregando...</div>
        ) : rows.length === 0 ? (
          <div className="empty">Nenhum registro encontrado.</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  {config.listColumns.map((column) => (
                    <th key={column}>{getColumnLabel(config, column)}</th>
                  ))}
                  <th>Ações</th>
                </tr>
              </thead>

              <tbody>
                {rows.map((row) => (
                  <tr key={String(row.id)}>
                    {config.listColumns.map((column) => (
                      <td key={column}>
                        {getDisplayValue(
                          config,
                          relationOptions,
                          column,
                          row[column],
                        )}
                      </td>
                    ))}

                    <td>
                      <div className="btn-row">
                        <button
                          type="button"
                          className="btn"
                          onClick={() => startEdit(row)}
                          disabled={saving}
                        >
                          Editar
                        </button>

                        <button
                          type="button"
                          className="btn danger"
                          onClick={() => setDeletingId(String(row.id))}
                          disabled={saving}
                        >
                          Excluir
                        </button>
                      </div>

                      {deletingId === String(row.id) ? (
                        <div style={{ marginTop: 8 }}>
                          <p style={{ margin: '0 0 8px', color: 'var(--muted)' }}>
                            Confirmar exclusão?
                          </p>

                          <div className="btn-row">
                            <button
                              type="button"
                              className="btn danger"
                              onClick={() => void confirmDelete()}
                              disabled={saving}
                            >
                              Sim, excluir
                            </button>

                            <button
                              type="button"
                              className="btn"
                              onClick={() => setDeletingId(null)}
                              disabled={saving}
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}