import { useState } from 'react'

export function useCurrencyMask() {
  // Sanitizar entrada removendo caracteres indesejados
  const sanitizeInput = (input: string): string => {
    // Remove R$, espaços, e mantém apenas números, vírgulas e pontos
    return input.replace(/[R$\s]/g, '').trim()
  }

  // Converter valor pt-BR para número canônico (ex: 787,87 → 787.87)
  const parseToCanonical = (formattedValue: string): number => {
    if (!formattedValue) return 0
    
    const sanitized = sanitizeInput(formattedValue)
    
    // Se não tem vírgula nem ponto, tratar como número inteiro SEM ajuste de centavos
    if (!sanitized.includes(',') && !sanitized.includes('.')) {
      const num = parseFloat(sanitized) || 0
      return num
    }
    
    // Se tem vírgula, assumir que é separador decimal pt-BR
    if (sanitized.includes(',')) {
      // Remove pontos de milhares e substitui vírgula por ponto
      const cleanValue = sanitized
        .replace(/\./g, '') // Remove pontos de milhares
        .replace(',', '.') // Substitui vírgula por ponto decimal
      
      return parseFloat(cleanValue) || 0
    }
    
    // Se tem apenas ponto, pode ser decimal ou milhares
    const pointCount = (sanitized.match(/\./g) || []).length
    if (pointCount > 1) {
      // Múltiplos pontos = separadores de milhares
      const cleanValue = sanitized.replace(/\./g, '')
      return parseFloat(cleanValue) || 0
    } else {
      // Um ponto pode ser decimal (formato americano) ou milhares
      const parts = sanitized.split('.')
      if (parts[1] && parts[1].length === 3) {
        // Provavelmente milhares (ex: 1.234)
        return parseFloat(sanitized.replace('.', '')) || 0
      } else {
        // Provavelmente decimal (ex: 1.50)
        return parseFloat(sanitized) || 0
      }
    }
  }

  // Formatar número para exibição pt-BR (ex: 787.87 → 787,87)
  const formatToPtBR = (numericValue: number): string => {
    if (numericValue === 0) return ''
    
    return numericValue.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  }

  // Formatar valor para exibição com símbolo R$
  const formatBRL = (numericValue: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(numericValue)
  }

  // Formatar valor quando o usuário sai do campo (onBlur)
  const formatOnBlur = (inputValue: string): string => {
    if (!inputValue.trim()) return ''
    
    const numericValue = parseToCanonical(inputValue)
    
    if (numericValue === 0) return ''
    
    return formatToPtBR(numericValue)
  }

  // Remover formatação quando o usuário entra no campo (onFocus)
  const unformatOnFocus = (formattedValue: string): string => {
    if (!formattedValue) return ''
    
    const numericValue = parseToCanonical(formattedValue)
    
    if (numericValue === 0) return ''
    
    // Retornar valor sem formatação para edição livre
    return numericValue.toString().replace('.', ',')
  }

  // Garantir duas casas decimais no valor canônico
  const ensureTwoDecimals = (numericValue: number): number => {
    return Math.round(numericValue * 100) / 100
  }

  // Obter valor canônico com duas casas decimais garantidas
  const getCanonicalValue = (inputValue: string): number => {
    const numericValue = parseToCanonical(inputValue)
    return ensureTwoDecimals(numericValue)
  }

  // Validar se o valor é maior que zero
  const isValid = (inputValue: string): boolean => {
    const numericValue = parseToCanonical(inputValue)
    return numericValue > 0
  }

  return {
    formatBRL,
    formatToPtBR,
    formatOnBlur,
    unformatOnFocus,
    parseToCanonical,
    getCanonicalValue,
    isValid,
    sanitizeInput,
    ensureTwoDecimals,
    formatValue: formatBRL,
    parseValue: parseToCanonical
  }
}