import React, { useState, useEffect } from 'react';
import './Traceabilly.css'; 
import { 
  Archive, 
  Search, 
  User, 
  Calendar, 
  Box, 
  ArrowRight,
  RotateCcw,
  Loader
} from 'lucide-react';

// 👇 Importamos o teu sistema de alertas globais!
import { useAlert } from '../../../contexts/AlertContext'; 

export default function Traceabilly({ perfil = 'logistica' }) {
  // 1. ESTADOS DO COMPONENTE
  const [dadosRastreabilidade, setDadosRastreabilidade] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [termoPesquisa, setTermoPesquisa] = useState('');
  
  // Instanciamos o disparador de alertas
  const { mostrarAlerta } = useAlert();

  // 2. BUSCA DE DADOS (Executado quando a tela abre)
  useEffect(() => {
    buscarHistorico();
  }, []);

const buscarHistorico = async () => {
  try {
    setCarregando(true);
    // Comunica com o backend para listar todas as solicitações
    const resposta = await fetch('http://localhost:3001/api/solicitacoes/listar');
    const json = await resposta.json();

    if (json.sucesso) {
      let itensExtraidos = [];

      json.dados.forEach(solicitacao => {
        // 👇 ETAPA 1: Regras de Negócio para Filtragem
        // Verifica se a solicitação já foi aprovada pela logística
        const estaAprovado = solicitacao.status === 'Em Separação' || solicitacao.status === 'Concluído';
        
        // Verifica se o tipo NÃO é 'Entrada'. Entradas vão só para o estoque!
        const naoEEntrada = solicitacao.tipo !== 'Entrada';

        // 👇 ETAPA 2: Aplicação da Regra
        // Só entra na tela de Rastreabilidade se for aprovado E não for uma Entrada
        if (estaAprovado && naoEEntrada) {
          
          // ETAPA 3: Formatação dos Dados
          solicitacao.itens.forEach(item => {
            itensExtraidos.push({
              id: item.id,
              partNumber: item.part_number_manual || '-',
              descricao: item.descricao_manual || '-',
              fornecedor: item.fornecedor || '-',
              nfEntrada: item.nf_entrada || 'N/A',
              bsSaida: solicitacao.bs || '-',
              solicitacao: solicitacao.id,
              solicitanteInicial: solicitacao.solicitante.charAt(0).toUpperCase(),
              solicitanteNome: solicitacao.solicitante,
              alocacao: item.alocacao || 'Padrão',
              qtd: `${item.quantidade_solicitada} ${item.unidade_medida_manual || 'Unid'}`,
              valor: item.valor_unitario_manual ? `R$ ${item.valor_unitario_manual}` : '-',
              wbs: solicitacao.wbs || '-',
              data: solicitacao.dataSolicitacao
            });
          });
        }
      });

      // Atualiza a tela com os itens filtrados
      setDadosRastreabilidade(itensExtraidos);
    }
  } catch (error) {
    console.error("Erro ao buscar rastreabilidade:", error);
    mostrarAlerta('Erro ao carregar o histórico.', 'erro');
  } finally {
    setCarregando(false);
  }
};

  // =========================================================================
  // 🎯 A MÁGICA DO FRONT-END: Função para Reverter o Item ao Estoque
  // =========================================================================
  const handleReverterItem = async (item) => {
    // 1. Confirmação de segurança dupla
    const confirmar = window.confirm(`Deseja devolver o item ${item.partNumber} ao estoque e removê-lo do histórico de saídas?`);
    if (!confirmar) return; 

    try {
      setCarregando(true);
      
      // 2. Comunicar com a rota do Back-end que criámos anteriormente
      const resposta = await fetch('http://localhost:3001/api/solicitacoes/reverter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_item: item.id
        })
      });

      const json = await resposta.json();

      if (resposta.ok && json.sucesso) {
        // 3. Sucesso! Mostra o alerta verde e remove o item da tabela visualmente
        mostrarAlerta(`O item ${item.partNumber} retornou ao estoque principal!`, 'sucesso');
        
        setDadosRastreabilidade(dadosAtuais => 
          dadosAtuais.filter(dado => dado.id !== item.id)
        );
      } else {
        // Se o back-end disser que algo falhou
        mostrarAlerta(`Falha ao reverter: ${json.erro}`, 'erro');
      }
    } catch (error) {
      console.error("Erro na reversão:", error);
      mostrarAlerta('Falha de conexão com o servidor.', 'erro');
    } finally {
      setCarregando(false);
    }
  };

  // 4. FILTRO DE PESQUISA INTELIGENTE
  const dadosFiltrados = dadosRastreabilidade.filter(item => 
    item.partNumber.toLowerCase().includes(termoPesquisa.toLowerCase()) ||
    item.descricao.toLowerCase().includes(termoPesquisa.toLowerCase()) ||
    item.solicitanteNome.toLowerCase().includes(termoPesquisa.toLowerCase()) ||
    item.solicitacao.toLowerCase().includes(termoPesquisa.toLowerCase())
  );

  return (
    <div className="traceabilly-wrapper">
      
      {/* --- CABEÇALHO DA PÁGINA --- */}
      <header className="pagina-cabecalho">
        <h1>Rastreabilidade</h1>
        <p>Banco de dados histórico — rastreador completo de saída de itens</p>
      </header>

      {/* --- CARTÃO PRINCIPAL --- */}
      <div className="traceabilly-cartao">
        
        <div className="cartao-topo">
          <div className="titulo-grupo">
            <Archive className="icone-azul" size={20} />
            <h2>Itens Arquivados</h2>
            <span className="badge-contador">{dadosFiltrados.length}</span>
          </div>
          
          <div className="pesquisa-grupo">
            <Search className="icone-pesquisa" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por PN, NF, BS, WBS, Solicitante..." 
              className="input-pesquisa"
              value={termoPesquisa}
              onChange={(e) => setTermoPesquisa(e.target.value)} 
            />
          </div>
        </div>

        <div className="filtros-linha">
          <button className="btn-filtro">
            <User size={16} /> Quem solicitou
          </button>
          <button className="btn-filtro">
            <Calendar size={16} /> Quando saiu
          </button>
          <button className="btn-filtro destaque">
            <Box size={16} /> Qual BS/Solicitação
          </button>
        </div>

        <div className="tabela-container">
          {carregando ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
              <Loader className="icone-girando" size={32} />
              <p>A carregar o histórico de saídas...</p>
            </div>
          ) : (
            <table className="tabela-rastreabilidade" style={{ minWidth: '1300px' }}>
              <thead>
                <tr>
                  <th>PART NUMBER</th>
                  <th>DESCRIÇÃO</th>
                  <th>FORNECEDOR</th>
                  <th>NF ENTRADA</th>
                  <th>BS SAÍDA</th>
                  <th>SOLICITAÇÃO</th>
                  <th>SOLICITANTE</th>
                  <th>ALOCAÇÃO</th>
                  <th>QTD</th>
                  <th>VALOR</th>
                  <th>WBS</th>
                  <th>DATA</th>
                  {perfil === 'logistica' && <th style={{ width: '40px' }}></th>}
                </tr>
              </thead>
              
              <tbody>
                {dadosFiltrados.length > 0 ? (
                  dadosFiltrados.map((linha, index) => (
                    <tr key={`${linha.id}-${index}`}>
                      <td className="fonte-forte">{linha.partNumber}</td>
                      <td>{linha.descricao}</td>
                      <td className="texto-cinza">{linha.fornecedor}</td>
                      
                      <td><span className="badge-borda">{linha.nfEntrada}</span></td>
                      
                      <td>
                        <div className="celula-flex">
                          <ArrowRight size={14} className="icone-seta" />
                          <span className="badge-azul-claro">{linha.bsSaida}</span>
                        </div>
                      </td>
                      
                      <td><span className="badge-azul-suave">{linha.solicitacao}</span></td>
                      
                      <td>
                        <div className="celula-flex">
                          <span className="avatar-circulo">{linha.solicitanteInicial}</span>
                          <span className="fonte-forte">{linha.solicitanteNome}</span>
                        </div>
                      </td>
                      
                      <td><a href="#" className="link-alocacao">{linha.alocacao}</a></td>
                      
                      <td className="fonte-forte">{linha.qtd}</td>
                      <td className="texto-cinza">{linha.valor}</td>
                      <td><a href="#" className="link-alocacao">{linha.wbs}</a></td>
                      <td className="texto-cinza">{linha.data}</td>

                      {perfil === 'logistica' && (
                        <td>
                          {/* 🎯 AQUI: Ligamos a função ao clique do botão e passamos a linha inteira! */}
                          <button 
                            className="btn-reverter" 
                            title="Devolver item ao estoque"
                            onClick={() => handleReverterItem(linha)} 
                          >
                            <RotateCcw size={16} />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="13" style={{ textAlign: 'center', padding: '30px', color: '#999' }}>
                      Nenhum registo encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </div>
  );
}