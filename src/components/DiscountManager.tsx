import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, TestTube, Check, X, RefreshCw } from 'lucide-react';
import apiService from '../services/api';

interface Discount {
  id: number;
  discount_code: string;
  name: string;
  applicable_percentage: number;
  coach_payment_type: 'full' | 'partial' | 'free';
  match_type: 'exact' | 'contains' | 'regex';
  active: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface DiscountManagerProps {
  onDiscountChange?: () => void;
}

const DiscountManager: React.FC<DiscountManagerProps> = ({ onDiscountChange }) => {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null);
  const [testMemo, setTestMemo] = useState('');
  const [testResult, setTestResult] = useState<any>(null);
  const [testing, setTesting] = useState(false);
  const [hasTested, setHasTested] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    discount_code: '',
    name: '',
    applicable_percentage: 0,
    coach_payment_type: 'partial' as 'full' | 'partial' | 'free',
    match_type: 'exact' as 'exact' | 'contains' | 'regex',
    active: true,
    notes: ''
  });

  useEffect(() => {
    fetchDiscounts();
  }, []);

  const normalizeCoachPaymentType = (v: any): 'full' | 'partial' | 'free' => {
    const s = String(v || 'partial').toLowerCase();
    return (s === 'full' || s === 'partial' || s === 'free') ? s : 'partial';
  };

  const normalizeMatchType = (v: any): 'exact' | 'contains' | 'regex' => {
    const s = String(v || 'exact').toLowerCase();
    return (s === 'exact' || s === 'contains' || s === 'regex') ? s : 'exact';
  };

  const normalizeDiscount = (row: any, fallbackId?: number): Discount => ({
    id: Number(row.id ?? fallbackId ?? Date.now()),
    discount_code: String(row.discount_code ?? row['discount_code'] ?? ''),
    name: String(row.name ?? row['name'] ?? ''),
    applicable_percentage: Number(row.applicable_percentage ?? row['applicable_percentage'] ?? 0) || 0,
    coach_payment_type: normalizeCoachPaymentType(row.coach_payment_type ?? row['coach_payment_type']),
    match_type: normalizeMatchType(row.match_type ?? row['match_type']),
    active: row.active === true || String(row.active).toUpperCase() === 'TRUE' || row.active === '1' || row.active === 1,
    notes: row.notes ?? row['notes'] ?? '',
    created_at: row.created_at ?? row['created_at'] ?? new Date().toISOString(),
    updated_at: row.updated_at ?? row['updated_at'] ?? new Date().toISOString(),
  });

  const fetchDiscounts = async () => {
    try {
      setLoading(true);
      const data = await apiService.listDiscounts();
      if ((data as any)?.success && Array.isArray((data as any).data) && (data as any).data.length > 0) {
        const normalized = (data as any).data.map((r: any, i: number) => normalizeDiscount(r, i + 1));
        setDiscounts(normalized);
      } else {
        console.error('Failed to fetch discounts or empty list from API.');
        await initializeDiscounts();
      }
    } catch (error) {
      console.error('Error fetching discounts:', error);
      await initializeDiscounts();
    } finally {
      setLoading(false);
    }
  };

  const initializeDiscounts = async () => {
    try {
      const data = await apiService.initializeDiscounts();
      
      if ((data as any).success) {
        const normalized = ((data as any).data || []).map((r: any, i: number) => normalizeDiscount(r, i + 1));
        setDiscounts(normalized);
        console.log('Discounts initialized successfully');
      }
    } catch (error) {
      console.error('Error initializing discounts:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const data = editingDiscount
        ? await apiService.updateDiscount(editingDiscount.id, formData)
        : await apiService.createDiscount(formData);
      
      if ((data as any).success) {
        await fetchDiscounts();
        resetForm();
        onDiscountChange?.();
      } else {
        const msg = (data as any).message || 'Failed to save discount';
        console.error('Failed to save discount:', msg);
        alert('Failed to save discount: ' + msg);
      }
    } catch (error) {
      console.error('Error saving discount:', error);
      alert('Error saving discount');
    }
  };

  const handleEdit = (discount: Discount) => {
    setEditingDiscount(discount);
    setFormData({
      discount_code: discount.discount_code,
      name: discount.name,
      applicable_percentage: discount.applicable_percentage,
      coach_payment_type: discount.coach_payment_type,
      match_type: discount.match_type,
      active: discount.active,
      notes: discount.notes || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this discount?')) {
      return;
    }
    
    try {
      const data = await apiService.deleteDiscount(id);
      
      if ((data as any).success) {
        await fetchDiscounts();
        onDiscountChange?.();
      } else {
        const msg = (data as any).message || 'Failed to delete discount';
        console.error('Failed to delete discount:', msg);
        alert('Failed to delete discount: ' + msg);
      }
    } catch (error) {
      console.error('Error deleting discount:', error);
      alert('Error deleting discount');
    }
  };

  const handleTestMatch = async () => {
    if (!testMemo.trim()) return;
    
    try {
      setTesting(true);
      setHasTested(false);
      const data = await apiService.classifyDiscount(testMemo);
      
      if ((data as any).success) {
        // data.data can be null when no match – keep it as null so UI can show the no‑match message
        setTestResult((data as any).data ?? null);
      } else {
        setTestResult({ error: (data as any).message || 'Unexpected error' });
      }
      setHasTested(true);
    } catch (error) {
      setTestResult({ error: 'Error testing match' });
      setHasTested(true);
    } finally {
      setTesting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      discount_code: '',
      name: '',
      applicable_percentage: 0,
      coach_payment_type: 'partial',
      match_type: 'exact',
      active: true,
      notes: ''
    });
    setEditingDiscount(null);
    setShowForm(false);
  };

  const filteredDiscounts = discounts.filter(discount =>
    discount.discount_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    discount.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCoachPaymentTypeColor = (type: string) => {
    switch (type) {
      case 'full': return 'bg-green-100 text-green-800';
      case 'partial': return 'bg-yellow-100 text-yellow-800';
      case 'free': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getMatchTypeColor = (type: string) => {
    switch (type) {
      case 'exact': return 'bg-blue-100 text-blue-800';
      case 'contains': return 'bg-purple-100 text-purple-800';
      case 'regex': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
      <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Discount Manager</h2>
        <div className="flex gap-2">
          <button
            onClick={fetchDiscounts}
            disabled={loading}
            className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Discount
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-4 w-4" />
        <input
          type="text"
          placeholder="Search discounts..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      {/* Test Match Section */}
      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100">Test Discount Matching</h3>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Enter memo text to test..."
            value={testMemo}
            onChange={(e) => setTestMemo(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <button
            onClick={handleTestMatch}
            disabled={testing || !testMemo.trim()}
            className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <TestTube className="h-4 w-4" />
            {testing ? 'Testing...' : 'Test'}
          </button>
        </div>
        
        {hasTested && (
          <div className="mt-3 p-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700">
            {testResult && (testResult as any).error ? (
              <div className="text-red-600 dark:text-red-400">Error: {testResult.error}</div>
            ) : testResult ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <span className="font-medium text-gray-900 dark:text-gray-100">Match Found!</span>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <div><strong>Discount:</strong> {testResult.discount.name}</div>
                  <div><strong>Code:</strong> {testResult.discount.discount_code}</div>
                  <div><strong>Type:</strong> {testResult.discount.coach_payment_type}</div>
                  <div><strong>Confidence:</strong> {(testResult.confidence * 100).toFixed(0)}%</div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <X className="h-4 w-4" />
                <span>No match found</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">
              {editingDiscount ? 'Edit Discount' : 'Add New Discount'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                    Discount Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.discount_code}
                    onChange={(e) => setFormData({ ...formData, discount_code: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., LOYALTY: 1 TO 1 - SINGLE CLASS DISCOUNT"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Loyalty 1-to-1 Single Class Discount"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                    Applicable Percentage
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={formData.applicable_percentage}
                    onChange={(e) => setFormData({ ...formData, applicable_percentage: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="12.5"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                    Discount Type*
                  </label>
                  <select
                    required
                    value={formData.coach_payment_type}
                    onChange={(e) => setFormData({ ...formData, coach_payment_type: e.target.value as 'full' | 'partial' | 'free' })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="full">Full Payment (treat as regular)</option>
                    <option value="partial">Partial Payment (apply discount)</option>
                    <option value="free">Free (no payment)</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                    Match Type *
                  </label>
                  <select
                    required
                    value={formData.match_type}
                    onChange={(e) => setFormData({ ...formData, match_type: e.target.value as 'exact' | 'contains' | 'regex' })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="exact">Exact Match</option>
                    <option value="contains">Contains</option>
                    <option value="regex">Regex Pattern</option>
                  </select>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="active"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded"
                  />
                  <label htmlFor="active" className="ml-2 block text-sm text-gray-700 dark:text-gray-200">
                    Active
                  </label>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Additional notes about this discount..."
                />
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 dark:text-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingDiscount ? 'Update' : 'Create'} Discount
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Discounts List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Discount Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Percentage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Payment Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Match Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredDiscounts.map((discount) => (
                <tr key={discount.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                    {discount.discount_code}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {discount.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {discount.applicable_percentage}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCoachPaymentTypeColor(discount.coach_payment_type)}`}>
                      {discount.coach_payment_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getMatchTypeColor(discount.match_type)}`}>
                      {discount.match_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${discount.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {discount.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(discount)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(discount.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredDiscounts.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            {searchTerm ? 'No discounts found matching your search.' : 'No discounts found.'}
          </div>
        )}
      </div>
    </div>
  );
};

export default DiscountManager;
