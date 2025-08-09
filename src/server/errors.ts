export const requestError = () =>
  Response.json({
    error: "requestError",
    message: "error while sending request through proxy",
  });

export const invalidEndpoint = () =>
  Response.json({
    error: "invalidEndpoint",
    message: "invalid endpoint",
  });

export const sessionError = {
  error: "SESSION_ERROR",
  message: "Session is required but not found.",
};
