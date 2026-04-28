import { AppShell } from '@/components/app-shell';
import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase/server';

async function excluirRegistro(table: string, id: string) {
  'use server';

  const supabase = await createSupabaseServerClient();

  await supabase.from(table).delete().eq('id', id);

  revalidatePath('/operacional');
}

export default async function OperacionalPage() {
  const supabase = await createSupabaseServerClient();

  const { data: vehicles } = await supabase
    .from('vehicles')
    .select('*')
    .order('created_at', { ascending: false });

  const { data: drivers } = await supabase
    .from('drivers')
    .select('*')
    .order('created_at', { ascending: false });

  const { data: investors } = await supabase
    .from('investors')
    .select('*')
    .order('created_at', { ascending: false });

  return (




<AppShell title="Painel Operacional">
  <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

    <BlocoVeiculos vehicles={vehicles ?? []} />
    <BlocoMotoristas drivers={drivers ?? []} />
    <BlocoSocios investors={investors ?? []} />

  </div>
</AppShell>
);



}

function BlocoVeiculos({ vehicles }: { vehicles: any[] }) {
  return (
    <section style={boxStyle}>
      <h2 style={titleStyle}>🚗 Veículos</h2>
      <p style={countStyle}>{vehicles.length} registro(s)</p>

      <div style={tableAreaStyle}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Placa</th>
              <th style={thStyle}>Veículo</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Ações</th>
            </tr>
          </thead>

          <tbody>
            {vehicles.map((item) => (
              <tr key={item.id}>
                <td style={tdStyle}>{item.plate ?? '—'}</td>
                <td style={tdStyle}>
                  {item.brand} {item.model}
                </td>
                <td style={tdStyle}>{item.status ?? '—'}</td>
                <td style={tdStyle}>
                  <Acoes table="vehicles" id={item.id} editHref={`/veiculos?id=${item.id}`} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function BlocoMotoristas({ drivers }: { drivers: any[] }) {
  return (
    <section style={boxStyle}>
      <h2 style={titleStyle}>👤 Motoristas</h2>
      <p style={countStyle}>{drivers.length} registro(s)</p>

      <div style={tableAreaStyle}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Nome</th>
              <th style={thStyle}>CPF</th>
              <th style={thStyle}>Telefone</th>
              <th style={thStyle}>Ações</th>
            </tr>
          </thead>

          <tbody>
            {drivers.map((item) => (
              <tr key={item.id}>
                <td style={tdStyle}>{item.name ?? '—'}</td>
                <td style={tdStyle}>{item.cpf ?? '—'}</td>
                <td style={tdStyle}>{item.phone ?? '—'}</td>
                <td style={tdStyle}>
                  <Acoes table="drivers" id={item.id} editHref={`/motoristas?id=${item.id}`} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function BlocoSocios({ investors }: { investors: any[] }) {
  return (
    <section style={boxStyle}>
      <h2 style={titleStyle}>🤝 Sócios</h2>
      <p style={countStyle}>{investors.length} registro(s)</p>

      <div style={tableAreaStyle}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Nome</th>
              <th style={thStyle}>CPF/CNPJ</th>
              <th style={thStyle}>Telefone</th>
              <th style={thStyle}>Ações</th>
            </tr>
          </thead>

          <tbody>
            {investors.map((item) => (
              <tr key={item.id}>
                <td style={tdStyle}>{item.name ?? '—'}</td>
                <td style={tdStyle}>{item.cpf ?? item.cnpj ?? '—'}</td>
                <td style={tdStyle}>{item.phone ?? '—'}</td>
                <td style={tdStyle}>
                  <Acoes table="investors" id={item.id} editHref={`/socios?id=${item.id}`} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Acoes({
  table,
  id,
  editHref,
}: {
  table: string;
  id: string;
  editHref: string;
}) {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <Link href={editHref} style={editButtonStyle}>
        Editar
      </Link>

      <form action={excluirRegistro.bind(null, table, id)}>
        <button style={deleteButtonStyle}>Excluir</button>
      </form>
    </div>
  );
}

const boxStyle = {
  background: '#ffffff',
  borderRadius: 18,
  padding: 22,
  boxShadow: '0 10px 25px rgba(15, 23, 42, 0.08)',
  height: 620,
  overflow: 'hidden',
};

const titleStyle = {
  fontSize: 28,
  marginBottom: 6,
};

const countStyle = {
  color: '#64748b',
  fontSize: 18,
  marginBottom: 18,
};

const tableAreaStyle = {
  height: 500,
  overflowY: 'auto' as const,
  overflowX: 'auto' as const,
};

const tableStyle = {
  minWidth: '700px',
  borderCollapse: 'collapse' as const,
  fontSize: 14,
};

const thStyle = {
  textAlign: 'left' as const,
  color: '#52627a',
  fontSize: 12,
  textTransform: 'uppercase' as const,
  padding: '12px 10px',
  borderBottom: '1px solid #e2e8f0',
  whiteSpace: 'nowrap' as const,
};

const tdStyle = {
  padding: '14px 10px',
  borderBottom: '1px solid #e2e8f0',
  whiteSpace: 'nowrap' as const,
};

const editButtonStyle = {
  background: '#2563eb',
  color: '#ffffff',
  padding: '7px 12px',
  borderRadius: 10,
  textDecoration: 'none',
  fontWeight: 600,
  fontSize: 13,
};

const deleteButtonStyle = {
  background: '#dc2626',
  color: '#ffffff',
  padding: '7px 12px',
  borderRadius: 10,
  border: 'none',
  fontWeight: 600,
  fontSize: 13,
  cursor: 'pointer',
};