
import React from 'react';
import PlaceholderContent from '../components/common/PlaceholderContent';
import { IconeConsultoriaTributaria } from '../components/common/Icons';

const ConsultoriaTributariaPage: React.FC = () => {
  return (
    <PlaceholderContent
      icon={<IconeConsultoriaTributaria />}
      title="Consultoria Tributária Inteligente"
      description="Ferramenta avançada para auditoria de notas fiscais, validando NCM, impostos, benefícios fiscais, parametrizações, códigos e inconsistências, cruzando com dados do CNAE da empresa. Utiliza banco de dados da empresa e IA para buscas avançadas e otimização tributária. Em desenvolvimento."
    />
  );
};

export default ConsultoriaTributariaPage;
