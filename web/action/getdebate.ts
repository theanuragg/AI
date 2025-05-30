'use server';

import axios from "axios";

export const getDebate = async (id: string) => {
    try{
        const response = await axios.post(
            `${process.env.BACKEND_URL}/api/battle/${id}`,
            {
                battleId: id,
            }
        )
    if (!response || !response.data || !response.data.success) {
        throw new Error("Invalid response from server")
    }
    return response.data.data
} catch (error: unknown) {
        if (axios.isAxiosError(error)) {
            if (error.response) {
                console.error("Server error:", error.response.data);
                throw new Error(error.response.data.error || "Server error occurred");
            } else if (error.request) {
                console.error("Network error:", error.request);
                throw new Error("Network error. Please check your connection.");
            }
        }
        console.error("Unexpected error:", error);
        throw new Error("An unexpected error occurred.");
    }
}