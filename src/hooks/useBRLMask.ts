import { useState } from 'react'

export function useBRLMask() {
  const [value, setValue] = useState('')

  // Formatar valor para exibição (com máscara)
  const formatBRL = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  // Formatar valor para input (apenas números com vírgula)
  const formatInputValue = (value: string) => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '')
    
    if (!numbers) return ''
    
    // Converte para centavos e depois para reais
    const cents = parseInt(numbers)
    const reais = cents / 100
    
    // Formata com vírgula decimal
    return reais.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  }

  // Converter valor formatado para número
  const parseValue = (formattedValue: string): number => {
    if (!formattedValue) return 0
    
    // Remove pontos de milhares e substitui vírgula por ponto
    const cleanValue = formattedValue
      .replace(/\./g, '')
      .replace(',', '.')
    
    return parseFloat(cleanValue) || 0
  }

  // Handler para mudança no input
  const handleChange = (inputValue: string) => {
    const formatted = formatInputValue(inputValue)
    setValue(formatted)
    return formatted
  }

  // Limpar valor
  const clear = () => {
    setValue('')
  }

  return {
    value,
    setValue,
    formatBRL,
    formatInputValue,
    parseValue,
    handleChange,
    clear
  }
}