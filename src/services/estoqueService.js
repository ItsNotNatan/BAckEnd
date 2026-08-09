// src/services/estoqueService.js
const supabase = require('../config/supabase');

/**
 * Procura todos os registos guardados na tabela 'estoque'
 */
// ✨ 1. A função agora recebe o parâmetro 'incluirZerados'
const listarEstoqueGeral = async (filial = '', incluirZerados = false) => {
  
  // 2. Preparamos a pesquisa base (traz tudo)
  let query = supabase
    .from('estoque')
    .select('*');

  // ✨ 3. SE NÃO FOR RASTREABILIDADE: Aplicamos a trava normal (quantidade > 0)
  if (!incluirZerados) {
    query = query.gt('quantidade_disponivel', 0);
  }

  // 4. A NOSSA REGRA: Se foi enviada uma filial E não for "TODOS", aplicamos o filtro!
  if (filial && filial !== 'TODOS') {
    query = query.eq('filial_id', filial);
  }

  // 5. Ordenamos os resultados e executamos a busca
  const { data, error } = await query.order('part_number', { ascending: true });

  if (error) {
    throw error;
  }

  return data;
};

module.exports = {
  listarEstoqueGeral
};