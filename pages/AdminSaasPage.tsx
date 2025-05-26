import React from 'react';
import PlaceholderContent from '../components/common/PlaceholderContent';
import { IconeAdminSaas } from '../components/common/Icons';

const AdminSaasPage: React.FC = () => {
  return (
    <PlaceholderContent
      icon={<IconeAdminSaas />}
      title="Administração Centralizada SAAS"
      description="Gerencie todos os aspectos da plataforma Portal Grupo Nixcon 4.0. Acesso restrito a SuperAdmins."
    />
  );
};

export default AdminSaasPage;
