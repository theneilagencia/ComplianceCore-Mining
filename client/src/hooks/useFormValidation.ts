import { useState, useCallback, useMemo } from 'react';

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
  message?: string;
}

export interface FieldConfig {
  [fieldName: string]: ValidationRule;
}

export interface ValidationErrors {
  [fieldName: string]: string | null;
}

export function useFormValidation(config: FieldConfig) {
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Validar um campo específico
  const validateField = useCallback(
    (fieldName: string, value: any): string | null => {
      const rules = config[fieldName];
      if (!rules) return null;

      // Required
      if (rules.required) {
        if (value === undefined || value === null || value === '') {
          return rules.message || 'Este campo é obrigatório';
        }
      }

      // Se o campo está vazio e não é obrigatório, não validar outras regras
      if (value === undefined || value === null || value === '') {
        return null;
      }

      // MinLength
      if (rules.minLength && typeof value === 'string') {
        if (value.length < rules.minLength) {
          return rules.message || `Mínimo de ${rules.minLength} caracteres`;
        }
      }

      // MaxLength
      if (rules.maxLength && typeof value === 'string') {
        if (value.length > rules.maxLength) {
          return rules.message || `Máximo de ${rules.maxLength} caracteres`;
        }
      }

      // Pattern
      if (rules.pattern && typeof value === 'string') {
        if (!rules.pattern.test(value)) {
          return rules.message || 'Formato inválido';
        }
      }

      // Custom validation
      if (rules.custom) {
        return rules.custom(value);
      }

      return null;
    },
    [config]
  );

  // Validar todos os campos
  const validateAll = useCallback(
    (values: Record<string, any>): boolean => {
      const newErrors: ValidationErrors = {};
      let isValid = true;

      Object.keys(config).forEach((fieldName) => {
        const error = validateField(fieldName, values[fieldName]);
        newErrors[fieldName] = error;
        if (error) isValid = false;
      });

      setErrors(newErrors);
      return isValid;
    },
    [config, validateField]
  );

  // Marcar campo como touched
  const touchField = useCallback((fieldName: string) => {
    setTouched((prev) => ({ ...prev, [fieldName]: true }));
  }, []);

  // Validar campo e atualizar erro
  const validateAndSet = useCallback(
    (fieldName: string, value: any) => {
      const error = validateField(fieldName, value);
      setErrors((prev) => ({ ...prev, [fieldName]: error }));
      return error;
    },
    [validateField]
  );

  // Limpar erros
  const clearErrors = useCallback(() => {
    setErrors({});
    setTouched({});
  }, []);

  // Limpar erro de um campo específico
  const clearFieldError = useCallback((fieldName: string) => {
    setErrors((prev) => ({ ...prev, [fieldName]: null }));
  }, []);

  // Verificar se há erros
  const hasErrors = useMemo(() => {
    return Object.values(errors).some((error) => error !== null);
  }, [errors]);

  // Obter erro de um campo (apenas se touched)
  const getFieldError = useCallback(
    (fieldName: string): string | null => {
      if (!touched[fieldName]) return null;
      return errors[fieldName] || null;
    },
    [errors, touched]
  );

  return {
    errors,
    touched,
    hasErrors,
    validateField,
    validateAll,
    validateAndSet,
    touchField,
    clearErrors,
    clearFieldError,
    getFieldError,
  };
}

