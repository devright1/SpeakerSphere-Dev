import { queryClient } from "./queryClient";

export async function fetchSpeakers(filters?: any) {
  const params = new URLSearchParams();
  
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        params.append(key, (value as string | number | boolean).toString());
      }
    });
  }
  
  const response = await fetch(`/api/speakers?${params.toString()}`);
  if (!response.ok) throw new Error("Failed to fetch speakers");
  return response.json();
}

export async function fetchSpeaker(id: string) {
  const response = await fetch(`/api/speakers/${id}`);
  if (!response.ok) throw new Error("Failed to fetch speaker");
  return response.json();
}

export async function fetchSpeakerReviews(id: string) {
  const response = await fetch(`/api/speakers/${id}/reviews`);
  if (!response.ok) throw new Error("Failed to fetch reviews");
  return response.json();
}

export async function fetchCategories() {
  const response = await fetch("/api/categories");
  if (!response.ok) throw new Error("Failed to fetch categories");
  return response.json();
}

export async function fetchSearchSuggestions(query: string) {
  if (!query || query.length < 2) return [];
  
  const response = await fetch(`/api/search/suggestions?q=${encodeURIComponent(query)}`);
  if (!response.ok) return [];
  return response.json();
}

export async function createInquiry(speakerId: string, inquiryData: any) {
  const response = await fetch(`/api/speakers/${speakerId}/inquiries`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(inquiryData),
    credentials: "include",
  });
  
  if (!response.ok) throw new Error("Failed to create inquiry");
  return response.json();
}

export async function createReview(speakerId: string, reviewData: any) {
  const response = await fetch(`/api/speakers/${speakerId}/reviews`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(reviewData),
    credentials: "include",
  });
  
  if (!response.ok) throw new Error("Failed to create review");
  
  // Invalidate related queries
  queryClient.invalidateQueries({ queryKey: ["/api/speakers", speakerId, "reviews"] });
  queryClient.invalidateQueries({ queryKey: ["/api/speakers", speakerId] });
  
  return response.json();
}
