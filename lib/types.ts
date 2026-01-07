export interface Transaction {
  id: string;
  user_id: string;
  description: string;
  amount: number;
  category: string;
  date: string; // O Supabase devolve datas como string (ISO format)
  type: 'income' | 'expense';
  created_at: string;
}

// Interface auxiliar para quando formos criar uma nova transação (sem ID ainda)
export interface NewTransaction {
  description: string;
  amount: number;
  category: string;
  date: string;
  type: 'income' | 'expense';
}

export interface Transaction {
  id: string;
  user_id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  type: 'income' | 'expense';
  payment_method?: 'credit' | 'debit'; // Opcional, pois Entrada não tem isso
  is_recurring: boolean;               // Novo campo
  created_at: string;
}

export interface NewTransaction {
  description: string;
  amount: number;
  category: string;
  date: string;
  type: 'income' | 'expense';
  payment_method?: 'credit' | 'debit';
  is_recurring: boolean;
}