export const notFoundHandler = (req, res) => {
  res.status(404).json({
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
};

export const errorHandler = (error, req, res, next) => {
  const statusCode = error.statusCode || 500;
  
  console.log('');
  console.log('ERROR CAUGHT:');
  console.log('Status:', statusCode);
  console.log('Message:', error.message);
  console.log('');

  res.status(statusCode).json({
    message: error.message || "Internal server error",
  });
};
