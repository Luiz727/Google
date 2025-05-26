import React, { useState, useEffect } from 'react';
import Card from '../common/Card';
import { IconeFinanceiro } from '../common/Icons';

const IMPOSTOMETRO_STORAGE_KEY = 'nixconPortalImpostometroValor';

const formatCurrency = (value: number) => {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const ImpostometroWidget: React.FC = () => {
  const [valorAtual, setValorAtual] = useState<number>(() => {
    const valorSalvo = localStorage.getItem(IMPOSTOMETRO_STORAGE_KEY);
    return valorSalvo ? parseFloat(valorSalvo) : 50000; // Valor inicial
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setValorAtual(prevValor => {
        const incremento = Math.random() * 200 + 50; // Entre 50 e 250
        const novoValor = prevValor + incremento;
        localStorage.setItem(IMPOSTOMETRO_STORAGE_KEY, novoValor.toString());
        return novoValor;
      });
    }, 5000); // Atualiza a cada 5 segundos

    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="shadow-xl bg-gradient-to-r from-nixcon-dark to-nixcon-charcoal text-white dark:from-nixcon-charcoal dark:to-nixcon-dark-bg">
      <div className="flex items-center mb-3">
        <IconeFinanceiro className="w-10 h-10 text-nixcon-gold mr-4" />
        <div>
          <h2 className="text-2xl font-bold">Impostômetro Grupo Nixcon</h2>
          <p className="text-sm text-gray-300">(Simulação Agregada)</p>
        </div>
      </div>
      <div className="text-center my-6">
        <p className="text-5xl font-extrabold tracking-tight text-nixcon-gold animate-pulse">
          {formatCurrency(valorAtual)}
        </p>
      </div>
      <p className="text-xs text-gray-400 text-center">
        Este valor representa uma simulação do total de impostos estimados gerados ou calculados na plataforma e é atualizado periodicamente.
      </p>
    </Card>
  );
};

export default ImpostometroWidget;
