
import React from 'react';
import PlaceholderContent from '../components/common/PlaceholderContent';
import { IconePatrimonio } from '../components/common/Icons';

const PatrimonioPage: React.FC = () => {
  return (
    <PlaceholderContent
      icon={<IconePatrimonio />}
      title="Módulo Patrimônio"
      description="Gestão e controle de bens do ativo imobilizado, incluindo cadastro detalhado, cálculo de depreciação/amortização (fiscal e societária), gestão de CIAP, PIS/COFINS sobre imobilizado, baixas, transferências e relatórios patrimoniais completos. Em desenvolvimento."
    />
  );
};

export default PatrimonioPage;
