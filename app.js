/* =============================================================
   Lógica do formulário de disponibilidade
   ============================================================= */

const DIAS = [
  "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira",
  "Sexta-feira", "Sábado", "Domingo"
];

// --- Monta as opções de dias ---
const divDias = document.getElementById("dias");
DIAS.forEach((dia, i) => {
  const lbl = document.createElement("label");
  lbl.className = "opcao";
  lbl.innerHTML = `
    <input type="checkbox" name="dia" value="${dia}" />
    <span class="marca"><svg viewBox="0 0 24 24" fill="none"><path d="M4 12l5 5L20 6"/></svg></span>
    <span class="texto-op">${dia}</span>`;
  divDias.appendChild(lbl);
});

// --- Elementos ---
const form = document.getElementById("form");
const chkOutro = document.getElementById("chkOutro");
const boxHorario = document.getElementById("boxHorario");
const inputHorario = document.getElementById("horario");
const resumo = document.getElementById("resumo");
const sucesso = document.getElementById("sucesso");
const erro = document.getElementById("erro");
const btnEditar = document.getElementById("btnEditar");
const btnEnviar = document.getElementById("btnEnviar");
const btnNovo = document.getElementById("btnNovo");

// --- Mostra/esconde o campo de horário ---
chkOutro.addEventListener("change", () => {
  boxHorario.classList.toggle("ativo", chkOutro.checked);
  if (!chkOutro.checked) inputHorario.value = "";
});

// --- Guarda a resposta atual ---
let dados = null;

// --- Cliente Supabase ---
let sb = null;
try {
  if (SUPABASE_URL && !SUPABASE_URL.startsWith("COLE_")) {
    sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
} catch (e) { /* ignora */ }

// --- SALVAR: valida e mostra o resumo ---
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const nome = document.getElementById("nome").value.trim();
  const diasSel = [...document.querySelectorAll('input[name=dia]:checked')].map(c => c.value);
  const temOutro = chkOutro.checked;
  const horario = inputHorario.value;

  if (!nome) { alert("Por favor, informe seu nome."); return; }
  if (diasSel.length === 0 && !temOutro) {
    alert("Escolha pelo menos um dia ou a opção de outro horário.");
    return;
  }
  if (temOutro && !horario) {
    alert("Você marcou ‘Outro horário’. Por favor, informe o horário.");
    return;
  }

  dados = { nome, dias: diasSel, outro: temOutro, horario: temOutro ? horario : null };

  // Preenche o resumo
  document.getElementById("rNome").textContent = nome;
  const chips = document.getElementById("rDias");
  chips.innerHTML = diasSel.length
    ? diasSel.map(d => `<span class="chip">${d}</span>`).join("")
    : '<span class="val" style="color:#6b7a72">Nenhum dia marcado</span>';
  const linhaH = document.getElementById("linhaHorario");
  if (temOutro) {
    linhaH.style.display = "flex";
    document.getElementById("rHorario").textContent = horario + " (horário específico)";
  } else {
    linhaH.style.display = "none";
  }

  form.style.display = "none";
  resumo.classList.add("ativo");
  erro.classList.remove("ativo");
});

// --- EDITAR: volta ao formulário ---
btnEditar.addEventListener("click", () => {
  resumo.classList.remove("ativo");
  form.style.display = "block";
});

// --- ENVIAR: grava no Supabase ---
btnEnviar.addEventListener("click", async () => {
  erro.classList.remove("ativo");
  btnEnviar.disabled = true;
  btnEditar.disabled = true;
  btnEnviar.textContent = "Enviando...";

  const registro = {
    nome: dados.nome,
    dias: dados.dias,
    outro_horario: dados.outro,
    horario: dados.horario
  };

  try {
    if (!sb) throw new Error("Supabase não configurado. Edite o arquivo config.js.");
    const { error } = await sb.from(TABELA).insert([registro]);
    if (error) throw error;

    resumo.classList.remove("ativo");
    sucesso.classList.add("ativo");
  } catch (err) {
    erro.textContent = "Não foi possível enviar: " + (err.message || err) +
      ". Verifique a configuração do Supabase e tente novamente.";
    erro.classList.add("ativo");
  } finally {
    btnEnviar.disabled = false;
    btnEditar.disabled = false;
    btnEnviar.textContent = "Enviar";
  }
});

// --- NOVA RESPOSTA ---
btnNovo.addEventListener("click", () => {
  form.reset();
  boxHorario.classList.remove("ativo");
  sucesso.classList.remove("ativo");
  form.style.display = "block";
  document.querySelectorAll('.opcao').forEach(o => o.classList.remove('sel'));
});
