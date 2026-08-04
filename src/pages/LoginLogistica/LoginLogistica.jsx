import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginLogistica.css';
import { Hexagon, Mail, Lock, AlertCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import BotaoAcaoGlobal from '../../components/BotaoAcaoGlobal/BotaoAcaoGlobal';
import { useAuth } from '../../contexts/AuthContext'; 

export default function LoginLogistica() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [carregando, setCarregando] = useState(false); 
  const [erro, setErro] = useState('');
  
  const navigate = useNavigate();
  const { login } = useAuth(); 

  const handleLogin = async (e) => {
    e.preventDefault();
    setCarregando(true);
    setErro('');

    try {
      const resposta = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, senha }),
      });

      const data = await resposta.json();

      if (!resposta.ok || !data.sucesso) {
        throw new Error(data.erro || 'Erro ao fazer login.');
      }

      if (data.usuario.cargo !== 'ADM' && data.usuario.cargo !== 'LIDER' && data.usuario.cargo !== 'OPERADOR') {
        throw new Error('Acesso negado. Este portal é exclusivo para a equipe de Logística.');
      }

      await login(data.usuario, data.token);
      
      // ✨ MUDANÇA: Redireciona direto para o painel de logística
      navigate('/logistica/painel');

    } catch (error) {
      setErro(error.message);
    } finally {
      setCarregando(false);
    }
  };

  const handleVoltar = () => {
    navigate('/');
  };

  return (
    <div className="login-page-wrapper">
      <div className="login-card">
        
        <button 
          onClick={handleVoltar}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            background: 'none', 
            border: 'none', 
            color: '#64748b', 
            cursor: 'pointer', 
            marginBottom: '24px', 
            fontSize: '0.875rem', 
            fontWeight: '600',
            padding: 0,
            transition: 'color 0.2s'
          }}
          onMouseOver={(e) => e.target.style.color = '#334155'}
          onMouseOut={(e) => e.target.style.color = '#64748b'}
        >
          <ArrowLeft size={18} />
          Voltar ao Início
        </button>

        <div className="login-logo-seccao">
          <div className="login-logo-icone"><Hexagon size={32} /></div>
          <h2>NexusLog</h2>
          <p>Controle Operacional &bull; Back-Office</p>
        </div>

        {erro && (
          <div className="login-erro-banner">
            <AlertCircle size={18} /><span>{erro}</span>
          </div>
        )}

        <form className="login-form" onSubmit={handleLogin}>
          <div className="input-grupo">
            <label style={{ fontSize: '0.75rem', fontWeight: '600', color: '#64748b', marginBottom: '8px', display: 'block' }}>EMAIL CORPORATIVO</label>
            <div className="input-login-wrapper">
              <Mail className="input-login-icone" size={18} />
              <input type="email" className="input-login-campo" placeholder="nome.sobrenome@comau.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </div>

          <div className="input-grupo">
            <label style={{ fontSize: '0.75rem', fontWeight: '600', color: '#64748b', marginBottom: '8px', display: 'block' }}>SENHA DE ACESSO</label>
            <div className="input-login-wrapper">
              <Lock className="input-login-icone" size={18} />
              <input type="password" className="input-login-campo" placeholder="••••••••" required value={senha} onChange={(e) => setSenha(e.target.value)} />
            </div>
          </div>

          <div style={{ marginTop: '8px' }}>
            <BotaoAcaoGlobal texto="Acessar Logística" icone={<ArrowRight size={18} />} cor="azul" onClick={handleLogin} carregando={carregando} />
          </div>
        </form>

      </div>
    </div>
  );
}