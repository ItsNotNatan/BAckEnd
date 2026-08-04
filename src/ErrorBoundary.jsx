import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    // Definimos o estado inicial: sem erros
    this.state = { temErro: false, mensagemErro: '', detalhesErro: '' };
  }

  // Se algum componente "filho" falhar, este método é acionado automaticamente
  static getDerivedStateFromError(error) {
    return { temErro: true, mensagemErro: error.toString() };
  }

  // Captura os detalhes adicionais do erro (onde ocorreu)
  componentDidCatch(error, errorInfo) {
    this.setState({ detalhesErro: errorInfo.componentStack });
  }

  render() {
    // Se apanharmos um erro, desenhamos um ecrã vermelho com a explicação
    if (this.state.temErro) {
      return (
        <div style={{ padding: '40px', fontFamily: 'system-ui, sans-serif', color: '#991b1b', backgroundColor: '#fef2f2', minHeight: '100vh', boxSizing: 'border-box' }}>
          <h2>🚨 Oops! O React tropeçou num erro.</h2>
          <p style={{ color: '#ef4444', fontWeight: 'bold' }}>Em vez de uma tela branca, aqui está o que causou a falha:</p>
          
          <pre style={{ backgroundColor: '#ffffff', padding: '20px', border: '1px solid #fecaca', borderRadius: '8px', overflowX: 'auto', color: '#1f2937' }}>
            <strong>{this.state.mensagemErro}</strong>
            <br/><br/>
            <span style={{ color: '#6b7280', fontSize: '0.85rem' }}>
              {this.state.detalhesErro}
            </span>
          </pre>
          
          <p style={{ marginTop: '20px', fontSize: '0.9rem', color: '#7f1d1d' }}>
            Copia a mensagem a negrito dentro da caixa branca e partilha-a para resolvermos juntos!
          </p>
        </div>
      );
    }

    // Se estiver tudo bem, desenha a aplicação normalmente
    return this.props.children;
  }
}