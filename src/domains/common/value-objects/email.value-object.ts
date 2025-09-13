export class Email {
  private readonly value: string;

  constructor(email: string) {
    this.validate(email);
    this.value = email.toLowerCase().trim();
  }

  private validate(email: string): void {
    if (email === null || email === undefined || typeof email !== 'string') {
      throw new Error('Email is required and must be a string');
    }

    const trimmedEmail = email.trim();
    if (trimmedEmail.length === 0) {
      throw new Error('Email cannot be empty');
    }

    if (trimmedEmail.length > 254) {
      throw new Error('Email cannot exceed 254 characters');
    }

    // More strict email validation
    const emailRegex = /^[a-zA-Z0-9]([a-zA-Z0-9._%-]*[a-zA-Z0-9])?@[a-zA-Z0-9]([a-zA-Z0-9.-]*[a-zA-Z0-9])?\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(trimmedEmail)) {
      throw new Error('Invalid email format');
    }

    // Additional checks for common invalid patterns
    if (trimmedEmail.includes('..') || trimmedEmail.includes(' ')) {
      throw new Error('Invalid email format');
    }
  }

  getValue(): string {
    return this.value;
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}