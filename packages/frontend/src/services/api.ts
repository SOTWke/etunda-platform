import axios, { AxiosInstance } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface AuthResponse {
  user: {
    id: string;
    email: string;
    role: string;
  };
  token: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
  farmer_id: string;
  category: string;
  created_at: string;
}

interface Order {
  id: string;
  buyer_id: string;
  product_id: string;
  quantity: number;
  total_price: number;
  status: string;
}

class ApiClient {
  private client: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('authToken');
    
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add token to all requests
    this.client.interceptors.request.use((config) => {
      if (this.token) {
        config.headers.Authorization = `Bearer ${this.token}`;
      }
      return config;
    });

    // Handle errors globally
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          this.logout();
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async register(email: string, password: string, role: string = 'buyer'): Promise<AuthResponse> {
    const response = await this.client.post<AuthResponse>('/auth/register', {
      email,
      password,
      role,
    });
    this.setToken(response.data.token);
    return response.data;
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await this.client.post<AuthResponse>('/auth/login', {
      email,
      password,
    });
    this.setToken(response.data.token);
    return response.data;
  }

  async getProfile() {
    const response = await this.client.get('/auth/profile');
    return response.data;
  }

  // Products endpoints
  async getProducts(limit: number = 20, offset: number = 0) {
    const response = await this.client.get('/products', {
      params: { limit, offset },
    });
    return response.data;
  }

  async getProduct(id: string) {
    const response = await this.client.get(`/products/${id}`);
    return response.data;
  }

  async createProduct(productData: Partial<Product>) {
    const response = await this.client.post('/products', productData);
    return response.data;
  }

  async updateProduct(id: string, productData: Partial<Product>) {
    const response = await this.client.put(`/products/${id}`, productData);
    return response.data;
  }

  async deleteProduct(id: string) {
    const response = await this.client.delete(`/products/${id}`);
    return response.data;
  }

  async searchProducts(query: string) {
    const response = await this.client.get('/products/search', {
      params: { q: query },
    });
    return response.data;
  }

  // Farmers endpoints
  async getFarmers(limit: number = 20, offset: number = 0) {
    const response = await this.client.get('/farmers', {
      params: { limit, offset },
    });
    return response.data;
  }

  async getFarmer(id: string) {
    const response = await this.client.get(`/farmers/${id}`);
    return response.data;
  }

  async getMyFarmerProfile() {
    const response = await this.client.get('/farmers/profile/me');
    return response.data;
  }

  async createFarmerProfile(profileData: any) {
    const response = await this.client.post('/farmers', profileData);
    return response.data;
  }

  async updateFarmerProfile(id: string, profileData: any) {
    const response = await this.client.put(`/farmers/${id}`, profileData);
    return response.data;
  }

  // ✅ NEW: Farm profile (extended farmer details)
  async getFarmProfile() {
    const response = await this.client.get('/farmers/farm/profile/details');
    return response.data;
  }

  async updateFarmProfile(profileData: any) {
    const response = await this.client.post('/farmers/farm/profile', profileData);
    return response.data;
  }

  async getVerifiedFarmers(limit: number = 20, offset: number = 0) {
    const response = await this.client.get('/farmers/verified', {
      params: { limit, offset },
    });
    return response.data;
  }

  async searchFarmersByCounty(county: string, limit: number = 20, offset: number = 0) {
    const response = await this.client.get('/farmers/search/county', {
      params: { county, limit, offset },
    });
    return response.data;
  }

  async searchFarmersByCategory(category: string, limit: number = 20, offset: number = 0) {
    const response = await this.client.get('/farmers/search/category', {
      params: { category, limit, offset },
    });
    return response.data;
  }

  // Buyers endpoints
  async getBuyers(limit: number = 20, offset: number = 0) {
    const response = await this.client.get('/buyers', {
      params: { limit, offset },
    });
    return response.data;
  }

  async getBuyer(id: string) {
    const response = await this.client.get(`/buyers/${id}`);
    return response.data;
  }

  async getMyBuyerProfile() {
    const response = await this.client.get('/buyers/profile/me');
    return response.data;
  }

  async createBuyerProfile(profileData: any) {
    const response = await this.client.post('/buyers', profileData);
    return response.data;
  }

  async updateBuyerProfile(id: string, profileData: any) {
    const response = await this.client.put(`/buyers/${id}`, profileData);
    return response.data;
  }

  // Orders endpoints
  async getOrders(limit: number = 20, offset: number = 0) {
    const response = await this.client.get('/orders', {
      params: { limit, offset },
    });
    return response.data;
  }

  async getMyOrders() {
    const response = await this.client.get('/orders/my-orders');
    return response.data;
  }

  async getOrder(id: string) {
    const response = await this.client.get(`/orders/${id}`);
    return response.data;
  }

  async createOrder(productId: string, quantity: number) {
    const response = await this.client.post('/orders', {
      productId,
      quantity,
    });
    return response.data;
  }

  async updateOrderStatus(id: string, status: string) {
    const response = await this.client.patch(`/orders/${id}/status`, {
      status,
    });
    return response.data;
  }

  private setToken(token: string) {
    this.token = token;
    localStorage.setItem('authToken', token);
  }

  logout() {
    this.token = null;
    localStorage.removeItem('authToken');
  }

  getToken() {
    return this.token;
  }
}

export const apiClient = new ApiClient();
export default apiClient;
