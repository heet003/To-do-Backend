const message = {
  401: {
    message: "Unauthorized access",
    httpCode: 401,
  },
  403: {
    message: "You don't have permission to perform this action",
    httpCode: 403,
  },
  1001: {
    message: "An unexpected error occurred on the server",
    httpCode: 500,
  },
  1004: {
    message: "Phone number is required",
    httpCode: 400,
  },
  2001: {
    message: "Username is required",
    httpCode: 400,
  },
  2002: {
    message: "Email is required",
    httpCode: 400,
  },
  2003: {
    message: "Email is invalid",
    httpCode: 400,
  },
  2004: {
    message: "Password is required",
    httpCode: 400,
  },
  2005: {
    message: "Password must be between 6 and 20 characters",
    httpCode: 400,
  },
  2006: {
    message: "Invalid credentials",
    httpCode: 401,
  },
  2007: {
    message: "User not found",
    httpCode: 404,
  },
  3001: {
    message: "To-do title is required",
    httpCode: 400,
  },
  3002: {
    message: "To-do description is required",
    httpCode: 400,
  },
  3003: {
    message: "To-do not found",
    httpCode: 404,
  },
  3004: {
    message: "Failed to create to-do",
    httpCode: 500,
  },
  3005: {
    message: "Failed to update to-do",
    httpCode: 500,
  },
  3006: {
    message: "Failed to delete to-do",
    httpCode: 500,
  },
  3007: {
    message: "To-do deletion not allowed for this user",
    httpCode: 403,
  },
  4000: {
    message: "Operation successful",
    httpCode: 200,
  },
};

module.exports = message;
