
import React, { useState, useMemo } from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { IconeRelatorios, IconeFinanceiro, IconeTarefas, IconeEstoque, IconeDocumentos, IconeFiscal, IconeChevronEsquerda } from '../components/common/Icons';
import { useAuth } from '../contexts/AuthContext'; // Para contexto futuro

interface ReportCategoryCardProps {
  titulo: string;
  descricao: string;
  icone: React.ReactElement<React.SVGProps<SVGSVGElement>>;
  exemplos: string[];
  corIcone?: string;
  onSelecionarCategoria: (titulo: string) => void;
}

const ReportCategoryCard: React.FC<ReportCategoryCardProps> = ({ titulo, descricao, icone, exemplos, corIcone = "text-nixcon-gold", onSelecionarCategoria }) => (
  <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col dark:bg-nixcon-dark-card">
    <div className="flex items-start mb-3">
      <div className={`p-3 rounded-full bg-opacity-10 ${corIcone.replace('text-', 'bg-')}`}>
        {React.cloneElement(icone, { className: `w-8 h-8 ${corIcone}` })}
      </div>
      <div className="ml-4">
        <h3 className="text-xl font-semibold text-nixcon-dark dark:text-nixcon-light">{titulo}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">{descricao}</p>
      </div>
    </div>
    <div className="mb-4 flex-grow">
      <p className="text-xs text-gray-500 dark:text-gray-300 mb-1 font-medium">Exemplos de relatórios:</p>
      <ul className="list-disc list-inside text-xs text-gray-500 dark:text-gray-400 space-y-0.5">
        {exemplos.map(ex => <li key={ex}>{ex}</li>)}
      </ul>
    </div>
    <Button 
      variant="secondary" 
      size="sm" 
      className="mt-auto w-full dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-nixcon-light"
      onClick={() => onSelecionarCategoria(titulo)}
    >
      Ver Relatórios de {titulo}
    </Button>
  </Card>
);

interface RelatorioMock {
    id: string;
    nome: string;
    dataGeracao: string;
    categoria: string; // Para filtragem
    linkVisualizacaoMock?: string; // Futuro
}

const todosRelatoriosMock: RelatorioMock[] = [
    // Financeiro
    { id: 'fin001', nome: 'Balanço Patrimonial Consolidado - 2023', dataGeracao: '2024-01-15', categoria: 'Financeiro' },
    { id: 'fin002', nome: 'Demonstração do Resultado (DRE) - T1/2024', dataGeracao: '2024-04-05', categoria: 'Financeiro' },
    { id: 'fin003', nome: 'Fluxo de Caixa Realizado - Jun/2024', dataGeracao: '2024-07-01', categoria: 'Financeiro' },
    { id: 'fin004', nome: 'Contas a Pagar Detalhado - Venc. Julho', dataGeracao: '2024-07-10', categoria: 'Financeiro' },
    { id: 'fin005', nome: 'Extrato de Boletos Emitidos - Mês Atual', dataGeracao: '2024-07-17', categoria: 'Financeiro' },
    // Vendas
    { id: 'ven001', nome: 'Ranking de Vendas por Vendedor - T2/2024', dataGeracao: '2024-07-02', categoria: 'Vendas' },
    { id: 'ven002', nome: 'Ticket Médio por Cliente - Semestre 1', dataGeracao: '2024-07-05', categoria: 'Vendas' },
    // Produtos
    { id: 'prd001', nome: 'Curva ABC de Produtos - 2023', dataGeracao: '2024-01-20', categoria: 'Produtos' },
    { id: 'prd002', nome: 'Lucratividade por Linha de Produto - T2/2024', dataGeracao: '2024-07-03', categoria: 'Produtos' },
    // Estoque
    { id: 'est001', nome: 'Posição de Estoque Atual (Completo)', dataGeracao: '2024-07-17', categoria: 'Estoque' },
    { id: 'est002', nome: 'Relatório de Itens com Estoque Baixo', dataGeracao: '2024-07-16', categoria: 'Estoque' },
    // Fiscal
    { id: 'fis001', nome: 'Apuração Simples Nacional - Jun/2024', dataGeracao: '2024-07-05', categoria: 'Fiscal' },
    { id: 'fis002', nome: 'Livro de Saídas - Jun/2024', dataGeracao: '2024-07-10', categoria: 'Fiscal' },
    // Produtividade
    { id: 'pro001', nome: 'Relatório de Horas por Projeto - Mês Anterior', dataGeracao: '2024-07-01', categoria: 'Produtividade' },
    { id: 'pro002', nome: 'Tarefas Concluídas vs. Pendentes por Equipe', dataGeracao: '2024-07-15', categoria: 'Produtividade' },
];


const RelatoriosPage: React.FC = () => {
  const { usuarioAtual, tenantAtual } = useAuth(); // Para contexto futuro
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<string | null>(null);
  const [relatoriosMockFiltrados, setRelatoriosMockFiltrados] = useState<RelatorioMock[]>([]);

  const reportCategories = [
    {
      titulo: "Financeiro",
      descricao: "Análises sobre pagamentos, recebimentos, DRE, Balanço Patrimonial, Balancete e fluxo de caixa.",
      icone: <IconeFinanceiro />,
      corIcone: "text-blue-500 dark:text-blue-400",
      exemplos: ["Contas a Pagar/Receber", "DRE Gerencial", "Balanço Patrimonial", "Fluxo de Caixa Projetado"]
    },
    {
      titulo: "Vendas",
      descricao: "Métricas sobre desempenho de vendas, vendedores e clientes.",
      icone: <IconeTarefas />, 
      corIcone: "text-green-500 dark:text-green-400",
      exemplos: ["Vendas por Vendedor", "Ticket Médio", "Curva ABC de Clientes"]
    },
    {
      titulo: "Produtos",
      descricao: "Informações sobre o desempenho e lucratividade dos produtos.",
      icone: <IconeDocumentos />, 
      corIcone: "text-purple-500 dark:text-purple-400",
      exemplos: ["Curva ABC de Itens Vendidos", "Lucratividade por Produto"]
    },
    {
      titulo: "Estoque",
      descricao: "Controle e análise do inventário, movimentações e custos.",
      icone: <IconeEstoque />,
      corIcone: "text-orange-500 dark:text-orange-400",
      exemplos: ["Kardex do Produto", "Itens com Estoque Baixo"]
    },
    {
      titulo: "Fiscal",
      descricao: "Relatórios para conformidade e análise das obrigações fiscais.",
      icone: <IconeFiscal />,
      corIcone: "text-red-500 dark:text-red-400",
      exemplos: ["Livro de Entradas/Saídas", "Apuração de Impostos"]
    },
     {
      titulo: "Produtividade",
      descricao: "Análises sobre o desempenho da equipe e conclusão de tarefas.",
      icone: <IconeRelatorios />, 
      corIcone: "text-teal-500 dark:text-teal-400",
      exemplos: ["Tarefas por Responsável", "Tempo Médio por Tarefa"]
    }
  ];

  const handleSelecionarCategoria = (tituloCategoria: string) => {
    setCategoriaSelecionada(tituloCategoria);
    const relatoriosDaCategoria = todosRelatoriosMock.filter(
      rel => rel.categoria.toLowerCase() === tituloCategoria.toLowerCase()
    );
    setRelatoriosMockFiltrados(relatoriosDaCategoria);
  };

  const handleVoltarParaCategorias = () => {
    setCategoriaSelecionada(null);
    setRelatoriosMockFiltrados([]);
  };

  const formatarData = (isoString?: string) => {
    if (!isoString) return '-';
    // Ajuste para garantir que a data seja interpretada corretamente, independentemente do fuso horário do navegador
    const data = new Date(isoString.includes('T') ? isoString : `${isoString}T00:00:00`);
    return new Intl.DateTimeFormat('pt-BR').format(data);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-nixcon-dark dark:text-nixcon-light flex items-center">
          <IconeRelatorios className="w-8 h-8 mr-3 text-nixcon-gold" />
          {categoriaSelecionada ? `Relatórios de ${categoriaSelecionada}` : "Central de Relatórios"}
        </h1>
        {categoriaSelecionada && (
          <Button onClick={handleVoltarParaCategorias} variant="ghost" size="sm" leftIcon={<IconeChevronEsquerda className="w-4 h-4"/>}>
            Voltar para Categorias
          </Button>
        )}
      </div>

      {!categoriaSelecionada ? (
        <>
          <p className="text-gray-600 dark:text-gray-400">
            Acesse uma variedade de relatórios para analisar o desempenho e obter insights valiosos sobre as operações do seu escritório e de seus clientes.
          </p>
          <Card className="shadow-md bg-nixcon-gold bg-opacity-10 border border-nixcon-gold dark:bg-nixcon-gold dark:bg-opacity-20 dark:border-yellow-700">
            <h2 className="text-lg font-semibold text-nixcon-dark dark:text-nixcon-light mb-2">Identidade Visual Personalizada</h2>
            <p className="text-sm text-gray-700 dark:text-gray-300">
                Todos os relatórios podem ser exportados em formatos como PDF e Excel, com a opção de incluir a identidade visual do seu escritório contábil (logo, cores), proporcionando uma apresentação profissional aos seus clientes.
            </p>
          </Card>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reportCategories.map((category) => (
              <ReportCategoryCard
                key={category.titulo}
                titulo={category.titulo}
                descricao={category.descricao}
                icone={category.icone}
                exemplos={category.exemplos}
                corIcone={category.corIcone}
                onSelecionarCategoria={handleSelecionarCategoria}
              />
            ))}
          </div>
        </>
      ) : (
        <Card className="shadow-lg dark:bg-nixcon-dark-card">
          <h2 className="text-xl font-semibold text-nixcon-dark dark:text-nixcon-light mb-4">Lista de Relatórios Disponíveis</h2>
          {relatoriosMockFiltrados.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nome do Relatório</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Data de Geração</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-nixcon-dark-card divide-y divide-gray-200 dark:divide-gray-700">
                  {relatoriosMockFiltrados.map(rel => (
                    <tr key={rel.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-nixcon-dark dark:text-nixcon-light">{rel.nome}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{formatarData(rel.dataGeracao)}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm space-x-2">
                        <Button variant="secondary" size="sm" onClick={() => alert(`Visualizando (PDF Mock): ${rel.nome}`)}>Visualizar (PDF)</Button>
                        <Button variant="ghost" size="sm" onClick={() => alert(`Exportando (Excel Mock): ${rel.nome}`)}>Exportar (Excel)</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">Nenhum relatório disponível para esta categoria no momento.</p>
          )}
        </Card>
      )}

      <p className="text-center text-gray-500 dark:text-gray-400 mt-8">
        Esta é a página central de Relatórios. A funcionalidade de geração real e filtros avançados será implementada.
      </p>
    </div>
  );
};

export default RelatoriosPage;
