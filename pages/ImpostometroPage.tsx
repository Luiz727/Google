
import React from 'react';
import ImpostometroWidget from '../components/dashboard/ImpostometroWidget';
import Card from '../components/common/Card';
import { IconeFinanceiro } from '../components/common/Icons';

const ImpostometroPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <h1 className="text-3xl font-bold text-nixcon-dark dark:text-nixcon-light flex items-center mb-4 sm:mb-0">
          <IconeFinanceiro className="w-8 h-8 mr-3 text-nixcon-gold" />
          Impostômetro Brasil (Simulado)
        </h1>
      </div>

      <ImpostometroWidget />

      <Card className="shadow-lg dark:bg-nixcon-dark-card">
        <h2 className="text-xl font-semibold text-nixcon-dark dark:text-nixcon-light mb-3">Sobre o Impostômetro</h2>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          O Impostômetro é uma ferramenta que visa conscientizar a população sobre a carga tributária brasileira.
          No Portal Grupo Nixcon, apresentamos uma simulação agregada, representando o volume de impostos
          gerados ou calculados dentro da plataforma.
        </p>
        <p className="text-gray-600 dark:text-gray-400 text-sm mt-2">
          Este valor é atualizado periodicamente e tem caráter meramente ilustrativo e educacional,
          não representando os valores oficiais arrecadados pelo governo.
        </p>
      </Card>
      
      <p className="text-center text-gray-500 dark:text-gray-400 text-sm mt-4">
        Para mais informações sobre a arrecadação de impostos no Brasil, consulte fontes oficiais.
      </p>
    </div>
  );
};

export default ImpostometroPage;
