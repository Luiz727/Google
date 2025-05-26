
import React, { useState, ChangeEvent } from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { IconeXml, IconeUpload } from '../components/common/Icons'; // Assumindo IconeXml existe
import { ArquivoXmlInfo, TipoDocumentoFiscal, StatusProcessamentoXml } from '../types';
import { useAuth } from '../contexts/AuthContext';

const OrganizadorXmlPage: React.FC = () => {
  const { tenantAtual } = useAuth(); // Para obter o contexto do tenant
  const [arquivosXml, setArquivosXml] = useState<ArquivoXmlInfo[]>([]);
  const [filtroTermo, setFiltroTermo] = useState('');
  const [filtroTipoNota, setFiltroTipoNota] = useState<TipoDocumentoFiscal | 'OUTRO_XML' | ''>('');
  const [filtroStatus, setFiltroStatus] = useState<StatusProcessamentoXml | ''>('');
  const [filtroDataDe, setFiltroDataDe] = useState('');
  const [filtroDataAte, setFiltroDataAte] = useState('');
  
  const inputFileRef = React.useRef<HTMLInputElement>(null);

  const handleSimularImportacao = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0 && tenantAtual) {
      const novosArquivos: ArquivoXmlInfo[] = Array.from(files).map((file, index) => ({
        id: `xml-${Date.now()}-${index}`,
        nomeArquivo: file.name,
        tipoNota: file.name.toLowerCase().includes('nfe') ? TipoDocumentoFiscal.NFe : 
                  file.name.toLowerCase().includes('nfse') ? TipoDocumentoFiscal.NFSe : 'OUTRO_XML',
        dataUpload: new Date().toISOString(),
        statusProcessamento: 'PENDENTE',
        tenantId: tenantAtual.id, // Associa ao tenant atual
        // Simular dados extraídos do XML (seria preenchido após processamento real)
        chaveAcesso: `CHAVE${Math.random().toString(36).substring(2,10).toUpperCase()}`,
        numeroNota: Math.floor(1000 + Math.random() * 9000).toString(),
        nomeEmitente: `Emitente Exemplo ${index + 1}`,
        valorNota: parseFloat((Math.random() * 1000 + 50).toFixed(2)),
      }));
      setArquivosXml(prev => [...prev, ...novosArquivos]);
      alert(`${files.length} arquivo(s) XML simuladamente importado(s) e adicionado(s) à lista.`);
    }
    if (inputFileRef.current) {
        inputFileRef.current.value = ""; // Limpa o input de arquivo
    }
  };

  const handleLimparFiltros = () => {
    setFiltroTermo('');
    setFiltroTipoNota('');
    setFiltroStatus('');
    setFiltroDataDe('');
    setFiltroDataAte('');
  };
  
  const handleProcessarXml = (xmlId: string) => {
    setArquivosXml(prev => prev.map(xml => {
        if (xml.id === xmlId) {
            // Simula um processamento
            const sucesso = Math.random() > 0.3; // 70% de chance de sucesso
            return {
                ...xml,
                statusProcessamento: sucesso ? 'PROCESSADO' : 'ERRO_VALIDACAO',
                mensagensErro: !sucesso ? 'Erro simulado na validação do XML.' : undefined,
                protocoloAutorizacao: sucesso ? `PROT${Date.now()}` : undefined,
                dataEmissaoNota: sucesso ? new Date(Date.now() - 86400000 * Math.floor(Math.random()*5)).toISOString() : undefined,
            };
        }
        return xml;
    }));
    alert(`XML ID ${xmlId} processado (simulado).`);
  };

  const arquivosXmlFiltrados = arquivosXml.filter(xml => {
    const termoBusca = filtroTermo.toLowerCase();
    const matchTermo = filtroTermo ? (
      xml.nomeArquivo.toLowerCase().includes(termoBusca) ||
      xml.chaveAcesso?.toLowerCase().includes(termoBusca) ||
      xml.nomeEmitente?.toLowerCase().includes(termoBusca) ||
      xml.numeroNota?.includes(termoBusca)
    ) : true;
    const matchTipo = filtroTipoNota ? xml.tipoNota === filtroTipoNota : true;
    const matchStatus = filtroStatus ? xml.statusProcessamento === filtroStatus : true;
    const dataUploadXml = new Date(xml.dataUpload);
    const matchDataDe = filtroDataDe ? dataUploadXml >= new Date(filtroDataDe + "T00:00:00") : true;
    const matchDataAte = filtroDataAte ? dataUploadXml <= new Date(filtroDataAte + "T23:59:59") : true;

    return matchTermo && matchTipo && matchStatus && matchDataDe && matchDataAte && xml.tenantId === tenantAtual?.id;
  }).sort((a,b) => new Date(b.dataUpload).getTime() - new Date(a.dataUpload).getTime());

  const formatarDataHora = (isoString: string) => new Date(isoString).toLocaleString('pt-BR');
  const formatarValor = (valor?: number) => valor?.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'}) || '-';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <h1 className="text-3xl font-bold text-nixcon-dark dark:text-nixcon-light flex items-center mb-4 sm:mb-0">
          <IconeXml className="w-8 h-8 mr-3 text-nixcon-gold" />
          Organizador de XMLs
        </h1>
        <Button onClick={() => inputFileRef.current?.click()} leftIcon={<IconeUpload className="w-4 h-4"/>}>
          Simular Importação de XML
        </Button>
        <input type="file" multiple accept=".xml" ref={inputFileRef} onChange={handleSimularImportacao} className="hidden"/>
      </div>

      <Card className="shadow-lg">
        <h2 className="text-xl font-semibold text-nixcon-dark dark:text-nixcon-light mb-4">Filtros</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <input type="text" placeholder="Chave, Emitente, Arquivo..." value={filtroTermo} onChange={e => setFiltroTermo(e.target.value)} className="input-form" />
          <select value={filtroTipoNota} onChange={e => setFiltroTipoNota(e.target.value as any)} className="input-form">
            <option value="">Todos os Tipos</option>
            {Object.values(TipoDocumentoFiscal).map(tipo => <option key={tipo} value={tipo}>{tipo}</option>)}
            <option value="OUTRO_XML">Outro XML</option>
          </select>
          <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value as any)} className="input-form">
            <option value="">Todos os Status</option>
            {['PENDENTE', 'PROCESSADO', 'ERRO_LEITURA', 'ERRO_VALIDACAO'].map(status => <option key={status} value={status}>{status.replace('_', ' ')}</option>)}
          </select>
          <input type="date" value={filtroDataDe} onChange={e => setFiltroDataDe(e.target.value)} className="input-form" title="Upload De"/>
          <input type="date" value={filtroDataAte} onChange={e => setFiltroDataAte(e.target.value)} className="input-form" title="Upload Até"/>
          <Button onClick={handleLimparFiltros} variant="secondary" className="w-full lg:w-auto">Limpar Filtros</Button>
        </div>
      </Card>

      <Card className="shadow-lg">
        <h2 className="text-xl font-semibold text-nixcon-dark dark:text-nixcon-light mb-4">XMLs Importados ({arquivosXmlFiltrados.length})</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="th-table">Arquivo / Tipo</th>
                <th className="th-table">Upload</th>
                <th className="th-table">Chave/Protocolo</th>
                <th className="th-table">Emitente</th>
                <th className="th-table">Valor</th>
                <th className="th-table">Status</th>
                <th className="th-table">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-nixcon-dark-card divide-y divide-gray-200 dark:divide-gray-700">
              {arquivosXmlFiltrados.map(xml => (
                <tr key={xml.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="td-table max-w-xs truncate" title={xml.nomeArquivo}>
                    {xml.nomeArquivo}<br/><span className="text-xs text-gray-500 dark:text-gray-400">{xml.tipoNota}</span>
                  </td>
                  <td className="td-table">{formatarDataHora(xml.dataUpload)}</td>
                  <td className="td-table font-mono text-xs" title={xml.chaveAcesso || xml.protocoloAutorizacao}>{xml.chaveAcesso || xml.protocoloAutorizacao || '-'}</td>
                  <td className="td-table">{xml.nomeEmitente || '-'}</td>
                  <td className="td-table">{formatarValor(xml.valorNota)}</td>
                  <td className="td-table">
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                        xml.statusProcessamento === 'PROCESSADO' ? 'bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100' :
                        xml.statusProcessamento === 'PENDENTE' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-100' :
                        'bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-100'
                    }`}>{xml.statusProcessamento.replace('_', ' ')}</span>
                  </td>
                  <td className="td-table space-x-1">
                    {xml.statusProcessamento === 'PENDENTE' && <Button size="sm" onClick={() => handleProcessarXml(xml.id)}>Processar</Button>}
                    <Button size="sm" variant="ghost" onClick={() => alert(`Detalhes do XML: ${xml.nomeArquivo}`)}>Detalhes</Button>
                  </td>
                </tr>
              ))}
              {arquivosXmlFiltrados.length === 0 && (
                <tr><td colSpan={7} className="text-center py-4 text-gray-500 dark:text-gray-400">Nenhum XML encontrado para os filtros aplicados.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
      <p className="text-center text-sm text-gray-500 dark:text-gray-400">
        Funcionalidades como classificação, validação contra SEFAZ (simulada), e vinculação a lançamentos financeiros serão adicionadas.
      </p>
      <style>{`
        .input-form { display: block; width: 100%; padding: 0.5rem 0.75rem; font-size: 0.875rem; border: 1px solid #D1D5DB; border-radius: 0.375rem; box-shadow: sm; background-color: white; }
        .input-form:focus { outline: none; ring: 2px; ring-color: #dbbd67; border-color: #dbbd67; }
        .dark .input-form { background-color: #374151; border-color: #4B5563; color: #D1D5DB; }
        .th-table { padding: 0.75rem 1rem; text-align: left; font-size: 0.75rem; font-weight: 500; color: #6B7280; text-transform: uppercase; letter-spacing: 0.05em; }
        .dark .th-table { color: #9CA3AF; }
        .td-table { padding: 0.75rem 1rem; font-size: 0.875rem; color: #374151; }
        .dark .td-table { color: #D1D5DB; }
      `}</style>
    </div>
  );
};

export default OrganizadorXmlPage;
