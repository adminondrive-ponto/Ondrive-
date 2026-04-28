import { createSupabaseServerClient } from '@/lib/supabase/server';
import Link from 'next/link';

type Veiculo = {
  id: string;
  plate: string | null;
  model: string | null;
  created_at: string | null;
};

export default async function VeiculosPage() {
  const supabase = await createSupabaseServerClient();

  const { data: veiculos } = await supabase
    .from('vehicles')
    .select('*')
    .order('created_at', { ascending: false });

  const listaVeiculos = (veiculos ?? []) as Veiculo[];

  return (
    <div style={{ padding: 24 }}>
      {/* HEADER */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: 20,
        }}
      >
        <h1 style={{ fontSize: 24 }}>Veículos</h1>

        <Link href="/veiculos/novo">
          <button
            style={{
              background: '#2563eb',
              color: '#fff',
              padding: '10px 16px',
              borderRadius: 8,
              border: 'none',
            }}
          >
            + Novo veículo
          </button>
        </Link>
      </div>

      {/* LISTA */}
      <div style={{ display: 'grid', gap: 10 }}>
        {listaVeiculos.map((v) => (
          <div
            key={v.id}
            style={{
              border: '1px solid #ddd',
              borderRadius: 10,
              padding: 16,
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <strong>{v.plate}</strong> - {v.model}
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <Link href={`/veiculos/${v.id}`}>
                <button>Editar</button>
              </Link>

              <button style={{ color: 'red' }}>Excluir</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}