# Formulário de Disponibilidade — Ministério de Música IBNM

Um formulário bonito e elegante (verde) onde a pessoa escolhe os dias da semana
(Segunda a Domingo), tem uma opção extra de "Outro horário" que abre um campo
`hh:mm`, salva, vê o **resumo** e envia. As respostas chegam até você e podem
ser acompanhadas **em tempo real com notificação**.

## O que vem na pasta

| Arquivo        | Para que serve |
|----------------|----------------|
| `index.html`   | O **formulário** que você envia para as pessoas responderem |
| `admin.html`   | Seu **painel** para acompanhar as respostas ao vivo (com notificações) |
| `config.js`    | Onde você cola a URL e a chave do seu Supabase |
| `app.js`       | Lógica do formulário |
| `logo.jpg`     | A imagem do app (seu logo) |

---

## Passo 1 — Criar a tabela no Supabase

1. Acesse o seu projeto no [supabase.com](https://supabase.com).
2. No menu lateral, abra **SQL Editor** → **New query**.
3. Cole o código abaixo e clique em **Run**:

```sql
-- Tabela das respostas
create table respostas_disponibilidade (
  id          bigint generated always as identity primary key,
  nome        text,
  dias        text[],
  outro_horario boolean default false,
  horario     text,
  created_at  timestamptz default now()
);

-- Liga a segurança por linha (RLS)
alter table respostas_disponibilidade enable row level security;

-- Permite QUALQUER pessoa ENVIAR o formulário (inserir)
create policy "qualquer um pode enviar"
  on respostas_disponibilidade
  for insert to anon
  with check (true);

-- Permite LER as respostas (necessário para o painel admin.html)
create policy "leitura das respostas"
  on respostas_disponibilidade
  for select to anon
  using (true);

-- Permite EDITAR a resposta (necessário para o usuário alterar depois de enviar)
create policy "pode editar a resposta"
  on respostas_disponibilidade
  for update to anon
  using (true) with check (true);
```

> **Já criou a tabela antes?** Rode só o comando da política de edição acima
> (o bloco `create policy "pode editar a resposta" ...`) para habilitar a
> edição depois do envio.

4. Depois, ative o tempo real: menu **Database → Replication** (ou
   **Realtime**) e marque a tabela `respostas_disponibilidade`.

---

## Passo 2 — Pegar suas chaves

No Supabase: **Settings → API**. Copie:
- **Project URL**
- **anon public** (chave anônima)

Abra o arquivo `config.js` e cole nos lugares indicados:

```js
const SUPABASE_URL = "https://xxxxxxxx.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOi...sua-chave-anon...";
```

> A chave **anon** pode ficar pública — ela foi feita para isso. A segurança
> real é garantida pelas políticas (RLS) do Passo 1.

---

## Passo 3 — Publicar no GitHub Pages

1. Crie um repositório novo no GitHub (ex.: `formulario-ibnm`).
2. Envie **todos os arquivos desta pasta** para o repositório.
3. No repositório: **Settings → Pages**.
4. Em *Source*, escolha a branch `main` e a pasta `/root`. Salve.
5. Em ~1 minuto o GitHub mostra o endereço, algo como:
   `https://seu-usuario.github.io/formulario-ibnm/`

- **Link do formulário** (enviar para as pessoas):
  `https://seu-usuario.github.io/formulario-ibnm/`
- **Seu painel** (só para você):
  `https://seu-usuario.github.io/formulario-ibnm/admin.html`

---

## Passo 4 — Acompanhar as respostas

Abra o `admin.html`. Ele mostra todas as respostas, atualiza **sozinho em
tempo real** quando alguém envia e, se você clicar em **"Ativar
 notificações"**, o navegador avisa a cada nova resposta.

Você também pode ver tudo direto no Supabase: **Table Editor →
respostas_disponibilidade**.

### Quer receber por e-mail também?
No Supabase use **Database → Webhooks**: crie um webhook no evento *Insert* da
tabela e aponte para um serviço de e-mail (ex.: Resend) ou para o Zapier/Make.
Assim cada resposta nova dispara um e-mail para você.

---

## Prazo final (o formulário se tranca sozinho)

O formulário tem uma data limite. Depois dela, ele fecha automaticamente: não
aceita novas respostas nem edições, e mostra um aviso vermelho avisando que o
período encerrou. Antes do prazo, aparece um aviso amarelo informando até
quando dá para responder.

A data fica no arquivo `config.js`, na linha:

```js
const PRAZO_FINAL = "2026-10-17T23:59:59"; // 17/10 às 23:59 (horário local)
```

Para mudar o prazo, é só trocar essa data (formato AAAA-MM-DDTHH:MM:SS).

## Editar depois de enviar

Depois de enviar, a pessoa vê um botão **“Editar minha resposta”**. Ao alterar
e reenviar, a **mesma resposta é atualizada** (não cria uma nova). Se a pessoa
fechar e abrir o link de novo no mesmo aparelho, o formulário reconhece que ela
já respondeu e permite editar. Isso funciona enquanto o prazo não terminar.

---

## Observação de segurança

A política de **leitura** liberada (`select` para `anon`) faz o `admin.html`
funcionar sem login, mas significa que quem souber o endereço do painel e tiver
sua chave anon poderia ler as respostas. Para um grupo pequeno isso costuma ser
suficiente. Se quiser deixar as respostas **privadas de verdade**, remova a
política de `select` e acompanhe as respostas apenas pelo painel do Supabase
(que exige o seu login), mantendo só a política de `insert` para o formulário.
