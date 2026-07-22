import React from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';

export default function DetalhesTransferencia({ item }) {
  // MOCK: Itens da Transferência
  const itensMockados = [
    { pn: '1534534', descricao: 'SENSOR DE INDUÇÃO', qtd: 2 },
    { pn: 'PN-TUB-7890', descricao: 'Tubo Aço Inox 316L', qtd: 4 }
  ];

  return (
    <div className="area-expandida">
      <div className="info-detalhe-grid">
        <div className="info-bloco">
          <label>Rota da Transferência</label>
          <span style={{ color: '#2563eb', fontWeight: '600' }}>{item.wbs}</span>
        </div>
        <div className="info-bloco">
          <label>Justificativa do Solicitante</label>
          <p>O material será realocado devido à manutenção preventiva.</p>
        </div>
      </div>

      <table className="tabela-detalhes-itens">
        <thead>
          <tr>
            <th>PART NUMBER</th>
            <th>DESCRIÇÃO DO MATERIAL</th>
            <th style={{ width: '100px', textAlign: 'center' }}>QTD</th>
          </tr>
        </thead>
        <tbody>
          {itensMockados.map((it, idx) => (
            <tr key={idx}>
              <td style={{ fontFamily: 'monospace', fontWeight: '600' }}>{it.pn}</td>
              <td>{it.descricao}</td>
              <td style={{ textAlign: 'center', fontWeight: '700', color: '#2563eb' }}>{it.qtd}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {item.status === 'Pendente' && (
        <div className="acoes-aprovacao">
          <button className="btn-recusar"><XCircle size={16} /> Recusar</button>
          <button className="btn-aprovar"><CheckCircle2 size={16} /> Aprovar Transferência</button>
        </div>
      )}
    </div>
  );
}