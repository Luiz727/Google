import React from 'react';
import PlaceholderContent from '../components/common/PlaceholderContent';
import { IconeAuditoria } from '../components/common/Icons';

const AuditoriaPage: React.FC = () => {
  return (
    <PlaceholderContent
      icon={<IconeAuditoria />}
      title="Logs de Auditoria"
      description="Acompanhe todas as ações críticas realizadas no sistema para garantir segurança e rastreabilidade das operações no portal."
    />
  );
};

export default AuditoriaPage;
