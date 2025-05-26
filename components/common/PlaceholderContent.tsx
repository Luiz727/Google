import React from 'react';
import Card from './Card'; // Ajuste o caminho se necessário

interface PlaceholderContentProps {
  icon?: React.ReactElement<React.SVGProps<SVGSVGElement>>;
  title: string;
  description?: string;
  actionButton?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'ghost';
  };
}

const PlaceholderContent: React.FC<PlaceholderContentProps> = ({ icon, title, description, actionButton }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)] p-4 text-center">
      <Card className="max-w-xl w-full shadow-xl dark:bg-nixcon-dark-card">
        {icon && React.cloneElement(icon, { className: "w-16 h-16 text-nixcon-gold mx-auto mb-6" })}
        <h1 className="text-3xl font-bold text-nixcon-dark dark:text-nixcon-light mb-3">
          {title}
        </h1>
        {description && (
          <p className="text-md text-gray-600 dark:text-gray-400 mb-6">
            {description}
          </p>
        )}
        <div className="bg-yellow-50 dark:bg-yellow-900 dark:bg-opacity-20 border-l-4 border-nixcon-gold dark:border-yellow-500 text-yellow-700 dark:text-yellow-300 p-4 rounded-md shadow-sm">
          <p className="font-medium">Funcionalidade em Desenvolvimento</p>
          <p className="text-sm">
            Este recurso está sendo cuidadosamente preparado e estará disponível em breve.
            Agradecemos a sua compreensão e paciência!
          </p>
        </div>
        {actionButton && (
          <div className="mt-8">
            <button 
              onClick={actionButton.onClick}
              // Adicionar classes de botão aqui, similar ao componente Button
              className={`px-6 py-2 rounded-md font-semibold transition-colors
                ${actionButton.variant === 'primary' ? 'bg-nixcon-gold text-white hover:bg-yellow-600' :
                  actionButton.variant === 'secondary' ? 'bg-gray-200 text-nixcon-dark hover:bg-gray-300 dark:bg-gray-600 dark:text-nixcon-light dark:hover:bg-gray-500' :
                  'bg-transparent text-nixcon-gold hover:bg-nixcon-gold hover:bg-opacity-10 dark:hover:bg-opacity-20'
                }`}
            >
              {actionButton.label}
            </button>
          </div>
        )}
      </Card>
    </div>
  );
};

export default PlaceholderContent;
