// src/lib/store.ts

// Types
export type LoginResult = any;
export type Reservation = any;
export type Barber = any;
export type GalleryPhoto = any;
export type PricingCategory = any;
export type PriceItem = any;

// Auth / Session
export const login = async (password: string) => ({ success: true });
export const verifyOTP = async (otp: string) => ({ success: true });
export const logout = async () => {};
export const getSessionInfo = () => ({ sessionLeft: 3600 });
export const refreshActivity = () => {};
export const checkInactivityTimeout = () => {};

// Reservations
export const getReservations = async () => [];
export const updateReservationStatus = async (id: string, status: string) => {};
export const deleteReservation = async (id: string) => {};

// Barbers (Team)
export const getBarbers = async () => [];
export const saveBarbers = async (barbers: any) => {};

// Photos / Media
export const uploadPhoto = async (file: File) => "url";
export const getImageUrl = (url: string) => url;
export const uploadPhotoWithProgress = async (file: File, onProgress: any) => "url";
export const fetchGalleryPhotos = async () => [];
export const deleteGalleryPhoto = async (id: string) => {};

// Pricing
export const getPricing = async () => [];
export const savePricing = async (pricing: any) => {};

// Settings
export const getContactPhone = async () => "06 00 00 00 00";
export const saveContactPhone = async (phone: string) => {};
export const getDisplayPhone = async () => "06 00 00 00 00";
export const saveDisplayPhone = async (phone: string) => {};
export const saveAdminPassword = async (pwd: string) => {};
