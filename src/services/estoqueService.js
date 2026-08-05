// src/services/estoqueService.js
const supabase = require('../config/supabase');

/**
 * Procura todos os registos guardados na tabela 'estoque'
 * que tenham quantidade disponível MAIOR que zero.
 */
// 👇 1. A função agora recebe a filial como parâmetro
const listarEstoqueGeral = async (filial = '') => {
  
  // 2. Preparamos a pesquisa base (trazendo tudo que tem quantidade > 0)
  let query = supabase
    .from('estoque')
    .select('*')
    .gt('quantidade_disponivel', 0);

  // 👇 3. A NOSSA REGRA: Se foi enviada uma filial E não for "TODOS", aplicamos o filtro!
  if (filial && filial !== 'TODOS') {
    query = query.eq('filial_id', filial);
  }

  // 4. Ordenamos os resultados e executamos a busca
  const { data, error } = await query.order('part_number', { ascending: true });

  if (error) {
    throw error;
  }

  return data;
};

module.exports = {
  listarEstoqueGeral
};