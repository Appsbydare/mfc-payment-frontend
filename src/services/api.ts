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
        const errorText = await response.text();
        console.error('❌ API Error:', `${response.status} - ${errorText}`);
        throw new Error(`HTTP error! status: ${response.status}, response: ${errorText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`❌ API request failed for ${endpoint}:`, error);
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

  // Payment rules - removed with Payment Calculator

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

  // Global rules via /rules endpoints remain available

  // Removed create/update/delete under /payments/rules

  

  

  // Global settings moved to /rules endpoints

  

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

  // Payments calculation removed

  // Discounts API
  async listDiscounts() {
    return this.request<{ success: boolean; data: any[] }>(`/discounts`);
  }

  async initializeDiscounts() {
    return this.request<{ success: boolean; data: any[]; message: string }>(`/discounts/initialize`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  async createDiscount(payload: any) {
    return this.request<{ success: boolean; data: any; message: string }>(`/discounts`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updateDiscount(id: number | string, payload: any) {
    return this.request<{ success: boolean; data: any; message: string }>(`/discounts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  async deleteDiscount(id: number | string) {
    return this.request<{ success: boolean; message: string }>(`/discounts/${id}`, {
      method: 'DELETE',
    });
  }

  async classifyDiscount(memo: string) {
    return this.request<{ success: boolean; data: any }>(`/discounts/classify`, {
      method: 'POST',
      body: JSON.stringify({ memo }),
    });
  }

  async debugDiscounts() {
    return this.request<{ success: boolean; debug?: any; error?: string }>(`/discounts/debug`);
  }

  // New Attendance Verification System
  async getAttendanceVerificationMaster() {
    return this.request<{
      success: boolean;
      data: any[];
      summary: {
        totalRecords: number;
        verifiedRecords: number;
        unverifiedRecords: number;
        verificationRate: number;
        newRecordsAdded: number;
      };
    }>('/attendance-verification/master');
  }

  async verifyAttendanceData(forceReverify: boolean = true) {
    return this.request<{
      success: boolean;
      message: string;
      data: any[];
      summary: {
        totalRecords: number;
        verifiedRecords: number;
        unverifiedRecords: number;
        verificationRate: number;
        newRecordsAdded: number;
      };
    }>('/attendance-verification/verify', {
      method: 'POST',
      body: JSON.stringify({ forceReverify }),
    });
  }

  async batchVerificationProcess(forceReverify: boolean = true) {
    return this.request<{
      success: boolean;
      message: string;
      data: any[];
      summary: {
        totalRecords: number;
        verifiedRecords: number;
        unverifiedRecords: number;
        verificationRate: number;
        newRecordsAdded: number;
      };
    }>('/attendance-verification/batch-verify', {
      method: 'POST',
      body: JSON.stringify({ forceReverify }),
    });
  }

  async addDiscounts() {
    return this.request<{
      success: boolean;
      message: string;
      data: any[];
      summary: {
        totalRecords: number;
        discountAppliedCount: number;
      };
    }>('/attendance-verification/add-discounts', {
      method: 'POST',
    });
  }

  async recalculateDiscounts() {
    return this.request<{
      success: boolean;
      message: string;
      data: any[];
      summary: {
        totalRecords: number;
        recalculatedCount: number;
      };
    }>('/attendance-verification/recalculate-discounts', {
      method: 'POST',
    });
  }

  async getAttendanceVerificationSummary(params: { fromDate?: string; toDate?: string } = {}) {
    const queryParams = new URLSearchParams();
    if (params.fromDate) queryParams.append('fromDate', params.fromDate);
    if (params.toDate) queryParams.append('toDate', params.toDate);
    
    return this.request<{
      success: boolean;
      data: {
        totalRecords: number;
        verifiedRecords: number;
        unverifiedRecords: number;
        verificationRate: number;
        totalAmount: number;
        totalSessionPrice: number;
        totalCoachAmount: number;
        totalBgmAmount: number;
        totalManagementAmount: number;
        totalMfcAmount: number;
      };
    }>(`/attendance-verification/summary?${queryParams.toString()}`);
  }

  async getUnverifiedRecords(params: { fromDate?: string; toDate?: string } = {}) {
    const queryParams = new URLSearchParams();
    if (params.fromDate) queryParams.append('fromDate', params.fromDate);
    if (params.toDate) queryParams.append('toDate', params.toDate);
    
    return this.request<{
      success: boolean;
      data: any[];
      count: number;
    }>(`/attendance-verification/unverified?${queryParams.toString()}`);
  }

  async manualVerifyRecord(payload: { uniqueKey: string; invoiceNumber: string; customerName?: string }) {
    return this.request<{
      success: boolean;
      message: string;
    }>('/attendance-verification/manual-verify', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async exportAttendanceVerification(params: { fromDate?: string; toDate?: string; format?: 'csv' | 'json' } = {}) {
    const queryParams = new URLSearchParams();
    if (params.fromDate) queryParams.append('fromDate', params.fromDate);
    if (params.toDate) queryParams.append('toDate', params.toDate);
    if (params.format) queryParams.append('format', params.format);
    
    const url = `${this.baseURL}/attendance-verification/export?${queryParams.toString()}`;
    
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      if (params.format === 'csv') {
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `attendance_verification_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        window.URL.revokeObjectURL(downloadUrl);
        return { success: true, message: 'File downloaded successfully' };
      } else {
        return await response.json();
      }
    } catch (error) {
      console.error('Export failed:', error);
      throw error;
    }
  }

  async rewriteMasterSheet() {
    return this.request<{
      success: boolean;
      message: string;
      recordCount?: number;
    }>('/attendance-verification/rewrite-master', {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  async upsertMasterRows(rows: any[]) {
    return this.request<{
      success: boolean;
      message: string;
      recordCount?: number;
    }>('/attendance-verification/upsert-master', {
      method: 'POST',
      body: JSON.stringify({ rows }),
    });
  }

  // Invoice Verification API methods
  async getInvoiceVerificationData() {
    return this.request<{
      success: boolean;
      data: any[];
    }>('/attendance-verification/invoices');
  }

  async initializeInvoiceVerification() {
    return this.request<{
      success: boolean;
      message: string;
      data: any[];
    }>('/attendance-verification/invoices/initialize', {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  async clearInvoiceVerificationData() {
    return this.request<{
      success: boolean;
      message: string;
    }>('/attendance-verification/invoices', {
      method: 'DELETE',
    });
  }

  async testInvoiceVerification() {
    return this.request<{
      success: boolean;
      message: string;
      data: {
        services?: {
          attendanceVerificationService: boolean;
          invoiceVerificationService: boolean;
        };
        timestamp?: string;
        environment?: string;
        existingRecords?: number;
        initializedRecords?: number;
        sampleData?: any[];
      };
    }>('/attendance-verification/test', {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  // Coaches API methods
  async getCoaches() {
    return this.request<{
      success: boolean;
      data: any[];
      count: number;
    }>('/coaches');
  }

  async createCoach(coachData: { name: string; email: string; rate: number; active?: boolean }) {
    return this.request<{
      success: boolean;
      data: any;
      message: string;
    }>('/coaches', {
      method: 'POST',
      body: JSON.stringify(coachData),
    });
  }

  async updateCoach(id: string | number, coachData: { name: string; email: string; rate: number; active?: boolean }) {
    return this.request<{
      success: boolean;
      data: any;
      message: string;
    }>(`/coaches/${id}`, {
      method: 'PUT',
      body: JSON.stringify(coachData),
    });
  }

  async deleteCoach(id: string | number) {
    return this.request<{
      success: boolean;
      data: any;
      message: string;
    }>(`/coaches/${id}`, {
      method: 'DELETE',
    });
  }

  // Coaches Summary API methods
  async getCoachesSummary(params: { fromDate?: string; toDate?: string } = {}) {
    try {
      const queryParams = new URLSearchParams();
      if (params.fromDate) queryParams.append('fromDate', params.fromDate);
      if (params.toDate) queryParams.append('toDate', params.toDate);

      return await this.request<{
        success: boolean;
        data: Array<{
          coachName: string;
          totalSessions: number;
          totalAmount: number;
          totalCoachAmount: number;
          totalBgmAmount: number;
          totalManagementAmount: number;
          totalMfcAmount: number;
          averageSessionAmount: number;
          sessions: number;
        }>;
        summary: {
          totalCoaches: number;
          totalSessions: number;
          totalAmount: number;
          totalCoachAmount: number;
          totalBgmAmount: number;
          totalManagementAmount: number;
          totalMfcAmount: number;
        };
        message: string;
      }>(`/coaches/summary?${queryParams.toString()}`);
    } catch (error) {
      // Return mock data if backend is not available
      console.warn('Coaches API not available, using mock data');
      return {
        success: true,
        data: [
          {
            coachName: 'Demo Coach',
            totalSessions: 0,
            totalAmount: 0,
            totalCoachAmount: 0,
            totalBgmAmount: 0,
            totalManagementAmount: 0,
            totalMfcAmount: 0,
            averageSessionAmount: 0,
            sessions: 0
          }
        ],
        summary: {
          totalCoaches: 1,
          totalSessions: 0,
          totalAmount: 0,
          totalCoachAmount: 0,
          totalBgmAmount: 0,
          totalManagementAmount: 0,
          totalMfcAmount: 0
        },
        message: 'Mock data - Backend not available'
      };
    }
  }

  async getCoachSessions(coachName: string, params: { fromDate?: string; toDate?: string } = {}) {
    try {
      const queryParams = new URLSearchParams();
      if (params.fromDate) queryParams.append('fromDate', params.fromDate);
      if (params.toDate) queryParams.append('toDate', params.toDate);

      return await this.request<{
        success: boolean;
        data: Array<{
          sessionAmount: number;
          coachAmount: number;
          bgmAmount: number;
          managementAmount: number;
          mfcAmount: number;
          date: string;
          customer: string;
          sessionType: string;
        }>;
        count: number;
        message: string;
      }>(`/coaches/${encodeURIComponent(coachName)}/sessions?${queryParams.toString()}`);
    } catch (error) {
      // Return mock data if backend is not available
      console.warn('Coach sessions API not available, using mock data');
      return {
        success: true,
        data: [],
        count: 0,
        message: 'Mock data - Backend not available'
      };
    }
  }
}

export const apiService = new ApiService();
export default apiService; 