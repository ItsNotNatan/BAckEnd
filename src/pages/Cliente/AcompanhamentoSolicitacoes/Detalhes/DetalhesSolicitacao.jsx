import React from 'react';
import { Eye, PackageX } from 'lucide-react';
// 👇 IMPORTAÇÃO DO NOVO COMPONENTE
import MostrarArquivo from '../../../../components/MostrarArquivo/MostrarArquivo';

export default function DetalhesSolicitacao({ item, perfil, onDeleteAnexo }) {
  // Pega os itens reais que vêm do banco de dados. Se não houver, usa array vazio.
  const itensReais = item.itens || [];

  // ========================================================
  // LÓGICA DE SEPARAÇÃO DOS ANEXOS
  // ========================================================
  // Tudo o que não for explicitamente da 'logistica' consideramos do 'cliente' (para compatibilidade com itens antigos)
  const anexosCliente = (item.anexos || []).filter(arq => arq.origem !== 'logistica');
  const anexosLogistica = (item.anexos || []).filter(arq => arq.origem === 'logistica');

  // Mini-componente para não repetirmos o código de anexos em todas as telas
const RenderizarAnexos = ({ tituloCliente, tituloLogistica }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
      <MostrarArquivo 
        arquivos={anexosCliente} 
        tituloCustomizado={tituloCliente || "Documentos Anexados pelo Solicitante"} 
      />
      <MostrarArquivo 
        arquivos={anexosLogistica} 
        tituloCustomizado={tituloLogistica || "Documentos de Liberação (Logística)"} 
        exibirOrigem={perfil === 'logistica'} 
        // 👇 Passa a função de apagar SÓ se o perfil for logística!
        onDelete={perfil === 'logistica' ? onDeleteAnexo : undefined}
      />
    </div>
  );

  // ========================================================
  // 1. VISUAL: MATERIAL
  // ========================================================
  if (item.tipo === 'Material') {
    return (
      <div className="area-expandida-cliente">
        <div className="expandida-cabecalho">
          <span>WBS Destino: <strong>{item.wbs}</strong></span>
          <span>Observações: <strong>{item.observacoes || 'Nenhuma'}</strong></span>
        </div>

        <table className="tabela-sub-itens">
          <thead>
            <tr>
              <th>DESENHO SAP</th>
              <th>PART NUMBER</th>
              <th>DESCRIÇÃO</th>
              <th>QTD. SOLICITADA</th>
            </tr>
          </thead>
          <tbody>
            {itensReais.length > 0 ? (
              itensReais.map((it, idx) => (
                <tr key={idx}>
                  <td style={{ color: '#64748b' }}>{it.desenho_sap_manual || '-'}</td>
                  <td style={{ fontWeight: '600' }}>{it.part_number_manual || '-'}</td>
                  <td style={{ minWidth: '250px' }}>{it.descricao_manual}</td>
                  <td className="texto-azul-link">{it.quantidade_solicitada} {it.unidade_medida_manual}</td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="4" style={{textAlign: 'center', color: '#94a3b8', padding: '16px'}}>Nenhum item encontrado.</td></tr>
            )}
          </tbody>
        </table>

        {/* 👇 RENDERIZAR ARQUIVOS SEPARADOS USANDO A FUNÇÃO AUXILIAR */}
        <RenderizarAnexos />
      </div>
    );
  }

  // ========================================================
  // 2. VISUAL: TRANSFERÊNCIA WBS
  // ========================================================
  if (item.tipo === 'Transferencia WBS' || item.tipo === 'Transfer. WBS') {
    return (
      <div className="area-expandida-cliente">
        <div className="expandida-cabecalho">
          <span>Rota da Transferência: <strong style={{ color: '#2563eb' }}>{item.wbs}</strong></span>
          <span>Justificativa: <strong>{item.observacoes || 'Sem justificativa'}</strong></span>
        </div>

        <table className="tabela-sub-itens">
          <thead>
            <tr>
              <th>PART NUMBER</th>
              <th>DESCRIÇÃO DO MATERIAL</th>
              <th style={{ width: '150px' }}>QTD. TRANSFERIDA</th>
            </tr>
          </thead>
          <tbody>
            {itensReais.length > 0 ? (
              itensReais.map((it, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: '600', fontFamily: 'monospace' }}>{it.part_number_manual || '-'}</td>
                  <td>{it.descricao_manual}</td>
                  <td className="texto-azul-link">{it.quantidade_solicitada} {it.unidade_medida_manual}</td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="3" style={{textAlign: 'center', color: '#94a3b8', padding: '16px'}}>Nenhum item encontrado.</td></tr>
            )}
          </tbody>
        </table>

        {/* 👇 RENDERIZAR ARQUIVOS SEPARADOS */}
        <RenderizarAnexos />
      </div>
    );
  }

  // ========================================================
  // 3. VISUAL: NOTA FISCAL
  // ========================================================
  if (item.tipo === 'Nota Fiscal') {
    // Como a NF só tem 1 item (o serviço), pegamos o valor unitário desse primeiro item
    const valorEstimado = itensReais[0]?.valor_unitario_manual 
      ? `R$ ${itensReais[0].valor_unitario_manual.toFixed(2)}` 
      : 'R$ 0,00';

    return (
      <div className="area-expandida-cliente" style={{ padding: '16px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px', fontSize: '0.875rem', marginBottom: '16px' }}>
          <div>
            <span style={{ color: '#1e293b', fontWeight: '600', marginRight: '6px' }}>Descrição / Motivo:</span>
            <span style={{ color: '#64748b' }}>{itensReais[0]?.descricao_manual || item.observacoes}</span>
          </div>
          <div>
            <span style={{ color: '#1e293b', fontWeight: '600', marginRight: '6px' }}>Valor Estimado:</span>
            <span style={{ color: '#64748b' }}>{valorEstimado}</span>
          </div>
        </div>

        {/* 👇 RENDERIZAR ARQUIVOS SEPARADOS - USANDO TÍTULO CUSTOMIZADO NA FUNÇÃO */}
        <RenderizarAnexos tituloCliente="Notas Fiscais e Espelhos (Solicitante)" />
      </div>
    );
  }

  // ========================================================
  // 4. VISUAL: ENTRADA (DINÂMICA)
  // ========================================================
  if (item.tipo === 'Entrada') {
    return (
      <div className="area-expandida-cliente">
        <div className="expandida-cabecalho">
          <span>Observações da Entrada: <strong>{item.observacoes || 'Nenhuma'}</strong></span>
        </div>

        <table className="tabela-sub-itens">
          <thead>
            <tr>
              <th>DESENHO SAP</th>
              <th>PART NUMBER</th>
              <th>DESCRIÇÃO DO MATERIAL</th>
              <th>VALOR UNIT.</th>
              <th style={{ width: '150px' }}>QTD. RECEBIDA</th>
            </tr>
          </thead>
          <tbody>
            {itensReais.length > 0 ? (
              itensReais.map((it, idx) => (
                <tr key={idx}>
                  <td style={{ color: '#64748b' }}>{it.desenho_sap_manual || '-'}</td>
                  <td style={{ fontWeight: '600', fontFamily: 'monospace' }}>{it.part_number_manual || '-'}</td>
                  <td>{it.descricao_manual}</td>
                  <td>{it.valor_unitario_manual ? `R$ ${it.valor_unitario_manual}` : '-'}</td>
                  <td className="texto-azul-link">{it.quantidade_solicitada} {it.unidade_medida_manual}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', color: '#94a3b8', padding: '32px 16px' }}>
                  <PackageX size={32} style={{ opacity: 0.5, margin: '0 auto 8px auto', display: 'block' }} />
                  Nenhum item foi cadastrado nesta solicitação de entrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* 👇 RENDERIZAR ARQUIVOS SEPARADOS */}
        <RenderizarAnexos tituloLogistica="Documentos de Recebimento Final (Logística)" />
      </div>
    );
  }

  // ========================================================
  // 5. VISUAL: CROSSDOCKING
  // ========================================================
  if (item.tipo === 'Crossdocking') {
    return (
      <div className="area-expandida-cliente">
        <div className="expandida-cabecalho">
          <span>WBS / Destino: <strong>{item.wbs}</strong></span>
          <span>Observações: <strong>{item.observacoes || 'Nenhuma'}</strong></span>
        </div>

        <table className="tabela-sub-itens">
          <thead>
            <tr>
              <th>DESENHO SAP / NF</th>
              <th style={{ width: '150px' }}>VOLUME SOLICITADO</th>
            </tr>
          </thead>
          <tbody>
            {itensReais.length > 0 ? (
              itensReais.map((it, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: '600' }}>{it.desenho_sap_manual || '-'}</td>
                  <td className="texto-azul-link">{it.quantidade_solicitada} {it.unidade_medida_manual}</td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="2" style={{textAlign: 'center', color: '#94a3b8', padding: '16px'}}>Saída Total (Sem itens especificados). Veja os anexos.</td></tr>
            )}
          </tbody>
        </table>

        {/* 👇 RENDERIZAR ARQUIVOS SEPARADOS */}
        <RenderizarAnexos 
          tituloCliente="Nota Fiscal Original (Solicitante)" 
          tituloLogistica="Conhecimento de Transporte (CT-e) e NFs (Logística)" 
        />
      </div>
    );
  }

  // ========================================================
  // DEFAULT
  // ========================================================
  return (
    <div className="area-expandida-cliente" style={{ textAlign: 'center', color: '#64748b' }}>
      <p>O painel detalhado para o tipo <strong>{item.tipo}</strong> será construído em breve.</p>
      <RenderizarAnexos />
    </div>
  );
}