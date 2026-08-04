import React, { useState } from 'react';
import { Search, Loader2, ArrowLeftRight } from 'lucide-react';
import './SeletorEstoqueLateral.css';

export default function SeletorEstoqueLateral({
  estoque = [],
  carregando = false,
  onAdicionarItem,
  calcularSaldo // (Opcional) Função que o TransferênciaWBS usa para recalcular o saldo restante
}) {
  const [termoBusca, setTermoBusca] = useState('');

  // Filtra as opções independente se os dados vieram do TransferenciaWBS ou MaterialEstoque
  const estoqueFiltrado = estoque.filter((item) => {
    const termo = termoBusca.toLowerCase();
    
    // Suporta chaves em camelCase e snake_case (absorvendo ambas as telas)
    const sap = (item.desenhoSAP || item.desenho_sap_manual || item.desenho_sap || '').toLowerCase();
    const pn = (item.numPecaFabricante || item.part_number_manual || item.part_number || '').toLowerCase();
    const desc = (item.materialDescription || item.descricao_manual || item.descricao || '').toLowerCase();
    const nota = (item.nf || item.nf_entrada || '').toLowerCase();

    return sap.includes(termo) || pn.includes(termo) || desc.includes(termo) || nota.includes(termo);
  });

  return (
    <div className="painel-seletor-estoque">
      <div className="painel-seletor-header">
        <h3>Estoque Disponível</h3>
        <span className="badge-contador">{estoqueFiltrado.length} itens</span>
      </div>

      <div className="painel-seletor-pesquisa">
        <div className="input-wrapper">
          <Search size={16} className="icone-pesquisa" />
          <input
            type="text"
            placeholder="Buscar por SAP, PN, Descrição..."
            value={termoBusca}
            onChange={(e) => setTermoBusca(e.target.value)}
          />
        </div>
      </div>

      <div className="painel-seletor-lista">
        {carregando ? (
          <div className="estado-vazio">
            <Loader2 size={24} className="animate-spin" />
            Carregando materiais disponíveis...
          </div>
        ) : estoqueFiltrado.length === 0 ? (
          <div className="estado-vazio">
            Nenhum material encontrado.
          </div>
        ) : (
          estoqueFiltrado.map((item, index) => {
            // Se passar a função calcularSaldo (usada no TransferenciaWBS), calcula. Senão usa a QTD direta.
            const saldoAtual = calcularSaldo 
              ? calcularSaldo(item) 
              : (item.quantidade_disponivel || item.qtdFornecida || 0);
            
            const semSaldo = saldoAtual <= 0;

            // Extrai as chaves corretamente dependendo de qual ecrã injetou os dados
            const desenho = item.desenhoSAP || item.desenho_sap_manual || item.desenho_sap || 'S/ SAP';
            const partNumber = item.numPecaFabricante || item.part_number_manual || item.part_number || '-';
            const descricao = item.materialDescription || item.descricao_manual || item.descricao || '-';
            const nf = item.nf || item.nf_entrada || '—';
            const alocacao = item.alocacao || 'Pendente';
            const isTransf = item.isTransferencia || item.is_transferencia || false;

            return (
              <div
                key={`estoque-${item.id || index}`}
                className="item-seletor-card"
                onClick={() => !semSaldo && onAdicionarItem(item, index)}
                style={{
                  cursor: semSaldo ? 'not-allowed' : 'pointer',
                  opacity: semSaldo ? 0.5 : 1
                }}
              >
                <div className="item-linha-1">
                  <span className="badge-sap">{desenho}</span>
                  {isTransf && (
                    <span className="badge-transferido">
                      <ArrowLeftRight size={12} /> Transferido
                    </span>
                  )}
                </div>

                <div className="item-linha-2">
                  <span className="item-pn">{partNumber}</span>
                  <span className="badge-nf">NF: {nf}</span>
                </div>

                <div className="item-desc">{descricao}</div>

                <div className="item-linha-3">
                  <span className="item-saldo" style={{ color: semSaldo ? '#ef4444' : '#10b981', fontWeight: '500' }}>
                    Saldo: <strong style={{ fontWeight: '700' }}>{saldoAtual}</strong>
                  </span>
                  <span className="item-alocacao" style={{ color: '#2563eb', fontFamily: 'monospace' }}>
                    {alocacao}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}