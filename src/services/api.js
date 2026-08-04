// =================================================================
// ARQUIVO: src/services/api.js
// DESCRIÇÃO: Centralizador de chamadas HTTP para o Back-end
// =================================================================

// Lê a URL do ambiente ou assume o servidor local por padrão
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

/**
 * Função utilitária para realizar requisições HTTP com suporte automático a JWT
 */
export async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem('@NexusLog:token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const resposta = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const dados = await resposta.json().catch(() => ({}));

  if (!resposta.ok) {
    throw new Error(dados.erro || 'Falha na comunicação com o servidor.');
  }

  return dados;
}