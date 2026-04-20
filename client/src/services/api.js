import axios from 'axios';

// In production, API is served from the same origin. In dev, proxy to localhost:3001
const API_BASE = import.meta.env.VITE_API_URL || (
    import.meta.env.PROD ? '/api' : 'http://localhost:3001/api'
);

const api = axios.create({
    baseURL: API_BASE,
    timeout: 60000,
});

// Add JWT token to all requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('nv_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Auth APIs
export const signupRequest = async (email) => {
    const response = await api.post('/auth/signup', { email });
    return response.data;
};

export const verifyOTP = async (email, otp, password, profileData = null) => {
    const response = await api.post('/auth/verify-otp', { email, otp, password, profileData });
    return response.data;
};

export const loginRequest = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
};

export const forgotPasswordRequest = async (email) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
};

export const resetPasswordRequest = async (email, otp, newPassword) => {
    const response = await api.post('/auth/reset-password', { email, otp, newPassword });
    return response.data;
};

// User APIs
export const saveOnboarding = async (data) => {
    const response = await api.post('/user/onboarding', data);
    return response.data;
};

export const getProfile = async () => {
    const response = await api.get('/user/profile');
    return response.data;
};

export const updateProfile = async (data) => {
    const response = await api.put('/user/profile', data);
    return response.data;
};

// Analysis APIs
export const analyzeImage = async (imageFile) => {
    const formData = new FormData();
    formData.append('image', imageFile);
    const response = await api.post('/analyze/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
};

export const analyzeText = async (text) => {
    const response = await api.post('/analyze/text', { text });
    return response.data;
};

export const analyzeSpeech = async (text) => {
    const response = await api.post('/analyze/speech', { text });
    return response.data;
};

export const saveAnalysis = async (data) => {
    const response = await api.post('/analyze/save', data);
    return response.data;
};

export const getHistory = async (period = '') => {
    const response = await api.get(`/analyze/history${period ? `?period=${period}` : ''}`);
    return response.data;
};

export const getStats = async (period = '') => {
    const response = await api.get(`/analyze/stats${period ? `?period=${period}` : ''}`);
    return response.data;
};

export const deleteHistoryItem = async (id) => {
    const response = await api.delete(`/analyze/history/${id}`);
    return response.data;
};

// Chat API
export const sendChatMessage = async (message, history = []) => {
    const response = await api.post('/chat', { message, history });
    return response.data;
};

export const healthCheck = async () => {
    const response = await api.get('/health');
    return response.data;
};
