import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Formatação de valores monetários em BRL
export function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

// Formatação de data para exibição (DD/MM/AAAA)
export function formatDate(date: string): string {
  return new Date(date + 'T00:00:00').toLocaleDateString('pt-BR');
}

// Formatação de data e hora para exibição (DD/MM/AAAA HH:mm)
export function formatDateTime(dateTime: string): string {
  return new Date(dateTime).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Converter valor BRL formatado para número
export function parseBRLToNumber(value: string): number {
  console.log('🔢 Convertendo valor:', value);
  // Remove tudo exceto números, vírgula e ponto
  const cleanValue = value.replace(/[^\d,.]/g, '');
  // Substitui vírgula por ponto para conversão
  const result = parseFloat(cleanValue.replace(',', '.')) || 0;
  console.log('🔢 Resultado da conversão:', result);
  return result;
}

// Formatar valor para input (permite digitação)
export function formatBRLInput(value: string): string {
  // Remove caracteres não numéricos exceto vírgula e ponto
  const cleanValue = value.replace(/[^\d,.]/g, '');
  
  // Se está vazio, retorna vazio
  if (!cleanValue) return '';
  
  // Se tem apenas números (sem vírgula ou ponto), trata como reais inteiros
  if (/^\d+$/.test(cleanValue)) {
    const num = parseInt(cleanValue);
    if (num === 0) return '';
    
    // Formata como reais (não centavos)
    return num.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }
  
  // Se tem vírgula ou ponto, formata o número completo
  if (cleanValue.includes(',') || cleanValue.includes('.')) {
    // Substitui vírgula por ponto para parseFloat
    const numericValue = parseFloat(cleanValue.replace(',', '.'));
    if (isNaN(numericValue)) return cleanValue;
    
    return numericValue.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }
  
  return cleanValue;
}

// Obter data atual no formato YYYY-MM-DD
export function getCurrentDate(): string {
  return new Date().toISOString().split('T')[0];
}
