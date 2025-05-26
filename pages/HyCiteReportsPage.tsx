import React from 'react';
import PlaceholderContent from '../components/common/PlaceholderContent';
import { IconeHyCite } from '../components/common/Icons';

const HyCiteReportsPage: React.FC = () => {
  return (
    <PlaceholderContent
      icon={<IconeHyCite />}
      title="Relatórios Específicos Hy Cite"
      description="Acesse relatórios detalhados e personalizados para a operação Hy Cite, incluindo extratos de comissões, análises de desempenho de vendas e acompanhamento de metas."
    />
  );
};

export default HyCiteReportsPage;
