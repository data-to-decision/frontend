/**
 * Base API client with typed fetch wrapper
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * API Error class with user-friendly messages
 */
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public userMessage: string,
    public technicalMessage: string,
    public code?: string
  ) {
    super(userMessage);
    this.name = 'ApiError';
  }
}

/**
 * Map HTTP status codes and error responses to user-friendly messages
 */
function mapErrorToUserMessage(
  status: number,
  errorBody?: { detail?: string; code?: string }
): { userMessage: string; code?: string } {
  // Handle specific error codes from backend
  if (errorBody?.code) {
    const codeMessages: Record<string, string> = {
      TOKEN_EXPIRED: 'This link has expired. Please request a new one.',
      TOKEN_INVALID: 'This link is invalid. Please request a new one.',
      TOKEN_ALREADY_USED: 'This link has already been used. Please request a new one.',
      EMAIL_INVALID: 'Please enter a valid email address.',
      RATE_LIMITED: 'Too many requests. Please wait a moment and try again.',
      USER_DISABLED: 'Your account has been disabled. Please contact support.',
    };

    if (codeMessages[errorBody.code]) {
      return { userMessage: codeMessages[errorBody.code], code: errorBody.code };
    }
  }

  // Map HTTP status codes to user-friendly messages
  const statusMessages: Record<number, string> = {
    400: 'Invalid request. Please check your input and try again.',
    401: 'Authentication failed. Please try signing in again.',
    403: 'You do not have permission to perform this action.',
    404: 'The requested resource was not found.',
    409: 'This action conflicts with existing data.',
    422: 'Invalid data provided. Please check your input.',
    429: 'Too many requests. Please wait a moment and try again.',
    500: 'Something went wrong on our end. Please try again later.',
    502: 'Service temporarily unavailable. Please try again later.',
    503: 'Service temporarily unavailable. Please try again later.',
    504: 'Request timed out. Please try again.',
  };

  return {
    userMessage: statusMessages[status] || 'An unexpected error occurred. Please try again.',
  };
}

/**
 * Request options for the API client
 */
export interface RequestOptions<TBody = unknown> {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: TBody;
  headers?: Record<string, string>;
  accessToken?: string;
  /**
   * Whether to include credentials (cookies) with the request.
   * Required for httpOnly cookie authentication.
   * Defaults to true for auth endpoints.
   */
  includeCredentials?: boolean;
}

/**
 * Make a typed API request
 */
export async function apiRequest<TResponse, TBody = unknown>(
  endpoint: string,
  options: RequestOptions<TBody> = {}
): Promise<TResponse> {
  const { method = 'GET', body, headers = {}, accessToken, includeCredentials } = options;

  const url = `${API_BASE_URL}${endpoint}`;

  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  };

  if (accessToken) {
    requestHeaders['Authorization'] = `Bearer ${accessToken}`;
  }

  // Determine if we should include credentials (cookies)
  // Always include for auth endpoints, otherwise based on option
  const isAuthEndpoint = endpoint.startsWith('/api/auth/');
  const shouldIncludeCredentials = includeCredentials ?? isAuthEndpoint;

  const requestInit: RequestInit = {
    method,
    headers: requestHeaders,
    // Include credentials for cross-origin requests to send cookies
    credentials: shouldIncludeCredentials ? 'include' : 'same-origin',
  };

  if (body !== undefined) {
    requestInit.body = JSON.stringify(body);
  }

  let response: Response;

  try {
    response = await fetch(url, requestInit);
  } catch (error) {
    // Network error (no internet, CORS, etc.)
    throw new ApiError(
      0,
      'Unable to connect to the server. Please try again after some time.',
      error instanceof Error ? error.message : 'Network error',
      'NETWORK_ERROR'
    );
  }

  // Handle non-JSON responses
  const contentType = response.headers.get('content-type');
  const isJson = contentType?.includes('application/json');

  if (!response.ok) {
    let errorBody: { detail?: string; code?: string } | undefined;

    if (isJson) {
      try {
        errorBody = await response.json();
      } catch {
        // Failed to parse error response
      }
    }

    const { userMessage, code } = mapErrorToUserMessage(response.status, errorBody);

    throw new ApiError(
      response.status,
      userMessage,
      errorBody?.detail || `HTTP ${response.status}`,
      code || errorBody?.code
    );
  }

  // Handle empty responses (204 No Content)
  if (response.status === 204 || !isJson) {
    return {} as TResponse;
  }

  try {
    return await response.json();
  } catch {
    throw new ApiError(
      response.status,
      'Received an invalid response from the server.',
      'JSON parse error',
      'PARSE_ERROR'
    );
  }
}

/**
 * Shorthand methods for common HTTP verbs
 */
export const api = {
  get: <TResponse>(endpoint: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    apiRequest<TResponse>(endpoint, { ...options, method: 'GET' }),

  post: <TResponse, TBody = unknown>(endpoint: string, body?: TBody, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    apiRequest<TResponse, TBody>(endpoint, { ...options, method: 'POST', body }),

  put: <TResponse, TBody = unknown>(endpoint: string, body?: TBody, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    apiRequest<TResponse, TBody>(endpoint, { ...options, method: 'PUT', body }),

  patch: <TResponse, TBody = unknown>(endpoint: string, body?: TBody, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    apiRequest<TResponse, TBody>(endpoint, { ...options, method: 'PATCH', body }),

  delete: <TResponse>(endpoint: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    apiRequest<TResponse>(endpoint, { ...options, method: 'DELETE' }),
};
