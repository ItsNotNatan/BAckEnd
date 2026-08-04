import React from 'react';
import { CheckCircle2, XCircle, FileDown, MapPin, Calendar } from 'lucide-react';

export default function DetalhesMaterial({ item }) {
  // MOCK: Itens reais que o utilizador pediu na solicitação de Material
  const itensMockados = [
    { pn: 'PROLOGANT4RP', sap: 'TEXXX-0000022629', descricao: 'REPARTIDORES LÓGICOS 4 X M12 FÊMEA', qtd: 10, unid: 'NR', alocacao: '002-B-004' },
    { pn: '6GK1901-1BB11-2AA0', sap: 'TAL-S378006', descricao: 'CONECTOR IE FC 180 4X2', qtd: 4, unid: 'NR', alocacao: '002-B-004' }
  ];

  return (
    <div className="area-expandida">
      {/* --- INFORMAÇÕES GERAIS --- */}
      <div className="info-detalhe-grid">
        <div className="info-bloco">
          <label>WBS / Centro de Custo</label>
          <span style={{ color: '#2563eb', fontWeight: '600' }}>{item.wbs}</span>
        </div>
        
        <div className="info-bloco">
          <label><Calendar size={12} style={{ display: 'inline', marginBottom: '-2px' }}/> Data de Necessidade</label>
          <span>15/07/2026</span> {/* Num cenário real viria de item.data_necessidade */}
        </div>
        
        <div className="info-bloco">
          <label><MapPin size={12} style={{ display: 'inline', marginBottom: '-2px' }}/> Destino Físico</label>
          <span style={{ fontWeight: '600', color: '#1e293b' }}>STELLANTIS GOIANA (Linha 4)</span>
        </div>
        
        <div className="info-bloco" style={{ width: '100%' }}>
          <label>Observações do Solicitante</label>
          <p style={{ backgroundColor: '#ffffff', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', marginTop: '4px' }}>
            Entregar no portão 3 para o supervisor Carlos. Cuidado com o conector IE FC pois é frágil.
          </p>
        </div>
      </div>

      {/* --- TABELA DE ITENS A SEPARAR --- */}
      <table className="tabela-detalhes-itens">
        <thead>
          <tr>
            <th>DESENHO SAP</th>
            <th>PART NUMBER</th>
            <th>DESCRIÇÃO DO MATERIAL</th>
            <th>ALOCAÇÃO</th>
            <th style={{ width: '80px', textAlign: 'center' }}>QTD</th>
            <th style={{ width: '80px' }}>UNID</th>
          </tr>
        </thead>
        <tbody>
          {itensMockados.map((it, idx) => (
            <tr key={idx}>
              <td style={{ color: '#64748b' }}>{it.sap}</td>
              <td style={{ fontFamily: 'monospace', fontWeight: '600' }}>{it.pn}</td>
              <td>{it.descricao}</td>
              <td style={{ color: '#2563eb', fontWeight: '500' }}>{it.alocacao}</td>
              <td style={{ textAlign: 'center', fontWeight: '700', color: '#2563eb', backgroundColor: '#eff6ff' }}>{it.qtd}</td>
              <td style={{ color: '#64748b' }}>{it.unid}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* --- BARRA DE AÇÕES --- */}
      <div className="acoes-aprovacao" style={{ justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
        
        <button className="btn-contornado" style={{ color: '#475569', borderColor: '#cbd5e1' }}>
          <FileDown size={16} /> Exportar Lista de Separação
        </button>

        {/* Só mostra os botões de Aprovar/Recusar se o status for Pendente */}
        {item.status === 'Pendente' && (
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn-recusar"><XCircle size={16} /> Recusar Pedido</button>
            <button className="btn-aprovar"><CheckCircle2 size={16} /> Aprovar para Separação</button>
          </div>
        )}
      </div>
      
    </div>
  );
}