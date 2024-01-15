export const requestError = Response.json({
    error: "requestError",
    message: "error while sending request through proxy",
});

export const invalidEndpoint = Response.json({
    error: "invalidEndpoint",
    message: "invalid endpoint",
});

export const sessionError = Response.json({
    error: "noSession",
    message: "no session found",
});
