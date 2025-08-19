import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  userType: 'reviewer' | 'speaker';
  speakerId?: number;
}

export interface Speaker {
  id: number;
  name: string;
  slug: string;
  title: string;
  verified: boolean;
  imageUrl: string;
}

export interface AuthResponse {
  user: AuthUser;
  speaker?: Speaker;
  token: string;
}

export function useAuth() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/auth/me"],
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    user: data?.user as AuthUser | undefined,
    speaker: data?.speaker as Speaker | undefined,
    isLoading,
    isAuthenticated: !!data?.user,
    isReviewer: data?.user?.userType === 'reviewer',
    isSpeaker: data?.user?.userType === 'speaker',
    error,
  };
}

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      return apiRequest("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(credentials),
      });
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/auth/me"], data);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
  });
}

export function useRegisterReviewer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userData: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      title?: string;
      company?: string;
    }) => {
      return apiRequest("/api/auth/register/reviewer", {
        method: "POST",
        body: JSON.stringify(userData),
      });
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/auth/me"], data);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
  });
}

export function useRegisterSpeaker() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userData: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      title?: string;
      company?: string;
      speakerId: number;
    }) => {
      return apiRequest("/api/auth/register/speaker", {
        method: "POST",
        body: JSON.stringify(userData),
      });
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/auth/me"], data);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      return apiRequest("/api/auth/logout", {
        method: "POST",
      });
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/me"], null);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      window.location.href = "/";
    },
  });
}

export function useVerifySpeaker() {
  return useMutation({
    mutationFn: async (data: { speakerId: number; email: string }) => {
      return apiRequest("/api/auth/verify-speaker", {
        method: "POST", 
        body: JSON.stringify(data),
      });
    },
  });
}

export function useCheckEmail() {
  return useMutation({
    mutationFn: async (email: string) => {
      return apiRequest("/api/auth/check-email", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
    },
  });
}