export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * A wrapper around the native fetch API that automatically injects the JWT token
 * from sessionStorage and handles 401/403 unauthorized responses globally.
 */
export const authFetch = async (url, options = {}) => {
    // We strictly use the ikigai_ prefix to prevent collisions with other apps
    const token = sessionStorage.getItem('ikigai_token');
    
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(`${API_URL}${url}`, {
            ...options,
            headers,
        });

        // Global interceptor for expired or invalid tokens
        if (response.status === 401 || response.status === 403) {
            sessionStorage.removeItem('ikigai_token');
            sessionStorage.removeItem('ikigai_email');
            sessionStorage.removeItem('ikigai_role');
            
            // Redirect to login if they aren't already there
            if (window.location.pathname !== '/') {
                window.location.href = '/';
            }
        }

        return response;
    } catch (error) {
        console.error('Fetch Error:', error);
        throw error;
    }
};
