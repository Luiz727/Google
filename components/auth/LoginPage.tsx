
import React, { useState, FormEvent } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { NIXCON_LOGO_URL, NOME_APLICACAO } from '../../constants';
import { IconeOlho, IconeOlhoFechado } from '../common/Icons'; 
import Button from '../common/Button';

const IconeEmail = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
  </svg>
);

const IconeCadeado = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
  </svg>
);


const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const { login, estaAutenticado, isLoading: authIsLoading } = useAuth();
  const navigate = useNavigate();

  if (authIsLoading) {
     return <div className="flex items-center justify-center h-screen bg-nixcon-light dark:bg-nixcon-dark-bg"><p className="text-nixcon-dark dark:text-nixcon-light text-lg">Verificando autenticação...</p></div>;
  }

  if (estaAutenticado) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErro(null);
    setCarregando(true);
    try {
      await login(email, senha); 
      navigate('/');
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Falha no login. Verifique suas credenciais.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-nixcon-light via-gray-100 to-nixcon-gold/30 dark:from-nixcon-dark-bg dark:via-gray-800 dark:to-nixcon-gold/20 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-12 transition-colors duration-300">
      <div className="max-w-lg w-full space-y-8 bg-white dark:bg-nixcon-dark-card p-8 sm:p-12 rounded-xl shadow-2xl">
        <div className="text-center">
          <img
            className="mx-auto h-20 w-auto" 
            src={NIXCON_LOGO_URL}
            alt={`Logo ${NOME_APLICACAO}`}
          />
          <h2 className="mt-6 text-3xl font-bold text-nixcon-charcoal dark:text-nixcon-light"> 
            Acessar sua conta
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Bem-vindo ao {NOME_APLICACAO}
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {erro && (
            <div className="p-4 bg-red-50 dark:bg-red-900 dark:bg-opacity-30 border-l-4 border-red-500 text-red-700 dark:text-red-300 rounded-md shadow-md">
              <h3 className="font-medium">Erro de Autenticação</h3>
              <p className="text-sm">{erro}</p>
            </div>
          )}
          <div className="rounded-md shadow-sm space-y-4"> 
            <div>
              <label htmlFor="email-address" className="sr-only">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <IconeEmail className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                </div>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none relative block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 placeholder-gray-500 dark:placeholder-gray-400 text-nixcon-dark dark:text-nixcon-light rounded-md focus:outline-none focus:ring-2 focus:ring-nixcon-gold/50 focus:border-nixcon-gold sm:text-sm"
                  placeholder="Seu email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            <div className="relative">
              <label htmlFor="password" className="sr-only">
                Senha
              </label>
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <IconeCadeado className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              </div>
              <input
                id="password"
                name="password"
                type={mostrarSenha ? 'text' : 'password'}
                autoComplete="current-password"
                required
                className="appearance-none relative block w-full pl-10 pr-10 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 placeholder-gray-500 dark:placeholder-gray-400 text-nixcon-dark dark:text-nixcon-light rounded-md focus:outline-none focus:ring-2 focus:ring-nixcon-gold/50 focus:border-nixcon-gold sm:text-sm"
                placeholder="Sua senha"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setMostrarSenha(!mostrarSenha)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5 text-gray-500 dark:text-gray-400 hover:text-nixcon-dark dark:hover:text-nixcon-light focus:outline-none"
                aria-label={mostrarSenha ? "Esconder senha" : "Mostrar senha"}
              >
                {mostrarSenha ? <IconeOlhoFechado className="h-5 w-5" /> : <IconeOlho className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-nixcon-gold focus:ring-nixcon-gold border-gray-300 dark:border-gray-600 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-gray-900 dark:text-gray-300">
                Lembrar-me
              </label>
            </div>

            <div>
              <a href="#" className="font-medium text-nixcon-gold hover:text-yellow-600 dark:hover:text-yellow-400">
                Esqueceu sua senha?
              </a>
            </div>
          </div>

          <div>
            <Button type="submit" fullWidth disabled={carregando} variant="primary" size="lg">
              {carregando ? 'Entrando...' : 'Entrar'}
            </Button>
          </div>
        </form>
         <p className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
            Não tem uma conta?{' '}
            <a href="#" className="font-medium text-nixcon-gold hover:text-yellow-600 dark:hover:text-yellow-400">
              Crie uma agora
            </a>
          </p>
      </div>
       <footer className="mt-10 text-center text-sm text-gray-500 dark:text-gray-400">
        <p>&copy; {new Date().getFullYear()} Grupo Nixcon. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
};

export default LoginPage;