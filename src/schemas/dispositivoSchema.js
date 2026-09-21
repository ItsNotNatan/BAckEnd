// ==========================================
// FILE: src/schemas/dispositivoSchema.js
// ==========================================
const { z } = require('zod');

const dispositivoSchema = z.object({
    projeto: z.string({ required_error: "O campo 'projeto' é obrigatório." }).min(1, "O projeto não pode estar vazio."),
    linha: z.string({ required_error: "O campo 'linha' é obrigatório." }).min(1, "A linha não pode estar vazia."),
    operacao: z.string({ required_error: "O campo 'operacao' é obrigatório." }).min(1, "A operação não pode estar vazia."),
    tipo_dispositivo: z.string({ required_error: "O tipo de dispositivo é obrigatório." }).min(1),
    descricao: z.string({ required_error: "A descrição é obrigatória." }).min(1, "Informe uma descrição válida."),
    escopo: z.array(z.string()).min(1, "Selecione pelo menos um item no escopo."),
    preco_target: z.number().nullable().optional(),
    pm: z.string().min(1, "Informe o PM responsável."),
    planner: z.string().min(1, "Informe o Planner responsável."),
    scl: z.string().min(1, "Informe o SCL responsável."),
    tl_mecanico: z.string().min(1, "Informe o TL Mecânico."),
    tl_controls: z.string().min(1, "Informe o TL de Controls."),
    site_manager: z.string().min(1, "Informe o Site Manager."),
    site_supervisor: z.string().min(1, "Informe o Site Supervisor."),
    status: z.string().default('pendente')
});

module.exports = dispositivoSchema;