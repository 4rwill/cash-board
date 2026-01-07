'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { getTransactionsByMonth, addTransaction, deleteTransaction } from '@/services/transactions'
import { Transaction, NewTransaction } from '@/lib/types'

export default function Dashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [view, setView] = useState<'debit' | 'credit' | 'investments'>('debit')
  
  // ESTADO DO MÊS ATUAL (Inicia na data de hoje)
  const [currentDate, setCurrentDate] = useState(new Date())

  // Estado do Formulário
  const [form, setForm] = useState<NewTransaction>({
    description: '',
    amount: 0,
    category: 'Outros',
    date: new Date().toISOString().split('T')[0],
    type: 'expense',
    payment_method: 'debit',
    is_recurring: false
  })

  // Categorias
  const categories = ['Alimentação', 'Transporte', 'Moradia', 'Lazer', 'Saúde', 'Educação', 'Investimento', 'Outros']

  // Carregar dados quando a tela abre OU quando muda o mês (currentDate)
  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return router.push('/')
      loadData()
    }
    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, currentDate])

  const loadData = async () => {
    setLoading(true)
    try {
      // Busca apenas dados do mês/ano selecionado
      const data = await getTransactionsByMonth(currentDate.getMonth(), currentDate.getFullYear())
      setTransactions(data)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  // Funções de Navegação de Data
  const changeMonth = (offset: number) => {
    const newDate = new Date(currentDate)
    newDate.setMonth(newDate.getMonth() + offset)
    setCurrentDate(newDate)
    
    // Opcional: Atualiza a data do formulário para o mês que você está visualizando
    // para não adicionar um gasto em Janeiro enquanto olha Fevereiro sem querer
    const formDate = new Date(newDate)
    // Mantém o dia atual, mas muda mês/ano
    setForm(prev => ({
        ...prev,
        date: formDate.toISOString().split('T')[0]
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    let payload: NewTransaction = {
      description: form.description,
      amount: form.amount,
      date: form.date,
      type: form.type,
      category: form.category,
      payment_method: form.payment_method,
      is_recurring: form.is_recurring
    }
    
    if (form.type === 'income') {
        payload = { ...payload, category: 'Entrada', payment_method: undefined, is_recurring: false }
    }

    try {
      await addTransaction(payload)
      // Recarrega apenas se a data da transação estiver no mês que estamos olhando
      loadData()
      
      setForm({ 
        description: '', 
        amount: 0, 
        category: 'Outros',
        date: form.date, 
        type: 'expense', 
        payment_method: 'debit',
        is_recurring: false
      }) 
    } catch (error) {
      alert('Erro ao salvar')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Apagar registro?')) return
    await deleteTransaction(id)
    loadData()
  }

  // --- CÁLCULOS (Baseados apenas no mês selecionado) ---
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((acc, t) => acc + t.amount, 0)

  const totalDebit = transactions
    .filter(t => t.type === 'expense' && t.payment_method === 'debit')
    .reduce((acc, t) => acc + t.amount, 0)

  const totalCredit = transactions
    .filter(t => t.type === 'expense' && t.payment_method === 'credit')
    .reduce((acc, t) => acc + t.amount, 0)

  const totalInvested = transactions
    .filter(t => t.category === 'Investimento')
    .reduce((acc, t) => acc + t.amount, 0)

  // Saldo do Mês (Entradas - Gastos Débito)
  const currentBalance = totalIncome - totalDebit

  // --- FILTRAGEM ---
  const filteredList = transactions.filter(t => {
    if (view === 'investments') return t.category === 'Investimento'
    if (t.category === 'Investimento') return false
    
    if (view === 'debit') return t.type === 'income' || t.payment_method === 'debit'
    if (view === 'credit') return t.payment_method === 'credit'
    return false
  })

  // Formatação do Mês (ex: "Janeiro 2025")
  const monthLabel = currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 pb-24">
      <div className="max-w-5xl mx-auto">
        
        {/* NAVEGADOR DE MESES */}
        <div className="flex items-center justify-between mb-8 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <button 
                onClick={() => changeMonth(-1)}
                className="p-2 hover:bg-gray-100 rounded-full text-gray-600 transition-colors"
            >
                ◀ Anterior
            </button>
            
            <h2 className="text-xl font-bold text-gray-800 capitalize">
                {monthLabel}
            </h2>

            <button 
                onClick={() => changeMonth(1)}
                className="p-2 hover:bg-gray-100 rounded-full text-gray-600 transition-colors"
            >
                Próximo ▶
            </button>
        </div>

        {/* CARDS DE RESUMO DO MÊS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-xl shadow border-l-4 border-green-500">
            <p className="text-xs text-gray-500 uppercase">Saldo (Mês)</p>
            <p className={`text-xl font-bold ${currentBalance >= 0 ? 'text-green-700' : 'text-red-600'}`}>
              R$ {currentBalance.toFixed(2)}
            </p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow border-l-4 border-blue-500">
            <p className="text-xs text-gray-500 uppercase">Fatura Crédito</p>
            <p className="text-xl font-bold text-blue-700">R$ {totalCredit.toFixed(2)}</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow border-l-4 border-purple-500">
            <p className="text-xs text-gray-500 uppercase">Investido</p>
            <p className="text-xl font-bold text-purple-700">R$ {totalInvested.toFixed(2)}</p>
          </div>
        </div>

        {/* FORMULÁRIO */}
        <div className="bg-white p-6 rounded-xl shadow-sm mb-8 border border-gray-100">
          <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-700">Adicionar em {monthLabel}</h2>
          </div>
          
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-3">
            <div className="md:col-span-2">
                <select 
                    className="w-full border p-2 rounded bg-gray-50 text-black font-medium"
                    value={form.type}
                    onChange={e => setForm({...form, type: e.target.value as 'income' | 'expense'})}
                >
                <option value="expense">🔴 Gasto</option>
                <option value="income">🟢 Entrada</option>
                </select>
            </div>

            <div className="md:col-span-3">
                <input 
                    type="text" 
                    placeholder="Descrição" 
                    required
                    className="w-full border p-2 rounded text-black"
                    value={form.description}
                    onChange={e => setForm({...form, description: e.target.value})}
                />
            </div>

            <div className="md:col-span-2">
                <input 
                    type="number" 
                    placeholder="Valor" 
                    required
                    step="0.01"
                    className="w-full border p-2 rounded text-black"
                    value={form.amount}
                    onChange={e => setForm({...form, amount: parseFloat(e.target.value)})}
                />
            </div>

            {/* DATA DA TRANSAÇÃO - Útil caso queira mudar o dia */}
            <div className="md:col-span-2">
                <input 
                    type="date" 
                    required
                    className="w-full border p-2 rounded text-black"
                    value={form.date}
                    onChange={e => setForm({...form, date: e.target.value})}
                />
            </div>

            {form.type === 'expense' && (
                <>
                    <div className="md:col-span-2">
                        <select 
                            className="w-full border p-2 rounded text-black"
                            value={form.category}
                            onChange={e => setForm({...form, category: e.target.value})}
                        >
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>

                    <div className="md:col-span-2">
                        <select 
                            className="w-full border p-2 rounded text-black"
                            value={form.payment_method}
                            onChange={e => setForm({...form, payment_method: e.target.value as 'debit' | 'credit'})}
                        >
                        <option value="debit">Débito / Pix</option>
                        <option value="credit">Crédito</option>
                        </select>
                    </div>

                    <div className="md:col-span-1 flex items-center justify-center">
                       <label className="flex items-center space-x-2 cursor-pointer text-sm text-gray-600">
                         <input 
                            type="checkbox" 
                            checked={form.is_recurring}
                            onChange={e => setForm({...form, is_recurring: e.target.checked})}
                            className="rounded text-blue-600"
                         />
                         <span>Fixo?</span>
                       </label>
                    </div>
                </>
            )}

            <button type="submit" className="md:col-span-12 bg-black text-white p-3 rounded font-bold hover:bg-gray-800 transition-colors">
              Salvar
            </button>
          </form>
        </div>

        {/* ABAS */}
        <div className="flex gap-2 mb-4 overflow-x-auto">
            <button onClick={() => setView('debit')} className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${view === 'debit' ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-600'}`}>
                Fluxo de Caixa
            </button>
            <button onClick={() => setView('credit')} className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${view === 'credit' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                Fatura Cartão
            </button>
            <button onClick={() => setView('investments')} className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${view === 'investments' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                Investimentos
            </button>
        </div>

        {/* TABELA */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
             <div className="p-8 text-center text-gray-500">Carregando dados...</div>
          ) : (
            <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                <tr>
                    <th className="p-4">Dia</th>
                    <th className="p-4">Descrição</th>
                    <th className="p-4 text-right">Valor</th>
                    <th className="p-4 text-center"></th>
                </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                {filteredList.length === 0 ? (
                    <tr><td colSpan={4} className="p-8 text-center text-gray-400">Nada registrado em {monthLabel}.</td></tr>
                ) : (
                    filteredList.map((t) => (
                    <tr key={t.id} className="hover:bg-gray-50 group">
                        <td className="p-4 text-gray-500 w-16">
                        {new Date(t.date).toLocaleDateString('pt-BR', {day: '2-digit'})}
                        </td>
                        <td className="p-4 font-medium text-gray-800">
                        {t.description}
                        <div className="flex gap-2 mt-1">
                            <span className="text-xs text-gray-400 font-normal border border-gray-100 px-1 rounded">{t.category}</span>
                            {t.is_recurring && <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded">Fixo</span>}
                        </div>
                        </td>
                        <td className={`p-4 text-right font-bold ${t.type === 'income' ? 'text-green-600' : (t.category === 'Investimento' ? 'text-purple-600' : 'text-red-600')}`}>
                        {t.type === 'expense' ? '-' : '+'} 
                        R$ {t.amount.toFixed(2)}
                        </td>
                        <td className="p-4 text-center w-10">
                        <button onClick={() => handleDelete(t.id)} className="text-gray-300 hover:text-red-500">×</button>
                        </td>
                    </tr>
                    ))
                )}
                </tbody>
            </table>
          )}
        </div>

      </div>
    </div>
  )
}