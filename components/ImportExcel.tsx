'use client'

import { ChangeEvent, useState } from 'react'
import * as XLSX from 'xlsx'
import { addBulkTransactions } from '@/services/transactions'
import { NewTransaction } from '@/lib/types'

interface Props {
  onSuccess: () => void
}

type ExcelRow = (string | number | undefined | null)[];

const MONTH_MAP: Record<string, number> = {
  'Janeiro': 0, 'Fevereiro': 1, 'Março': 2, 'Abril': 3, 'Maio': 4, 'Junho': 5,
  'Julho': 6, 'Agosto': 7, 'Setembro': 8, 'Outubro': 9, 'Novembro': 10, 'Dezembro': 11
}

export default function ImportExcel({ onSuccess }: Props) {
  const [loading, setLoading] = useState(false)

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    const reader = new FileReader()

    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result
        const wb = XLSX.read(bstr, { type: 'binary' })
        
        const allTransactions: NewTransaction[] = []
        const currentYear = new Date().getFullYear()

        wb.SheetNames.forEach(sheetName => {
          if (Object.prototype.hasOwnProperty.call(MONTH_MAP, sheetName)) {
            const ws = wb.Sheets[sheetName]
            const monthIndex = MONTH_MAP[sheetName]
            
            const data = XLSX.utils.sheet_to_json<ExcelRow>(ws, { header: 1 })

            // Começamos na linha 10 (index 9)
            for (let i = 9; i < data.length; i++) {
              const row = data[i]
              if (!row) continue

              // --- PARTE 1: GASTOS (Esquerda) ---
              const expenseDesc = row[2]
              const expenseCat = row[6]
              const expenseVal = row[7]

              if (expenseDesc && expenseVal) {
                const expenseDate = new Date(currentYear, monthIndex, 1).toISOString()
                const catString = expenseCat ? String(expenseCat) : 'Fixo'
                
                allTransactions.push({
                  description: String(expenseDesc),
                  amount: typeof expenseVal === 'number' ? Math.abs(expenseVal) : parseFloat(String(expenseVal)),
                  category: catString,
                  date: expenseDate,
                  type: 'expense',
                  payment_method: 'debit', // Assumimos débito por padrão na importação
                  is_recurring: catString === 'Fixo' || catString === 'Fixos' // Tenta adivinhar se é fixo pela categoria
                })
              }

              // --- PARTE 2: ENTRADAS (Direita) ---
              const incomeDesc = row[10]
              const incomeDateRaw = row[11]
              const incomeCat = row[12]
              const incomeVal = row[13]

              if (incomeDesc && incomeVal) {
                let finalDate = new Date(currentYear, monthIndex, 1).toISOString()

                if (incomeDateRaw) {
                   if (typeof incomeDateRaw === 'number') {
                      const dateObj = new Date(Math.round((incomeDateRaw - 25569) * 86400 * 1000))
                      finalDate = dateObj.toISOString()
                   } else {
                      finalDate = new Date(String(incomeDateRaw)).toISOString()
                   }
                }

                allTransactions.push({
                  description: String(incomeDesc),
                  amount: typeof incomeVal === 'number' ? Math.abs(incomeVal) : parseFloat(String(incomeVal)),
                  category: incomeCat ? String(incomeCat) : 'Entrada',
                  date: finalDate,
                  type: 'income',
                  // Entradas não precisam de payment_method, mas para satisfazer tipos estritos, podemos omitir ou passar undefined
                  is_recurring: false 
                })
              }
            }
          }
        })

        if (allTransactions.length === 0) {
          alert("Nenhuma transação encontrada.")
          return
        }

        const batchSize = 50
        for (let i = 0; i < allTransactions.length; i += batchSize) {
            const batch = allTransactions.slice(i, i + batchSize);
            await addBulkTransactions(batch)
        }

        alert(`${allTransactions.length} transações importadas!`)
        onSuccess()

      } catch (error) {
        console.error("Erro:", error)
        alert('Erro ao processar.')
      } finally {
        setLoading(false)
        e.target.value = ''
      }
    }

    reader.readAsBinaryString(file)
  }

  return (
    <div className="relative">
      <input
        type="file"
        accept=".xlsx, .xls"
        onChange={handleFileUpload}
        className="hidden"
        id="excel-upload"
        disabled={loading}
      />
      <label
        htmlFor="excel-upload"
        className={`cursor-pointer bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded transition-colors flex items-center gap-2 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {loading ? '⏳ ...' : '📤 Importar'}
      </label>
    </div>
  )
}