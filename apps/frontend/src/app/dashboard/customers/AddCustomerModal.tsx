import { useState } from 'react';
import { X, User, Phone, Mail, MapPin } from 'lucide-react';

interface AddCustomerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (data: any) => Promise<void>;
}

export default function AddCustomerModal({ isOpen, onClose, onAdd }: AddCustomerModalProps) {
    const [formData, setFormData] = useState({ name: '', phone: '', email: '', address: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await onAdd(formData);
            setFormData({ name: '', phone: '', email: '', address: '' });
            onClose();
        } catch (err: any) {
            setError(err.message || 'Failed to add customer. Phone might already exist.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-black tracking-tight">New Customer</h2>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Add to database</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-50 rounded-xl text-gray-400 transition-all">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm font-bold">{error}</div>}
                    
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block">Full Name</label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 pl-10 pr-4 font-black focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all text-sm" placeholder="John Doe" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block">Phone Number</label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input required type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 pl-10 pr-4 font-black focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all text-sm" placeholder="+1234567890" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block">Email <span className="text-gray-300">(Optional)</span></label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 pl-10 pr-4 font-bold text-gray-600 focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all text-sm" placeholder="john@example.com" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block">Address <span className="text-gray-300">(Optional)</span></label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-4 w-4 h-4 text-gray-400" />
                            <textarea value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 pl-10 pr-4 font-bold text-gray-600 focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all text-sm min-h-[80px]" placeholder="123 Main St..." />
                        </div>
                    </div>

                    <div className="pt-2">
                        <button disabled={loading} type="submit" className="w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl flex items-center justify-center transition-all bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20 hover:-translate-y-0.5 disabled:opacity-50">
                            {loading ? 'Adding...' : 'Add Customer'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
