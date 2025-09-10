import { QueryClient, QueryFunction } from "@tanstack/react-query";


export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<any> {
  // Get user ID from localStorage for authentication header
  const userToken = localStorage.getItem('userToken');
  
  const headers: Record<string, string> = {};
  if (data) {
    headers["Content-Type"] = "application/json";
  }
  
  // Add X-User-ID header for authentication if user token exists
  if (userToken) {
    headers["X-User-ID"] = userToken;
  }

  console.log('API Request Debug:', { 
    url, 
    method, 
    userToken: userToken ? `${userToken.substring(0, 8)}...` : 'null',
    headers: Object.keys(headers)
  });

  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  // Handle both success and error responses here
  if (!res.ok) {
    const text = await res.text();
    console.log('Raw error response:', text);
    
    try {
      const jsonResponse = JSON.parse(text);
      console.log('Parsed error response:', jsonResponse);
      
      // Handle different error response formats
      let errorMessage = jsonResponse.message || jsonResponse.error || text || res.statusText;
      
      // If it's a validation error with details, extract the first error message
      if (jsonResponse.details && Array.isArray(jsonResponse.details) && jsonResponse.details.length > 0) {
        errorMessage = jsonResponse.details[0].msg || errorMessage;
      }
      
      throw new Error(errorMessage);
    } catch (jsonError) {
      // If JSON parsing fails, use the raw text or status text
      throw new Error(text || res.statusText || 'An error occurred');
    }
  }

  // For successful responses, return the parsed JSON
  return await res.json();
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Get user ID from localStorage for authentication header
    const userToken = localStorage.getItem('userToken');
    
    const headers: Record<string, string> = {};
    // Add X-User-ID header for authentication if user token exists
    if (userToken) {
      headers["X-User-ID"] = userToken;
    }

    console.log('Query Request Debug:', { 
      url: queryKey[0], 
      userToken: userToken ? `${userToken.substring(0, 8)}...` : 'null',
      headers: Object.keys(headers)
    });

    const res = await fetch(queryKey[0] as string, {
      headers,
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    // Handle error responses  
    if (!res.ok) {
      try {
        const text = await res.text();
        const jsonResponse = JSON.parse(text);
        const errorMessage = jsonResponse.message || jsonResponse.error || text || res.statusText;
        throw new Error(errorMessage);
      } catch (parseError) {
        if (parseError instanceof Error && parseError.message && !parseError.message.includes('Unexpected token')) {
          throw parseError;
        }
        throw new Error(res.statusText || 'An error occurred');
      }
    }
    
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
