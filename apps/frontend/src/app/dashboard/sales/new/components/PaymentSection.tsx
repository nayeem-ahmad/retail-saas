import { useState, useEffect } from 'react';
import { Trash2, Plus } from 'lucide-react';
import { api } from '../../../../../lib/api';
import { Payment } from '../../../../../lib/hooks/useNewSaleCart';

interface PaymentSectionProps {
    payments: Payment[];
    total: number;
    onPaymentChange: (payments: Payment[]) => void;
}

const PAYMENT_METHODS = [
    { value: 'Cash', label: 'Cash' },
    { value: 'Mobile Wallet', label: 'Mobile Wallet (bKash/Nagad)' },
    { value: 'Card', label: 'Card' },
    { value: 'Bank', label: 'Bank Transfer' },
];

const ACCOUNT_TYPE_MAP: Record<string, string> = {
    'Cash': 'Cash',
    'Mobile Wallet': 'Wallet',
    'Card': 'Card',
    'Bank': 'Bank',
};

export default function PaymentSection({ payments, total, onPaymentChange }: PaymentSectionProps) {
    const [newPayment, setNewPayment] = useState<Partial<Payment>>({ method: 'Cash', amount: total });
    const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
    const [accounts, setAccounts] = useState<any[]>([]);

    useEffect(() => {
        loadPaymentMethods();
        loadAccounts();
    }, []);

    const loadPaymentMethods = async () => {
        try {
            const data = await api.getPaymentMethods();
            setPaymentMethods(data);
        } catch (error) {
            console.error('Failed to load payment methods', error);
        }
    };

    const loadAccounts = async () => {
        try {
            const data = await api.getAccounts();
            setAccounts(data);
        } catch (error) {
            console.error('Failed to load accounts', error);
        }
    };

    const getFilteredAccounts = (method: string | undefined) => {
        if (!method) return [];
        const accountType = ACCOUNT_TYPE_MAP[method];
        return accounts.filter((a) => a.type.includes(accountType) || a.category === method.toLowerCase());
    };

    const handleAddPayment = () => {
        if (!newPayment.method || !newPayment.amount || newPayment.amount <= 0) {
            alert('Please select a payment method and enter an amount');
            return;
        }

        const updatedPayments = [...payments, newPayment as Payment];
        onPaymentChange(updatedPayments);

        // Calculate remaining amount
        const totalPaid = updatedPayments.reduce((sum, p) => sum + p.amount, 0);
        const remaining = Math.max(0, total - totalPaid);

        setNewPayment({ method: 'Cash', amount: remaining });
    };

    const handleRemovePayment = (index: number) => {
        const updatedPayments = payments.filter((_, i) => i !== index);
        onPaymentChange(updatedPayments);
    };

    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    const balance = total - totalPaid;
    const paymentValid = Math.abs(balance) < 0.01;

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Payment</h3>
                <span
                    className={`text-xs font-semibold ${
                        paymentValid ? 'text-green-600' : balance > 0 ? 'text-red-600' : 'text-amber-600'
                    }`}
                >
                    {paymentValid ? '✓ Settled' : `Due ৳${Math.abs(balance).toFixed(2)}`}
                </span>
            </div>

            {/* Payment List */}
            {payments.length > 0 && (
                <div className="rounded border divide-y">
                    {payments.map((payment, index) => (
                        <div key={index} className="flex justify-between items-center px-2 py-1 text-sm">
                            <div className="min-w-0 truncate">
                                <span className="font-medium">{payment.method}</span>
                                {payment.accountId && (
                                    <span className="text-gray-500 ml-1 text-xs">
                                        · {accounts.find((a) => a.id === payment.accountId)?.name}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                                <span className="font-medium">৳{payment.amount.toFixed(2)}</span>
                                <button
                                    type="button"
                                    onClick={() => handleRemovePayment(index)}
                                    className="text-red-500 hover:text-red-700"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add Payment — stacked for the narrow panel */}
            <div className="space-y-1.5">
                <select
                    value={newPayment.method || ''}
                    onChange={(e) =>
                        setNewPayment({ ...newPayment, method: e.target.value, accountId: undefined })
                    }
                    className="w-full px-2 py-1.5 border rounded text-sm"
                >
                    <option value="">Payment method…</option>
                    {PAYMENT_METHODS.map((method) => (
                        <option key={method.value} value={method.value}>
                            {method.label}
                        </option>
                    ))}
                </select>

                {newPayment.method && getFilteredAccounts(newPayment.method).length > 0 && (
                    <select
                        value={newPayment.accountId || ''}
                        onChange={(e) =>
                            setNewPayment({ ...newPayment, accountId: e.target.value || undefined })
                        }
                        className="w-full px-2 py-1.5 border rounded text-sm"
                    >
                        <option value="">Account (optional)…</option>
                        {getFilteredAccounts(newPayment.method).map((account) => (
                            <option key={account.id} value={account.id}>
                                {account.name}
                            </option>
                        ))}
                    </select>
                )}

                <div className="flex gap-1.5">
                    <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={newPayment.amount || ''}
                        onChange={(e) =>
                            setNewPayment({ ...newPayment, amount: parseFloat(e.target.value) || 0 })
                        }
                        placeholder={`Amount (৳${balance.toFixed(2)})`}
                        className="flex-1 min-w-0 px-2 py-1.5 border rounded text-sm"
                    />
                    <button
                        type="button"
                        onClick={handleAddPayment}
                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium flex-shrink-0"
                    >
                        <Plus className="w-4 h-4" />
                        Add
                    </button>
                </div>
            </div>
        </div>
    );
}
