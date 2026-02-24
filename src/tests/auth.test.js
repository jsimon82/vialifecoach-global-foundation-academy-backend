import { expect } from 'chai';
import sinon from 'sinon';
import * as TokenService from '../services/token.service.js';
import { validateEmail, validatePassword } from '../utils/validator.js';

describe('Authentication Tests', () => {
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('Token Service', () => {
    const mockPayload = { id: 1, email: 'test@vialifecoach-academy.com' };

    describe('generateToken', () => {
      it('should generate a valid JWT token', () => {
        const token = TokenService.generateToken(mockPayload);
        expect(token).to.be.a('string');
        expect(token.split('.')).to.have.lengthOf(3); // JWT has 3 parts
      });
    });

    describe('verifyToken', () => {
      it('should verify a valid token and return payload', () => {
        const token = TokenService.generateToken(mockPayload);
        const decoded = TokenService.verifyToken(token);
        expect(decoded.id).to.equal(mockPayload.id);
        expect(decoded.email).to.equal(mockPayload.email);
      });

      it('should throw error for invalid token', () => {
        expect(() => TokenService.verifyToken('invalid.token.here')).to.throw();
      });
    });

    describe('generateRefreshToken', () => {
      it('should generate a refresh token', () => {
        const refreshToken = TokenService.generateRefreshToken(mockPayload);
        expect(refreshToken).to.be.a('string');
        expect(refreshToken.split('.')).to.have.lengthOf(3);
      });
    });

    describe('extractTokenFromHeader', () => {
      it('should extract token from Bearer header', () => {
        const authHeader = 'Bearer abc123.def456.ghi789';
        const token = TokenService.extractTokenFromHeader(authHeader);
        expect(token).to.equal('abc123.def456.ghi789');
      });

      it('should return null for invalid header', () => {
        expect(TokenService.extractTokenFromHeader('Invalid header')).to.be.null;
        expect(TokenService.extractTokenFromHeader(null)).to.be.null;
      });
    });
  });

  describe('Validators', () => {
    describe('validateEmail', () => {
      it('should validate correct email', () => {
        expect(validateEmail('test@vialifecoach-academy.com')).to.be.true;
        expect(validateEmail('user.name+tag@example.co.uk')).to.be.true;
      });

      it('should reject invalid email', () => {
        expect(validateEmail('invalid-email')).to.be.false;
        expect(validateEmail('test@')).to.be.false;
        expect(validateEmail('@example.com')).to.be.false;
      });
    });

    describe('validatePassword', () => {
      it('should validate strong password', () => {
        expect(validatePassword('StrongPass123')).to.be.true;
        expect(validatePassword('Another!Pass9')).to.be.true;
      });

      it('should reject weak password', () => {
        expect(validatePassword('weak')).to.be.false;
        expect(validatePassword('12345678')).to.be.false;
        expect(validatePassword('password')).to.be.false;
        expect(validatePassword('PASSWORD')).to.be.false;
      });
    });
  });
});
