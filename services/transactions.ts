import { supabase } from '@/lib/supabaseClient'
import { NewTransaction, Transaction } from '@/lib/types'

// GET: Buscar transações FILTRADAS por data
export const getTransactionsByMonth = async (month: number, year: number) => {
  // Cria data de início: Dia 1 do mês, 00:00:00
  const start = new Date(year, month, 1).toISOString()
  
  // Cria data de fim: Dia 0 do mês seguinte (último dia do mês atual), 23:59:59
  const end = new Date(year, month + 1, 0, 23, 59, 59).toISOString()

  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .gte('date', start) // Maior ou igual ao dia 1
    .lte('date', end)   // Menor ou igual ao último dia
    .order('date', { ascending: false })

  if (error) throw error
  return data as Transaction[]
}

// POST e DELETE continuam iguais...
export const addTransaction = async (transaction: NewTransaction) => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não logado')

  const { data, error } = await supabase
    .from('transactions')
    .insert([{ ...transaction, user_id: user.id }])
    .select()

  if (error) throw error
  return data
}

export const deleteTransaction = async (id: string) => {
  const { error } = await supabase.from('transactions').delete().eq('id', id)
  if (error) throw error
}

export const addBulkTransactions = async (transactions: NewTransaction[]) => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não logado')

  const transactionsWithUser = transactions.map(t => ({ ...t, user_id: user.id }))
  const { data, error } = await supabase.from('transactions').insert(transactionsWithUser).select()
  if (error) throw error
  return data
}