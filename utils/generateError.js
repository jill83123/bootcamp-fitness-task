const generateError = (statusCode, message) => {
  const error = new Error(message);
  error.isOperational = true;
  error.statusCode = statusCode;
  return error;
};

module.exports = generateError;
