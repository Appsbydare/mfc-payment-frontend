import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

interface PaymentCategorizationProps {
  onClose: () => void;
  paymentData: any[];
  onUpdate: () => void;
}

const PaymentCategorization: React.FC<PaymentCategorizationProps> = ({ 
  onClose, 
  paymentData, 
  onUpdate 
}) => {
  const [payments, setPayments] = useState<any[]>([]);
  const [editingPayment, setEditingPayment] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  const categories = [
    'Payment',
    'Discount', 
    'Tax',
    'Refund',
    'Fee',
    'Other'
  ];

  useEffect(() => {
    setPayments(paymentData);
  }, [paymentData]);

  const handleStartEdit = (payment: any) => {
    setEditingPayment(payment.id || `${payment.Date}_${payment.Customer}_${payment.Amount}`);
    setSelectedCategory(payment.Category || 'Payment');
  };

  const handleSaveCategory = async (_payment: any) => {
    // Payment category update functionality has been removed
    toast.error('Payment category update functionality has been removed');
  };

  const handleCancelEdit = () => {
    setEditingPayment(null);
    setSelectedCategory('');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Payment Categorization
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ✕
          </button>
        </div>
        
        <div className="p-4 overflow-y-auto max-h-[60vh]">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-2 px-3 font-semibold text-gray-700 dark:text-gray-200">Date</th>
                  <th className="text-left py-2 px-3 font-semibold text-gray-700 dark:text-gray-200">Customer</th>
                  <th className="text-left py-2 px-3 font-semibold text-gray-700 dark:text-gray-200">Amount</th>
                  <th className="text-left py-2 px-3 font-semibold text-gray-700 dark:text-gray-200">Invoice</th>
                  <th className="text-left py-2 px-3 font-semibold text-gray-700 dark:text-gray-200">Memo</th>
                  <th className="text-left py-2 px-3 font-semibold text-gray-700 dark:text-gray-200">Category</th>
                  <th className="text-left py-2 px-3 font-semibold text-gray-700 dark:text-gray-200">Actions</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment: any, index: number) => {
                  const paymentId = payment.id || `${payment.Date}_${payment.Customer}_${payment.Amount}`;
                  const isEditing = editingPayment === paymentId;
                  
                  return (
                    <tr key={index} className="border-b border-gray-100 dark:border-gray-700">
                      <td className="py-2 px-3 text-gray-900 dark:text-gray-100">{payment.Date}</td>
                      <td className="py-2 px-3 text-gray-900 dark:text-gray-100">{payment.Customer}</td>
                      <td className="py-2 px-3 text-gray-900 dark:text-gray-100">€{Number(payment.Amount || 0).toFixed(2)}</td>
                      <td className="py-2 px-3 text-gray-900 dark:text-gray-100">{payment.Invoice || ''}</td>
                      <td className="py-2 px-3 text-gray-900 dark:text-gray-100 max-w-xs truncate" title={payment.Memo}>
                        {payment.Memo || ''}
                      </td>
                      <td className="py-2 px-3">
                        {isEditing ? (
                          <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="text-sm border rounded px-2 py-1"
                          >
                            {categories.map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                        ) : (
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            payment.Category === 'Discount' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                            payment.Category === 'Tax' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                            payment.Category === 'Refund' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                            payment.Category === 'Fee' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                            'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          }`}>
                            {payment.Category || 'Payment'}
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3">
                        {isEditing ? (
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleSaveCategory(payment)}
                              className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
                            >
                              Save
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="text-xs bg-gray-600 text-white px-2 py-1 rounded hover:bg-gray-700"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleStartEdit(payment)}
                            className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
                          >
                            Edit
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="flex justify-end gap-2 p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentCategorization;
