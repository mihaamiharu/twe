import { describe, it, expect } from 'bun:test';
import {
  signUpSchema,
  signInSchema,
  validateInput,
  localizedStringSchema,
  challengeTypeSchema,
  challengeDifficultySchema,
  testCaseDefinitionSchema,
  expectedStateRuleSchema,
} from '../../lib/validations';

describe('Validations', () => {
  describe('signUpSchema', () => {
    it('should validate correct input', () => {
      const result = signUpSchema.safeParse({
        email: 'test@example.com',
        password: 'password123',
        name: 'John Doe',
      });
      expect(result.success).toBe(true);
    });

    it('should fail on invalid email', () => {
      const result = signUpSchema.safeParse({
        email: 'invalid-email',
        password: 'password123',
        name: 'John Doe',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          'Please enter a valid email',
        );
      }
    });

    it('should fail on short password', () => {
      const result = signUpSchema.safeParse({
        email: 'test@example.com',
        password: 'short',
        name: 'John Doe',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          'Password must be at least 8 characters',
        );
      }
    });

    it('should fail on short name', () => {
      const result = signUpSchema.safeParse({
        email: 'test@example.com',
        password: 'password123',
        name: 'A',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          'Name must be at least 2 characters',
        );
      }
    });
  });

  describe('signInSchema', () => {
    it('should validate correct input', () => {
      const result = signInSchema.safeParse({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(result.success).toBe(true);
    });

    it('should fail on empty fields', () => {
      const result = signInSchema.safeParse({
        email: '',
        password: '',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('validateInput helper', () => {
    it('should return formatted errors', () => {
      const result = validateInput(signUpSchema, {
        email: 'bad',
        password: '123',
        name: '',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors).toHaveProperty('email');
        expect(result.errors).toHaveProperty('password');
        expect(result.errors).toHaveProperty('name');
      }
    });

    it('should return data on success', () => {
      const data = {
        email: 'test@example.com',
        password: 'password123',
        name: 'John Doe',
      };
      const result = validateInput(signUpSchema, data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(data);
      }
    });
  });

  describe('localizedStringSchema', () => {
    it('should validate valid English string', () => {
      const result = localizedStringSchema.safeParse({ en: 'Hello' });
      expect(result.success).toBe(true);
    });

    it('should validate valid English and Indonesian string', () => {
      const result = localizedStringSchema.safeParse({ en: 'Hello', id: 'Halo' });
      expect(result.success).toBe(true);
    });

    it('should fail if English is missing', () => {
      const result = localizedStringSchema.safeParse({ id: 'Halo' });
      expect(result.success).toBe(false);
    });

    it('should fail if English is empty', () => {
      const result = localizedStringSchema.safeParse({ en: '' });
      expect(result.success).toBe(false);
    });
  });

  describe('challengeTypeSchema', () => {
    it('should validate valid types', () => {
      const types = ['CSS_SELECTOR', 'XPATH_SELECTOR', 'JAVASCRIPT', 'TYPESCRIPT', 'PLAYWRIGHT'];
      types.forEach(type => {
        expect(challengeTypeSchema.safeParse(type).success).toBe(true);
      });
    });

    it('should fail on invalid type', () => {
      expect(challengeTypeSchema.safeParse('INVALID').success).toBe(false);
    });
  });

  describe('challengeDifficultySchema', () => {
    it('should validate valid difficulties', () => {
      const difficulties = ['EASY', 'MEDIUM', 'HARD'];
      difficulties.forEach(difficulty => {
        expect(challengeDifficultySchema.safeParse(difficulty).success).toBe(true);
      });
    });

    it('should fail on invalid difficulty', () => {
      expect(challengeDifficultySchema.safeParse('INSANE').success).toBe(false);
    });
  });

  describe('testCaseDefinitionSchema', () => {
    it('should validate valid test case', () => {
      const result = testCaseDefinitionSchema.safeParse({
        description: 'Test description',
        expectedOutput: 'Expected',
      });
      expect(result.success).toBe(true);
    });

    it('should validate complete test case', () => {
      const result = testCaseDefinitionSchema.safeParse({
        description: 'Test description',
        input: 'Input',
        expectedOutput: 'Expected',
        isHidden: true,
      });
      expect(result.success).toBe(true);
    });
  });

  describe('expectedStateRuleSchema', () => {
    it('should validate simple selector rule', () => {
      const result = expectedStateRuleSchema.safeParse({
        selector: '.btn',
      });
      expect(result.success).toBe(true);
    });

    it('should validate complex rule', () => {
      const result = expectedStateRuleSchema.safeParse({
        selector: '.btn',
        visible: true,
        containsText: 'Submit',
        count: 1,
      });
      expect(result.success).toBe(true);
    });

    it('should validate hasAttribute rule', () => {
      const result = expectedStateRuleSchema.safeParse({
        selector: 'input',
        hasAttribute: {
          name: 'type',
          value: 'text',
        },
      });
      expect(result.success).toBe(true);
    });

    it('should validate hasAttribute rule with RegExp', () => {
      const result = expectedStateRuleSchema.safeParse({
        selector: 'input',
        hasAttribute: {
          name: 'class',
          value: /form-control/,
        },
      });
      expect(result.success).toBe(true);
    });
  });
});
