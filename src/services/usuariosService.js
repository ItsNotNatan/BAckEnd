// src/services/usuariosService.js
const supabase = require('../config/supabase');

/**
 * Busca todos os utilizadores registados na base de dados
 */
const listarUsuarios = async () => {
  const { data, error } = await supabase
    .from('usuarios')
    // 👇 MUDANÇA 1: Adicionámos o 'filiais_acesso' à pesquisa
    .select('id, nome_completo, email, cargo, filial_padrao_id, filiais_acesso, senha, created_at')
    .order('nome_completo', { ascending: true });

  if (error) throw error;
  return data;
};

/**
 * Cria um novo utilizador na tabela 'usuarios'
 */
const criarUsuario = async (dadosUsuario) => {
  const { error } = await supabase
    .from('usuarios')
    .insert([{
      nome_completo: dadosUsuario.nome,
      email: dadosUsuario.email,
      senha: dadosUsuario.senha,
      cargo: dadosUsuario.cargo,
      filial_padrao_id: dadosUsuario.filial_padrao_id || dadosUsuario.filial,
      // 👇 MUDANÇA 2: Agora o back-end grava o array enviado pelo React
      filiais_acesso: dadosUsuario.filiais_acesso 
    }]);

  if (error) throw error;
  return true;
};

/**
 * Atualiza os dados de um utilizador existente (ex: mudar o cargo ou filiais)
 */
const atualizarUsuario = async (id, dadosAtualizados) => {
  const dadosMapeados = {};

  if (dadosAtualizados.nome) {
    dadosMapeados.nome_completo = dadosAtualizados.nome; 
  }
  if (dadosAtualizados.email) {
    dadosMapeados.email = dadosAtualizados.email;
  }
  if (dadosAtualizados.cargo) {
    dadosMapeados.cargo = dadosAtualizados.cargo;
  }
  if (dadosAtualizados.filial_padrao_id || dadosAtualizados.filial) {
    dadosMapeados.filial_padrao_id = dadosAtualizados.filial_padrao_id || dadosAtualizados.filial;
  }
  if (dadosAtualizados.senha) {
    dadosMapeados.senha = dadosAtualizados.senha;
  }
  
  // 👇 MUDANÇA 3: Mapeamos o array de filiais na edição!
  if (dadosAtualizados.filiais_acesso) {
    dadosMapeados.filiais_acesso = dadosAtualizados.filiais_acesso;
  }

  const { error } = await supabase
    .from('usuarios')
    .update(dadosMapeados)
    .eq('id', id);

  if (error) throw error;
  return true;
};

module.exports = {
  listarUsuarios,
  criarUsuario,
  atualizarUsuario
};