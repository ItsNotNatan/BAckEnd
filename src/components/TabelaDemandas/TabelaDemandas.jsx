import React from 'react';
import { Search } from 'lucide-react';

export default function TabelaDemandas({ dados }) {
  return (
    <div className="tabela-cartao">
      
      {/* Filtros e Pesquisa */}
      <div className="tabela-controles">
        <div className="controles-esquerdos">
          <select className="select-filtro">
            <option>Todo Período</option>
          </select>
          <select className="select-filtro">
            <option>Todos os Status</option>
          </select>
        </div>
        <div className="pesquisa-wrapper">
          <Search className="icone-pesquisa" size={16} />
          <input type="text" placeholder="Buscar PS, BS, WBS..." />
        </div>
      </div>

      {/* Informações da Tabela */}
      <div className="tabela-info">
        <span className="info-registros">{dados.length} registros</span>
        <span className="info-target">Lead Time = Criação de BS &rarr; Data de Entrega</span>
      </div>

      {/* Tabela de Dados */}
      <div className="tabela-scroll">
        <table className="dados-table">
          <thead>
            <tr>
              <th>PS ID</th>
              <th>SOLICITANTE</th>
              <th>WBS</th>
              <th>STATUS PS</th>
              <th>BS</th>
              <th>CRIAÇÃO DE BS</th>
              <th>DATA E HORA DE ENTREGA</th>
              <th>CONTAGEM</th>
            </tr>
          </thead>
          <tbody>
            {dados.map((linha, index) => (
              <tr key={index}>
                <td className="fonte-negrito">{linha.id}</td>
                <td>{linha.solicitante}</td>
                <td><a href="#" className="link-azul">{linha.wbs}</a></td>
                <td>
                  <span className="badge-status-simples">{linha.status}</span>
                </td>
                <td>
                  {linha.bs !== '-' ? (
                    <a href="#" className="link-azul">{linha.bs}</a>
                  ) : (
                    <span className="texto-cinza">-</span>
                  )}
                </td>
                <td className="texto-cinza">{linha.criacaoBs}</td>
                <td className={linha.dataEntrega === 'não definido' ? 'texto-amarelo' : 'texto-cinza'}>
                  {linha.dataEntrega}
                </td>
                <td>
                  {linha.contagem && linha.contagem.includes('d') ? (
                    <span className={`badge-countdown countdown-${linha.contagemStatus}`}>
                      {linha.contagem}
                    </span>
                  ) : (
                    <span className="texto-cinza fonte-negrito">{linha.contagem}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}