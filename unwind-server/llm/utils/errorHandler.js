/**
 * Simple LLM Error Handler
 * Basic error handling functions
 */

// Error types
const ErrorTypes = {
  CONFIGURATION_ERROR: 'CONFIGURATION_ERROR',
  API_ERROR: 'API_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  RATE_LIMIT_ERROR: 'RATE_LIMIT_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
};

/**
 * Create a simple error
 */
function createError(type, message, statusCode = 500) {
  const error = new Error(message);
  error.type = type;
  error.statusCode = statusCode;
  error.timestamp = new Date().toISOString();
  return error;
}

/**
 * Handle API errors
 */
function handleApiError(error, context = 'API') {
  if (error.response) {
    const { status, data } = error.response;
    const message = data?.message || `${context} request failed`;
    
    if (status === 400) {
      return createError(ErrorTypes.VALIDATION_ERROR, message, 400);
    }
    if (status === 401) {
      return createError(ErrorTypes.CONFIGURATION_ERROR, `${context} authentication failed`, 401);
    }
    if (status === 429) {
      return createError(ErrorTypes.RATE_LIMIT_ERROR, `${context} rate limit exceeded`, 429);
    }
    if (status >= 500) {
      return createError(ErrorTypes.API_ERROR, `${context} service error`, 500);
    }
    
    return createError(ErrorTypes.API_ERROR, message, status);
  }

  if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
    return createError(ErrorTypes.TIMEOUT_ERROR, `${context} request timed out`, 408);
  }

  if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
    return createError(ErrorTypes.API_ERROR, `Cannot connect to ${context}`, 503);
  }

  return createError(ErrorTypes.UNKNOWN_ERROR, `${context} error: ${error.message}`, 500);
}

/**
 * Handle validation errors
 */
function handleValidationError(message) {
  return createError(ErrorTypes.VALIDATION_ERROR, message, 400);
}

/**
 * Handle configuration errors
 */
function handleConfigurationError(message) {
  return createError(ErrorTypes.CONFIGURATION_ERROR, message, 500);
}

/**
 * Convert error to HTTP response
 */
function toHttpResponse(error) {
  if (error.type && error.statusCode) {
    return {
      statusCode: error.statusCode,
      body: {
        error: {
          type: error.type,
          message: error.message,
          timestamp: error.timestamp
        }
      }
    };
  }

  // Handle unknown errors
  return {
    statusCode: 500,
    body: {
      error: {
        type: ErrorTypes.UNKNOWN_ERROR,
        message: 'An unexpected error occurred',
        timestamp: new Date().toISOString()
      }
    }
  };
}

/**
 * Simple error logging
 */
function logError(error, context = 'LLM') {
  const prefix = `[${context}]`;
  
  if (error.type === ErrorTypes.VALIDATION_ERROR) {
    console.warn(`${prefix} Validation Error:`, error.message);
  } else {
    console.error(`${prefix} Error:`, error.message);
  }
}

module.exports = {
  ErrorTypes,
  createError,
  handleApiError,
  handleValidationError,
  handleConfigurationError,
  toHttpResponse,
  logError
};