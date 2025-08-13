// API service for MFC Payment System
const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'https://mfc-payment-system.vercel.app';

class ApiService {
  private baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // Health check
  async healthCheck() {
    return this.request<{
      status: string;
      message: string;
      timestamp: string;
      environment: string;
      version: string;
    }>('/api/health');
  }

  // Payment rules
  async getPaymentRules() {
    return this.request<{
      success: boolean;
      data: any[];
      message: string;
    }>('/api/payments/rules');
  }

  async getGlobalRules() {
    return this.request<{
      success: boolean;
      data: any[];
      message: string;
    }>('/api/payments/rules/global');
  }

  async createRule(ruleData: any) {
    return this.request<{
      success: boolean;
      data: any;
      message: string;
    }>('/api/payments/rules', {
      method: 'POST',
      body: JSON.stringify(ruleData),
    });
  }

  async updateRule(id: number, ruleData: any) {
    return this.request<{
      success: boolean;
      data: any;
      message: string;
    }>(`/api/payments/rules/${id}`, {
      method: 'PUT',
      body: JSON.stringify(ruleData),
    });
  }

  async deleteRule(id: number) {
    return this.request<{
      success: boolean;
      message: string;
    }>(`/api/payments/rules/${id}`, {
      method: 'DELETE',
    });
  }

  // Global settings
  async getGlobalSettings() {
    return this.request<{
      success: boolean;
      data: any[];
      message: string;
    }>('/api/payments/settings');
  }

  async updateGlobalSettings(settings: any[]) {
    return this.request<{
      success: boolean;
      message: string;
    }>('/api/payments/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  // Data import
  async importData(formData: FormData) {
    const url = `${this.baseURL}/api/data/import`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Data import failed:', error);
      throw error;
    }
  }

  // Reports
  async generateReport(reportType: string, filters: any = {}) {
    return this.request<{
      success: boolean;
      data: any;
      message: string;
    }>('/api/reports/generate', {
      method: 'POST',
      body: JSON.stringify({ reportType, filters }),
    });
  }
}

export const apiService = new ApiService();
export default apiService; 