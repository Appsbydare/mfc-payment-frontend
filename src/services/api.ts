// API service for MFC Payment System
import { API_URL } from '../config/env';

const API_BASE_URL = API_URL;

// Normalize provided base URL so that it ends with exactly one "/api"
// - trims whitespace
// - removes trailing slashes
// - appends "/api" if missing
const normalizeBaseURL = (url: string): string => {
  let out = String(url || '').trim();
  out = out.replace(/\/+$/, '');
  if (!/\/api$/i.test(out)) {
    out += '/api';
  }
  return out;
};

class ApiService {
  private baseURL: string;

  constructor() {
    this.baseURL = normalizeBaseURL(API_BASE_URL);
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
    }>('/health');
  }

  // Get attendance data
  async getAttendanceData() {
    return this.request<{
      success: boolean;
      data: any[];
      count: number;
      message: string;
    }>('/data/attendance');
  }

  // Payment rules
  async getPaymentRules() {
    return this.request<{
      success: boolean;
      data: any[];
      message: string;
    }>('/payments/rules');
  }

  // Rule Manager (Sheets-based)
  async listRules() {
    return this.request<{ success: boolean; data: any[] }>('/rules');
  }

  async getRule(id: string | number) {
    return this.request<{ success: boolean; data: any }>(`/rules/${id}`);
  }

  async saveRule(ruleData: any) {
    return this.request<{ success: boolean; data: any }>(`/rules`, {
      method: 'POST',
      body: JSON.stringify(ruleData),
    });
  }

  async deleteRuleById(id: string | number) {
    return this.request<{ success: boolean }>(`/rules/${id}`, { method: 'DELETE' });
  }

  async listSettings() {
    return this.request<{ success: boolean; data: any[] }>(`/rules/settings/all`);
  }

  async upsertSettings(settings: any | any[]) {
    return this.request<{ success: boolean; data: any[] }>(`/rules/settings/upsert`, {
      method: 'POST',
      body: JSON.stringify(settings),
    });
  }

  // Payments verification - REMOVED
  // Payment verification methods have been removed as requested

  // Attendance verification - REMOVED
  // All attendance verification methods have been removed as requested

  async getGlobalRules() {
    return this.request<{
      success: boolean;
      data: any[];
      message: string;
    }>('/payments/rules/global');
  }

  async createRule(ruleData: any) {
    return this.request<{
      success: boolean;
      data: any;
      message: string;
    }>('/payments/rules', {
      method: 'POST',
      body: JSON.stringify(ruleData),
    });
  }

  async updateRule(id: number, ruleData: any) {
    return this.request<{
      success: boolean;
      data: any;
      message: string;
    }>(`/payments/rules/${id}`, {
      method: 'PUT',
      body: JSON.stringify(ruleData),
    });
  }

  async deleteRule(id: number) {
    return this.request<{
      success: boolean;
      message: string;
    }>(`/payments/rules/${id}`, {
      method: 'DELETE',
    });
  }

  // Global settings
  async getGlobalSettings() {
    return this.request<{
      success: boolean;
      data: any[];
      message: string;
    }>('/payments/settings');
  }

  async updateGlobalSettings(settings: any[]) {
    return this.request<{
      success: boolean;
      message: string;
    }>('/payments/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  // Data import
  async importData(formData: FormData) {
    const url = `${this.baseURL}/data/import`;
    
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

  // Get data from Google Sheets
  async getSheetData(sheet: 'attendance' | 'payments') {
    return this.request<{
      success: boolean;
      data: any[];
      count: number;
    }>(`/data/sheets?sheet=${sheet}`);
  }

  // Export data
  async exportData(sheet: 'attendance' | 'payments', format: 'json' | 'csv' = 'json') {
    const url = `${this.baseURL}/data/export?sheet=${sheet}&format=${format}`;
    
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      if (format === 'csv') {
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `${sheet}_export.csv`;
        link.click();
        window.URL.revokeObjectURL(downloadUrl);
        return { success: true, message: 'File downloaded successfully' };
      } else {
        return await response.json();
      }
    } catch (error) {
      console.error('Data export failed:', error);
      throw error;
    }
  }

  // Reports
  async generateReport(reportType: string, filters: any = {}) {
    return this.request<{
      success: boolean;
      data: any;
      message: string;
    }>('/reports/generate', {
      method: 'POST',
      body: JSON.stringify({ reportType, filters }),
    });
  }

  // Payments calculation
  async calculatePayments(payload: { month?: number; year?: number; fromDate?: string; toDate?: string }) {
    return this.request<{
      success: boolean;
      filters: { month: number | null; year: number | null; fromDate: string | null; toDate: string | null };
      counts: {
        attendanceTotal: number;
        groupSessions: number;
        privateSessions: number;
        paymentsCount: number;
        discountPayments: number;
      };
      revenue: { totalPayments: number };
      splits: any;
      notes?: string;
    }>('/payments/calculate', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // Verification system - REMOVED
  // All verification-related methods have been removed as requested
}

export const apiService = new ApiService();
export default apiService; 