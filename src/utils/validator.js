import logger from './logger.js';

export function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isValid = emailRegex.test(email);
  if (!isValid) {
    logger.warn('Invalid email format', { email });
  }
  return isValid;
}

export function validatePassword(password) {
  // At least 8 characters, one uppercase, one lowercase, one number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
  const isValid = passwordRegex.test(password);
  if (!isValid) {
    logger.warn('Invalid password format');
  }
  return isValid;
}

export function validateCourseData(courseData) {
  const { title, description, instructor_id } = courseData;
  const errors = [];

  if (!title || typeof title !== 'string' || title.trim().length < 3) {
    errors.push('Title must be a string with at least 3 characters');
  }

  if (!description || typeof description !== 'string' || description.trim().length < 10) {
    errors.push('Description must be a string with at least 10 characters');
  }

  if (!instructor_id || typeof instructor_id !== 'number' || instructor_id <= 0) {
    errors.push('Instructor ID must be a positive number');
  }

  if (errors.length > 0) {
    logger.warn('Course data validation failed', { errors });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validatePaymentData(paymentData) {
  const { method, amount, courseId, userId } = paymentData;
  const errors = [];
  const validMethods = ['paypal', 'bank_transfer', 'mpesa'];

  if (!method || !validMethods.includes(method)) {
    errors.push('Invalid payment method');
  }

  if (!amount || typeof amount !== 'number' || amount <= 0) {
    errors.push('Amount must be a positive number');
  }

  if (!courseId || typeof courseId !== 'number' || courseId <= 0) {
    errors.push('Course ID must be a positive number');
  }

  if (!userId || typeof userId !== 'number' || userId <= 0) {
    errors.push('User ID must be a positive number');
  }

  if (errors.length > 0) {
    logger.warn('Payment data validation failed', { errors });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  return input.trim().replace(/[<>]/g, '');
}
