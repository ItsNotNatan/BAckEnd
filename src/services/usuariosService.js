// src/services/usuariosService.js
const supabase = require('../config/supabase');

/**
 * Busca todos os utilizadores registados na base de dados
 */
/**
 * Busca todos os utilizadores registados na base de dados
 */
const listarUsuarios = async () => {
  const { data, error } = await supabase
    .from('usuarios')
    // 👇 A MÁGICA AQUI: Adicionámos a coluna 'senha' à lista de seleção!
    .select('id, nome_completo, email, cargo, filial_padrao_id, senha, created_at')
    .order('nome_completo', { ascending: true });

  if (error) throw error;
  return data;
};

/**
 * Cria um novo utilizador na tabela 'usuarios'
 */
const criarUsuario = async (dadosUsuario) => {
  // Traduzimos as propriedades que vêm do Front-end para os nomes corretos do Banco de Dados
  const { error } = await supabase
    .from('usuarios')
    .insert([{
      nome_completo: dadosUsuario.nome, // Mapeia 'nome' para 'nome_completo'
      email: dadosUsuario.email,
      senha: dadosUsuario.senha,
      cargo: dadosUsuario.cargo,
      // O Front-end pode enviar 'filial' ou 'filial_padrao_id', cobrimos os dois:
      filial_padrao_id: dadosUsuario.filial_padrao_id || dadosUsuario.filial 
    }]);

  if (error) throw error;
  return true;
};

/**
 * Atualiza os dados de um utilizador existente (ex: mudar o cargo)
 */
const atualizarUsuario = async (id, dadosAtualizados) => {
  // 1. Criamos um objeto vazio que vai receber apenas as colunas corretas
  const dadosMapeados = {};

  // 2. Fazemos a tradução apenas dos campos que foram enviados
  if (dadosAtualizados.nome) {
    dadosMapeados.nome_completo = dadosAtualizados.nome; // A MÁGICA ESTÁ AQUI!
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

  // 3. Enviamos para o Supabase apenas o objeto mapeado corretamente
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