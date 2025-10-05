import React, { forwardRef, useState } from 'react'
import { Input } from './input'
import { cn } from '../../lib/utils'

export interface CurrencyInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value?: number
  onChange?: (value: number) => void
  showError?: boolean
  errorMessage?: string
}

const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ 
    className, 
    value = 0, 
    onChange, 
    showError = false,
    errorMessage = 'Valor deve ser maior que zero',
    disabled,
    placeholder = 'Digite o valor...',
    ...props 
  }, ref) => {
    const [displayValue, setDisplayValue] = useState('')
    const [isFocused, setIsFocused] = useState(false)

    // Sincronizar valor inicial APENAS quando não está focado
    React.useEffect(() => {
      if (!isFocused) {
        if (value > 0) {
          setDisplayValue(formatToPtBR(value))
        } else {
          setDisplayValue('')
        }
      }
    }, [value, isFocused])

    // Função para formatar número para exibição (com R$)
    const formatToPtBR = (num: number): string => {
      return num.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      })
    }

    // Função para converter string para número
    const parseToNumber = (str: string): number => {
      if (!str || str.trim() === '') return 0
      
      // Remove tudo exceto números, vírgula e ponto
      const cleaned = str.replace(/[^\d.,]/g, '')
      if (!cleaned) return 0
      
      // Se tem vírgula, trata como separador decimal pt-BR
      if (cleaned.includes(',')) {
        // Para "787,87" -> converter para 787.87
        const parts = cleaned.split(',')
        const integerPart = parts[0] // Manter como está: "787"
        const decimalPart = parts[1] ? parts[1].substring(0, 2) : '00' // Pegar apenas 2 dígitos: "87"
        return parseFloat(`${integerPart}.${decimalPart}`) || 0
      }
      
      // Se tem apenas ponto, trata como decimal
      if (cleaned.includes('.')) {
        return parseFloat(cleaned) || 0
      }
      
      // Se não tem vírgula nem ponto, trata como número inteiro
      return parseInt(cleaned) || 0
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value
      
      // CRÍTICO: Permitir apenas números, vírgula e ponto - REMOVER LETRAS
      const sanitized = inputValue.replace(/[^0-9.,]/g, '')
      
      // DURANTE A DIGITAÇÃO: Mostrar EXATAMENTE o que foi digitado (SEM formatação)
      setDisplayValue(sanitized)
      
      // Converter para número e notificar mudança
      const numericValue = parseToNumber(sanitized)
      onChange?.(numericValue)
    }

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true)
      
      // Ao focar, converter valor formatado para valor editável simples
      if (value > 0) {
        // Converter o valor numérico para string simples (sem formatação)
        const simpleValue = value.toString().replace('.', ',')
        setDisplayValue(simpleValue)
      } else {
        setDisplayValue('')
      }
      
      props.onFocus?.(e)
    }

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false)
      
      // Aplicar formatação quando sair do campo
      const numericValue = parseToNumber(displayValue)
      if (numericValue > 0) {
        setDisplayValue(formatToPtBR(numericValue))
        onChange?.(numericValue)
      } else {
        setDisplayValue('')
        onChange?.(0)
      }
      
      props.onBlur?.(e)
    }

    const isInvalid = showError && parseToNumber(displayValue) <= 0

    return (
      <div className="relative">
        <Input
          ref={ref}
          type="text"
          value={displayValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          placeholder={placeholder}
          className={cn(
            "text-right",
            isInvalid && "border-red-500 focus:border-red-500 focus:ring-red-500",
            className
          )}
          {...props}
        />
        {isInvalid && (
          <p className="text-sm text-red-500 mt-1">
            {errorMessage}
          </p>
        )}
      </div>
    )
  }
)

CurrencyInput.displayName = "CurrencyInput"

export { CurrencyInput }