export class Password {
  private readonly value: string;

  constructor(password: string) {
    this.validate(password);
    this.value = password;
  }

  private validate(password: string): void {
    if (!password || typeof password !== 'string') {
      throw new Error('Password is required and must be a string');
    }

    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }

    if (password.length > 128) {
      throw new Error('Password cannot exceed 128 characters');
    }

    // Check for at least one uppercase letter
    if (!/[A-Z]/.test(password)) {
      throw new Error('Password must contain at least one uppercase letter');
    }

    // Check for at least one lowercase letter
    if (!/[a-z]/.test(password)) {
      throw new Error('Password must contain at least one lowercase letter');
    }

    // Check for at least one digit
    if (!/\d/.test(password)) {
      throw new Error('Password must contain at least one digit');
    }

    // Check for at least one special character
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      throw new Error('Password must contain at least one special character');
    }
  }

  getValue(): string {
    return this.value;
  }

  equals(other: Password): boolean {
    return this.value === other.value;
  }

  // For security, don't expose the actual password in toString
  toString(): string {
    return '[PROTECTED]';
  }
}