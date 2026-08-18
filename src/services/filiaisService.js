const supabase = require('../config/supabase');

const listarFiliais = async () => {
  const { data, error } = await supabase
    .from('filiais')
    .select('*')
    .order('id', { ascending: true });

  if (error) throw error;
  return data;
};

const criarFilial = async (dadosFilial) => {
  const { error } = await supabase
    .from('filiais')
    .insert([dadosFilial]);

  if (error) throw error;
  return true;
};

const deletarFilial = async (idFilial) => {
  const { error } = await supabase
    .from('filiais')
    .delete()
    .eq('id', idFilial);

  if (error) throw error;
  return true;
};

const atualizarFilial = async (idFilial, dadosAtualizados) => {
  const { error } = await supabase
    .from('filiais')
    .update(dadosAtualizados)
    .eq('id', idFilial);

  if (error) throw error;
  return true;
};

module.exports = { listarFiliais, criarFilial, deletarFilial, atualizarFilial };
