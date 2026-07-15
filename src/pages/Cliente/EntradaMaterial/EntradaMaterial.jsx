import React, { useState } from 'react';
import { Package, User, Plus, Send, Trash2, Paperclip, X, FileSpreadsheet } from 'lucide-react';

// NOSSOS COMPONENTES E HOOKS
import CarregarArquivo from '../../../components/CarregarArquivo/CarregarArquivo';
import ModalProcessamento from '../../../components/ModalProcessamento/ModalProcessamento';
import { useProcessadorExcel } from '../../../hooks/useProcessadorExcel';
import BotaoAcaoGlobal from '../../../components/BotaoAcaoGlobal/BotaoAcaoGlobal';

// 👇 AQUI ESTÁ A CORREÇÃO: Importamos o cliente do Supabase!
import { supabase } from '../../../supabaseClient';

export default function EntradaMaterial() {
  // 1. ESTADO: Dados gerais do formulário
  const [formDados, setFormDados] = useState({
    nome: '',
    wbs: '',
    observacoes: ''
  });

  // Função auxiliar para gerar uma linha vazia com todos os novos campos do SAP
  const gerarLinhaVazia = () => ({
    id: `linha-vazia-${Date.now()}-${Math.random()}`, 
    desenhoSAP: '', 
    materialDescription: '', 
    numPecaFabricante: '', 
    fornecedor: '', 
    qtdFornecida: 1, 
    referencia: '',
    unidadeMedida: 'Unid', 
    vendorDescription: '',
    wbs: '',
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
        desenhoSAP: item.desenhoSAP || item['Material'] || item['DESENHO SAP'] || '',
        materialDescription: item.materialDescription || item['Material Description'] || item['MATERIAL DESCRIPTION'] || '',
        numPecaFabricante: item.numPecaFabricante || item['Nº peça fabricante'] || item['Nº PEÇA FABRICANTE'] || '',
        fornecedor: item.fornecedor || item['Fornecedor'] || item['FORNECEDOR'] || '',
        qtdFornecida: item.qtdFornecida || item['Qtd.fornecida'] || item['Qtd.'] || 1,
        referencia: item.referencia || item['Referência'] || item['REFERÊNCIA'] || '',
        unidadeMedida: item.unidadeMedida || item['Unidade de medida'] || 'Unid',
        vendorDescription: item.vendorDescription || item['Vendor Description'] || '',
        wbs: item.wbs || item['WBS'] || item['Elemento PEP'] || '',
        emissaoNF: item.emissaoNF || item['EMISSÃO NF'] || item['Emissão NF'] || '',
        recebNF: item.recebNF || item['RECEB. NF'] || item['Receb. NF'] || '',
        docCompras: item.docCompras || item['Documento de compras'] || item['Doc. Compras'] || '',
        poNetPrice: item.poNetPrice || item['PO Net Price'] || '',
        centro: item.centro || item['Centro'] || item['CENTRO'] || '',
        deposito: item.deposito || item['Depósito'] || item['DEPÓSITO'] || '',
        alocacao: item.alocacao || item['Alocação'] || item['ALOCAÇÃO'] || ''
      }));

      setItens(prev => {
        const listaLimpa = prev.filter(i => i.numPecaFabricante !== '' || i.materialDescription !== '');
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

    const itensIncompletos = itens.some(i => !i.numPecaFabricante || !i.materialDescription || !i.qtdFornecida);
    if (itensIncompletos) {
      alert("Preencha os campos obrigatórios (Nº Peça, Descrição e Qtd) em todas as linhas.");
      return;
    }

    try {
      // ---------------------------------------------------------
      // MAGIA DOS ANEXOS: Upload para o Supabase Storage primeiro
      // ---------------------------------------------------------
      const anexosProcessados = [];
      
      if (anexos.length > 0) {
        for (const arquivo of anexos) {
          // Gera um nome único para o ficheiro para evitar sobreposições
          const extensao = arquivo.name.split('.').pop();
          const nomeUnico = `${Date.now()}-${Math.random().toString(36).substring(2)}.${extensao}`;
          const caminhoNoStorage = `uploads/${nomeUnico}`;

          // 1. Faz o upload para o bucket 'documentos'
          const { error: erroUpload } = await supabase.storage
            .from('documentos')
            .upload(caminhoNoStorage, arquivo);

          if (erroUpload) {
            console.error("Erro ao subir arquivo:", erroUpload);
            alert(`Falha ao anexar o ficheiro: ${arquivo.name}. Verifique as permissões do Bucket.`);
            return; // Para o processo se um ficheiro falhar
          }

          // 2. Pega o Link Público do ficheiro que acabou de subir
          const { data: linkPublico } = supabase.storage
            .from('documentos')
            .getPublicUrl(caminhoNoStorage);

          // 3. Guarda na nossa lista final
          anexosProcessados.push({
            nome_arquivo: arquivo.name,
            url_arquivo: linkPublico.publicUrl
          });
        }
      }
      // ---------------------------------------------------------

      // Mapeamos os dados finais
      const payload = {
        solicitante: {
          ...formDados,
          tipo: 'Entrada'
        },
        itens: itens.map(item => ({
          ...item,
          qtd: item.qtdFornecida 
        })),
        anexos: anexosProcessados // Adicionamos os links mágicos aqui!
      };

      const resposta = await fetch('http://localhost:3001/api/solicitacoes/entrada', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const dados = await resposta.json();

      if (resposta.ok) {
        alert(`Sucesso! Solicitação de Entrada enviada. ID: ${dados.ps_id}`);
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
    <div className="entrada-container">
      
      {/* TELA DE CARREGAMENTO DO EXCEL (MODAL) */}
      <ModalProcessamento 
        estaProcessando={processador.estaProcessando}
        concluido={processador.concluido}
        estadoProgresso={processador.estadoProgresso}
        resultado={processador.resultado}
        erroFatal={processador.erroFatal}
        onClose={processador.resetarProcessador}
      />

      {/* --- AVISO SUPERIOR --- */}
      <div className="banner-aviso banner-verde">
        <Package size={24} />
        <div>
          <strong>Entrada de Material</strong>
          <p>Preencha os dados dos itens a receber. A <strong>alocação física</strong> no armazém será definida pela equipe de Logística após a aprovação.</p>
        </div>
      </div>

      {/* --- BLOCO 1: DADOS DO SOLICITANTE --- */}
      <div className="form-cartao">
        <div className="form-header">
          <div className="form-header-esquerda">
            <div className="form-header-icone verde-claro"><User size={18} /></div>
            <h2>Dados do Solicitante</h2>
          </div>
        </div>
        <div className="form-grid">
          <div className="input-grupo">
            <label>NOME *</label>
            <input 
              type="text" 
              className="input-campo foco-verde" 
              placeholder="Seu nome completo" 
              value={formDados.nome}
              onChange={(e) => setFormDados({...formDados, nome: e.target.value})}
            />
          </div>
          <div className="input-grupo">
            <label>WBS *</label>
            <input 
              type="text" 
              className="input-campo foco-verde" 
              placeholder="Ex: WBS-PRJ-2024-001" 
              value={formDados.wbs}
              onChange={(e) => setFormDados({...formDados, wbs: e.target.value})}
            />
          </div>
          <div className="input-grupo span-2">
            <label>OBSERVAÇÕES</label>
            <textarea 
              className="input-campo foco-verde" 
              placeholder="Informações adicionais para a conferência..."
              value={formDados.observacoes}
              onChange={(e) => setFormDados({...formDados, observacoes: e.target.value})}
            ></textarea>
          </div>
        </div>
      </div>

      {/* --- BLOCO 2: ITENS PARA ENTRADA --- */}
      <div className="form-cartao" style={{ padding: 0, overflow: 'hidden' }}>
        
        {/* Cabeçalho da Tabela */}
        <div className="form-header" style={{ padding: '20px 24px', margin: 0, borderBottom: '1px solid #f1f5f9', backgroundColor: '#ffffff' }}>
          <div className="form-header-esquerda">
            <div className="form-header-icone verde-quadrado" style={{ width: '28px', height: '28px' }}><Package size={16} /></div>
            <h2 style={{ fontSize: '1rem' }}>Itens para Entrada</h2>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button 
              onClick={adicionarLinhaEmBranco} 
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '600', color: '#475569', cursor: 'pointer' }}
            >
              <Plus size={16} /> Nova Linha
            </button>

            {/* BOTÃO IMPORTAR EXCEL CONECTADO À FUNÇÃO */}
            <CarregarArquivo 
              variante="botao"
              accept=".xlsx, .xls"
              label="Importar Excel"
              icone={<FileSpreadsheet size={16} color="#10b981" />}
              onFileSelect={handleImportarExcel}
            />

            <span style={{ fontSize: '0.75rem', fontWeight: '500', color: '#64748b', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', padding: '4px 10px', borderRadius: '999px' }}>
              {itens.length} itens
            </span>
          </div>
        </div>
        
        {/* Corpo da Tabela */}
        <div className="scroll-tabela-solicitacao">
          <table className="tabela-solicitacao-dados" style={{ minWidth: '2500px' }}>
            <thead>
              <tr>
                <th>AÇÕES</th>
                <th>DESENHO SAP</th>
                <th>MATERIAL DESCRIPTION</th>
                <th>Nº PEÇA FABRICANTE</th>
                <th>FORNECEDOR</th>
                <th>QTD. FORNECIDA</th>
                <th>REFERÊNCIA</th>
                <th>UNIDADE DE MEDIDA</th>
                <th>VENDOR DESCRIPTION</th>
                <th>WBS</th>
                <th>EMISSÃO NF</th>
                <th>RECEB. NF</th>
                <th>DOCUMENTO DE COMPRAS</th>
                <th>PO NET PRICE</th>
                <th>CENTRO</th>
                <th>DEPÓSITO</th>
                <th>ALOCAÇÃO</th>
              </tr>
            </thead>
            <tbody>
              {itens.map((item) => (
                <tr key={item.id}>
                  <td style={{ textAlign: 'center' }}>
                    <button onClick={() => removerItem(item.id)} className="btn-deletar-linha">
                      <Trash2 size={16} />
                    </button>
                  </td>
                  <td>
                    <input className="input-editavel-tabela texto-cinza-claro" value={item.desenhoSAP} onChange={(e) => atualizarCampo(item.id, 'desenhoSAP', e.target.value)} placeholder="SAP" />
                  </td>
                  <td style={{ minWidth: '220px' }}>
                    <input className="input-editavel-tabela texto-preto" value={item.materialDescription} onChange={(e) => atualizarCampo(item.id, 'materialDescription', e.target.value)} placeholder="Descrição do item" />
                  </td>
                  <td>
                    <input className="input-editavel-tabela badge-partnumber" value={item.numPecaFabricante} onChange={(e) => atualizarCampo(item.id, 'numPecaFabricante', e.target.value)} placeholder="PN" />
                  </td>
                  <td>
                    <input className="input-editavel-tabela texto-cinza-escuro" value={item.fornecedor} onChange={(e) => atualizarCampo(item.id, 'fornecedor', e.target.value)} placeholder="Fornecedor" />
                  </td>
                  <td className="qtd-solicitada-destaque">
                    <input type="number" className="input-inline-tabela" value={item.qtdFornecida} onChange={(e) => atualizarCampo(item.id, 'qtdFornecida', e.target.value)} placeholder="0" min="1" />
                  </td>
                  <td>
                    <input className="input-editavel-tabela texto-cinza" value={item.referencia} onChange={(e) => atualizarCampo(item.id, 'referencia', e.target.value)} placeholder="Ref" />
                  </td>
                  <td>
                    <select className="input-editavel-tabela texto-cinza" style={{ width: '80px', appearance: 'auto', padding: '4px' }} value={item.unidadeMedida} onChange={(e) => atualizarCampo(item.id, 'unidadeMedida', e.target.value)}>
                      <option value="Unid">Unid</option>
                      <option value="Kg">Kg</option>
                      <option value="Metro">Metro</option>
                      <option value="Caixa">Caixa</option>
                      <option value="Litro">Litro</option>
                      <option value="NR">NR</option>
                    </select>
                  </td>
                  <td style={{ minWidth: '180px' }}>
                    <input className="input-editavel-tabela texto-cinza" value={item.vendorDescription} onChange={(e) => atualizarCampo(item.id, 'vendorDescription', e.target.value)} placeholder="Descrição do fornecedor" />
                  </td>
                  <td>
                    <input className="input-editavel-tabela link-azul-fake" value={item.wbs} onChange={(e) => atualizarCampo(item.id, 'wbs', e.target.value)} placeholder="WBS" />
                  </td>
                  <td>
                    <input type="text" className="input-editavel-tabela texto-cinza" value={item.emissaoNF} onChange={(e) => atualizarCampo(item.id, 'emissaoNF', e.target.value)} placeholder="DD/MM/AAAA" />
                  </td>
                  <td>
                    <input type="text" className="input-editavel-tabela texto-cinza" value={item.recebNF} onChange={(e) => atualizarCampo(item.id, 'recebNF', e.target.value)} placeholder="DD/MM/AAAA" />
                  </td>
                  <td>
                    <input className="input-editavel-tabela texto-cinza" value={item.docCompras} onChange={(e) => atualizarCampo(item.id, 'docCompras', e.target.value)} placeholder="Doc Compras" />
                  </td>
                  <td>
                    <input className="input-editavel-tabela texto-preto" value={item.poNetPrice} onChange={(e) => atualizarCampo(item.id, 'poNetPrice', e.target.value)} placeholder="R$ 0,00" />
                  </td>
                  <td>
                    <input className="input-editavel-tabela texto-cinza" style={{ width: '60px' }} value={item.centro} onChange={(e) => atualizarCampo(item.id, 'centro', e.target.value)} placeholder="Centro" />
                  </td>
                  <td>
                    <input className="input-editavel-tabela texto-cinza" style={{ width: '70px' }} value={item.deposito} onChange={(e) => atualizarCampo(item.id, 'deposito', e.target.value)} placeholder="Depósito" />
                  </td>
                  <td>
                    <input className="input-editavel-tabela link-azul-fake" value={item.alocacao} onChange={(e) => atualizarCampo(item.id, 'alocacao', e.target.value)} placeholder="Alocação" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- BLOCO 3: ANEXOS --- */}
      <div className="form-cartao">
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

      {/* --- BLOCO 4: AÇÃO FINAL --- */}
      <BotaoAcaoGlobal 
        texto="Solicitar Entrada de Material" 
        icone={<Send size={16} />} 
        cor="verde" 
        onClick={handleEnviar} 
      />
      
    </div>
  );
}