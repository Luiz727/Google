
import React from 'react';
import PlaceholderContent from '../components/common/PlaceholderContent';
import { IconeLalur } from '../components/common/Icons';

const LalurPage: React.FC = () => {
  return (
    <PlaceholderContent
      icon={<IconeLalur />}
      title="Módulo LALUR/LACS"
      description="Escrituração do Livro de Apuração do Lucro Real (e-Lalur) e Livro de Apuração da Contribuição Social sobre o Lucro Líquido (e-Lacs), incluindo Parte A (adições, exclusões, compensações) e Parte B (controle de saldos como prejuízos fiscais e bases negativas de CSLL). Em desenvolvimento."
    />
  );
};

export default LalurPage;
