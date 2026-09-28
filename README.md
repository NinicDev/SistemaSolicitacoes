# Sistema de Solicitações

Sistema web para cadastro, gerenciamento e acompanhamento de solicitações de serviço, desenvolvido com **Node.js, Express, PostgreSQL e JavaScript**.

O projeto possui autenticação de usuários, verificação de e-mail, recuperação de senha, controle de acesso por níveis, gerenciamento de responsáveis, upload protegido de anexos, geração de PDFs e uma área administrativa.

O objetivo foi desenvolver uma aplicação completa trabalhando conceitos de **frontend, backend, banco de dados relacional, autenticação, autorização, segurança, uploads e regras de negócio**.

---

## 📋 Funcionalidades

### Autenticação e usuários

- Cadastro de usuários
- Login com JWT
- Logout com invalidação de token
- Verificação de e-mail através de código
- Reenvio de código de verificação
- Recuperação de senha por e-mail
- Redefinição de senha
- Controle de acesso baseado em níveis

### Solicitações

- Cadastro de solicitações
- Listagem de solicitações
- Visualização individual
- Edição de solicitações
- Exclusão de solicitações
- Filtros de pesquisa
- Prioridades
- Controle de status
- Associação com responsáveis
- Associação com tipos de serviço
- Busca automática de endereço através do CEP

### Anexos

- Upload de múltiplas imagens
- Visualização de miniaturas
- Visualização ampliada em modal
- Remoção de anexos
- Proteção dos arquivos através de autenticação
- Limite e validação dos formatos enviados

### PDFs

- Geração de PDF individual
- Geração de PDF em lote
- Seleção de múltiplas solicitações para impressão

### Administração

- Listagem de usuários
- Alteração de nível de acesso
- Cadastro de responsáveis
- Ativação e desativação de responsáveis
- Associação de um responsável a um usuário existente
- Alteração automática do nível de acesso do usuário vinculado

---

# 🔐 Níveis de acesso

O sistema possui três níveis de acesso:

| Nível | Permissões |
| --- | --- |
| **ADMIN** | Possui acesso completo ao sistema, incluindo gerenciamento de usuários, responsáveis, solicitações e níveis de acesso |
| **OPERADOR** | Pode criar e editar solicitações, gerenciar anexos, visualizar solicitações e gerar PDFs |
| **VISUALIZADOR** | Possui acesso somente para consulta de solicitações, anexos e documentos |

Todo novo usuário é criado inicialmente como:

```text
VISUALIZADOR
```

Quando um usuário é cadastrado como responsável, o sistema altera automaticamente seu nível para:

```text
OPERADOR
```

Quando esse responsável é desativado, seu nível volta para:

```text
VISUALIZADOR
```

Um responsável ativo deve obrigatoriamente possuir nível `OPERADOR`.

As permissões são verificadas no **backend**, através de middlewares de autenticação e autorização. Dessa forma, esconder um botão no frontend não é utilizado como mecanismo de segurança.

---

# 🛠 Tecnologias utilizadas

## Backend

- Node.js
- Express
- PostgreSQL
- `pg`
- JSON Web Token (`jsonwebtoken`)
- bcrypt
- Multer
- Nodemailer
- PDFKit
- dotenv
- CORS

## Frontend

- HTML5
- CSS3
- JavaScript
- Fetch API

## Ferramentas utilizadas durante o desenvolvimento

- Visual Studio Code
- PostgreSQL
- Postman
- Git
- GitHub

---

# 📁 Estrutura do projeto

```text
SistemaSolicitacoes/
│
├── config/
│   └── database.js
│
├── database/
│   ├── schema.sql
│   └── seed.sql
│
├── public/
│   │
│   ├── css/
│   │   ├── administracao.css
│   │   ├── anexos.css
│   │   ├── base.css
│   │   ├── inicio.css
│   │   ├── login.css
│   │   ├── nova-solicitacao.css
│   │   ├── solicitacao.css
│   │   └── solicitacoes.css
│   │
│   ├── js/
│   │   ├── administracao.js
│   │   ├── anexos.js
│   │   ├── cadastro.js
│   │   ├── formatadores.js
│   │   ├── inicio.js
│   │   ├── login.js
│   │   ├── nova-solicitacao.js
│   │   ├── redefinir-senha.js
│   │   ├── solicitacao.js
│   │   ├── solicitacoes.js
│   │   ├── validacoes.js
│   │   ├── verificar-email.js
│   │   └── verificar-email-senha.js
│   │
│   ├── administracao.html
│   ├── cadastro.html
│   ├── inicio.html
│   ├── login.html
│   ├── nova-solicitacao.html
│   ├── redefinir-senha.html
│   ├── solicitacao.html
│   ├── solicitacoes.html
│   ├── verificar-email.html
│   └── verificar-email-senha.html
│
├── src/
│   │
│   ├── controllers/
│   ├── middlewares/
│   ├── routes/
│   ├── services/
│   └── app.js
│
├── uploads/
│   └── README.md
│
├── .env.example
├── .gitignore
├── package.json
├── package-lock.json
├── README.md
└── server.js
```

---

# 🗄 Banco de dados

O projeto utiliza **PostgreSQL**.

As principais tabelas são:

```text
usuarios
responsaveis
tipos_servico
solicitacoes
anexos
codigos_verificacao
tokens_invalidados
```

Também são utilizadas as views:

```text
view_email_verificacao
view_solicitacoes_registro
```

O relacionamento principal do sistema pode ser representado de forma simplificada como:

```text
usuarios
   │
   │ 1
   │
   ▼
responsaveis
   │
   │ 1:N
   ▼
solicitacoes
   │
   │ 1:N
   ▼
anexos
```

Um usuário pode ser vinculado a um responsável.

Todo responsável possui um usuário associado, e um responsável pode estar associado a várias solicitações.

---

# 📦 Pré-requisitos

Para executar o projeto localmente é necessário possuir:

- Node.js
- npm
- PostgreSQL

O projeto foi desenvolvido utilizando:

```text
Node.js 24
PostgreSQL 18
```

Versões diferentes e compatíveis também podem funcionar.

---

# 🚀 Instalação

Clone o repositório:

```bash
git clone https://github.com/NinicDev/SistemaSolicitacoes.git
```

Entre na pasta:

```bash
cd SistemaSolicitacoes
```

Instale as dependências:

```bash
npm install
```

---

# 🗃 Configuração do PostgreSQL

Primeiro, crie o banco:

```sql
CREATE DATABASE sistema_solicitacoes;
```

Depois execute o arquivo responsável por criar toda a estrutura:

```bash
psql -U postgres -d sistema_solicitacoes -f database/schema.sql
```

Em seguida execute os dados iniciais:

```bash
psql -U postgres -d sistema_solicitacoes -f database/seed.sql
```

O `seed.sql` adiciona os tipos de serviço iniciais:

```text
Instalação
Manutenção
Vistoria
```

O arquivo `schema.sql` contém:

- tabelas;
- sequences;
- chaves primárias;
- chaves estrangeiras;
- constraints;
- valores padrão;
- views;
- relacionamentos.

Nenhum usuário, senha, solicitação ou dado pessoal utilizado durante o desenvolvimento é distribuído junto ao banco.

---

# ⚙️ Variáveis de ambiente

Na raiz do projeto existe:

```text
.env.example
```

Crie uma cópia chamada:

```text
.env
```

E configure suas informações:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=sua_senha_do_postgresql
DB_NAME=sistema_solicitacoes

JWT_SECRET=seu_segredo_jwt

EMAIL_HOST=servidor_smtp
EMAIL_PORT=porta_smtp
EMAIL_USER=seu_email
EMAIL_PASS=sua_senha_ou_app_password
EMAIL_FROM=seu_email

PORT=3000
```

O arquivo `.env` contém informações privadas e **não deve ser enviado ao GitHub**.

Ele já está configurado no `.gitignore`.

---

# ✉️ Configuração de e-mail

O envio de e-mails é utilizado para:

- verificação de conta;
- reenvio de código;
- recuperação de senha.

É necessário configurar um servidor SMTP através das variáveis:

```env
EMAIL_HOST=
EMAIL_PORT=
EMAIL_USER=
EMAIL_PASS=
EMAIL_FROM=
```

Dependendo do provedor de e-mail utilizado, pode ser necessário gerar uma **senha de aplicativo**.

---

# 👑 Criando o primeiro administrador

Todos os novos usuários são cadastrados inicialmente como:

```text
VISUALIZADOR
```

Para criar o primeiro administrador:

1. Cadastre um usuário normalmente.
2. Verifique o e-mail.
3. Execute no PostgreSQL:

```sql
UPDATE usuarios
SET nivel_acesso = 'ADMIN'
WHERE email = 'seu@email.com';
```

Depois disso, ao entrar novamente no sistema, esse usuário terá acesso à área administrativa.

Os próximos usuários poderão ser gerenciados através da própria interface.

---

# ▶️ Executando o projeto

Para iniciar normalmente:

```bash
npm start
```

Durante o desenvolvimento, utilizando Nodemon:

```bash
npm run dev
```

Por padrão, o backend utiliza:

```text
http://localhost:3000
```

Caso a variável `PORT` seja fornecida pelo ambiente, ela será utilizada automaticamente.

---

# 🌐 Frontend

O frontend está localizado na pasta:

```text
public/
```

A página de entrada é:

```text
public/login.html
```

Durante o desenvolvimento local, os arquivos podem ser servidos através de um servidor HTTP local, como o **Live Server** do Visual Studio Code.

O frontend se comunica com a API utilizando a Fetch API.

---

# 🔑 Autenticação

Após o login, o backend gera um token JWT.

As rotas protegidas esperam o token através do header:

```http
Authorization: Bearer TOKEN
```

O middleware de autenticação verifica:

- existência do token;
- validade;
- expiração;
- invalidação por logout;
- existência atual do usuário.

O nível de acesso é consultado no banco para que uma alteração de permissão tenha efeito sem depender da emissão de um novo JWT.

---

# 🛡 Autorização

A autenticação responde:

> Quem é o usuário?

A autorização responde:

> Esse usuário possui permissão para executar esta operação?

As rotas utilizam níveis como:

```javascript
autorizarNiveis("ADMIN")
```

ou:

```javascript
autorizarNiveis(
    "ADMIN",
    "OPERADOR"
)
```

Por exemplo:

```text
GET /solicitacoes
→ ADMIN
→ OPERADOR
→ VISUALIZADOR
```

```text
POST /solicitacoes
→ ADMIN
→ OPERADOR
```

```text
DELETE /solicitacoes/:id
→ ADMIN
```

Dessa forma, as permissões continuam protegidas mesmo caso alguém tente realizar uma requisição diretamente através de ferramentas como Postman.

---

# 👤 Responsáveis

Responsáveis são usuários do sistema vinculados à tabela `responsaveis`.

Quando um administrador cadastra um usuário como responsável:

```text
VISUALIZADOR
        ↓
    OPERADOR
```

Ao desativar esse responsável:

```text
OPERADOR
     ↓
VISUALIZADOR
```

Ao reativá-lo:

```text
VISUALIZADOR
        ↓
    OPERADOR
```

Essas alterações são realizadas utilizando transações para evitar inconsistências entre as tabelas `usuarios` e `responsaveis`.

Um responsável inativo deixa de aparecer para novas solicitações, porém continua associado às solicitações antigas para preservar o histórico.

---

# 📝 Solicitações

Uma solicitação pode possuir:

- Nome
- CPF
- RG
- Telefone
- Rua
- Número
- Bairro
- Cidade
- UF
- CEP
- Complemento
- Responsável
- Tipo de serviço
- Prioridade
- Status
- Descrição
- Anexos

---

## Prioridades

As prioridades disponíveis são:

```text
BAIXO
MEDIO
ALTO
```

O banco também possui uma constraint para impedir valores inválidos.

---

## Status

Os status disponíveis são:

```text
ABERTA
EM_ANDAMENTO
CONCLUIDA
CANCELADA
```

Toda nova solicitação é criada inicialmente como:

```text
ABERTA
```

O banco também possui uma constraint para impedir valores de status inválidos.

---

# 📍 Consulta de CEP

O formulário de solicitação possui integração para consulta de CEP.

Ao informar um CEP válido, o sistema pode preencher automaticamente informações como:

- rua;
- bairro;
- cidade;
- UF.

---

# 🖼 Anexos

Solicitações podem possuir imagens anexadas.

O upload utiliza **Multer**.

São aplicadas validações de formato e tamanho antes do armazenamento.

Os arquivos são mantidos na pasta:

```text
uploads/
```

Os arquivos enviados durante a execução não são versionados pelo Git.

Além disso, a pasta de uploads não é exposta diretamente como diretório público.

A leitura dos anexos passa por uma rota autenticada, impedindo acesso direto sem autorização.

Ao excluir um anexo ou uma solicitação, o sistema também realiza a limpeza dos arquivos físicos relacionados.

---

# 📄 PDFs

O sistema utiliza **PDFKit** para gerar documentos das solicitações.

Existem duas modalidades:

### PDF individual

Gera um documento contendo os dados completos de uma única solicitação.

### PDF em lote

Permite selecionar várias solicitações na listagem e gerar um único documento contendo todas elas.

O sistema também controla automaticamente quebra de página para descrições maiores.

---

# 🔎 Filtros

A tela de listagem permite localizar e consultar solicitações de forma mais prática.

Os registros exibem informações como:

- ID;
- nome;
- tipo de serviço;
- responsável;
- status;
- prioridade.

A interface também diferencia visualmente status e prioridades.

---

# 🎨 Interface

O frontend possui uma identidade visual padronizada entre as diferentes telas do sistema.

Entre elas:

- login;
- cadastro;
- verificação de e-mail;
- recuperação de senha;
- página inicial;
- cadastro de solicitação;
- listagem;
- detalhes da solicitação;
- administração.

A interface também possui adaptação para diferentes tamanhos de tela.

---

# 🔒 Segurança

Algumas medidas aplicadas no projeto:

- senhas armazenadas através de hash com bcrypt;
- autenticação JWT;
- expiração de tokens;
- invalidação de JWT durante logout;
- verificação de permissões no backend;
- validação dos dados recebidos;
- queries parametrizadas com PostgreSQL;
- níveis de acesso consultados diretamente no banco;
- anexos protegidos por autenticação;
- validação de tipo e tamanho dos uploads;
- proteção contra níveis de acesso inválidos;
- proteção contra remoção do último administrador;
- variáveis sensíveis armazenadas no `.env`;
- `.env` ignorado pelo Git.

---

# 📜 Scripts disponíveis

## Produção / execução normal

```bash
npm start
```

## Desenvolvimento

```bash
npm run dev
```

O modo de desenvolvimento utiliza Nodemon para reiniciar o servidor automaticamente após alterações.

---

# 🌱 Dados iniciais

O arquivo:

```text
database/seed.sql
```

possui somente informações necessárias para iniciar o projeto.

Atualmente são criados os seguintes tipos de serviço:

```text
Instalação
Manutenção
Vistoria
```

O seed pode ser executado novamente sem duplicar esses registros.

---

# 🧪 Testes

Durante o desenvolvimento, as rotas da API foram testadas utilizando Postman.

Foram testados cenários como:

- autenticação válida e inválida;
- token ausente;
- token expirado;
- permissões entre ADMIN, OPERADOR e VISUALIZADOR;
- criação e edição de solicitações;
- exclusão;
- upload e exclusão de anexos;
- geração de PDFs;
- alteração do nível de acesso;
- ativação e desativação de responsáveis;
- códigos de verificação;
- recuperação de senha;
- validações de campos.

---

# 🌍 Demonstração online

Uma versão hospedada da aplicação será adicionada posteriormente.

```text
Em breve
```

---

# 📸 Screenshots

Screenshots da aplicação serão adicionadas após a publicação da versão online.

<!--
Exemplo futuro:

## Login

![Login](docs/screenshots/login.png)

## Página inicial

![Início](docs/screenshots/inicio.png)

## Solicitações

![Solicitações](docs/screenshots/solicitacoes.png)

## Administração

![Administração](docs/screenshots/administracao.png)
-->

---

# 📌 Próximas etapas

- Publicação da aplicação
- Hospedagem do banco PostgreSQL
- Configuração de armazenamento persistente para anexos
- Inclusão de screenshots no README
- Inclusão do link da demonstração online

---

# 👨‍💻 Autor

Desenvolvido por **Nicolas Andrade**.

GitHub:

[NinicDev](https://github.com/NinicDev)

---

## 📄 Licença

Este projeto foi desenvolvido para fins de estudo, prática e portfólio.