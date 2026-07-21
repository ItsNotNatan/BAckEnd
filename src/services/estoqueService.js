// src/services/estoqueService.js
const supabase = require('../config/supabase');

/**
 * Procura todos os registos guardados na tabela 'estoque'
 * sem qualquer tipo de filtro ou bloqueio de RLS.
 */
const listarEstoqueGeral = async () => {
  const { data, error } = await supabase
    .from('estoque')
    .select('*')
    .order('part_number', { ascending: true });

  if (error) {
    throw error;
  }

  return data;
};

module.exports = {
  listarEstoqueGeral
};