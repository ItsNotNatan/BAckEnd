import React, { useState } from 'react';
import './EntradaEstoque.css';
import { 
  PackagePlus, 
  Trash2,
  Package,
  FileSpreadsheet,
  User,
  Plus,
  Send,
  Paperclip,
  X
} from 'lucide-react';

// NOSSOS COMPONENTES E HOOKS
import CarregarArquivo from '../../../components/CarregarArquivo/CarregarArquivo';
import ModalProcessamento from '../../../components/ModalProcessamento/ModalProcessamento';
import { useProcessadorExcel } from '../../../hooks/useProcessadorExcel';
import BotaoAcaoGlobal from '../../../components/BotaoAcaoGlobal/BotaoAcaoGlobal';

// Cliente do Supabase
import { supabase } from '../../../supabaseClient';

export default function EntradaEstoque() {
  // 1. ESTADO: Dados gerais do formulário
  const [formDados, setFormDados] = useState({
    nome: '',
    wbs: '',
    observacoes: ''
  });

  // Função auxiliar com a NOVA ordem exata das tuas colunas
  const gerarLinhaVazia = () => ({
    id: `linha-vazia-${Date.now()}-${Math.random()}`, 
    numPecaFabricante: '', 
    fornecedor: '', 
    qtdFornecida: 1, 
    nfEntrada: '',
    unidadeMedida: 'Unid', 
    vendorDescription: '',
    wbsElement: '',
    emissaoNF: '',
    recebNF: '',
    docCompras: '',
    poNetPrice: '',
    centro: '',
    deposito: '',
    alocacao: ''
  });

  // 2. ESTADO: Tabela dinâmica de itens
  const [itens, setItens] = useState([gerarLinhaVazia()]);

  // 3. ESTADO: Ficheiros anexados
  const [anexos, setAnexos] = useState([]);

  // INICIA O MAESTRO (Hook de Processamento do Excel)
  const processador = useProcessadorExcel();

  // ==========================================
  // FUNÇÃO PRINCIPAL: UPLOAD E MAPEAMENTO DO EXCEL
  // ==========================================
  const handleImportarExcel = async (arquivo) => {
    const itensProcessados = await processador.iniciarProcessamento(arquivo);
    
    if (itensProcessados && Array.isArray(itensProcessados)) {
      const novosItensFormatados = itensProcessados.map((item, index) => ({
        id: `excel-${Date.now()}-${index}`,
        numPecaFabricante: item['Nº peça fabricante'] || item.numPecaFabricante || '',
        fornecedor: item['FORNECEDOR'] || item['Fornecedor'] || item.fornecedor || '',
        qtdFornecida: item['Qtd.fornecida'] || item.qtdFornecida || 1,
        nfEntrada: item['NF DE ENTRADA'] || '',
        unidadeMedida: item['Unidade de medida'] || item.unidadeMedida || 'Unid',
        vendorDescription: item['Vendor Description'] || item.vendorDescription || '',
        wbsElement: item['WBS Element'] || item.wbs || '',
        emissaoNF: item['EMISSÃO NF'] || item.emissaoNF || '',
        recebNF: item['RECEB. NF'] || item.recebNF || '',
        docCompras: item['Documento de compras'] || item.docCompras || '',
        poNetPrice: item['PO Net Price'] || item.poNetPrice || '',
        centro: item['Centro'] || item.centro || '',
        deposito: item['Depósito'] || item.deposito || '',
        alocacao: item['Alocação'] || item.alocacao || ''
      }));

      setItens(prev => {
        const listaLimpa = prev.filter(i => i.numPecaFabricante !== '');
        return [...listaLimpa, ...novosItensFormatados];
      });
    }
  };

  const adicionarLinhaEmBranco = () => {
    setItens([...itens, gerarLinhaVazia()]);
  };

  const removerItem = (idParaRemover) => {
    if (itens.length > 1) {
      setItens(itens.filter(item => item.id !== idParaRemover));
    } else {
      alert("A solicitação precisa ter pelo menos um item.");
    }
  };

  const atualizarCampo = (id, campo, novoValor) => {
    setItens(itens.map(item => item.id === id ? { ...item, [campo]: novoValor } : item));
  };

  const handleAnexar = (arquivo) => {
    setAnexos([...anexos, arquivo]);
  };

  const removerAnexo = (indexRemover) => {
    setAnexos(anexos.filter((_, index) => index !== indexRemover));
  };

  // --- ENVIO PARA O BACKEND (NODE.JS) ---
  const handleEnviar = async () => {
    if (!formDados.nome || !formDados.wbs) {
      alert("Preencha o Nome e o WBS do solicitante.");
      return;
    }

    // Valida apenas o PN e a Quantidade
    const itensIncompletos = itens.some(i => !i.numPecaFabricante || !i.qtdFornecida);
    if (itensIncompletos) {
      alert("Preencha os campos obrigatórios (Nº Peça e Qtd) em todas as linhas.");
      return;
    }

    try {
      const anexosProcessados = [];
      
      if (anexos.length > 0) {
        for (const arquivo of anexos) {
          const extensao = arquivo.name.split('.').pop();
          const nomeUnico = `${Date.now()}-${Math.random().toString(36).substring(2)}.${extensao}`;
          const caminhoNoStorage = `uploads/${nomeUnico}`;

          const { error: erroUpload } = await supabase.storage
            .from('documentos')
            .upload(caminhoNoStorage, arquivo);

          if (erroUpload) {
            console.error("Erro ao subir arquivo:", erroUpload);
            alert(`Falha ao anexar o ficheiro: ${arquivo.name}.`);
            return; 
          }

          const { data: linkPublico } = supabase.storage
            .from('documentos')
            .getPublicUrl(caminhoNoStorage);

          anexosProcessados.push({
            nome_arquivo: arquivo.name,
            url_arquivo: linkPublico.publicUrl,
            origem: 'logistica' // 👈 Assinala que o anexo foi inserido via painel de Logística
          });
        }
      }

      // Mapeamos os dados finais
      const payload = {
        solicitante: {
          ...formDados,
          tipo: 'Entrada'
        },
        itens: itens.map(item => ({
          ...item,
          // 👇 AQUI ESTÁ A ALTERAÇÃO: Limpamos os espaços vazios da NF antes de enviar
          nfEntrada: item.nfEntrada ? item.nfEntrada.trim() : '', 
          qtd: item.qtdFornecida,
          desenhoSAP: '-', 
          materialDescription: item.vendorDescription || 'Sem descrição'
        })),
        anexos: anexosProcessados 
      };

      const resposta = await fetch('http://localhost:3001/api/solicitacoes/entrada', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const dados = await resposta.json();

      if (resposta.ok) {
        alert(`Sucesso! Solicitação de Entrada gerada no sistema. ID: ${dados.ps_id}`);
        setFormDados({ nome: '', wbs: '', observacoes: '' });
        setItens([gerarLinhaVazia()]);
        setAnexos([]);
      } else {
        alert(`Erro do servidor: ${dados.erro}`);
      }
    } catch (error) {
      console.error("Erro na requisição:", error);
      alert("Falha ao conectar com o servidor. Verifique se o backend está rodando na porta 3001.");
    }
  };

  return (
    <div className="estoque-wrapper">
      
      <ModalProcessamento 
        estaProcessando={processador.estaProcessando}
        concluido={processador.concluido}
        estadoProgresso={processador.estadoProgresso}
        resultado={processador.resultado}
        erroFatal={processador.erroFatal}
        onClose={processador.resetarProcessador}
      />

      <header className="estoque-cabecalho">
        <h1>Entrada de Estoque</h1>
        <p>Cadastro detalhado de itens — Back-Office Logística</p>
      </header>

      {/* --- DADOS DO SOLICITANTE --- */}
      <div className="estoque-cartao form-cartao">
        <div className="form-header">
          <div className="form-header-esquerda">
            <div className="icone-fundo-azul" style={{ width: '32px', height: '32px' }}>
              <User size={18} className="icone-azul" />
            </div>
            <h2>Operador Responsável</h2>
          </div>
        </div>
        <div className="form-grid">
          <div className="input-grupo">
            <label>NOME *</label>
            <input 
              type="text" 
              className="input-campo" 
              placeholder="Seu nome completo" 
              value={formDados.nome}
              onChange={(e) => setFormDados({...formDados, nome: e.target.value})}
            />
          </div>
          <div className="input-grupo">
            <label>WBS *</label>
            <input 
              type="text" 
              className="input-campo" 
              placeholder="Ex: WBS-PRJ-2024-001" 
              value={formDados.wbs}
              onChange={(e) => setFormDados({...formDados, wbs: e.target.value})}
            />
          </div>
          <div className="input-grupo">
            <label>OBSERVAÇÕES</label>
            <textarea 
              className="input-campo" 
              placeholder="Informações adicionais para a conferência..."
              value={formDados.observacoes}
              onChange={(e) => setFormDados({...formDados, observacoes: e.target.value})}
              style={{ minHeight: '42px' }}
            ></textarea>
          </div>
        </div>
      </div>

      {/* --- TABELA DE ITENS --- */}
      <div className="estoque-cartao form-cartao" style={{ padding: 0, overflow: 'hidden' }}>
        
        <div className="form-header" style={{ padding: '20px 24px', margin: 0, borderBottom: '1px solid #f1f5f9', backgroundColor: '#ffffff' }}>
          <div className="form-header-esquerda">
            <div className="icone-fundo-azul" style={{ width: '28px', height: '28px' }}>
              <Package size={16} className="icone-azul" />
            </div>
            <h2 style={{ fontSize: '1rem' }}>Itens para Entrada</h2>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button 
              onClick={adicionarLinhaEmBranco} 
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '600', color: '#475569', cursor: 'pointer' }}
            >
              <Plus size={16} /> Nova Linha
            </button>

            <CarregarArquivo 
              variante="botao"
              accept=".xlsx, .xls"
              label="Importar Excel SAP"
              icone={<FileSpreadsheet size={16} color="#2563eb" />}
              onFileSelect={handleImportarExcel}
            />

            <span style={{ fontSize: '0.75rem', fontWeight: '500', color: '#64748b', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', padding: '4px 10px', borderRadius: '999px' }}>
              {itens.length} itens
            </span>
          </div>
        </div>
        
        <div className="scroll-tabela-solicitacao" style={{ overflowX: 'auto', width: '100%' }}>
          <table className="estoque-tabela" style={{ minWidth: '2200px', width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr>
                <th style={{ width: '60px', textAlign: 'center', padding: '12px', backgroundColor: '#fafafa', borderBottom: '1px solid #e2e8f0' }}>AÇÕES</th>
                <th style={{ padding: '12px', backgroundColor: '#fafafa', borderBottom: '1px solid #e2e8f0' }}>Nº PEÇA FABRICANTE</th>
                <th style={{ padding: '12px', backgroundColor: '#fafafa', borderBottom: '1px solid #e2e8f0' }}>FORNECEDOR</th>
                <th style={{ width: '120px', padding: '12px', backgroundColor: '#fafafa', borderBottom: '1px solid #e2e8f0' }}>QTD. FORNECIDA</th>
                <th style={{ padding: '12px', backgroundColor: '#fafafa', borderBottom: '1px solid #e2e8f0' }}>NF DE ENTRADA</th>
                <th style={{ width: '140px', padding: '12px', backgroundColor: '#fafafa', borderBottom: '1px solid #e2e8f0' }}>UNIDADE DE MEDIDA</th>
                <th style={{ minWidth: '200px', padding: '12px', backgroundColor: '#fafafa', borderBottom: '1px solid #e2e8f0' }}>VENDOR DESCRIPTION</th>
                <th style={{ padding: '12px', backgroundColor: '#fafafa', borderBottom: '1px solid #e2e8f0' }}>WBS ELEMENT</th>
                <th style={{ padding: '12px', backgroundColor: '#fafafa', borderBottom: '1px solid #e2e8f0' }}>EMISSÃO NF</th>
                <th style={{ padding: '12px', backgroundColor: '#fafafa', borderBottom: '1px solid #e2e8f0' }}>RECEB. NF</th>
                <th style={{ padding: '12px', backgroundColor: '#fafafa', borderBottom: '1px solid #e2e8f0' }}>DOCUMENTO DE COMPRAS</th>
                <th style={{ padding: '12px', backgroundColor: '#fafafa', borderBottom: '1px solid #e2e8f0' }}>PO NET PRICE</th>
                <th style={{ width: '100px', padding: '12px', backgroundColor: '#fafafa', borderBottom: '1px solid #e2e8f0' }}>CENTRO</th>
                <th style={{ width: '100px', padding: '12px', backgroundColor: '#fafafa', borderBottom: '1px solid #e2e8f0' }}>DEPÓSITO</th>
                <th style={{ padding: '12px', backgroundColor: '#fafafa', borderBottom: '1px solid #e2e8f0' }}>ALOCAÇÃO</th>
              </tr>
            </thead>
            <tbody>
              {itens.map((item) => (
                <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ textAlign: 'center', padding: '8px' }}>
                    <button onClick={() => removerItem(item.id)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                      <Trash2 size={16} />
                    </button>
                  </td>
                  <td style={{ padding: '8px' }}>
                    <input style={{ width: '100%', border: 'none', outline: 'none', backgroundColor: 'transparent', fontWeight: '600' }} value={item.numPecaFabricante} onChange={(e) => atualizarCampo(item.id, 'numPecaFabricante', e.target.value)} placeholder="PN" />
                  </td>
                  <td style={{ padding: '8px' }}>
                    <input style={{ width: '100%', border: 'none', outline: 'none', backgroundColor: 'transparent', color: '#475569' }} value={item.fornecedor} onChange={(e) => atualizarCampo(item.id, 'fornecedor', e.target.value)} placeholder="Fornecedor" />
                  </td>
                  <td style={{ padding: '8px', textAlign: 'center' }}>
                    <input type="number" style={{ width: '60px', padding: '4px 8px', border: '1px solid transparent', borderRadius: '4px', color: '#2563eb', fontWeight: '700', textAlign: 'center', backgroundColor: '#eff6ff', outline: 'none' }} value={item.qtdFornecida} onChange={(e) => atualizarCampo(item.id, 'qtdFornecida', e.target.value)} placeholder="0" min="1" />
                  </td>
                  <td style={{ padding: '8px' }}>
                    <input style={{ width: '100%', border: 'none', outline: 'none', backgroundColor: 'transparent', color: '#1e293b' }} value={item.nfEntrada} onChange={(e) => atualizarCampo(item.id, 'nfEntrada', e.target.value)} placeholder="NF Entrada" />
                  </td>
                  <td style={{ padding: '8px' }}>
                    <select style={{ width: '100%', border: 'none', outline: 'none', backgroundColor: 'transparent', color: '#475569' }} value={item.unidadeMedida} onChange={(e) => atualizarCampo(item.id, 'unidadeMedida', e.target.value)}>
                      <option value="Unid">Unid</option>
                      <option value="Kg">Kg</option>
                      <option value="Metro">Metro</option>
                      <option value="Caixa">Caixa</option>
                      <option value="Litro">Litro</option>
                      <option value="NR">NR</option>
                    </select>
                  </td>
                  <td style={{ padding: '8px' }}>
                    <input style={{ width: '100%', border: 'none', outline: 'none', backgroundColor: 'transparent', color: '#475569' }} value={item.vendorDescription} onChange={(e) => atualizarCampo(item.id, 'vendorDescription', e.target.value)} placeholder="Descrição do fornecedor" />
                  </td>
                  <td style={{ padding: '8px' }}>
                    <input style={{ width: '100%', border: 'none', outline: 'none', backgroundColor: 'transparent', color: '#2563eb', fontFamily: 'monospace' }} value={item.wbsElement} onChange={(e) => atualizarCampo(item.id, 'wbsElement', e.target.value)} placeholder="WBS" />
                  </td>
                  <td style={{ padding: '8px' }}>
                    <input type="text" style={{ width: '100%', border: 'none', outline: 'none', backgroundColor: 'transparent', color: '#475569' }} value={item.emissaoNF} onChange={(e) => atualizarCampo(item.id, 'emissaoNF', e.target.value)} placeholder="DD/MM/AAAA" />
                  </td>
                  <td style={{ padding: '8px' }}>
                    <input type="text" style={{ width: '100%', border: 'none', outline: 'none', backgroundColor: 'transparent', color: '#475569' }} value={item.recebNF} onChange={(e) => atualizarCampo(item.id, 'recebNF', e.target.value)} placeholder="DD/MM/AAAA" />
                  </td>
                  <td style={{ padding: '8px' }}>
                    <input style={{ width: '100%', border: 'none', outline: 'none', backgroundColor: 'transparent', color: '#475569' }} value={item.docCompras} onChange={(e) => atualizarCampo(item.id, 'docCompras', e.target.value)} placeholder="Doc Compras" />
                  </td>
                  <td style={{ padding: '8px' }}>
                    <input style={{ width: '100%', border: 'none', outline: 'none', backgroundColor: 'transparent', color: '#1e293b' }} value={item.poNetPrice} onChange={(e) => atualizarCampo(item.id, 'poNetPrice', e.target.value)} placeholder="R$ 0,00" />
                  </td>
                  <td style={{ padding: '8px' }}>
                    <input style={{ width: '60px', border: 'none', outline: 'none', backgroundColor: 'transparent', color: '#475569' }} value={item.centro} onChange={(e) => atualizarCampo(item.id, 'centro', e.target.value)} placeholder="Centro" />
                  </td>
                  <td style={{ padding: '8px' }}>
                    <input style={{ width: '60px', border: 'none', outline: 'none', backgroundColor: 'transparent', color: '#475569' }} value={item.deposito} onChange={(e) => atualizarCampo(item.id, 'deposito', e.target.value)} placeholder="Depósito" />
                  </td>
                  <td style={{ padding: '8px' }}>
                    <input style={{ width: '100%', border: 'none', outline: 'none', backgroundColor: 'transparent', color: '#2563eb', fontFamily: 'monospace' }} value={item.alocacao} onChange={(e) => atualizarCampo(item.id, 'alocacao', e.target.value)} placeholder="Alocação" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- ANEXOS --- */}
      <div className="estoque-cartao form-cartao">
        <div className="input-grupo">
          <label>ANEXOS (OPCIONAL - Notas Fiscais, Manuais, Fotos)</label>
          
          <div style={{ marginTop: '8px' }}>
            <CarregarArquivo 
              variante="botao"
              accept=".pdf, .jpg, .png, .xlsx"
              label="Anexar Arquivo"
              icone={<Paperclip size={16} />}
              onFileSelect={handleAnexar}
            />
          </div>

          {anexos.length > 0 && (
            <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {anexos.map((arquivo, index) => (
                <div key={index} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f8fafc', padding: '8px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', width: 'fit-content', minWidth: '300px' }}>
                  <span style={{ fontSize: '0.85rem', color: '#334155' }}>{arquivo.name}</span>
                  <button onClick={() => removerAnexo(index)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* --- AÇÃO FINAL --- */}
      <BotaoAcaoGlobal 
        texto="Solicitar Entrada de Material" 
        icone={<Send size={16} />} 
        cor="azul" 
        onClick={handleEnviar} 
      />
      
    </div>
  );
}