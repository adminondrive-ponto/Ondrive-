'use client';

import { useState } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';

type VehicleInfo = {
  id: string;
  plate: string;
  brand?: string;
  model?: string;
  year?: number;
  status?: string;
  driver_id?: string;
  investor_id?: string;
};

type DriverInfo = {
  id: string;
  name?: string;
  phone?: string;
};

type InvestorInfo = {
  id: string;
  name?: string;
  phone?: string;
  adm_percentage?: number;
  partner_percentage?: number;
};

type TrackerData = {
  vehicle: VehicleInfo;
  driver: DriverInfo | null;
  investor: InvestorInfo | null;
};

function statusLabel(status?: string) {
  const s = String(status ?? '').toLowerCase();
  if (['alugado', 'rented'].includes(s)) return { label: 'Alugado', color: '#3b82f6' };
  if (['disponivel', 'disponível', 'available'].includes(s)) return { label: 'Disponível', color: '#3fb950' };
  if (['vendido', 'sold'].includes(s)) return { label: 'Vendido', color: '#a78bfa' };
  if (['manutencao', 'manutenção', 'maintenance'].includes(s)) return { label: 'Manutenção', color: '#f0a732' };
  return { label: status || 'Não informado', color: '#8b949e' };
}

export function VehicleTracker() {
  const [plate, setPlate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<TrackerData | null>(null);

  const supabase = getSupabaseBrowserClient();

  async function buscar() {
    const plateClean = plate.trim().toUpperCase();
    if (!plateClean) { setError('Digite a placa do veículo.'); return; }

    setLoading(true);
    setError(null);
    setData(null);

    try {
      const { data: vehicles, error: vErr } = await supabase
        .from('vehicles').select('*').ilike('plate', plateClean).limit(1);

      if (vErr) throw vErr;
      if (!vehicles || vehicles.length === 0) {
        setError(`Nenhum veículo encontrado com a placa "${plateClean}".`);
        setLoading(false);
        return;
      }

      const vehicle = vehicles[0] as VehicleInfo;
      let driver: DriverInfo | null = null;
      let investor: InvestorInfo | null = null;

      const { data: contracts } = await supabase
        .from('contracts').select('driver_id, investor_id, status, active')
        .eq('vehicle_id', vehicle.id).limit(10);

      const activeContract = (contracts || []).find(
        (c: any) => c.active === true ||
          String(c.status ?? '').toLowerCase() === 'active' ||
          String(c.status ?? '').toLowerCase() === 'ativo',
      );

      const driverId = activeContract?.driver_id || vehicle.driver_id;
      const investorId = activeContract?.investor_id || vehicle.investor_id;

      if (driverId) {
        const { data: drivers } = await supabase
          .from('drivers').select('id, name, phone').eq('id', driverId).limit(1);
        driver = drivers?.[0] ?? null;
      }

      if (investorId) {
        const { data: investors } = await supabase
          .from('investors').select('id, name, phone, adm_percentage, partner_percentage')
          .eq('id', investorId).limit(1);
        investor = investors?.[0] ?? null;
      }

      setData({ vehicle, driver, investor });
    } catch (err: any) {
      setError(err?.message || 'Erro ao buscar veículo.');
    } finally {
      setLoading(false);
    }
  }

  const status = data ? statusLabel(data.vehicle.status) : null;

  return (
    <div style={{ color: '#ffffff' }}>
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <input
          style={{ flex: 1, background: '#1c2128', border: '1px solid #30363d', borderRadius: 10, padding: '10px 14px', color: '#ffffff', fontSize: 14 }}
          placeholder="🔍  Digite a placa do veículo (ex: ABC1D23)"
          value={plate}
          onChange={(e) => setPlate(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === 'Enter' && buscar()}
        />
        <button onClick={buscar} disabled={loading}
          style={{ background: '#f0a732', color: '#0d1117', border: 'none', borderRadius: 10, padding: '10px 24px', fontWeight: 700, fontSize: 14, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
          {loading ? 'Buscando...' : 'Buscar'}
        </button>
      </div>

      {error && (
        <div style={{ background: 'rgba(248,81,73,0.1)', border: '1px solid #f85149', borderRadius: 10, padding: '10px 14px', color: '#fca5a5', marginBottom: 16, fontSize: 13 }}>
          {error}
        </div>
      )}

      {!data && !error && !loading && (
        <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 16, padding: 40, textAlign: 'center', color: '#8b949e' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🛰️</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#ffffff', marginBottom: 6 }}>Rastreamento de Veículos</div>
          <div style={{ fontSize: 13 }}>Digite a placa de um veículo para ver suas informações.</div>
        </div>
      )}

      {data && (
        <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 14, padding: 16 }}>
              <div style={{ fontSize: 10, color: '#8b949e', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Veículo</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#ffffff', marginBottom: 2 }}>{data.vehicle.plate}</div>
              <div style={{ fontSize: 12, color: '#8b949e', marginBottom: 10 }}>
                {[data.vehicle.brand, data.vehicle.model, data.vehicle.year].filter(Boolean).join(' · ')}
              </div>
              <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 999, fontSize: 10, fontWeight: 700, background: `${status?.color}22`, color: status?.color, border: `1px solid ${status?.color}` }}>
                {status?.label}
              </span>
              <div style={{ borderTop: '1px solid #30363d', margin: '12px 0' }} />
              {data.driver ? (
                <>
                  <div style={{ fontSize: 10, color: '#8b949e', marginBottom: 3 }}>👤 Motorista</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#ffffff', marginBottom: 2 }}>{data.driver.name || 'Sem nome'}</div>
                  {data.driver.phone && <div style={{ fontSize: 11, color: '#8b949e' }}>📞 {data.driver.phone}</div>}
                </>
              ) : (
                <div style={{ fontSize: 12, color: '#8b949e' }}>Sem motorista vinculado</div>
              )}
            </div>

            {data.investor && (
              <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 14, padding: 16 }}>
                <div style={{ fontSize: 10, color: '#8b949e', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>🤝 Sócio vinculado</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#f0a732', marginBottom: 6 }}>{data.investor.name || 'Sem nome'}</div>
                {data.investor.partner_percentage && (
                  <div style={{ fontSize: 11, color: '#8b949e', marginBottom: 3 }}>Repasse sócio: <strong style={{ color: '#ffffff' }}>{data.investor.partner_percentage}%</strong></div>
                )}
                {data.investor.adm_percentage && (
                  <div style={{ fontSize: 11, color: '#8b949e', marginBottom: 3 }}>Repasse ADM: <strong style={{ color: '#ffffff' }}>{data.investor.adm_percentage}%</strong></div>
                )}
                {data.investor.phone && <div style={{ fontSize: 11, color: '#8b949e', marginTop: 4 }}>📞 {data.investor.phone}</div>}
              </div>
            )}

            <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 14, padding: 16 }}>
              <div style={{ fontSize: 10, color: '#8b949e', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>📡 Status GPS</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f0a732', display: 'inline-block' }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: '#f0a732' }}>Aguardando API</span>
              </div>
              <div style={{ fontSize: 11, color: '#8b949e' }}>Conecte a API do rastreador para ver a localização em tempo real.</div>
            </div>
          </div>

          <div style={{ background: '#1a2332', border: '1px solid #30363d', borderRadius: 14, position: 'relative', overflow: 'hidden', minHeight: 420, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(#1e2d40 1px, transparent 1px), linear-gradient(90deg, #1e2d40 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
            <div style={{ position: 'absolute', top: '30%', left: 0, right: 0, height: 14, background: '#243044' }} />
            <div style={{ position: 'absolute', top: '60%', left: 0, right: 0, height: 10, background: '#243044' }} />
            <div style={{ position: 'absolute', left: '25%', top: 0, bottom: 0, width: 14, background: '#243044' }} />
            <div style={{ position: 'absolute', left: '60%', top: 0, bottom: 0, width: 10, background: '#243044' }} />

            <div style={{ position: 'relative', zIndex: 10, textAlign: 'center' }}>
              <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(240,167,50,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#f0a732', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🚗</div>
              </div>
              <div style={{ background: 'rgba(13,17,23,0.9)', border: '1px solid rgba(240,167,50,0.3)', borderRadius: 10, padding: '8px 16px', fontSize: 12, color: '#f0a732' }}>
                ⚡ Conecte a API do rastreador para ver a posição real
              </div>
            </div>

            <div style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(13,17,23,0.85)', border: '1px solid #30363d', borderRadius: 8, padding: '5px 10px', fontSize: 11, color: '#8b949e' }}>
              📍 {data.vehicle.plate} — {data.vehicle.brand} {data.vehicle.model}
            </div>
          </div>
        </div>
      )}

      {data && (
        <div style={{ marginTop: 14, background: 'rgba(240,167,50,0.08)', border: '1px solid rgba(240,167,50,0.25)', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: '#f0a732' }}>
          ⚡ <strong>Pronto para integração:</strong> informe qual empresa de rastreamento você usa para configurarmos a integração com o mapa real.
        </div>
      )}
    </div>
  );
}