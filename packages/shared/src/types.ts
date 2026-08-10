// Shared Type Definitions for eTunda Platform

export interface User {
  id: string;
  name: string;
  email: string;
  userType: 'farmer' | 'buyer';
  phone?: string;
  location?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Product {
  id: string;
  farmerId: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
  category: string;
  image?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Order {
  id: string;
  buyerId: string;
  farmerId: string;
  productId: string;
  quantity: number;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
