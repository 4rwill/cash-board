'use client'

import { supabase } from '@/lib/supabaseClient'
import { useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  
  // Novos estados para o Magic Link
  const [email, setEmail] = useState('')
  const [linkSent, setLinkSent] = useState(false)

  useEffect(() => {
    // Verifica sessão atual
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      setLoading(false)
    }

    checkUser()

    // Escuta mudanças (Login/Logout)
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [])

  // Função de Login com Magic Link
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault() // Evita recarregar a página
    setLoading(true)

    const { error } = await supabase.auth.signInWithOtp({
      email: email,
      options: {
        // Redireciona para a home após clicar no email
        emailRedirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
      },
    })

    if (error) {
      alert('Erro ao enviar email: ' + error.message)
    } else {
      setLinkSent(true) // Mostra mensagem de sucesso
    }
    setLoading(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setLinkSent(false)
    setEmail('')
  }

  if (loading && !user && !linkSent) return <div className="p-10 text-center">Carregando...</div>

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100 max-w-md w-full text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Finance App</h1>

        {!user ? (
          !linkSent ? (
            /* Formulário de Login */
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <p className="text-gray-600 text-sm mb-2">
                Digite seu e-mail para receber um link de acesso.
              </p>
              <input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="border border-gray-300 rounded p-3 text-black focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? 'Enviando...' : 'Enviar Magic Link'}
              </button>
            </form>
          ) : (
            /* Mensagem de Link Enviado */
            <div className="text-center animate-pulse">
              <h3 className="text-green-600 text-xl font-bold mb-2">Link Enviado!</h3>
              <p className="text-gray-600">
                Verifique sua caixa de entrada ({email}).<br/>
                Clique no link para entrar.
              </p>
              <button 
                onClick={() => setLinkSent(false)} 
                className="text-sm text-blue-500 mt-4 underline"
              >
                Tentar outro e-mail
              </button>
            </div>
          )
        ) : (
          /* Usuário Logado */
          <>
            <p className="mb-4 text-green-600 font-semibold break-words">
              Logado: {user.email}
            </p>
            <div className="flex flex-col gap-3">
               <button className="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 w-full">
                  Ver Minhas Finanças
               </button>
               <button
                  onClick={handleLogout}
                  className="bg-red-100 text-red-600 hover:bg-red-200 py-2 px-4 rounded transition-colors w-full"
                >
                  Sair
                </button>
            </div>
          </>
        )}
      </div>
    </main>
  )
}