import React, { useState, useEffect, useMemo, FormEvent } from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import { IconeLink, IconeConfiguracoes } from '../components/common/Icons';
import { useAuth } from '../contexts/AuthContext';
import { ConfiguracoesEmissor, TipoIntegracao, FuncaoUsuario, ConfiguracoesWhatsapp } from '../types';

const inputClasses = "mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-nixcon-gold focus:border-nixcon-gold sm:text-sm";

interface IntegracaoCardProps {
  titulo: string;
  descricao: string;
  tipo: TipoIntegracao;
  configurado: boolean;
  onConfigurar: (tipo: TipoIntegracao) => void;
}

const IntegracaoCard: React.FC<IntegracaoCardProps> = ({ titulo, descricao, tipo, configurado, onConfigurar }) => {
  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 dark:bg-nixcon-dark-card flex flex-col">
      <div className="flex items-start mb-3">
        <div className={`p-3 rounded-full bg-opacity-10 ${configurado ? 'bg-green-500' : 'bg-gray-400'}`}>
          <IconeLink className={`w-8 h-8 ${configurado ? 'text-green-500 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`} />
        </div>
        <div className="ml-4">
          <h3 className="text-xl font-semibold text-nixcon-dark dark:text-nixcon-light">{titulo}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{descricao}</p>
        </div>
      </div>
      <div className="mt-auto pt-3">
        <p className={`text-xs font-medium mb-2 ${configurado ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
          Status: {configurado ? 'Configurada' : 'Não Configurada'}
        </p>
        <Button 
          variant={configurado ? "secondary" : "primary"} 
          size="sm" 
          onClick={() => onConfigurar(tipo)}
          fullWidth
        >
          {configurado ? 'Editar Configuração' : 'Configurar'}
        </Button>
      </div>
    </Card>
  );
};


const IntegracoesPage: React.FC = () => {
  const { tenantAtual, setTenantConfiguracoesEmissor, usuarioAtual } = useAuth();
  
  const [modalConfigAberto, setModalConfigAberto] = useState(false);
  const [tipoIntegracaoEditando, setTipoIntegracaoEditando] = useState<TipoIntegracao | null>(null);
  const [formDadosIntegracao, setFormDadosIntegracao] = useState<Partial<ConfiguracoesEmissor & { configuracoesWhatsapp: ConfiguracoesWhatsapp}>>({});

  const configEmissorAtual = tenantAtual?.configuracoesEmissor;

  const integraNotasConfigurada = useMemo(() => !!configEmissorAtual?.integraNotasApiKey, [configEmissorAtual]);
  const whatsAppEvolutionConfigurado = useMemo(() => !!configEmissorAtual?.configuracoesWhatsapp?.evolutionApiKey, [configEmissorAtual]);
  const whatsAppMetaConfigurado = useMemo(() => !!configEmissorAtual?.configuracoesWhatsapp?.metaAccessToken, [configEmissorAtual]);

  const handleAbrirModalConfig = (tipo: TipoIntegracao) => {
    setTipoIntegracaoEditando(tipo);
    let dadosIniciais: Partial<ConfiguracoesEmissor & { configuracoesWhatsapp: ConfiguracoesWhatsapp}> = {};
    if (configEmissorAtual) {
        switch (tipo) {
            case TipoIntegracao.INTEGRA_NOTAS:
                dadosIniciais = { integraNotasApiKey: configEmissorAtual.integraNotasApiKey || '' };
                break;
            case TipoIntegracao.WHATSAPP_EVOLUTION:
                dadosIniciais = { configuracoesWhatsapp: { ...configEmissorAtual.configuracoesWhatsapp } };
                break;
            case TipoIntegracao.WHATSAPP_META:
                dadosIniciais = { configuracoesWhatsapp: { ...configEmissorAtual.configuracoesWhatsapp } };
                break;
        }
    }
    setFormDadosIntegracao(dadosIniciais);
    setModalConfigAberto(true);
  };

  const handleChangeForm = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name.startsWith("whatsapp.")) {
        const whatsappField = name.split(".")[1];
        setFormDadosIntegracao(prev => ({
            ...prev,
            configuracoesWhatsapp: {
                ...(prev.configuracoesWhatsapp || {}),
                [whatsappField]: value
            }
        }));
    } else {
        setFormDadosIntegracao(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSalvarConfiguracao = (e: FormEvent) => {
    e.preventDefault();
    if (!tenantAtual || !tipoIntegracaoEditando) return;

    let configAtualizada = { ...tenantAtual.configuracoesEmissor };

    switch (tipoIntegracaoEditando) {
        case TipoIntegracao.INTEGRA_NOTAS:
            configAtualizada.integraNotasApiKey = formDadosIntegracao.integraNotasApiKey;
            break;
        case TipoIntegracao.WHATSAPP_EVOLUTION:
            configAtualizada.configuracoesWhatsapp = {
                ...(configAtualizada.configuracoesWhatsapp || {}),
                evolutionApiUrl: formDadosIntegracao.configuracoesWhatsapp?.evolutionApiUrl,
                evolutionApiKey: formDadosIntegracao.configuracoesWhatsapp?.evolutionApiKey,
                evolutionApiInstance: formDadosIntegracao.configuracoesWhatsapp?.evolutionApiInstance,
            };
            break;
        case TipoIntegracao.WHATSAPP_META:
            configAtualizada.configuracoesWhatsapp = {
                ...(configAtualizada.configuracoesWhatsapp || {}),
                metaAppId: formDadosIntegracao.configuracoesWhatsapp?.metaAppId,
                metaBusinessAccountId: formDadosIntegracao.configuracoesWhatsapp?.metaBusinessAccountId,
                metaAccessToken: formDadosIntegracao.configuracoesWhatsapp?.metaAccessToken,
                metaPhoneNumberId: formDadosIntegracao.configuracoesWhatsapp?.metaPhoneNumberId,
            };
            break;
    }
    
    setTenantConfiguracoesEmissor(configAtualizada as ConfiguracoesEmissor);
    alert(`Configurações para ${tipoIntegracaoEditando} salvas!`);
    setModalConfigAberto(false);
  };
  
  if (usuarioAtual?.funcao !== FuncaoUsuario.ADMIN_ESCRITORIO && usuarioAtual?.funcao !== FuncaoUsuario.SUPERADMIN) {
    return (
      <Card className="shadow-lg text-center p-8 dark:bg-nixcon-dark-card">
        <IconeConfiguracoes className="w-16 h-16 text-nixcon-gold mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-nixcon-dark dark:text-nixcon-light mb-2">Acesso Negado</h1>
        <p className="text-gray-600 dark:text-gray-400">Você não tem permissão para acessar as configurações de integrações.</p>
      </Card>
    );
  }

  const integrações: IntegracaoCardProps[] = [
    { 
      titulo: "API IntegraNotas", 
      descricao: "Integração para emissão de Notas Fiscais de Serviço (NFS-e) através da plataforma IntegraNotas.",
      tipo: TipoIntegracao.INTEGRA_NOTAS,
      configurado: integraNotasConfigurada,
      onConfigurar: handleAbrirModalConfig
    },
    { 
      titulo: "WhatsApp Evolution API", 
      descricao: "Conecte-se à API não oficial Evolution para envio de mensagens e alertas via WhatsApp.",
      tipo: TipoIntegracao.WHATSAPP_EVOLUTION,
      configurado: whatsAppEvolutionConfigurado,
      onConfigurar: handleAbrirModalConfig
    },
    { 
      titulo: "WhatsApp Meta API (Cloud)", 
      descricao: "Utilize a API Oficial do WhatsApp Business (Cloud API) para comunicações robustas e escaláveis.",
      tipo: TipoIntegracao.WHATSAPP_META,
      configurado: whatsAppMetaConfigurado,
      onConfigurar: handleAbrirModalConfig
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-nixcon-dark dark:text-nixcon-light flex items-center">
          <IconeLink className="w-8 h-8 mr-3 text-nixcon-gold" />
          Gerenciamento de Integrações
        </h1>
      </div>

      <p className="text-gray-600 dark:text-gray-400">
        Configure e gerencie as conexões do Portal Nixcon com serviços e APIs de terceiros.
        As configurações aqui realizadas são específicas para o seu escritório contábil.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {integrações.map(integracao => (
          <IntegracaoCard key={integracao.tipo} {...integracao} />
        ))}
      </div>

      {modalConfigAberto && tipoIntegracaoEditando && (
        <Modal isOpen={modalConfigAberto} onClose={() => setModalConfigAberto(false)} title={`Configurar ${tipoIntegracaoEditando}`}>
          <form onSubmit={handleSalvarConfiguracao} className="space-y-4 text-sm">
            {tipoIntegracaoEditando === TipoIntegracao.INTEGRA_NOTAS && (
              <div>
                <label htmlFor="integraNotasApiKey" className="block font-medium text-gray-700 dark:text-gray-300">API Key da IntegraNotas*</label>
                <input type="password" name="integraNotasApiKey" id="integraNotasApiKey" value={formDadosIntegracao.integraNotasApiKey || ''} onChange={handleChangeForm} required className={inputClasses} />
              </div>
            )}
            {tipoIntegracaoEditando === TipoIntegracao.WHATSAPP_EVOLUTION && (
              <>
                <div><label className="block font-medium">URL da API Evolution*</label><input type="text" name="whatsapp.evolutionApiUrl" value={formDadosIntegracao.configuracoesWhatsapp?.evolutionApiUrl || ''} onChange={handleChangeForm} required className={inputClasses} /></div>
                <div><label className="block font-medium">Chave da API Evolution*</label><input type="password" name="whatsapp.evolutionApiKey" value={formDadosIntegracao.configuracoesWhatsapp?.evolutionApiKey || ''} onChange={handleChangeForm} required className={inputClasses} /></div>
                <div><label className="block font-medium">Instância da API Evolution*</label><input type="text" name="whatsapp.evolutionApiInstance" value={formDadosIntegracao.configuracoesWhatsapp?.evolutionApiInstance || ''} onChange={handleChangeForm} required className={inputClasses} /></div>
              </>
            )}
            {tipoIntegracaoEditando === TipoIntegracao.WHATSAPP_META && (
              <>
                <div><label className="block font-medium">ID do Aplicativo Meta (App ID)*</label><input type="text" name="whatsapp.metaAppId" value={formDadosIntegracao.configuracoesWhatsapp?.metaAppId || ''} onChange={handleChangeForm} required className={inputClasses} /></div>
                <div><label className="block font-medium">ID da Conta Empresarial Meta*</label><input type="text" name="whatsapp.metaBusinessAccountId" value={formDadosIntegracao.configuracoesWhatsapp?.metaBusinessAccountId || ''} onChange={handleChangeForm} required className={inputClasses} /></div>
                <div><label className="block font-medium">Token de Acesso Permanente Meta*</label><input type="password" name="whatsapp.metaAccessToken" value={formDadosIntegracao.configuracoesWhatsapp?.metaAccessToken || ''} onChange={handleChangeForm} required className={inputClasses} /></div>
                <div><label className="block font-medium">ID do Número de Telefone Meta*</label><input type="text" name="whatsapp.metaPhoneNumberId" value={formDadosIntegracao.configuracoesWhatsapp?.metaPhoneNumberId || ''} onChange={handleChangeForm} required className={inputClasses} /></div>
              </>
            )}
            <div className="mt-6 text-right space-x-2">
              <Button type="button" variant="secondary" onClick={() => setModalConfigAberto(false)}>Cancelar</Button>
              <Button type="submit">Salvar Configuração</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default IntegracoesPage;
