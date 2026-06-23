import axios from "axios";
import toast from "react-hot-toast";

export const api = axios.create({
  baseURL: "/api",
});

import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";
import { auth } from "./firebase";

export async function searchFlights(departure: string, arrival: string, outbound_date?: string, return_date?: string) {
  try {
    const response = await api.get("/flights", { params: { departure_id: departure, arrival_id: arrival, outbound_date, return_date } });
    return response.data;
  } catch (error) {
    console.error("Flight search error:", error);
    toast.error("Failed to retrieve flight data.");
    throw error;
  }
}

export async function searchFlightDeals(departure: string) {
  try {
    const response = await api.get("/flights/deals", { params: { departure_id: departure } });
    return response.data;
  } catch (error) {
    return { deals: [] };
  }
}

export async function autocompleteAirports(q: string) {
  try {
    const response = await api.get("/flights/autocomplete", { params: { q } });
    return response.data;
  } catch (error) {
    return { airports: [] };
  }
}

export async function getFlightBookingLinks(token: string) {
  try {
    const response = await api.get("/flights/booking", { params: { token } });
    return response.data;
  } catch (error) {
    console.error("Booking fetch error:", error);
    toast.error("Failed to retrieve booking links.");
    throw error;
  }
}

export async function searchTrains(origin: string, destination: string, date?: string) {
  try {
    const response = await api.get("/trains", { params: { origin, destination, date } });
    return response.data;
  } catch (error) {
    console.error("Train search error:", error);
    toast.error("Failed to retrieve train data.");
    throw error;
  }
}

export async function searchProducts(query: string) {
  try {
    const response = await api.get("/search", { params: { q: query } });
    
    // Log search analytics
    try {
      await addDoc(collection(db, "searches"), {
        query: query,
        timestamp: serverTimestamp(),
        userId: auth.currentUser?.uid || 'anonymous'
      });
    } catch (logError) {
      console.warn("Failed to log search analytics:", logError);
    }

    return response.data;
  } catch (error: any) {
    console.error("API search error:", error);
    toast.error(error?.response?.data?.error || "Network error. Failed to retrieve market data.");
    throw error;
  }
}
export async function getCoupons(store: string) {
  try {
    const response = await api.get("/coupons", { params: { store } });
    return response.data;
  } catch (error) {
    return { coupons: [] };
  }
}

export async function getCashback(store: string) {
  try {
    const response = await api.get("/cashback", { params: { store } });
    return response.data;
  } catch (error) {
    return { cashback: [] };
  }
}

export async function fetchAdminStats() {
  try {
    const response = await api.get("/admin/stats");
    return response.data;
  } catch (error: any) {
    console.error("API admin stats error:", error);
    toast.error("Failed to load admin statistics.");
    throw error;
  }
}
