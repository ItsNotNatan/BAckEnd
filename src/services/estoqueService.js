// src/services/estoqueService.js
const supabase = require('../config/supabase');

/**
 * Procura todos os registos guardados na tabela 'estoque'
 * que tenham quantidade disponível MAIOR que zero.
 */
const listarEstoqueGeral = async () => {
  const { data, error } = await supabase
    .from('estoque')
    .select('*')
    // 👇 A MAGIA ACONTECE AQUI: Filtramos para trazer apenas saldo > 0
    .gt('quantidade_disponivel', 0) 
    .order('part_number', { ascending: true });

  if (error) {
    throw error;
  }

  return data;
};

module.exports = {
  listarEstoqueGeral
};