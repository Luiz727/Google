import React, { useState, useEffect, useMemo, ChangeEvent, FormEvent } from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import { IconeCnae, IconeLixeira, IconeDocumentos } from '../components/common/Icons';
import { useAuth } from '../contexts/AuthContext';
import { CnaeInfo, FuncaoUsuario, AnexoSimplesNacional, ANEXOS_SIMPLES_NACIONAL_OPTIONS } from '../types';

const STORAGE_KEY_CNAES_PREFIX = 'nixconPortalCnaes_';

const inputStyles = "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-nixcon-gold focus:border-nixcon-gold sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:placeholder-gray-400";
const selectStyles = `${inputStyles} bg-white dark:bg-gray-700`;
const textareaStyles = `${inputStyles} min-h-[80px]`;

const CnaePage: React.FC = () => {
  const { usuarioAtual, tenantAtual } = useAuth();
  const [cnaes, setCnaes] = useState<CnaeInfo[]>([]);
  const [modalCnaeAberto, setModalCnaeAberto] = useState(false);
  const [cnaeEditando, setCnaeEditando] = useState<Partial<CnaeInfo> | null>(null);
  
  const [filtroCodigo, setFiltroCodigo] = useState('');
  const [filtroDescricao, setFiltroDescricao] = useState('');
  
  const [codigoServicoInput, setCodigoServicoInput] = useState('');

  const tenantIdEscritorio = useMemo(() => tenantAtual?.id, [tenantAtual]);

  useEffect(() => {
    if (tenantIdEscritorio) {
      const storageKey = `${STORAGE_KEY_CNAES_PREFIX}${tenantIdEscritorio}`;
      const cnaesSalvos = localStorage.getItem(storageKey);
      if (cnaesSalvos) {
        setCnaes(JSON.parse(cnaesSalvos));
      } else {
        // Mock inicial
        const mockInitialCnaes: CnaeInfo[] = [
          { id: 'cnae1', codigo: '62.01-5-01', descricao: 'Desenvolvimento de programas de computador sob encomenda', codigosServicoLc116: ['01.01'], anexoSimplesNacional: 'III', permiteMei: true, observacoes: 'Pode variar para Anexo V dependendo do Fator R.', tenantId: tenantIdEscritorio },
          { id: 'cnae2', codigo: '47.12-1-00', descricao: 'Comércio varejista de mercadorias em geral, com predominância de produtos alimentícios - minimercados, mercearias e armazéns', anexoSimplesNacional: 'I', permiteMei: true, tenantId: tenantIdEscritorio },
          { id: 'cnae3', codigo: '73.11-4-00', descricao: 'Agências de publicidade', codigosServicoLc116: ['17.06'], anexoSimplesNacional: 'V', permiteMei: false, tenantId: tenantIdEscritorio },
        ];
        setCnaes(mockInitialCnaes);
      }
    }
  }, [tenantIdEscritorio]);

  useEffect(() => {
    if (tenantIdEscritorio) {
      localStorage.setItem(`${STORAGE_KEY_CNAES_PREFIX}${tenantIdEscritorio}`, JSON.stringify(cnaes));
    }
  }, [cnaes, tenantIdEscritorio]);

  const handleAbrirModalCnae = (cnae?: CnaeInfo) => {
    setCnaeEditando(cnae ? { ...cnae, codigosServicoLc116: cnae.codigosServicoLc116 ? [...cnae.codigosServicoLc116] : [] } : { codigo: '', descricao: '', codigosServicoLc116: [], anexoSimplesNacional: 'NAO_SE_APLICA', permiteMei: false });
    setCodigoServicoInput('');
    setModalCnaeAberto(true);
  };

  const handleChangeCnaeEditando = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
    setCnaeEditando(prev => prev ? { ...prev, [name]: type === 'checkbox' ? checked : value } : null);
  };

  const handleAdicionarCodigoServico = () => {
    if (codigoServicoInput.trim() && cnaeEditando) {
      const jaExiste = cnaeEditando.codigosServicoLc116?.includes(codigoServicoInput.trim());
      if (jaExiste) {
        alert("Este código de serviço já foi adicionado.");
        return;
      }
      setCnaeEditando(prev => ({
        ...prev,
        codigosServicoLc116: [...(prev?.codigosServicoLc116 || []), codigoServicoInput.trim()]
      }));
      setCodigoServicoInput('');
    }
  };

  const handleRemoverCodigoServico = (codigoParaRemover: string) => {
    setCnaeEditando(prev => prev ? ({
      ...prev,
      codigosServicoLc116: prev.codigosServicoLc116?.filter(cs => cs !== codigoParaRemover)
    }) : null);
  };
  
  const handleSalvarCnae = (e: FormEvent) => {
    e.preventDefault();
    if (!cnaeEditando || !cnaeEditando.codigo || !cnaeEditando.descricao || !tenantIdEscritorio) {
      alert("Código e Descrição do CNAE são obrigatórios.");
      return;
    }

    if (cnaeEditando.id) {
      setCnaes(cnaes.map(c => c.id === cnaeEditando!.id ? { ...c, ...cnaeEditando } as CnaeInfo : c));
    } else {
      const novoCnae: CnaeInfo = {
        id: `cnae-${Date.now()}`,
        tenantId: tenantIdEscritorio,
        ...cnaeEditando,
      } as CnaeInfo;
      setCnaes(prevCnaes => [novoCnae, ...prevCnaes]);
    }
    setModalCnaeAberto(false);
  };

  const handleExcluirCnae = (idCnae: string) => {
    if (window.confirm("Tem certeza que deseja excluir este CNAE?")) {
        setCnaes(cnaes.filter(c => c.id !== idCnae));
    }
  };

  const cnaesFiltrados = useMemo(() => {
    return cnaes.filter(cnae => 
      (filtroCodigo ? cnae.codigo.toLowerCase().includes(filtroCodigo.toLowerCase()) : true) &&
      (filtroDescricao ? cnae.descricao.toLowerCase().includes(filtroDescricao.toLowerCase()) : true)
    ).sort((a, b) => a.codigo.localeCompare(b.codigo));
  }, [cnaes, filtroCodigo, filtroDescricao]);

  if (usuarioAtual?.funcao !== FuncaoUsuario.ADMIN_ESCRITORIO && usuarioAtual?.funcao !== FuncaoUsuario.SUPERADMIN) {
    return (
      <Card className="shadow-lg text-center p-8">
        <IconeCnae className="w-16 h-16 text-nixcon-gold mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-nixcon-dark dark:text-nixcon-light mb-2">Acesso Negado</h1>
        <p className="text-gray-600 dark:text-gray-400">Você não tem permissão para acessar esta funcionalidade.</p>
      </Card>
    );
  }


  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <h1 className="text-3xl font-bold text-nixcon-dark dark:text-nixcon-light flex items-center mb-4 sm:mb-0">
          <IconeCnae className="w-8 h-8 mr-3 text-nixcon-gold" />
          Cadastro de CNAEs e Códigos de Serviço
        </h1>
        <Button onClick={() => handleAbrirModalCnae()}>Adicionar Novo CNAE</Button>
      </div>
      
      <Card className="shadow-lg dark:bg-nixcon-dark-card">
        <h2 className="text-xl font-semibold text-nixcon-dark dark:text-nixcon-light mb-4">Filtros</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <input 
            type="text" 
            placeholder="Buscar por Código CNAE..." 
            value={filtroCodigo}
            onChange={(e) => setFiltroCodigo(e.target.value)}
            className={`${inputStyles} dark:bg-gray-700 dark:text-gray-200`}
          />
          <input 
            type="text" 
            placeholder="Buscar por Descrição..." 
            value={filtroDescricao}
            onChange={(e) => setFiltroDescricao(e.target.value)}
            className={`${inputStyles} dark:bg-gray-700 dark:text-gray-200`}
          />
        </div>
      </Card>

      <Card className="shadow-lg dark:bg-nixcon-dark-card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Código CNAE</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Descrição</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Anexo SN</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Permite MEI?</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-nixcon-dark-card divide-y divide-gray-200 dark:divide-gray-700">
              {cnaesFiltrados.map((cnae) => (
                <tr key={cnae.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-nixcon-dark dark:text-nixcon-light">{cnae.codigo}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 max-w-md truncate" title={cnae.descricao}>{cnae.descricao}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{cnae.anexoSimplesNacional || '-'}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{cnae.permiteMei ? 'Sim' : 'Não'}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm space-x-1">
                    <Button variant="ghost" size="sm" onClick={() => handleAbrirModalCnae(cnae)}>Editar</Button>
                    <Button variant="danger" size="sm" onClick={() => handleExcluirCnae(cnae.id)}><IconeLixeira className="w-3 h-3"/></Button>
                  </td>
                </tr>
              ))}
              {cnaesFiltrados.length === 0 && (
                <tr><td colSpan={5} className="text-center py-4 text-gray-500 dark:text-gray-400">Nenhum CNAE encontrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {modalCnaeAberto && cnaeEditando && (
        <Modal isOpen={modalCnaeAberto} onClose={() => setModalCnaeAberto(false)} title={cnaeEditando.id ? 'Editar CNAE' : 'Novo CNAE'}>
          <form onSubmit={handleSalvarCnae} className="space-y-4 max-h-[75vh] overflow-y-auto p-1">
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Código CNAE*</label><input type="text" name="codigo" value={cnaeEditando.codigo || ''} onChange={handleChangeCnaeEditando} required className={inputStyles} placeholder="Ex: 62.01-5/01 ou 6201501" /></div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Descrição*</label><textarea name="descricao" value={cnaeEditando.descricao || ''} onChange={handleChangeCnaeEditando} required rows={3} className={textareaStyles}></textarea></div>
            
            <fieldset className="border p-3 rounded-md dark:border-gray-600">
                <legend className="text-md font-medium text-nixcon-dark dark:text-nixcon-light px-1">Códigos de Serviço (LC 116/03)</legend>
                <div className="flex items-center gap-2 mb-2">
                    <input type="text" value={codigoServicoInput} onChange={(e) => setCodigoServicoInput(e.target.value)} placeholder="Ex: 01.01" className={`${inputStyles} flex-grow`} />
                    <Button type="button" onClick={handleAdicionarCodigoServico} variant="secondary" size="sm" disabled={!codigoServicoInput.trim()}>Adicionar Cód.</Button>
                </div>
                {cnaeEditando.codigosServicoLc116 && cnaeEditando.codigosServicoLc116.length > 0 && (
                    <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-300 space-y-1 max-h-24 overflow-y-auto bg-gray-50 dark:bg-gray-700 p-2 rounded">
                        {cnaeEditando.codigosServicoLc116.map(cs => (
                            <li key={cs} className="flex justify-between items-center">
                                {cs}
                                <button type="button" onClick={() => handleRemoverCodigoServico(cs)} className="text-red-500 hover:text-red-700 text-xs p-0.5"><IconeLixeira className="w-3 h-3"/></button>
                            </li>
                        ))}
                    </ul>
                )}
            </fieldset>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Anexo Simples Nacional</label><select name="anexoSimplesNacional" value={cnaeEditando.anexoSimplesNacional || 'NAO_SE_APLICA'} onChange={handleChangeCnaeEditando} className={selectStyles}>{ANEXOS_SIMPLES_NACIONAL_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}</select></div>
                <div className="flex items-center pt-6">
                    <input type="checkbox" name="permiteMei" id="permiteMeiCnae" checked={cnaeEditando.permiteMei || false} onChange={handleChangeCnaeEditando} className="h-4 w-4 text-nixcon-gold border-gray-300 dark:border-gray-600 rounded focus:ring-nixcon-gold" />
                    <label htmlFor="permiteMeiCnae" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">Atividade Permitida no MEI?</label>
                </div>
            </div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Observações</label><textarea name="observacoes" value={cnaeEditando.observacoes || ''} onChange={handleChangeCnaeEditando} rows={3} className={textareaStyles} placeholder="Informações adicionais, alíquotas de referência, etc."></textarea></div>
            
            <div className="mt-6 text-right space-x-2">
              <Button type="button" variant="secondary" onClick={() => setModalCnaeAberto(false)}>Cancelar</Button>
              <Button type="submit">Salvar CNAE</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default CnaePage;
