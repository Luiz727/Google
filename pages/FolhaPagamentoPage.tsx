
import React, { useState } from 'react';
import Card from '../components/common/Card';
import { IconeFolhaPagamento, IconeConfiguracoes, IconeDocumentos, IconeTarefas } from '../components/common/Icons'; // Adicionei IconeConfiguracoes, IconeDocumentos, IconeTarefas para abas

type AbaFolha = 'painel' | 'colaboradores' | 'lancamentos' | 'processamento' | 'guiasRelatorios' | 'eSocial';

const FolhaPagamentoPage: React.FC = () => {
  const [abaAtiva, setAbaAtiva] = useState<AbaFolha>('painel');

  const abas: { key: AbaFolha; label: string; icone: React.ReactElement }[] = [
    { key: 'painel', label: 'Painel Folha', icone: <IconeFolhaPagamento className="w-5 h-5 mr-2" /> },
    { key: 'colaboradores', label: 'Colaboradores', icone: <IconeTarefas className="w-5 h-5 mr-2" /> }, // Usando IconeTarefas como placeholder
    { key: 'lancamentos', label: 'Eventos/Lançamentos', icone: <IconeDocumentos className="w-5 h-5 mr-2" /> }, // Usando IconeDocumentos como placeholder
    { key: 'processamento', label: 'Processamento', icone: <IconeConfiguracoes className="w-5 h-5 mr-2" /> }, // Usando IconeConfiguracoes como placeholder
    { key: 'guiasRelatorios', label: 'Guias e Relatórios', icone: <IconeFolhaPagamento className="w-5 h-5 mr-2" /> }, // Reutilizando IconeFolhaPagamento
    { key: 'eSocial', label: 'eSocial', icone: <IconeConfiguracoes className="w-5 h-5 mr-2" /> }, // Usando IconeConfiguracoes como placeholder
  ];

  const renderConteudoAba = () => {
    switch (abaAtiva) {
      case 'painel':
        return <Card><p className="text-gray-600 dark:text-gray-400">Resumo e principais indicadores da folha de pagamento. Gráficos, alertas e informações consolidadas.</p></Card>;
      case 'colaboradores':
        return <Card><p className="text-gray-600 dark:text-gray-400">Cadastro e gestão de colaboradores, informações contratuais, dados pessoais, dependentes, histórico funcional, etc.</p></Card>;
      case 'lancamentos':
        return <Card><p className="text-gray-600 dark:text-gray-400">Lançamento de eventos variáveis como horas extras, faltas, comissões, adiantamentos salariais, pensões, etc.</p></Card>;
      case 'processamento':
        return <Card><p className="text-gray-600 dark:text-gray-400">Rotinas de cálculo da folha mensal, adiantamentos, férias, 13º salário e rescisões contratuais.</p></Card>;
      case 'guiasRelatorios':
        return <Card><p className="text-gray-600 dark:text-gray-400">Emissão de guias de recolhimento (INSS, FGTS, IRRF) e diversos relatórios gerenciais e legais (holerites, resumo da folha, RAIS, DIRF).</p></Card>;
      case 'eSocial':
        return (
          <Card className="space-y-4">
            <h2 className="text-xl font-semibold text-nixcon-dark dark:text-nixcon-light">Gestão eSocial</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Esta seção é dedicada à gestão completa dos eventos do eSocial. As funcionalidades incluirão a geração dos leiautes,
              transmissão para o ambiente nacional, acompanhamento de status e tratamento de retornos, tudo em conformidade com
              a documentação técnica oficial do governo.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t dark:border-gray-700">
              <Card title="Eventos Pendentes" className="dark:bg-nixcon-dark-bg">
                <p className="text-sm text-gray-500 dark:text-gray-300">Lista de eventos prontos para transmissão ou com pendências.</p>
                {/* Placeholder para lista de eventos pendentes */}
              </Card>
              <Card title="Eventos Transmitidos" className="dark:bg-nixcon-dark-bg">
                <p className="text-sm text-gray-500 dark:text-gray-300">Histórico e status dos eventos já enviados ao eSocial.</p>
                {/* Placeholder para lista de eventos transmitidos */}
              </Card>
              <Card title="Configurações eSocial" className="md:col-span-2 dark:bg-nixcon-dark-bg">
                <p className="text-sm text-gray-500 dark:text-gray-300">Parâmetros do empregador, certificados digitais e configurações de transmissão.</p>
                {/* Placeholder para formulário de configurações */}
              </Card>
            </div>
          </Card>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <h1 className="text-3xl font-bold text-nixcon-dark dark:text-nixcon-light flex items-center mb-4 sm:mb-0">
          <IconeFolhaPagamento className="w-8 h-8 mr-3 text-nixcon-gold" />
          Módulo Folha de Pagamento
        </h1>
        {/* Botão para adicionar algo específico da folha (ex: Novo Cálculo, Novo Funcionário) pode vir aqui no futuro */}
      </div>

      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-4 overflow-x-auto" aria-label="Tabs">
          {abas.map(tab => (
            <button
              key={tab.key}
              onClick={() => setAbaAtiva(tab.key)}
              className={`flex items-center whitespace-nowrap py-3 px-2 border-b-2 font-medium text-sm transition-colors
                ${abaAtiva === tab.key
                  ? 'border-nixcon-gold text-nixcon-gold'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
            >
              {tab.icone}
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="mt-4">
        {renderConteudoAba()}
      </div>
    </div>
  );
};

export default FolhaPagamentoPage;
