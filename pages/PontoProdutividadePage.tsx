import React from 'react';
import PlaceholderContent from '../components/common/PlaceholderContent';
import { IconePontoProdutividade } from '../components/common/Icons';

const PontoProdutividadePage: React.FC = () => {
  return (
    <PlaceholderContent
      icon={<IconePontoProdutividade />}
      title="Controle de Ponto e Produtividade"
      description="Registre e gerencie o ponto dos colaboradores, acompanhe a produtividade em tarefas e otimize a gestão do tempo da equipe do escritório."
    />
  );
};

export default PontoProdutividadePage;
