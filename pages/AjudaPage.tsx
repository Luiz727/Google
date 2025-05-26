import React, { useState } from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { IconeAjuda, IconeTarefas, IconeDocumentos, IconeFinanceiro } from '../components/common/Icons'; // Usando IconeAjuda como principal

interface FaqItemProps {
  pergunta: string;
  resposta: string;
}

const FaqItem: React.FC<FaqItemProps> = ({ pergunta, resposta }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-gray-200 py-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex justify-between items-center w-full text-left text-nixcon-dark hover:text-nixcon-gold"
      >
        <span className="font-medium">{pergunta}</span>
        <svg
          className={`w-5 h-5 transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
        </svg>
      </button>
      {isOpen && (
        <div className="mt-2 text-gray-600 text-sm">
          <p>{resposta}</p>
        </div>
      )}
    </div>
  );
};

interface HelpSectionProps {
  titulo: string;
  icone: React.ReactElement<React.SVGProps<SVGSVGElement>>;
  children: React.ReactNode;
}

const HelpSection: React.FC<HelpSectionProps> = ({ titulo, icone, children }) => (
    <Card className="shadow-lg">
        <div className="flex items-center mb-4">
            {React.cloneElement(icone, { className: "w-7 h-7 text-nixcon-gold mr-3"})}
            <h2 className="text-xl font-semibold text-nixcon-dark">{titulo}</h2>
        </div>
        {children}
    </Card>
);


const AjudaPage: React.FC = () => {
  const faqsComuns = [
    {
      pergunta: 'Como faço para redefinir minha senha?',
      resposta: 'Você pode redefinir sua senha clicando no link "Esqueceu sua senha?" na página de login. Siga as instruções enviadas para o seu e-mail.',
    },
    {
      pergunta: 'Como posso adicionar um novo cliente ao portal?',
      resposta: 'Se você for um Administrador do Escritório, vá para a seção "Configurações" > "Gerenciamento de Usuários" e utilize a opção para convidar ou criar um novo tenant/empresa cliente.',
    },
    {
      pergunta: 'Onde encontro os documentos fiscais do meu cliente?',
      resposta: 'Acesse o módulo "Documentos". Lá você poderá filtrar por cliente, categoria (Fiscal) e período para encontrar os arquivos XML e outros documentos relevantes.',
    },
    {
      pergunta: 'Como funciona a integração com o WhatsApp?',
      resposta: 'A integração com o WhatsApp permite o envio automático de lembretes de prazos, notificações de novas tarefas ou documentos e, em breve, um canal de atendimento. As configurações são gerenciadas na seção "Integrações" (para administradores).',
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <h1 className="text-3xl font-bold text-nixcon-dark flex items-center mb-4 sm:mb-0">
          <IconeAjuda className="w-8 h-8 mr-3 text-nixcon-gold" />
          Central de Ajuda e FAQ
        </h1>
        <div className="relative w-full sm:w-72">
          <input
            type="search"
            placeholder="Buscar na Central de Ajuda..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-nixcon-gold focus:border-nixcon-gold"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      </div>

      <HelpSection titulo="Perguntas Frequentes (FAQ)" icone={<IconeTarefas />}>
        {faqsComuns.map((faq, index) => (
          <FaqItem key={index} pergunta={faq.pergunta} resposta={faq.resposta} />
        ))}
      </HelpSection>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <HelpSection titulo="Tutoriais e Guias" icone={<IconeDocumentos />}>
          <p className="text-gray-600 mb-3">
            Explore nossos vídeos e guias passo a passo para aproveitar ao máximo o Portal Grupo Nixcon 4.0.
          </p>
          <ul className="space-y-2">
            <li><a href="#" className="text-nixcon-gold hover:underline">Vídeo: Primeiros passos no portal</a></li>
            <li><a href="#" className="text-nixcon-gold hover:underline">Guia: Gerenciando tarefas eficientemente</a></li>
            <li><a href="#" className="text-nixcon-gold hover:underline">Tutorial: Fazendo upload e organizando documentos</a></li>
          </ul>
           <Button variant="secondary" size="sm" className="mt-4">Ver Todos os Tutoriais</Button>
        </HelpSection>

        <HelpSection titulo="Suporte Técnico" icone={<IconeFinanceiro />}> {/* Usando IconeFinanceiro como placeholder */}
          <p className="text-gray-600 mb-3">
            Não encontrou o que procurava? Nossa equipe de suporte está pronta para ajudar.
          </p>
          <div className="space-y-1 text-sm">
            <p><strong>Email:</strong> <a href="mailto:suporte@gruponixcon.com.br" className="text-nixcon-gold hover:underline">suporte@gruponixcon.com.br</a></p>
            <p><strong>Telefone:</strong> (XX) XXXX-XXXX (Horário comercial)</p>
            <p><strong>Chat Online:</strong> Disponível em breve</p>
          </div>
          <Button variant="primary" size="sm" className="mt-4">Abrir Chamado de Suporte</Button>
        </HelpSection>
      </div>

      <p className="text-center text-gray-500 mt-8">
        Esta página será continuamente atualizada com novas informações, FAQs e tutoriais.
      </p>
    </div>
  );
};

export default AjudaPage;