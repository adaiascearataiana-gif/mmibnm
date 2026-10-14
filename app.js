/* =============================================================
   Lógica do formulário de disponibilidade
   - Enviar resposta
   - Editar DEPOIS de enviar (atualiza a mesma resposta)
   - Prazo final: trava o formulário após a data definida em config.js
   ============================================================= */

const DIAS = [
  "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira",
  "Sexta-feira", "Sábado", "Domingo"
];

// --- Monta as opções de dias ---
const divDias = document.getElementById("dias");
DIAS.forEach((dia) => {
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
const btnEditarEnviada = document.getElementById("btnEditarEnviada");
const btnNovo = document.getElementById("btnNovo");
const btnSalvar = document.getElementById("btnSalvar");
const alerta = document.getElementById("alerta");
const tituloSucesso = document.getElementById("tituloSucesso");
const textoSucesso = document.getElementById("textoSucesso");
const nomeInput = document.getElementById("nome");

// --- Mostra/esconde o campo de horário ---
chkOutro.addEventListener("change", () => {
  boxHorario.classList.toggle("ativo", chkOutro.checked);
  if (!chkOutro.checked) inputHorario.value = "";
});

// --- Estado ---
let dados = null;
let respostaId = localStorage.getItem("ibnm_resposta_id") || null; // id da resposta já enviada neste aparelho

// --- Cliente Supabase ---
let sb = null;
try {
  if (SUPABASE_URL && !SUPABASE_URL.startsWith("COLE_")) {
    sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
} catch (e) { /* ignora */ }

/* =============================================================
   PRAZO FINAL
   ============================================================= */
const prazo = new Date(PRAZO_FINAL);
const prazoFmt = prazo.toLocaleDateString("pt-BR") + " às " +
  prazo.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
function prazoEncerrado(){ return new Date() > prazo; }

function travarFormulario(){
  // desabilita todos os campos e esconde o botão salvar
  form.querySelectorAll("input, button").forEach(el => el.disabled = true);
  if (btnSalvar) btnSalvar.style.display = "none";
  alerta.className = "alerta travado";
  alerta.innerHTML = `
    <span class="ico">⛔</span>
    <div><b>Período de respostas encerrado</b><br>
    O formulário foi fechado em <b>${prazoFmt}</b> e não aceita mais respostas nem edições.</div>`;
  // garante que as outras etapas também fiquem travadas
  resumo.classList.remove("ativo");
  sucesso.classList.remove("ativo");
  form.style.display = "block";
}

function mostrarAvisoPrazo(){
  alerta.className = "alerta aviso";
  alerta.innerHTML = `
    <span class="ico">⏰</span>
    <div>Você pode responder ou editar sua resposta até <b>${prazoFmt}</b>.
    Depois dessa data o formulário será fechado.</div>`;
}

/* =============================================================
   PREENCHER o formulário com uma resposta existente (para editar)
   ============================================================= */
function preencher(r){
  nomeInput.value = r.nome || "";
  document.querySelectorAll('input[name=dia]').forEach(c => {
    c.checked = (r.dias || []).includes(c.value);
  });
  chkOutro.checked = !!r.outro_horario;
  boxHorario.classList.toggle("ativo", !!r.outro_horario);
  inputHorario.value = r.outro_horario && r.horario ? r.horario : "";
}

/* =============================================================
   AO CARREGAR A PÁGINA
   ============================================================= */
async function iniciar(){
  if (prazoEncerrado()){
    travarFormulario();
    return;
  }
  mostrarAvisoPrazo();

  // Já respondeu neste aparelho? Carrega para permitir edição.
  if (respostaId && sb){
    try {
      const { data, error } = await sb.from(TABELA).select("*").eq("id", respostaId).maybeSingle();
      if (error || !data){ // resposta não existe mais
        localStorage.removeItem("ibnm_resposta_id");
        respostaId = null;
      } else {
        preencher(data);
        const avisoEdit = document.createElement("div");
        avisoEdit.className = "alerta info";
        avisoEdit.innerHTML = `<span class="ico">✏️</span><div>Você já enviou uma resposta. Pode alterá-la abaixo — ao salvar e enviar, <b>sua resposta anterior será atualizada</b>.</div>`;
        alerta.after(avisoEdit);
        btnSalvar.textContent = "Salvar alterações";
      }
    } catch(e){ /* ignora */ }
  }
}
iniciar();

/* =============================================================
   SALVAR: valida e mostra o resumo
   ============================================================= */
form.addEventListener("submit", (e) => {
  e.preventDefault();
  if (prazoEncerrado()){ travarFormulario(); return; }

  const nome = nomeInput.value.trim();
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

  document.getElementById("rNome").textContent = nome;
  const chips = document.getElementById("rDias");
  chips.innerHTML = diasSel.length
    ? diasSel.map(d => `<span class="chip">${d}</span>`).join("")
    : '<span style="color:#9ca3af">Nenhum dia marcado</span>';
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
  // texto do botão enviar conforme seja novo ou edição
  btnEnviar.textContent = respostaId ? "Atualizar resposta" : "Enviar";
});

// --- EDITAR (no resumo): volta ao formulário ---
btnEditar.addEventListener("click", () => {
  resumo.classList.remove("ativo");
  form.style.display = "block";
});

/* =============================================================
   ENVIAR / ATUALIZAR no Supabase
   ============================================================= */
btnEnviar.addEventListener("click", async () => {
  if (prazoEncerrado()){ travarFormulario(); return; }
  erro.classList.remove("ativo");
  btnEnviar.disabled = true;
  btnEditar.disabled = true;
  const original = btnEnviar.textContent;
  btnEnviar.textContent = respostaId ? "Atualizando..." : "Enviando...";

  const registro = {
    nome: dados.nome,
    dias: dados.dias,
    outro_horario: dados.outro,
    horario: dados.horario
  };

  try {
    if (!sb) throw new Error("Supabase não configurado. Edite o arquivo config.js.");

    if (respostaId){
      // ATUALIZA a mesma resposta
      const { error } = await sb.from(TABELA).update(registro).eq("id", respostaId);
      if (error) throw error;
      tituloSucesso.textContent = "Resposta atualizada!";
      textoSucesso.textContent = "Pronto! Suas alterações foram salvas na sua resposta.";
    } else {
      // INSERE uma nova resposta e guarda o id para edições futuras
      const { data, error } = await sb.from(TABELA).insert([registro]).select("id").single();
      if (error) throw error;
      respostaId = data.id;
      localStorage.setItem("ibnm_resposta_id", respostaId);
      tituloSucesso.textContent = "Resposta enviada!";
      textoSucesso.textContent = "Obrigado! Sua disponibilidade foi registrada e já chegou até nós.";
    }

    resumo.classList.remove("ativo");
    sucesso.classList.add("ativo");
  } catch (err) {
    erro.textContent = "Não foi possível salvar: " + (err.message || err) +
      ". Verifique a configuração do Supabase e tente novamente.";
    erro.classList.add("ativo");
  } finally {
    btnEnviar.disabled = false;
    btnEditar.disabled = false;
    btnEnviar.textContent = original;
  }
});

/* =============================================================
   EDITAR MINHA RESPOSTA (na tela de sucesso)
   Volta ao formulário já preenchido; ao reenviar, atualiza a mesma resposta.
   ============================================================= */
btnEditarEnviada.addEventListener("click", () => {
  if (prazoEncerrado()){ travarFormulario(); return; }
  sucesso.classList.remove("ativo");
  if (dados) preencher({
    nome: dados.nome, dias: dados.dias,
    outro_horario: dados.outro, horario: dados.horario
  });
  btnSalvar.textContent = "Salvar alterações";
  form.style.display = "block";
});

/* =============================================================
   ENVIAR OUTRA RESPOSTA (nova pessoa no mesmo aparelho)
   Limpa o vínculo com a resposta anterior e cria uma nova.
   ============================================================= */
btnNovo.addEventListener("click", () => {
  if (prazoEncerrado()){ travarFormulario(); return; }
  respostaId = null;
  localStorage.removeItem("ibnm_resposta_id");
  form.reset();
  boxHorario.classList.remove("ativo");
  btnSalvar.textContent = "Salvar";
  sucesso.classList.remove("ativo");
  form.style.display = "block";
  dados = null;
});
