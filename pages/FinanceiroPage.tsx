
import React, { useState, useEffect, useMemo, FormEvent } from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal'; // Import Modal
import { IconeFinanceiro } from '../components/common/Icons';
import { useAuth } from '../contexts/AuthContext';
import { ContaPagar, ContaReceber, FuncaoUsuario, StatusContaPagar, StatusContaReceber, Empresa } from '../types';
// Fix: Ensure this import works if EmpresasPage.tsx exports STORAGE_KEY_PREFIX
import { STORAGE_KEY_PREFIX as STORAGE_KEY_PREFIX_EMPRESAS_CLIENTES } from './EmpresasPage';


// Chaves do localStorage para Contas a Pagar e Receber
export const STORAGE_KEY_CONTAS_PAGAR_PREFIX = 'nixconPortalContasPagar_';
export const STORAGE_KEY_CONTAS_RECEBER_PREFIX = 'nixconPortalContasReceber_';

const formatCurrency = (value: number | undefined | null) => {
  if (typeof value !== 'number' || isNaN(value)) return 'R$ 0,00';
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

interface DadosDREReport {
  receitaBruta: number;
  deducoesReceita: number;
  receitaLiquida: number;
  cmvCsv: number;
  lucroBruto: number;
  despesasOperacionais: number;
  lucroOperacional: number;
  resultadoFinanceiro: number;
  lair: number;
  irpjCsll: number;
  lucroLiquido: number;
}

interface DadosBalancoReport {
  caixa: number;
  contasAReceberBP: number;
  estoquesBP: number;
  ativoCirculante: number;
  imobilizadoBP: number;
  ativoNaoCirculante: number;
  totalAtivo: number;
  fornecedoresBP: number;
  emprestimosCurtoPrazoBP: number;
  obrigacoesFiscaisBP: number;
  passivoCirculante: number;
  passivoNaoCirculante: number;
  capitalSocial: number;
  lucrosAcumulados: number;
  patrimonioLiquido: number;
  totalPassivoPL: number;
}

interface ConfigBoletoForm {
  bancoEmissor: string;
  carteira: string;
  nossoNumero: string;
  dataVencimentoBoleto: string;
  instrucaoLinha1: string;
  instrucaoLinha2: string;
  diasProtesto?: number;
}


const FinanceiroPage: React.FC = () => {
  const { usuarioAtual, tenantAtual, personificandoInfo, activeClientCompanyContext } = useAuth();

  const [contasPagar, setContasPagar] = useState<ContaPagar[]>([]);
  const [contasReceber, setContasReceber] = useState<ContaReceber[]>([]);
  const [fluxoCaixaGeral, setFluxoCaixaGeral] = useState<{
    totalEntradas: number;
    totalSaidas: number;
    saldo: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Estados para os modais de relatório
  const [modalDREVisivel, setModalDREVisivel] = useState(false);
  const [modalBalancoVisivel, setModalBalancoVisivel] = useState(false);
  const [dadosDRE, setDadosDRE] = useState<DadosDREReport | null>(null);
  const [dadosBalanco, setDadosBalanco] = useState<DadosBalancoReport | null>(null);

  // Estados para modal de boleto
  const [modalBoletoVisivel, setModalBoletoVisivel] = useState(false);
  const [contaParaGerarBoleto, setContaParaGerarBoleto] = useState<ContaReceber | null>(null);
  const [configBoletoForm, setConfigBoletoForm] = useState<ConfigBoletoForm>({
    bancoEmissor: '', carteira: '', nossoNumero: '', dataVencimentoBoleto: '', instrucaoLinha1: '', instrucaoLinha2: ''
  });


  const effectiveTenantId = useMemo(() => {
    if (personificandoInfo) return personificandoInfo.empresaId;
    if (usuarioAtual?.funcao === FuncaoUsuario.USUARIO_EXTERNO_CLIENTE && usuarioAtual.tenantId) {
      return usuarioAtual.tenantId;
    }
    if (activeClientCompanyContext && (usuarioAtual?.funcao === FuncaoUsuario.ADMIN_ESCRITORIO || usuarioAtual?.funcao === FuncaoUsuario.SUPERADMIN)) {
      return activeClientCompanyContext.id;
    }
    return usuarioAtual?.tenantId || tenantAtual?.id;
  }, [personificandoInfo, usuarioAtual, tenantAtual, activeClientCompanyContext]);

  const getTenantEscritorioId = (): string | undefined => {
    if (usuarioAtual?.funcao === FuncaoUsuario.ADMIN_ESCRITORIO || usuarioAtual?.funcao === FuncaoUsuario.SUPERADMIN) return tenantAtual?.id;
    // Para AdminCliente ou UsuarioCliente, tenantAtual é o escritório ao qual eles pertencem (via personificação ou acesso direto).
    // Para UsuarioExternoCliente, tenantAtual é o escritório que gerencia a empresa dele.
    return tenantAtual?.id; // Assumindo que tenantAtual sempre se refere ao tenant do escritório quando relevante.
  };
  const tenantEscritorioId = useMemo(getTenantEscritorioId, [tenantAtual, usuarioAtual]);


  const getActiveContextName = (): string => {
    if (personificandoInfo) return personificandoInfo.empresaNome;
    if (activeClientCompanyContext) return activeClientCompanyContext.nome;
    if (usuarioAtual?.funcao === FuncaoUsuario.USUARIO_EXTERNO_CLIENTE && usuarioAtual.tenantId) {
        // Busca o nome da empresa do usuário externo no localStorage do escritório.
        const storageKeyEmpresas = `${STORAGE_KEY_PREFIX_EMPRESAS_CLIENTES}${tenantEscritorioId}`;
        const empresasSalvas = localStorage.getItem(storageKeyEmpresas);
        if (empresasSalvas) {
            const empresasDoEscritorio: Empresa[] = JSON.parse(empresasSalvas);
            const empresaAtiva = empresasDoEscritorio.find(emp => emp.id === usuarioAtual.tenantId);
            return empresaAtiva?.nome || 'Empresa Ativa';
        }
        return 'Empresa Ativa';
    }
    return tenantAtual?.nome || 'Contexto Atual';
  };
  const activeContextName = useMemo(getActiveContextName, [personificandoInfo, activeClientCompanyContext, usuarioAtual, tenantAtual, tenantEscritorioId]);


  useEffect(() => {
    if (effectiveTenantId) {
      setIsLoading(true);
      const storageKeyPagar = `${STORAGE_KEY_CONTAS_PAGAR_PREFIX}${effectiveTenantId}`;
      const contasPagarSalvas = localStorage.getItem(storageKeyPagar);
      setContasPagar(contasPagarSalvas ? JSON.parse(contasPagarSalvas) : []);

      const storageKeyReceber = `${STORAGE_KEY_CONTAS_RECEBER_PREFIX}${effectiveTenantId}`;
      const contasReceberSalvas = localStorage.getItem(storageKeyReceber);
      setContasReceber(contasReceberSalvas ? JSON.parse(contasReceberSalvas) : []);
      
      setIsLoading(false);
    } else {
      setContasPagar([]);
      setContasReceber([]);
      setIsLoading(false);
    }
  }, [effectiveTenantId]);

  useEffect(() => {
    const totalEntradas = contasReceber
      .filter(cr => cr.status === 'RECEBIDA')
      .reduce((sum, cr) => sum + cr.valor, 0);

    const totalSaidas = contasPagar
      .filter(cp => cp.status === 'PAGA')
      .reduce((sum, cp) => sum + cp.valor, 0);

    setFluxoCaixaGeral({
      totalEntradas,
      totalSaidas,
      saldo: totalEntradas - totalSaidas,
    });
  }, [contasPagar, contasReceber]);

  useEffect(() => { // Para salvar contas a receber quando elas mudam
    if (effectiveTenantId && contasReceber.length >= 0) {
      const storageKeyReceber = `${STORAGE_KEY_CONTAS_RECEBER_PREFIX}${effectiveTenantId}`;
      localStorage.setItem(storageKeyReceber, JSON.stringify(contasReceber));
    }
  }, [contasReceber, effectiveTenantId]);

  const formatData = (isoDate?: string) => {
    if (!isoDate) return '-';
    const date = new Date(isoDate.includes('T') ? isoDate : `${isoDate}T00:00:00Z`);
    return date.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  };

  const calcularDRESimulada = () => {
    const receitaBruta = contasReceber.filter(cr => cr.status === 'RECEBIDA').reduce((sum, cr) => sum + cr.valor, 0) || 100000; // Default se 0
    const deducoesReceita = receitaBruta * 0.10;
    const receitaLiquida = receitaBruta - deducoesReceita;
    const cmvCsv = receitaLiquida * 0.40;
    const lucroBruto = receitaLiquida - cmvCsv;
    const despesasPagas = contasPagar.filter(cp => cp.status === 'PAGA').reduce((sum, cp) => sum + cp.valor, 0);
    const despesasOperacionais = despesasPagas > 0 ? despesasPagas : lucroBruto * 0.20; // Usa contas pagas ou 20% do lucro bruto
    const lucroOperacional = lucroBruto - despesasOperacionais;
    const resultadoFinanceiro = lucroOperacional * 0.02; // Mock de resultado financeiro pequeno
    const lair = lucroOperacional + resultadoFinanceiro;
    const irpjCsll = lair > 0 ? lair * 0.15 : 0;
    const lucroLiquido = lair - irpjCsll;

    setDadosDRE({
      receitaBruta, deducoesReceita, receitaLiquida, cmvCsv, lucroBruto,
      despesasOperacionais, lucroOperacional, resultadoFinanceiro, lair, irpjCsll, lucroLiquido
    });
    setModalDREVisivel(true);
  };

  const calcularBalancoSimulado = () => {
    const caixa = Math.max(fluxoCaixaGeral?.saldo || 0, 5000); // Saldo ou um mínimo
    const contasAReceberBP = contasReceber.filter(cr => cr.status === 'A_RECEBER').reduce((sum, cr) => sum + cr.valor, 0);
    const estoquesBP = (caixa + contasAReceberBP) * 0.20; // Mock
    const ativoCirculante = caixa + contasAReceberBP + estoquesBP;
    const imobilizadoBP = ativoCirculante * 0.5; // Mock
    const ativoNaoCirculante = imobilizadoBP;
    const totalAtivo = ativoCirculante + ativoNaoCirculante;

    const fornecedoresBP = contasPagar.filter(cp => cp.status === 'PENDENTE' || cp.status === 'ATRASADA').reduce((sum, cp) => sum + cp.valor, 0);
    const emprestimosCurtoPrazoBP = fornecedoresBP * 0.15; // Mock
    const obrigacoesFiscaisBP = fornecedoresBP * 0.10; // Mock
    const passivoCirculante = fornecedoresBP + emprestimosCurtoPrazoBP + obrigacoesFiscaisBP;
    const passivoNaoCirculante = passivoCirculante * 0.25; // Mock
    
    const patrimonioLiquido = totalAtivo - (passivoCirculante + passivoNaoCirculante);
    const capitalSocial = patrimonioLiquido * 0.6; // Mock
    const lucrosAcumulados = patrimonioLiquido - capitalSocial;
    const totalPassivoPL = passivoCirculante + passivoNaoCirculante + patrimonioLiquido;

    setDadosBalanco({
      caixa, contasAReceberBP, estoquesBP, ativoCirculante, imobilizadoBP, ativoNaoCirculante, totalAtivo,
      fornecedoresBP, emprestimosCurtoPrazoBP, obrigacoesFiscaisBP, passivoCirculante, passivoNaoCirculante,
      capitalSocial, lucrosAcumulados, patrimonioLiquido, totalPassivoPL
    });
    setModalBalancoVisivel(true);
  };

  const handleAbrirModalBoleto = (conta: ContaReceber) => {
    setContaParaGerarBoleto(conta);
    setConfigBoletoForm({
      bancoEmissor: 'BancoDoBrasil', // Default
      carteira: '17', // Default
      nossoNumero: `NN-${conta.id.slice(-4)}-${Date.now().toString().slice(-3)}`,
      dataVencimentoBoleto: conta.dataVencimento.split('T')[0],
      instrucaoLinha1: 'Não receber após o vencimento.',
      instrucaoLinha2: `Multa de 2% após venc. Juros de 1% a.m.`,
      diasProtesto: undefined,
    });
    setModalBoletoVisivel(true);
  };

  const handleGerarBoletoSimulado = (e: FormEvent) => {
    e.preventDefault();
    if (!contaParaGerarBoleto) return;

    alert(`Boleto gerado com sucesso (simulado)! Nosso Número: ${configBoletoForm.nossoNumero}. Banco: ${configBoletoForm.bancoEmissor}`);
    
    setContasReceber(prevContas => 
      prevContas.map(cr => 
        cr.id === contaParaGerarBoleto.id 
        ? { ...cr, status: 'BOLETO_GERADO' as StatusContaReceber, nossoNumeroBoleto: configBoletoForm.nossoNumero } 
        : cr
      )
    );
    // O useEffect de contasReceber já cuida de salvar no localStorage.

    // Simular envio por email
    if (contaParaGerarBoleto.clienteNome) { // Idealmente, teríamos o email do cliente.
      alert(`Boleto enviado por email para ${contaParaGerarBoleto.clienteNome} (simulado).`);
    }
    setModalBoletoVisivel(false);
  };

  const getStatusContaReceberClass = (status: StatusContaReceber) => {
    switch (status) {
      case 'A_RECEBER': return 'bg-blue-100 text-blue-800 dark:bg-blue-700 dark:text-blue-100';
      case 'RECEBIDA': return 'bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100';
      case 'ATRASADA': return 'bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-100';
      case 'BOLETO_GERADO': return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-700 dark:text-cyan-100';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-300';
    }
  };
  
  const inputClasses = "mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-nixcon-gold focus:border-nixcon-gold sm:text-sm";
  const selectClasses = `${inputClasses} bg-white dark:bg-gray-700`;


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-nixcon-dark dark:text-nixcon-light flex items-center">
          <IconeFinanceiro className="w-8 h-8 mr-3 text-nixcon-gold" />
          Controle Financeiro <span className="text-lg text-gray-500 dark:text-gray-400 ml-2">({activeContextName})</span>
        </h1>
        <Button onClick={() => alert("Abrir modal de nova transação (a implementar)")}>Nova Transação</Button>
      </div>

      <Card className="shadow-lg">
        <h2 className="text-xl font-semibold text-nixcon-dark dark:text-nixcon-light mb-4">Resumo do Fluxo de Caixa Geral</h2>
        {isLoading ? (
          <p className="text-gray-500 dark:text-gray-400">Carregando dados do fluxo de caixa...</p>
        ) : fluxoCaixaGeral ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Recebido (Geral)</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{formatCurrency(fluxoCaixaGeral.totalEntradas)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Pago (Geral)</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">{formatCurrency(fluxoCaixaGeral.totalSaidas)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Saldo Atual (Geral)</p>
              <p className={`text-2xl font-bold ${fluxoCaixaGeral.saldo >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}>
                {formatCurrency(fluxoCaixaGeral.saldo)}
              </p>
            </div>
          </div>
        ) : (
           <p className="text-gray-500 dark:text-gray-400">Não foi possível calcular o fluxo de caixa.</p>
        )}
      </Card>
      
      <Card className="shadow-lg">
        <h2 className="text-xl font-semibold text-nixcon-dark dark:text-nixcon-light mb-4">Gráfico de Fluxo de Caixa</h2>
        <div className="h-64 bg-gray-100 dark:bg-gray-700 flex items-center justify-center rounded-md border border-gray-200 dark:border-gray-600">
          <p className="text-gray-400 dark:text-gray-500 text-lg">Gráfico de Fluxo de Caixa (Ex: Recharts) - A implementar</p>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-lg">
          <h2 className="text-xl font-semibold text-nixcon-dark dark:text-nixcon-light mb-4">Contas a Pagar Recentes</h2>
          {isLoading ? ( <p>Carregando...</p> ) : contasPagar.length > 0 ? (
            <ul className="space-y-3 max-h-60 overflow-y-auto">
              {contasPagar.slice(0, 5).map(conta => (
                <li key={conta.id} className="p-3 bg-nixcon-light dark:bg-gray-700 rounded-md shadow-sm border border-gray-200 dark:border-gray-600">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-nixcon-charcoal dark:text-nixcon-light">{conta.descricao}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Venc: {formatData(conta.dataVencimento)} - Valor: {formatCurrency(conta.valor)}</p>
                    </div>
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                      conta.status === 'PENDENTE' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-100' : 
                      conta.status === 'PAGA' ? 'bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100' :
                      conta.status === 'ATRASADA' ? 'bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-100' :
                      'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-300'
                    }`}>
                      {conta.status.replace('_', ' ')}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">Nenhuma conta a pagar registrada para este contexto.</p>
          )}
           <Button variant="ghost" size="sm" className="mt-4">Ver Todas Contas a Pagar</Button>
        </Card>

        <Card className="shadow-lg">
          <h2 className="text-xl font-semibold text-nixcon-dark dark:text-nixcon-light mb-4">Contas a Receber Recentes</h2>
           {isLoading ? ( <p>Carregando...</p> ) : contasReceber.length > 0 ? (
            <ul className="space-y-3 max-h-60 overflow-y-auto">
              {contasReceber.slice(0, 5).map(conta => (
                <li key={conta.id} className="p-3 bg-nixcon-light dark:bg-gray-700 rounded-md shadow-sm border border-gray-200 dark:border-gray-600">
                  <div className="flex justify-between items-start">
                    <div className="flex-grow">
                      <p className="font-medium text-nixcon-charcoal dark:text-nixcon-light">{conta.descricao}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Venc: {formatData(conta.dataVencimento)} - Valor: {formatCurrency(conta.valor)}</p>
                    </div>
                     <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getStatusContaReceberClass(conta.status)} ml-2 flex-shrink-0`}>
                      {conta.status.replace('_', ' ')}
                    </span>
                  </div>
                  {(conta.status === 'A_RECEBER' || conta.status === 'ATRASADA') && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleAbrirModalBoleto(conta)} 
                      className="mt-2 text-nixcon-gold text-xs"
                    >
                      Gerar Boleto
                    </Button>
                  )}
                  {conta.status === 'BOLETO_GERADO' && conta.nossoNumeroBoleto && (
                    <p className="text-xs text-cyan-700 dark:text-cyan-300 mt-1">Nosso Nº: {conta.nossoNumeroBoleto}</p>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">Nenhuma conta a receber registrada para este contexto.</p>
          )}
          <Button variant="ghost" size="sm" className="mt-4">Ver Todas Contas a Receber</Button>
        </Card>
      </div>
      
      <Card className="shadow-lg">
        <h2 className="text-xl font-semibold text-nixcon-dark dark:text-nixcon-light mb-4">Outras Funcionalidades Financeiras</h2>
        <div className="flex flex-wrap gap-2">
            <Button onClick={calcularDRESimulada} variant="secondary">DRE Gerencial (Simulado)</Button>
            <Button onClick={calcularBalancoSimulado} variant="secondary">Balanço Patrimonial (Simulado)</Button>
            {/* O botão de emissão de boletos foi movido para a lista de Contas a Receber */}
        </div>
         <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-1 mt-4">
            <li>Integração Bancária (Importação OFX/CNAB) - A implementar</li>
            <li>Dashboard Financeiro Detalhado - A implementar</li>
            <li>Conciliação Bancária - A implementar</li>
        </ul>
      </Card>

       {/* Modal DRE */}
      {modalDREVisivel && dadosDRE && (
        <Modal isOpen={modalDREVisivel} onClose={() => setModalDREVisivel(false)} title={`DRE Gerencial (Simulada) - ${activeContextName}`}>
          <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
            <DREItem label="Receita Operacional Bruta" value={dadosDRE.receitaBruta} />
            <DREItem label="(-) Deduções da Receita (Impostos)" value={dadosDRE.deducoesReceita} isDeduction />
            <DREItem label="(=) Receita Operacional Líquida" value={dadosDRE.receitaLiquida} isSubtotal />
            <DREItem label="(-) CMV/CSV" value={dadosDRE.cmvCsv} isDeduction />
            <DREItem label="(=) Lucro Bruto" value={dadosDRE.lucroBruto} isSubtotal />
            <DREItem label="(-) Despesas Operacionais" value={dadosDRE.despesasOperacionais} isDeduction />
            <DREItem label="(=) Lucro Operacional (EBIT)" value={dadosDRE.lucroOperacional} isSubtotal />
            <DREItem label="(+/-) Resultado Financeiro" value={dadosDRE.resultadoFinanceiro} isNeutral={dadosDRE.resultadoFinanceiro === 0} isPositive={dadosDRE.resultadoFinanceiro > 0} isNegative={dadosDRE.resultadoFinanceiro < 0}/>
            <DREItem label="(=) Lucro Antes IRPJ/CSLL (LAIR)" value={dadosDRE.lair} isSubtotal />
            <DREItem label="(-) Provisão IRPJ/CSLL" value={dadosDRE.irpjCsll} isDeduction />
            <DREItem label="(=) Lucro Líquido do Exercício" value={dadosDRE.lucroLiquido} isTotal />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 text-center">Valores calculados de forma simulada para demonstração.</p>
          </div>
        </Modal>
      )}

      {/* Modal Balanço Patrimonial */}
      {modalBalancoVisivel && dadosBalanco && (
        <Modal isOpen={modalBalancoVisivel} onClose={() => setModalBalancoVisivel(false)} title={`Balanço Patrimonial (Simulado) - ${activeContextName}`}>
          <div className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
            <BalancoSection title="ATIVO">
              <BalancoSubSection title="Ativo Circulante" total={dadosBalanco.ativoCirculante}>
                <BalancoItem label="Caixa e Equivalentes" value={dadosBalanco.caixa} />
                <BalancoItem label="Contas a Receber" value={dadosBalanco.contasAReceberBP} />
                <BalancoItem label="Estoques" value={dadosBalanco.estoquesBP} />
              </BalancoSubSection>
              <BalancoSubSection title="Ativo Não Circulante" total={dadosBalanco.ativoNaoCirculante}>
                <BalancoItem label="Imobilizado" value={dadosBalanco.imobilizadoBP} />
              </BalancoSubSection>
              <BalancoTotalItem label="TOTAL DO ATIVO" value={dadosBalanco.totalAtivo} />
            </BalancoSection>

            <BalancoSection title="PASSIVO E PATRIMÔNIO LÍQUIDO">
              <BalancoSubSection title="Passivo Circulante" total={dadosBalanco.passivoCirculante}>
                <BalancoItem label="Fornecedores" value={dadosBalanco.fornecedoresBP} />
                <BalancoItem label="Empréstimos Curto Prazo" value={dadosBalanco.emprestimosCurtoPrazoBP} />
                <BalancoItem label="Obrigações Fiscais" value={dadosBalanco.obrigacoesFiscaisBP} />
              </BalancoSubSection>
              <BalancoSubSection title="Passivo Não Circulante" total={dadosBalanco.passivoNaoCirculante}>
                 {/* Adicionar itens se houver, por enquanto apenas o total */}
              </BalancoSubSection>
              <BalancoSubSection title="Patrimônio Líquido" total={dadosBalanco.patrimonioLiquido}>
                <BalancoItem label="Capital Social" value={dadosBalanco.capitalSocial} />
                <BalancoItem label="Lucros/Prejuízos Acumulados" value={dadosBalanco.lucrosAcumulados} />
              </BalancoSubSection>
              <BalancoTotalItem label="TOTAL PASSIVO + PL" value={dadosBalanco.totalPassivoPL} />
            </BalancoSection>
             <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 text-center">Valores calculados de forma simulada para demonstração.</p>
          </div>
        </Modal>
      )}

      {/* Modal Gerar Boleto */}
      {modalBoletoVisivel && contaParaGerarBoleto && (
        <Modal isOpen={modalBoletoVisivel} onClose={() => setModalBoletoVisivel(false)} title={`Gerar Boleto para: ${contaParaGerarBoleto.descricao}`}>
          <form onSubmit={handleGerarBoletoSimulado} className="space-y-3 text-sm">
            <div>
              <label htmlFor="bancoEmissor" className="block font-medium text-gray-700 dark:text-gray-300">Banco Emissor</label>
              <select id="bancoEmissor" value={configBoletoForm.bancoEmissor} onChange={e => setConfigBoletoForm(p => ({...p, bancoEmissor: e.target.value}))} className={selectClasses}>
                <option value="BancoDoBrasil">Banco do Brasil</option>
                <option value="Itau">Itaú</option>
                <option value="Bradesco">Bradesco</option>
                <option value="Santander">Santander</option>
                <option value="Inter">Inter</option>
                <option value="Sicoob">Sicoob</option>
                <option value="Sicredi">Sicredi</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div><label className="block font-medium text-gray-700 dark:text-gray-300">Carteira</label><input type="text" value={configBoletoForm.carteira} onChange={e => setConfigBoletoForm(p => ({...p, carteira: e.target.value}))} className={inputClasses}/></div>
                <div><label className="block font-medium text-gray-700 dark:text-gray-300">Nosso Número</label><input type="text" value={configBoletoForm.nossoNumero} onChange={e => setConfigBoletoForm(p => ({...p, nossoNumero: e.target.value}))} className={inputClasses}/></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div><label className="block font-medium text-gray-700 dark:text-gray-300">Vencimento Boleto</label><input type="date" value={configBoletoForm.dataVencimentoBoleto} onChange={e => setConfigBoletoForm(p => ({...p, dataVencimentoBoleto: e.target.value}))} className={inputClasses}/></div>
                <div><label className="block font-medium text-gray-700 dark:text-gray-300">Valor Boleto</label><input type="text" value={formatCurrency(contaParaGerarBoleto.valor)} readOnly className={`${inputClasses} bg-gray-100 dark:bg-gray-600`}/></div>
            </div>
             <div><label className="block font-medium text-gray-700 dark:text-gray-300">Instrução Linha 1</label><input type="text" value={configBoletoForm.instrucaoLinha1} onChange={e => setConfigBoletoForm(p => ({...p, instrucaoLinha1: e.target.value}))} className={inputClasses}/></div>
             <div><label className="block font-medium text-gray-700 dark:text-gray-300">Instrução Linha 2</label><input type="text" value={configBoletoForm.instrucaoLinha2} onChange={e => setConfigBoletoForm(p => ({...p, instrucaoLinha2: e.target.value}))} className={inputClasses}/></div>
             <div><label className="block font-medium text-gray-700 dark:text-gray-300">Dias para Protesto (opcional)</label><input type="number" min="0" value={configBoletoForm.diasProtesto || ''} onChange={e => setConfigBoletoForm(p => ({...p, diasProtesto: e.target.value ? parseInt(e.target.value) : undefined}))} className={inputClasses}/></div>
             <div className="mt-4 pt-3 border-t dark:border-gray-600 text-right space-x-2">
                <Button type="button" variant="secondary" onClick={() => setModalBoletoVisivel(false)}>Cancelar</Button>
                <Button type="submit">Gerar e Simular Envio</Button>
             </div>
          </form>
        </Modal>
      )}


      <p className="text-center text-gray-500 dark:text-gray-400">
        As funcionalidades de CRUD para transações, relatórios detalhados, e integrações serão implementadas.
      </p>
    </div>
  );
};


// Componentes Auxiliares para Modais de Relatório
const DREItem: React.FC<{ label: string; value: number | null; isSubtotal?: boolean; isTotal?: boolean; isDeduction?: boolean; isPositive?: boolean; isNegative?: boolean; isNeutral?: boolean }> = 
({ label, value, isSubtotal, isTotal, isDeduction, isPositive, isNegative, isNeutral }) => (
  <div className={`flex justify-between py-0.5 ${isSubtotal || isTotal ? 'border-t border-gray-300 dark:border-gray-600 mt-0.5 pt-0.5' : ''} ${isTotal ? 'font-bold text-lg' : ''}`}>
    <span className={`${isSubtotal || isTotal ? 'font-semibold' : ''} ${isDeduction ? 'pl-2' : ''}`}>{label}</span>
    <span className={`
        ${isTotal ? 'font-bold' : 'font-medium'}
        ${isPositive ? 'text-green-600 dark:text-green-400' : ''}
        ${isNegative || isDeduction ? 'text-red-600 dark:text-red-400' : ''}
        ${isNeutral && !isDeduction ? 'text-gray-700 dark:text-gray-300' : ''}
    `}>
      {isDeduction && value && value > 0 ? `(${formatCurrency(value)})` : formatCurrency(value)}
    </span>
  </div>
);

const BalancoSection: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
  <div className="mb-2">
    <h4 className="font-bold text-md mb-1 text-nixcon-dark dark:text-nixcon-light">{title}</h4>
    <div className="space-y-0.5">{children}</div>
  </div>
);

// Fix: Make children optional in BalancoSubSectionProps
const BalancoSubSection: React.FC<{ title: string, total?: number, children?: React.ReactNode }> = ({ title, total, children }) => (
  <div className="pl-2 mb-1">
    <div className="flex justify-between font-semibold text-gray-800 dark:text-gray-200">
      <span>{title}</span>
      {typeof total === 'number' && <span>{formatCurrency(total)}</span>}
    </div>
    <div className="pl-3 border-l border-gray-200 dark:border-gray-600 ml-1">{children}</div>
  </div>
);

const BalancoItem: React.FC<{ label: string; value: number | null }> = ({ label, value }) => (
  <div className="flex justify-between items-center text-xs py-0.5">
    <span>{label}</span>
    <span className="font-medium">{formatCurrency(value)}</span>
  </div>
);

const BalancoTotalItem: React.FC<{ label: string; value: number | null }> = ({ label, value }) => (
  <div className="flex justify-between font-bold text-md pt-1 border-t-2 border-nixcon-gold dark:border-nixcon-gold mt-1">
    <span>{label}</span>
    <span>{formatCurrency(value)}</span>
  </div>
);


export default FinanceiroPage;
