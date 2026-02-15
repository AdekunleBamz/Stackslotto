/**
 * Form validation utilities
 * Provides reusable validation functions for the application
 */

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

/**
 * Validate Stacks wallet address format
 */
export function validateStacksAddress(address: string): boolean {
  if (!address) return false;
  // Stacks addresses start with 'SP' or 'SM' followed by alphanumeric characters
  const stacksAddressRegex = /^(SP|SM)[A-Z0-9]{30,32}$/;
  return stacksAddressRegex.test(address.toUpperCase());
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate positive integer
 */
export function validatePositiveInt(value: string | number): boolean {
  const num = typeof value === 'string' ? parseInt(value, 10) : value;
  return Number.isInteger(num) && num > 0;
}

/**
 * Validate minimum value
 */
export function validateMinValue(value: number, min: number): boolean {
  return value >= min;
}

/**
 * Validate maximum value
 */
export function validateMaxValue(value: number, max: number): boolean {
  return value <= max;
}

/**
 * Validate string length
 */
export function validateStringLength(
  value: string,
  minLength?: number,
  maxLength?: number
): boolean {
  if (minLength && value.length < minLength) return false;
  if (maxLength && value.length > maxLength) return false;
  return true;
}

/**
 * Validate STX amount (in microSTX)
 */
export function validateSTXAmount(amountMicroSTX: number): boolean {
  if (!Number.isInteger(amountMicroSTX) || amountMicroSTX <= 0) return false;
  // Maximum STX amount (prevent overflow)
  const MAX_STX = 21000000 * 1000000; // 21 million STX in microSTX
  return amountMicroSTX <= MAX_STX;
}

/**
 * Create field-level validator
 */
export class FormValidator {
  private errors: ValidationError[] = [];

  addError(field: string, message: string): void {
    this.errors.push({ field, message });
  }

  validateRequired(field: string, value: any): boolean {
    if (value === null || value === undefined || value === '') {
      this.addError(field, `${field} is required`);
      return false;
    }
    return true;
  }

  validateStacksAddress(field: string, address: string): boolean {
    if (!this.validateRequired(field, address)) return false;
    if (!validateStacksAddress(address)) {
      this.addError(field, 'Invalid Stacks wallet address format');
      return false;
    }
    return true;
  }

  validateEmail(field: string, email: string): boolean {
    if (!this.validateRequired(field, email)) return false;
    if (!validateEmail(email)) {
      this.addError(field, 'Invalid email format');
      return false;
    }
    return true;
  }

  validateTicketCount(field: string, count: number): boolean {
    if (!this.validateRequired(field, count)) return false;
    if (!validatePositiveInt(count)) {
      this.addError(field, 'Ticket count must be a positive integer');
      return false;
    }
    if (count > 1000) {
      this.addError(field, 'Maximum 1000 tickets per transaction');
      return false;
    }
    return true;
  }

  validateSTXAmount(field: string, amountMicroSTX: number): boolean {
    if (!this.validateRequired(field, amountMicroSTX)) return false;
    if (!validateSTXAmount(amountMicroSTX)) {
      this.addError(field, 'Invalid STX amount');
      return false;
    }
    return true;
  }

  validateStringLength(
    field: string,
    value: string,
    minLength?: number,
    maxLength?: number
  ): boolean {
    if (!this.validateRequired(field, value)) return false;
    if (!validateStringLength(value, minLength, maxLength)) {
      const constraints = [];
      if (minLength) constraints.push(`minimum ${minLength} characters`);
      if (maxLength) constraints.push(`maximum ${maxLength} characters`);
      this.addError(field, `${field} must have ${constraints.join(' and ')}`);
      return false;
    }
    return true;
  }

  clear(): void {
    this.errors = [];
  }

  getErrors(): ValidationError[] {
    return this.errors;
  }

  hasErrors(): boolean {
    return this.errors.length > 0;
  }

  getResult(): ValidationResult {
    return {
      isValid: !this.hasErrors(),
      errors: this.getErrors(),
    };
  }

  getFieldError(field: string): string | undefined {
    return this.errors.find((e) => e.field === field)?.message;
  }
}

/**
 * Sanitize user input to prevent XSS
 */
export function sanitizeInput(input: string): string {
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML;
}
