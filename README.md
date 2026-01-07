
# 💰 CashBoard

O **CashBoard** é uma aplicação web responsiva para controle financeiro pessoal, projetada para simplificar o registro de gastos e receitas. O objetivo é unir a flexibilidade das planilhas (Excel/Google Sheets) com a acessibilidade e segurança de uma aplicação web moderna.

## 🚀 Sobre o Projeto

Este projeto nasceu da necessidade de registrar transações financeiras de forma intuitiva pelo celular, mantendo a integridade dos dados e permitindo a sincronização entre dispositivos. Ele serve como uma interface amigável para dados que tradicionalmente ficariam presos em planilhas locais.

### ✨ Funcionalidades Planejadas

- [x] **Autenticação Segura:** Login via Magic Link (E-mail) sem necessidade de senhas.
- [ ] **CRUD de Transações:** Adicionar, editar e remover gastos e receitas.
- [ ] **Integração com Excel:** Importação e exportação de planilhas `.xlsx` (suporte a dados legados).
- [ ] **Dashboard Responsivo:** Visualização clara em Mobile e Desktop.
- [ ] **Categorização:** Organização inteligente de gastos.

## 🛠️ Tecnologias Utilizadas

Este projeto utiliza uma stack moderna focada em performance e DX (Developer Experience):

- **Frontend & API:** [Next.js 14+](https://nextjs.org/) (App Router & Server Actions)
- **Linguagem:** [TypeScript](https://www.typescriptlang.org/)
- **Estilização:** [Tailwind CSS](https://tailwindcss.com/)
- **Banco de Dados & Auth:** [Supabase](https://supabase.com/) (PostgreSQL)
- **Manipulação de Arquivos:** [SheetJS (xlsx)](https://docs.sheetjs.com/)

## ⚙️ Configuração Local

Siga os passos abaixo para rodar o projeto na sua máquina:

### Pré-requisitos
- Node.js instalado (v18 ou superior).
- Uma conta no [Supabase](https://supabase.com/).





### Instalação
1. Clone o repositório:
```bash
git clone [https://github.com/seu-usuario/cashboard.git](https://github.com/seu-usuario/cashboard.git)
cd cashboard

```

2. Instale as dependências:
```bash
npm install
```


3. Configure as variáveis de ambiente:
Crie um arquivo `.env.local` na raiz do projeto e adicione suas credenciais do Supabase:
```env
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima

```


4. Rode o servidor de desenvolvimento:
```bash
npm run dev

```


Acesse `http://localhost:3000`.

## 🗄️ Estrutura do Banco de Dados

O projeto utiliza PostgreSQL via Supabase. A tabela principal `transactions` possui a seguinte estrutura (com RLS ativado):

| Coluna | Tipo | Descrição |
| --- | --- | --- |
| `id` | uuid | PK |
| `user_id` | uuid | FK (Auth Users) |
| `description` | text | Descrição do gasto |
| `amount` | numeric | Valor da transação |
| `category` | text | Categoria (ex: Alimentação) |
| `type` | text | 'income' ou 'expense' |
| `date` | date | Data da ocorrência |

---

Desenvolvido com 💙 como um projeto pessoal de portfólio.



