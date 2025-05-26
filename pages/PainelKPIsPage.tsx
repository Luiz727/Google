import React from 'react';
import PlaceholderContent from '../components/common/PlaceholderContent';
import { IconeKPIs } from '../components/common/Icons';

const PainelKPIsPage: React.FC = () => {
  return (
    <PlaceholderContent
      icon={<IconeKPIs />}
      title="Painel de KPIs e Indicadores"
      description="Monitore os principais indicadores de desempenho do seu escritório ou empresa. Este painel oferece uma visão consolidada para auxiliar na tomada de decisões estratégicas."
    />
  );
};

export default PainelKPIsPage;
