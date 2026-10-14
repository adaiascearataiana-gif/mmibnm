// =============================================================
//  CONFIGURAÇÃO DO SUPABASE
//  Já preenchido com os dados do seu projeto.
//  (A chave "publishable" PODE ficar pública, ela foi feita para isso.)
// =============================================================
const SUPABASE_URL = "https://whtbzermbyuxicswyvsy.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_LJNCmi7jUYP9AIAtlMwsnw_q1Wjex5h";

// Nome da tabela criada no Supabase (não precisa mudar).
const TABELA = "respostas_disponibilidade";

// =============================================================
//  PRAZO FINAL
//  Depois desta data/hora (horário local), o formulário TRANCA:
//  não aceita novas respostas nem edições.
//  Formato: AAAA-MM-DDTHH:MM:SS
// =============================================================
const PRAZO_FINAL = "2026-10-17T23:59:59";
