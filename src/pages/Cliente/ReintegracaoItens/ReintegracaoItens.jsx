import React, { useState } from 'react';
import { User, RefreshCcw, Search, Send } from 'lucide-react';
import BotaoAcaoGlobal from '../../../components/BotaoAcaoGlobal/BotaoAcaoGlobal';

const listaDeBs = [
  { id: '10976', solicitante: 'TESTE', wbs: 'WBS-PRJ-2024-001', itens: 4, status: 'Em Separação' },
  { id: '10975', solicitante: 'RASDAS', wbs: 'WBS-PRJ-2024-001', itens: 2, status: 'Em Separação' },
  { id: '10974', solicitante: 'DOUGLAS', wbs: 'WBS-PRJ-2024-001', itens: 1, status: 'Em Separação' },
  { id: '10972', solicitante: 'JEFERSON', wbs: 'WBS-PRJ-2024-001', itens: 3, status: 'Em Separação' }
];

export default function ReintegracaoItens() {
  // 1. Estados DENTRO do componente
  const [nome, setNome] = useState('');
  const [pesquisa, setPesquisa] = useState('');
  const [bsSelecionada, setBsSelecionada] = useState(null);

  // 2. Função de Envio
  const handleEnviar = async () => {
    if (!nome || !bsSelecionada) {
      alert("Preencha o seu nome e selecione uma BS para reintegrar.");
      return;
    }

    const bsDados = listaDeBs.find(b => b.id === bsSelecionada);

    const payload = {
      solicitante: {
        nome: nome,
        bs_origem: bsSelecionada,
        wbs: bsDados.wbs
      }
    };

    try {
      const resposta = await fetch('http://localhost:3001/api/solicitacoes/reintegracao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const dados = await resposta.json();

      if (resposta.ok) {
        alert(`Sucesso! Reintegração solicitada. ID: ${dados.ps_id}`);
        setNome('');
        setBsSelecionada(null);
        setPesquisa('');
      } else {
        alert(`Erro do servidor: ${dados.erro}`);
      }
    } catch (error) {
      console.error("Erro na requisição:", error);
      alert("Falha ao conectar com o servidor.");
    }
  };

  // 3. Filtro da lista de pesquisa
  const listaFiltrada = listaDeBs.filter(bs => 
    bs.id.includes(pesquisa) || 
    bs.solicitante.toLowerCase().includes(pesquisa.toLowerCase()) ||
    bs.wbs.toLowerCase().includes(pesquisa.toLowerCase())
  );

  return (
    <div className="limitador-largura">
      <div className="form-cartao">
        <div className="form-header">
          <div className="form-header-esquerda">
            <div className="form-header-icone laranja"><User size={18} /></div>
            <h2>Solicitante</h2>
          </div>
        </div>
        <div className="input-grupo" style={{ maxWidth: '400px' }}>
          <label>NOME *</label>
          <input 
            type="text" 
            className="input-campo foco-laranja" 
            placeholder="Seu nome completo" 
            value={nome}
            onChange={(e) => setNome(e.target.value)}
          />
        </div>
      </div>

      <div className="form-cartao">
        <div className="form-header">
          <div className="form-header-esquerda">
            <div className="form-header-icone laranja"><RefreshCcw size={18} /></div>
            <h2>Selecionar BS de Origem</h2>
          </div>
        </div>
        <div className="pesquisa-wrapper">
          <Search size={18} className="icone-pesquisa" />
          <input 
            type="text" 
            className="input-campo foco-laranja" 
            placeholder="Buscar por nº BS, ID de solicitação ou solicitante..." 
            style={{ paddingLeft: '40px' }} 
            value={pesquisa}
            onChange={(e) => setPesquisa(e.target.value)}
          />
        </div>
        <div className="lista-bs-container">
          {listaFiltrada.map((bs) => (
            <div 
              key={bs.id} 
              className="item-bs"
              style={{
                border: bsSelecionada === bs.id ? '2px solid #f97316' : '1px solid #e2e8f0',
                backgroundColor: bsSelecionada === bs.id ? '#fff7ed' : '#ffffff'
              }}
              onClick={() => setBsSelecionada(bs.id)}
            >
              <div className="item-bs-info">
                <span className="item-bs-titulo" style={{ color: bsSelecionada === bs.id ? '#ea580c' : '#1e293b' }}>
                  BS #{bs.id}
                </span>
                <span className="item-bs-detalhes">{bs.solicitante} &middot; WBS: {bs.wbs} &middot; {bs.itens} itens</span>
              </div>
              <span className="badge-separacao">{bs.status}</span>
            </div>
          ))}
        </div>
      </div>

      {/* --- BOTÃO GLOBAL AQUI --- */}
      <BotaoAcaoGlobal
        texto="Solicitar Reintegração"
        icone={<Send size={16} />}
        cor="laranja"
        onClick={handleEnviar}
      />

    </div>
  );
}