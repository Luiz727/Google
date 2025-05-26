
import React from 'react';
import PlaceholderContent from '../components/common/PlaceholderContent';
import { IconeSerpro } from '../components/common/Icons'; // Usaremos IconeSerpro

const IntegraContadorAdminPage: React.FC = () => {
  return (
    <PlaceholderContent
      icon={<IconeSerpro />}
      title="Administração IntegraContador (SERPRO)"
      description="Gerencie a integração com a API IntegraContador do SERPRO para automação de emissão de guias de tributos (DAS, DARF, etc.) e outras consultas. Configure credenciais, acompanhe logs de integração e gerencie o status das conexões."
    />
  );
};

export default IntegraContadorAdminPage;
