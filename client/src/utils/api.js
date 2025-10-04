// Helper to get auth headers
export const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

// Helper for FormData requests (no Content-Type header)
export const getAuthHeadersForFormData = () => {
  const token = localStorage.getItem('token');
  const headers = {};
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

// Helper to handle API errors and return user-friendly messages
export const handleApiError = async (response) => {
  if (!response.ok) {
    try {
      const data = await response.json();
      
      // Permission errors
      if (response.status === 403) {
        return {
          message: data.error || 'Permission denied',
          detail: data.requiredRole ? `Required: ${data.requiredRole}` : null
        };
      }
      
      // Auth errors
      if (response.status === 401) {
        return {
          message: 'Please login again',
          detail: 'Your session has expired'
        };
      }
      
      // Other errors
      return {
        message: data.error || `Error: ${response.status}`,
        detail: data.limitMB ? `File size limit: ${data.limitMB}MB` : null
      };
    } catch {
      return {
        message: `Error: ${response.status}`,
        detail: null
      };
    }
  }
  return null;
};

