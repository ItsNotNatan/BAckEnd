import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginLogistica.css';
import { Hexagon, Mail, Lock, AlertCircle, ArrowRight } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import BotaoAcaoGlobal from '../../components/BotaoAcaoGlobal/BotaoAcaoGlobal';
import { useAuth } from '../../contexts/AuthContext'; // [cite: 1021]

export default function LoginLogistica() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [carregando, setCarregando] = useState(false); // [cite: 1023]
  const [erro, setErro] = useState('');
  
  const navigate = useNavigate();
  const { loginManual } = useAuth(); // [cite: 1024]

const handleLogin = async (e) => {
    e.preventDefault();
    setCarregando(true);
    setErro('');

    try {
      // 1. Faz a busca na tabela 'usuarios' cruzando e-mail e senha exatamente como estão no BD
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('email', email)
        .eq('senha', senha)
        .maybeSingle(); // Não gera erro PGRST116 se retornar 0 linhas

      // Se houver um erro técnico real de infraestrutura
      if (error) {
        alert(`[Erro Técnico do Banco]: ${error.message}`);
        throw new Error('Falha na comunicação com o servidor.');
      }

      // Se data for null, significa que o e-mail ou a senha digitados não existem no BD
      if (!data) {
        throw new Error('E-mail corporativo ou senha incorretos.');
      }

      // 2. Valida o cargo com base no CHECK constraint do teu BD ('ADM', 'OPERADOR')
      if (data.cargo !== 'ADM' && data.cargo !== 'OPERADOR') {
        throw new Error('Acesso negado. Este portal é exclusivo para a equipe de Logística.');
      }

      // 3. Sucesso! Guarda os dados no localStorage/Contexto e saúda o utilizador pelo nome correto
      alert(`Bem-vindo ao NexusLog, ${data.nome_completo}!`);
      
      loginManual(data);
      navigate('/logistica/painel');

    } catch (error) {
      // Dispara o alert com o erro amigável (ex: "E-mail corporativo ou senha incorretos.")
      alert(error.message);
      setErro(error.message);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="login-page-wrapper">
      <div className="login-card">
        
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