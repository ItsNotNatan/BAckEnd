// src/services/usuariosService.js
const supabase = require('../config/supabase');

/**
 * Busca todos os utilizadores registados na base de dados
 */
const listarUsuarios = async () => {
  const { data, error } = await supabase
    .from('usuarios')
    // 👇 MUDANÇA: 'filiais_acesso' adicionado na pesquisa
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
      // 👇 MUDANÇA: Guardamos o array enviado pelo frontend
      filiais_acesso: dadosUsuario.filiais_acesso || [] 
    }]);

  if (error) throw error;
  return true;
};

/**
 * Atualiza os dados de um utilizador existente
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
  // 👇 MUDANÇA: Atualizamos as filiais se elas forem enviadas
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

// src/services/usuariosService.js
// Adiciona esta função no final do ficheiro

/**
 * Deleta um utilizador após confirmar a senha de quem está a solicitar a exclusão
 */
const deletarUsuarioComConfirmacao = async (idAlvo, idAdmin, senhaFornecida) => {
  // 1. Buscar a senha real do Administrador na base de dados
  const { data: admin, error: erroAdmin } = await supabase
    .from('usuarios')
    .select('senha')
    .eq('id', idAdmin)
    .single();

  if (erroAdmin || !admin) throw new Error('Não foi possível verificar a identidade do administrador.');

  // 2. Verificar se a senha confere
  if (admin.senha !== senhaFornecida) {
    throw new Error('A senha de confirmação está incorreta. Exclusão cancelada.');
  }

  // 3. Tudo certo! Proceder com a exclusão do utilizador alvo
  const { error: erroDelete } = await supabase
    .from('usuarios')
    .delete()
    .eq('id', idAlvo);

  if (erroDelete) throw new Error('Erro ao apagar o utilizador na base de dados.');
  
  return true;
};

// Lembra-te de exportar também esta função no module.exports
module.exports = { listarUsuarios, criarUsuario, atualizarUsuario, deletarUsuarioComConfirmacao };