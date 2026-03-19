import { useState, useEffect } from 'react';
import { X, User, Phone, Mail, MapPin, CreditCard, Percent } from 'lucide-react';
import { api } from '../../../lib/api';

interface AddCustomerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (data: any) => Promise<void>;
}

const emptyForm = {
    name: '', phone: '', email: '', address: '', profile_pic_url: '',
    customer_type: 'INDIVIDUAL', customer_group_id: '', territory_id: '',
    credit_limit: '', default_discount_pct: '',
};

export default function AddCustomerModal({ isOpen, onClose, onAdd }: AddCustomerModalProps) {
    const [formData, setFormData] = useState({ ...emptyForm });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [groups, setGroups] = useState<any[]>([]);
    const [territories, setTerritories] = useState<any[]>([]);

    useEffect(() => {
        if (isOpen) {
            api.getCustomerGroups().then(setGroups).catch(() => {});
            api.getTerritories().then(setTerritories).catch(() => {});
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const payload: any = {
                name: formData.name,
                phone: formData.phone,
                customer_type: formData.customer_type,
            };
            if (formData.email) payload.email = formData.email;
            if (formData.address) payload.address = formData.address;
            if (formData.profile_pic_url) payload.profile_pic_url = formData.profile_pic_url;
            if (formData.customer_group_id) payload.customer_group_id = formData.customer_group_id;
            if (formData.territory_id) payload.territory_id = formData.territory_id;
            if (formData.credit_limit) payload.credit_limit = parseFloat(formData.credit_limit);
            if (formData.default_discount_pct) payload.default_discount_pct = parseFloat(formData.default_discount_pct);

            await onAdd(payload);
            setFormData({ ...emptyForm });
            onClose();
        } catch (err: any) {
            setError(err.message || 'Failed to add customer. Phone might already exist.');
        } finally {
            setLoading(false);
        }
    };

    const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
        setFormData({ ...formData, [field]: e.target.value });

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-black tracking-tight">New Customer</h2>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Add to database</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-50 rounded-xl text-gray-400 transition-all">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
                    {error && <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm font-bold">{error}</div>}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2 space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block">Full Name</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input required type="text" value={formData.name} onChange={set('name')} className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 pl-10 pr-4 font-black focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all text-sm" placeholder="John Doe" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block">Phone Number</label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input required type="text" value={formData.phone} onChange={set('phone')} className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 pl-10 pr-4 font-black focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all text-sm" placeholder="+8801234567890" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block">Email <span className="text-gray-300">(Optional)</span></label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input type="email" value={formData.email} onChange={set('email')} className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 pl-10 pr-4 font-bold text-gray-600 focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all text-sm" placeholder="john@example.com" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block">Customer Type</label>
                            <select value={formData.customer_type} onChange={set('customer_type')} className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 px-4 font-black text-sm focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all">
                                <option value="INDIVIDUAL">Individual</option>
                                <option value="ORGANIZATION">Organization</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block">Customer Group <span className="text-gray-300">(Optional)</span></label>
                            <select value={formData.customer_group_id} onChange={set('customer_group_id')} className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 px-4 font-bold text-gray-600 text-sm focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all">
                                <option value="">None</option>
                                {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block">Territory <span className="text-gray-300">(Optional)</span></label>
                            <select value={formData.territory_id} onChange={set('territory_id')} className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 px-4 font-bold text-gray-600 text-sm focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all">
                                <option value="">None</option>
                                {territories.map(t => <option key={t.id} value={t.id}>{t.parent ? `${t.parent.name} > ` : ''}{t.name}</option>)}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block">Credit Limit <span className="text-gray-300">(Optional)</span></label>
                            <div className="relative">
                                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input type="number" min="0" step="0.01" value={formData.credit_limit} onChange={set('credit_limit')} className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 pl-10 pr-4 font-bold text-gray-600 focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all text-sm" placeholder="0.00" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block">Discount % <span className="text-gray-300">(Optional)</span></label>
                            <div className="relative">
                                <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input type="number" min="0" max="100" step="0.01" value={formData.default_discount_pct} onChange={set('default_discount_pct')} className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 pl-10 pr-4 font-bold text-gray-600 focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all text-sm" placeholder="0.00" />
                            </div>
                        </div>

                        <div className="col-span-2 space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block">Address <span className="text-gray-300">(Optional)</span></label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-4 w-4 h-4 text-gray-400" />
                                <textarea value={formData.address} onChange={set('address')} className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 pl-10 pr-4 font-bold text-gray-600 focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all text-sm min-h-[60px]" placeholder="123 Main St..." />
                            </div>
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
