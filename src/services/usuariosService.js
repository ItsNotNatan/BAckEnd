// src/services/usuariosService.js
const supabase = require('../config/supabase');

/**
 * Busca todos os utilizadores registados na base de dados
 */
const listarUsuarios = async () => {
  const { data, error } = await supabase
    .from('usuarios')
    .select('id, nome_completo, email, cargo, filial_padrao_id, created_at')
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
      senha: dadosUsuario.senha, // Idealmente deveríamos encriptar (ex: bcrypt), mas manteremos simples por agora
      cargo: dadosUsuario.cargo,
      filial_padrao_id: dadosUsuario.filial
    }]);

  if (error) throw error;
  return true;
};

/**
 * Atualiza os dados de um utilizador existente (ex: mudar o cargo)
 */
const atualizarUsuario = async (id, dadosAtualizados) => {
  const { error } = await supabase
    .from('usuarios')
    .update(dadosAtualizados)
    .eq('id', id);

  if (error) throw error;
  return true;
};

module.exports = {
  listarUsuarios,
  criarUsuario,
  atualizarUsuario
};