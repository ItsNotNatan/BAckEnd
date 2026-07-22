import React, { useState, useEffect } from 'react';
import { Package, User, Plus, Send, Trash2, Paperclip, X, FileSpreadsheet } from 'lucide-react';

// NOSSOS COMPONENTES E HOOKS
import CarregarArquivo from '../../../components/CarregarArquivo/CarregarArquivo';
import ModalProcessamento from '../../../components/ModalProcessamento/ModalProcessamento';
import { useProcessadorExcel } from '../../../hooks/useProcessadorExcel';
import BotaoAcaoGlobal from '../../../components/BotaoAcaoGlobal/BotaoAcaoGlobal';

// Cliente do Supabase
import { supabase } from '../../../supabaseClient';

export default function EntradaMaterial() {
  // 1. ESTADO: Dados gerais do formulário
  const [formDados, setFormDados] = useState({
    nome: '',
    wbs: '',
    observacoes: ''
  });

  // ✨ ESTADO E EFFECT: Lógica exata do RequestForm para travar o calendário
  const [dataMinima, setDataMinima] = useState('');

  useEffect(() => {
    const hoje = new Date();
    const timezoneOffset = hoje.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(hoje.getTime() - timezoneOffset)).toISOString().split('T')[0];
    setDataMinima(localISOTime);
  }, []);

  // Função auxiliar com a ordem exata das colunas + Data de Necessidade
  const gerarLinhaVazia = () => ({
    id: `linha-vazia-${Date.now()}-${Math.random()}`,
    numPecaFabricante: '',
    fornecedor: '',
    qtdFornecida: 1,
    nfEntrada: '',
    unidadeMedida: 'Unid',
    vendorDescription: '',
    wbsElement: '',
    dataNecessidade: '', // Coluna Nova
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
        dataNecessidade: item['Data de Necessidade'] || item.dataNecessidade || '', 
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

    const itensIncompletos = itens.some(i => !i.numPecaFabricante || !i.qtdFornecida);
    if (itensIncompletos) {
      alert("Preencha os campos obrigatórios (Nº Peça e Qtd) em todas as linhas.");
      return;
    }

    // ✨ Verificação de datas usando a dataMinima gerada no useEffect
    const datasInvalidas = itens.some(i =>
      (i.emissaoNF && i.emissaoNF < dataMinima) ||
      (i.recebNF && i.recebNF < dataMinima) ||
      (i.dataNecessidade && i.dataNecessidade < dataMinima)
    );

    if (datasInvalidas) {
      alert("Existem datas preenchidas que são anteriores ao dia atual. Por favor, corrija-as antes de enviar.");
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
            url_arquivo: linkPublico.publicUrl
          });
        }
      }

      const payload = {
        solicitante: {
          ...formDados,
          tipo: 'Entrada'
        },
        itens: itens.map(item => ({
          ...item,
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

      <ModalProcessamento
        estaProcessando={processador.estaProcessando}
        concluido={processador.concluido}
        estadoProgresso={processador.estadoProgresso}
        resultado={processador.resultado}
        erroFatal={processador.erroFatal}
        onClose={processador.resetarProcessador}
      />

      <div className="banner-aviso banner-verde">
        <Package size={24} />
        <div>
          <strong>Entrada de Material</strong>
          <p>Preencha os dados dos itens a receber. A <strong>alocação física</strong> no armazém será definida pela equipe de Logística após a aprovação.</p>
        </div>
      </div>

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
              onChange={(e) => setFormDados({ ...formDados, nome: e.target.value })}
            />
          </div>
          <div className="input-grupo">
            <label>WBS *</label>
            <input
              type="text"
              className="input-campo foco-verde"
              placeholder="Ex: WBS-PRJ-2024-001"
              value={formDados.wbs}
              onChange={(e) => setFormDados({ ...formDados, wbs: e.target.value })}
            />
          </div>
          <div className="input-grupo span-2">
            <label>OBSERVAÇÕES</label>
            <textarea
              className="input-campo foco-verde"
              placeholder="Informações adicionais para a conferência..."
              value={formDados.observacoes}
              onChange={(e) => setFormDados({ ...formDados, observacoes: e.target.value })}
            ></textarea>
          </div>
        </div>
      </div>

      <div className="form-cartao" style={{ padding: 0, overflow: 'hidden' }}>

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

        <div className="scroll-tabela-solicitacao">
          <table className="tabela-solicitacao-dados" style={{ minWidth: '2400px' }}>
            <thead>
              <tr>
                <th style={{ width: '60px', textAlign: 'center' }}>AÇÕES</th>
                <th>Nº PEÇA FABRICANTE</th>
                <th>FORNECEDOR</th>
                <th style={{ width: '120px' }}>QTD. FORNECIDA</th>
                <th>NF DE ENTRADA</th>
                <th style={{ width: '140px' }}>UNIDADE DE MEDIDA</th>
                <th style={{ minWidth: '200px' }}>VENDOR DESCRIPTION</th>
                <th>WBS ELEMENT</th>
                <th>DATA DE NECESSIDADE</th>
                <th>EMISSÃO NF</th>
                <th>RECEB. NF</th>
                <th>DOCUMENTO DE COMPRAS</th>
                <th>PO NET PRICE</th>
                <th style={{ width: '100px' }}>CENTRO</th>
                <th style={{ width: '100px' }}>DEPÓSITO</th>
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
                    <input className="input-editavel-tabela badge-partnumber" value={item.numPecaFabricante} onChange={(e) => atualizarCampo(item.id, 'numPecaFabricante', e.target.value)} placeholder="PN" />
                  </td>
                  <td>
                    <input className="input-editavel-tabela texto-cinza-escuro" value={item.fornecedor} onChange={(e) => atualizarCampo(item.id, 'fornecedor', e.target.value)} placeholder="Fornecedor" />
                  </td>
                  <td className="qtd-solicitada-destaque">
                    <input type="number" className="input-inline-tabela" value={item.qtdFornecida} onChange={(e) => atualizarCampo(item.id, 'qtdFornecida', e.target.value)} placeholder="0" min="1" />
                  </td>
                  <td>
                    <input className="input-editavel-tabela texto-preto" value={item.nfEntrada} onChange={(e) => atualizarCampo(item.id, 'nfEntrada', e.target.value)} placeholder="NF Entrada" />
                  </td>
                  <td>
                    <select className="input-editavel-tabela texto-cinza" style={{ width: '100%', appearance: 'auto', padding: '4px' }} value={item.unidadeMedida} onChange={(e) => atualizarCampo(item.id, 'unidadeMedida', e.target.value)}>
                      <option value="Unid">Unid</option>
                      <option value="Kg">Kg</option>
                      <option value="Metro">Metro</option>
                      <option value="Caixa">Caixa</option>
                      <option value="Litro">Litro</option>
                      <option value="NR">NR</option>
                    </select>
                  </td>
                  <td>
                    <input className="input-editavel-tabela texto-cinza" value={item.vendorDescription} onChange={(e) => atualizarCampo(item.id, 'vendorDescription', e.target.value)} placeholder="Descrição do fornecedor" />
                  </td>
                  <td>
                    <input className="input-editavel-tabela link-azul-fake" value={item.wbsElement} onChange={(e) => atualizarCampo(item.id, 'wbsElement', e.target.value)} placeholder="WBS" />
                  </td>

                  {/* ✨ BLOQUEIOS DE DATA */}
                  <td>
                    <input
                      type="date"
                      className="input-editavel-tabela texto-cinza"
                      value={item.dataNecessidade}
                      min={dataMinima}
                      onChange={(e) => atualizarCampo(item.id, 'dataNecessidade', e.target.value)}
                      onKeyDown={(e) => e.preventDefault()}
                      onClick={(e) => e.target.showPicker && e.target.showPicker()}
                      style={{ cursor: 'pointer' }}
                    />
                  </td>
                  <td>
                    <input
                      type="date"
                      className="input-editavel-tabela texto-cinza"
                      value={item.emissaoNF}
                      min={dataMinima}
                      onChange={(e) => atualizarCampo(item.id, 'emissaoNF', e.target.value)}
                      onKeyDown={(e) => e.preventDefault()}
                      onClick={(e) => e.target.showPicker && e.target.showPicker()}
                      style={{ cursor: 'pointer' }}
                    />
                  </td>
                  <td>
                    <input
                      type="date"
                      className="input-editavel-tabela texto-cinza"
                      value={item.recebNF}
                      min={dataMinima}
                      onChange={(e) => atualizarCampo(item.id, 'recebNF', e.target.value)}
                      onKeyDown={(e) => e.preventDefault()}
                      onClick={(e) => e.target.showPicker && e.target.showPicker()}
                      style={{ cursor: 'pointer' }}
                    />
                  </td>

                  <td>
                    <input className="input-editavel-tabela texto-cinza" value={item.docCompras} onChange={(e) => atualizarCampo(item.id, 'docCompras', e.target.value)} placeholder="Doc Compras" />
                  </td>
                  <td>
                    <input className="input-editavel-tabela texto-preto" value={item.poNetPrice} onChange={(e) => atualizarCampo(item.id, 'poNetPrice', e.target.value)} placeholder="R$ 0,00" />
                  </td>
                  <td>
                    <input className="input-editavel-tabela texto-cinza" value={item.centro} onChange={(e) => atualizarCampo(item.id, 'centro', e.target.value)} placeholder="Centro" />
                  </td>
                  <td>
                    <input className="input-editavel-tabela texto-cinza" value={item.deposito} onChange={(e) => atualizarCampo(item.id, 'deposito', e.target.value)} placeholder="Depósito" />
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

      <BotaoAcaoGlobal
        texto="Solicitar Entrada de Material"
        icone={<Send size={16} />}
        cor="verde"
        onClick={handleEnviar}
      />

    </div>
  );
}