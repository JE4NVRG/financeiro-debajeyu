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

  // Formatar valor para input - permite digitação livre
  const formatInputValue = (inputValue: string) => {
    // Remove tudo que não é número ou vírgula
    let cleanValue = inputValue.replace(/[^\d,]/g, '')
    
    if (!cleanValue) return ''
    
    // Se contém vírgula, tratar como decimal
    if (cleanValue.includes(',')) {
      const parts = cleanValue.split(',')
      let integerPart = parts[0]
      let decimalPart = parts[1] ? parts[1].substring(0, 2) : '' // Máximo 2 casas decimais
      
      // Formatar parte inteira com pontos de milhares se >= 1000
      if (integerPart && parseInt(integerPart) >= 1000) {
        integerPart = parseInt(integerPart).toLocaleString('pt-BR')
      }
      
      // Retornar com vírgula
      return decimalPart ? `${integerPart},${decimalPart}` : `${integerPart},`
    }
    
    // Se não tem vírgula, apenas formatar com pontos de milhares se necessário
    const numericValue = parseInt(cleanValue)
    if (numericValue >= 1000) {
      return numericValue.toLocaleString('pt-BR')
    } else {
      return cleanValue
    }
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