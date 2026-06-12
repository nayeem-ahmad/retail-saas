#!/usr/bin/env node
/**
 * Apply Bengali translations to key catalog modules.
 * Run: npx tsx scripts/translate-bn-catalog.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const messagesDir = path.join(__dirname, '../src/lib/localization/messages');

function serializeValue(value, indent = 4) {
    const pad = ' '.repeat(indent);
    const padInner = ' '.repeat(indent + 4);
    if (typeof value === 'string') return JSON.stringify(value);
    if (Array.isArray(value)) {
        if (value.length === 0) return '[]';
        if (typeof value[0] === 'string') {
            return `[\n${value.map((v) => `${padInner}${JSON.stringify(v)},`).join('\n')}\n${pad}]`;
        }
        return `[\n${value.map((v) => `${padInner}${serializeValue(v, indent + 4)},`).join('\n')}\n${pad}]`;
    }
    const entries = Object.entries(value);
    if (entries.length === 0) return '{}';
    return `{\n${entries.map(([k, v]) => {
        const key = /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(k) ? k : JSON.stringify(k);
        return `${padInner}${key}: ${serializeValue(v, indent + 4)},`;
    }).join('\n')}\n${pad}}`;
}

function deepTranslate(enTree, bnTree, map) {
    if (typeof enTree === 'string') {
        return map[enTree] ?? (typeof bnTree === 'string' ? bnTree : enTree);
    }
    if (Array.isArray(enTree)) {
        return enTree.map((item, i) => deepTranslate(item, bnTree?.[i], map));
    }
    if (!enTree || typeof enTree !== 'object') return bnTree ?? enTree;
    const out = {};
    for (const key of Object.keys(enTree)) {
        out[key] = deepTranslate(enTree[key], bnTree?.[key], map);
    }
    return out;
}

const settingsExtrasBn = {
    'POS Counters': 'POS কাউন্টার',
    'Manage the sales counters for this store. Each cashier session is tied to a counter.': 'এই স্টোরের বিক্রয় কাউন্টার পরিচালনা করুন। প্রতিটি ক্যাশিয়ার সেশন একটি কাউন্টারের সাথে যুক্ত।',
    'Add Counter': 'কাউন্টার যোগ করুন',
    'Add First Counter': 'প্রথম কাউন্টার যোগ করুন',
    'Loading…': 'লোড হচ্ছে…',
    'No store selected. Please select a store first.': 'কোনো স্টোর নির্বাচিত নয়। প্রথমে একটি স্টোর নির্বাচন করুন।',
    'No counters yet': 'এখনও কোনো কাউন্টার নেই',
    'Add counters to allow multiple cashier stations': 'একাধিক ক্যাশিয়ার স্টেশনের জন্য কাউন্টার যোগ করুন',
    'Failed to load counters': 'কাউন্টার লোড করতে ব্যর্থ',
    'Name and counter number are required': 'নাম ও কাউন্টার নম্বর প্রয়োজন',
    'Counter updated': 'কাউন্টার আপডেট হয়েছে',
    'Counter created': 'কাউন্টার তৈরি হয়েছে',
    'Failed to save counter': 'কাউন্টার সংরক্ষণ ব্যর্থ',
    'Delete this counter? This cannot be undone.': 'এই কাউন্টার মুছবেন? এটি পূর্বাবস্থায় ফেরানো যাবে না।',
    'Counter deleted': 'কাউন্টার মুছে ফেলা হয়েছে',
    'Failed to delete counter': 'কাউন্টার মুছতে ব্যর্থ',
    'Counter activated': 'কাউন্টার সক্রিয়',
    'Counter deactivated': 'কাউন্টার নিষ্ক্রিয়',
    'Failed to update counter': 'কাউন্টার আপডেট ব্যর্থ',
    'Active': 'সক্রিয়',
    'Inactive': 'নিষ্ক্রিয়',
    'Edit Counter': 'কাউন্টার সম্পাদনা',
    'Counter Name': 'কাউন্টারের নাম',
    'e.g. Counter 1, Express Lane': 'যেমন: কাউন্টার ১, এক্সপ্রেস লেন',
    'Counter Number': 'কাউন্টার নম্বর',
    'Save Changes': 'পরিবর্তন সংরক্ষণ',
    'Create Counter': 'কাউন্টার তৈরি করুন',
    'Branding': 'ব্র্যান্ডিং',
    'Customize your dashboard with your logo, colors, and business name.': 'লোগো, রঙ ও ব্যবসার নাম দিয়ে ড্যাশবোর্ড কাস্টমাইজ করুন।',
    'Loading branding settings…': 'ব্র্যান্ডিং সেটিংস লোড হচ্ছে…',
    'Branding settings saved successfully.': 'ব্র্যান্ডিং সেটিংস সফলভাবে সংরক্ষিত।',
    'Failed to save branding settings.': 'ব্র্যান্ডিং সেটিংস সংরক্ষণ ব্যর্থ।',
    'Save Branding': 'ব্র্যান্ডিং সংরক্ষণ',
    'Tax Settings': 'ট্যাক্স সেটিংস',
    'Bangladesh NBR Compliance': 'বাংলাদেশ NBR সম্মতি',
    'Configure your VAT registration and default rate. The standard VAT rate is 15% under the VAT and Supplementary Duty Act 2012. Your VAT registration number and BIN (Business Identification Number / TIN) will appear on all customer invoices and receipts.': 'আপনার ভ্যাট নিবন্ধন ও ডিফল্ট হার কনফিগার করুন। ভ্যাট ও সম্পূরক শুল্ক আইন ২০১২ অনুযায়ী স্ট্যান্ডার্ড ভ্যাট হার ১৫%। আপনার ভ্যাট নিবন্ধন নম্বর ও BIN (ব্যবসা শনাক্তকরণ নম্বর/TIN) সব গ্রাহক ইনভয়েস ও রসিদে দেখাবে।',
    'Failed to load tax settings': 'ট্যাক্স সেটিংস লোড ব্যর্থ',
    'VAT rate must be a number between 0 and 100': 'ভ্যাট হার ০–১০০ এর মধ্যে একটি সংখ্যা হতে হবে',
    'Failed to save': 'সংরক্ষণ ব্যর্থ',
    'Tax settings saved.': 'ট্যাক্স সেটিংস সংরক্ষিত।',
    'Tax settings saved successfully.': 'ট্যাক্স সেটিংস সফলভাবে সংরক্ষিত।',
    'Default VAT Rate (%)': 'ডিফল্ট ভ্যাট হার (%)',
    'e.g. 15': 'যেমন: ১৫',
    'Leave blank to disable VAT. Products can override this rate individually.': 'ভ্যাট নিষ্ক্রিয় করতে খালি রাখুন। পণ্য আলাদাভাবে এই হার ওভাররাইড করতে পারে।',
    'VAT Registration Number (BIN)': 'ভ্যাট নিবন্ধন নম্বর (BIN)',
    'e.g. 000000000-0101': 'যেমন: 000000000-0101',
    'Your 13-digit BIN issued by the National Board of Revenue (NBR).': 'জাতীয় রাজস্ব বোর্ড (NBR) প্রদত্ত ১৩-অঙ্কের BIN।',
    'Tax Identification Number (TIN)': 'ট্যাক্স শনাক্তকরণ নম্বর (TIN)',
    'e.g. 123456789012': 'যেমন: 123456789012',
    'Your business TIN for tax reporting purposes.': 'ট্যাক্স রিপোর্টিংয়ের জন্য আপনার ব্যবসার TIN।',
    '12-digit TIN issued by the Income Tax department.': 'আয়কর বিভাগ প্রদত্ত ১২-অঙ্কের TIN।',
    'Save Tax Settings': 'ট্যাক্স সেটিংস সংরক্ষণ',
    'NBR VAT Compliance Checklist': 'NBR ভ্যাট সম্মতি চেকলিস্ট',
    'VAT rate shown on POS receipts (Mushak 6.3 format)': 'POS রসিদে ভ্যাট হার দেখানো (মুশাক ৬.৩ ফরম্যাট)',
    'Subtotal, VAT amount, and total displayed separately on invoices': 'ইনভয়েসে সাবটোটাল, ভ্যাট ও মোট আলাদাভাবে দেখানো',
    'BIN/VAT registration number printed on every invoice': 'প্রতিটি ইনভয়েসে BIN/ভ্যাট নিবন্ধন নম্বর মুদ্রিত',
    'Register for VAT at ibas++.gov.bd if you have annual turnover above BDT 30 lakh': 'বার্ষিক টার্নওভার ৩০ লাখ টাকার উপরে হলে ibas++.gov.bd-এ ভ্যাট নিবন্ধন করুন',
    'File monthly VAT returns (Mushak 9.1) through the NBR online portal': 'NBR অনলাইন পোর্টালে মাসিক ভ্যাট রিটার্ন (মুশাক ৯.১) জমা দিন',
    'Settings': 'সেটিংস',
    'Loyalty Program': 'লয়্যালটি প্রোগ্রাম',
    'Configure points earn & redeem rates for your customers.': 'গ্রাহকদের জন্য পয়েন্ট অর্জন ও রিডিম হার কনফিগার করুন।',
    'Loading settings…': 'সেটিংস লোড হচ্ছে…',
    'Failed to load loyalty settings.': 'লয়্যালটি সেটিংস লোড ব্যর্থ।',
    'Loyalty settings saved.': 'লয়্যালটি সেটিংস সংরক্ষিত।',
    'Failed to save settings.': 'সেটিংস সংরক্ষণ ব্যর্থ।',
    'Enable Loyalty Program': 'লয়্যালটি প্রোগ্রাম সক্রিয় করুন',
    'Allow customers to earn and redeem points.': 'গ্রাহকদের পয়েন্ট অর্জন ও রিডিম করতে দিন।',
    'Rate Configuration': 'হার কনফিগারেশন',
    'Earn Rate': 'অর্জন হার',
    'points per ৳1 spent': 'প্রতি ৳১ খরচে পয়েন্ট',
    'e.g. 1.0': 'যেমন: ১.০',
    'e.g. 1.0 means a ৳100 sale earns 100 points': 'যেমন: ১.০ মানে ৳১০০ বিক্রয়ে ১০০ পয়েন্ট',
    'Redemption Rate': 'রিডিম হার',
    '1 point =': '১ পয়েন্ট =',
    'e.g. 0.01': 'যেমন: ০.০১',
    'e.g. 0.01 means 100 points = ৳1.00 discount': 'যেমন: ০.০১ মানে ১০০ পয়েন্ট = ৳১.০০ ছাড়',
    'Minimum Points to Redeem': 'রিডিমের ন্যূনতম পয়েন্ট',
    'points': 'পয়েন্ট',
    'e.g. 100': 'যেমন: ১০০',
    'Customers must have at least this many points to redeem': 'রিডিম করতে গ্রাহকের কাছে কমপক্ষে এত পয়েন্ট থাকতে হবে',
    'Example Calculation': 'উদাহরণ হিসাব',
    'A ৳{amount} sale earns {points} points.': '৳{amount} বিক্রয়ে {points} পয়েন্ট অর্জিত হয়।',
    '{points} points = ৳{discount} discount.': '{points} পয়েন্ট = ৳{discount} ছাড়।',
    'Save Settings': 'সেটিংস সংরক্ষণ',
    'SMS Notifications': 'SMS নোটিফিকেশন',
    'Server configuration required': 'সার্ভার কনফিগারেশন প্রয়োজন',
    'Failed to load SMS settings.': 'SMS সেটিংস লোড ব্যর্থ।',
    'Failed to save SMS settings.': 'SMS সেটিংস সংরক্ষণ ব্যর্থ।',
    'SMS settings saved successfully.': 'SMS সেটিংস সফলভাবে সংরক্ষিত।',
    'Enable SMS Notifications': 'SMS নোটিফিকেশন সক্রিয় করুন',
    'Master switch for all SMS notifications for this tenant.': 'এই টেন্যান্টের সব SMS নোটিফিকেশনের মাস্টার সুইচ।',
    'Send SMS receipt after each sale': 'প্রতিটি বিক্রয়ের পর SMS রসিদ পাঠান',
    'Send SMS for low stock alerts': 'লো স্টক সতর্কতার জন্য SMS পাঠান',
    'Save SMS Settings': 'SMS সেটিংস সংরক্ষণ',
    'Automated Reports': 'স্বয়ংক্রিয় রিপোর্ট',
    'Automated sales report emails': 'স্বয়ংক্রিয় বিক্রয় রিপোর্ট ইমেইল',
    'Failed to load report settings.': 'রিপোর্ট সেটিংস লোড ব্যর্থ।',
    'Failed to save report settings.': 'রিপোর্ট সেটিংস সংরক্ষণ ব্যর্থ।',
    'Report settings saved successfully.': 'রিপোর্ট সেটিংস সফলভাবে সংরক্ষিত।',
    'Enable Weekly Report': 'সাপ্তাহিক রিপোর্ট সক্রিয় করুন',
    'Enable Monthly Report': 'মাসিক রিপোর্ট সক্রিয় করুন',
    'Report Email Address': 'রিপোর্ট ইমেইল ঠিকানা',
    '(optional)': '(ঐচ্ছিক)',
    'Leave blank to use your account email': 'আপনার অ্যাকাউন্ট ইমেইল ব্যবহার করতে খালি রাখুন',
    'Save Report Settings': 'রিপোর্ট সেটিংস সংরক্ষণ',
    'Discount Codes': 'ডিসকাউন্ট কোড',
    'New Code': 'নতুন কোড',
    'Failed to load discount codes': 'ডিসকাউন্ট কোড লোড ব্যর্থ',
    'Discount code created': 'ডিসকাউন্ট কোড তৈরি হয়েছে',
    'Failed to create code': 'কোড তৈরি ব্যর্থ',
    'Failed to update code': 'কোড আপডেট ব্যর্থ',
    'Delete code "{code}"?': '"{code}" কোড মুছবেন?',
    'Failed to delete code': 'কোড মুছতে ব্যর্থ',
    'No discount codes yet': 'এখনও কোনো ডিসকাউন্ট কোড নেই',
    'Create your first code to start offering promotions': 'প্রমোশন শুরু করতে প্রথম কোড তৈরি করুন',
    'New Discount Code': 'নতুন ডিসকাউন্ট কোড',
    'Code *': 'কোড *',
    'e.g. EID2025': 'যেমন: EID2025',
    'Name *': 'নাম *',
    'e.g. Eid Special 2025': 'যেমন: ঈদ স্পেশাল ২০২৫',
    'Type *': 'ধরন *',
    'Percentage (%)': 'শতাংশ (%)',
    'Fixed Amount (৳)': 'নির্দিষ্ট পরিমাণ (৳)',
    'Value *': 'মান *',
    '(%)': '(%)',
    '(৳)': '(৳)',
    'Min Purchase (৳)': 'ন্যূনতম ক্রয় (৳)',
    'e.g. 500': 'যেমন: ৫০০',
    'Max Discount (৳)': 'সর্বোচ্চ ছাড় (৳)',
    'e.g. 1000': 'যেমন: ১০০০',
    'Usage Limit': 'ব্যবহার সীমা',
    'Unlimited': 'অসীম',
    'Valid From': 'শুরু তারিখ',
    'Valid Until': 'শেষ তারিখ',
    'Cancel': 'বাতিল',
    'Create Code': 'কোড তৈরি করুন',
    'Creating…': 'তৈরি হচ্ছে…',
    'Discount': 'ছাড়',
    'Conditions': 'শর্ত',
    'Usage': 'ব্যবহার',
    'Validity': 'মেয়াদ',
    'max': 'সর্বোচ্চ',
    'Min': 'ন্যূনতম',
    'Until': 'পর্যন্ত',
    'No expiry': 'মেয়াদ নেই',
};

const storefrontBn = {
    'Storefront Orders': 'স্টোরফ্রন্ট অর্ডার',
    'Online orders from your public store': 'আপনার পাবলিক স্টোরের অনলাইন অর্ডার',
    'Store Settings': 'স্টোর সেটিংস',
    'Loading orders…': 'অর্ডার লোড হচ্ছে…',
    'No orders yet': 'এখনও কোনো অর্ডার নেই',
    'Orders placed on your storefront will appear here.': 'স্টোরফ্রন্টে দেওয়া অর্ডার এখানে দেখাবে।',
    'Failed to update status': 'স্ট্যাটাস আপডেট ব্যর্থ',
    'Order ID': 'অর্ডার আইডি',
    'Customer': 'গ্রাহক',
    'Items': 'আইটেম',
    'Total': 'মোট',
    'Date': 'তারিখ',
    'Status': 'স্ট্যাটাস',
    'Showing {start}–{end} of {total} orders': '{total} অর্ডারের মধ্যে {start}–{end} দেখানো হচ্ছে',
    'Storefront Settings': 'স্টোরফ্রন্ট সেটিংস',
    'Configure your public online store': 'আপনার পাবলিক অনলাইন স্টোর কনফিগার করুন',
    'Loading settings…': 'সেটিংস লোড হচ্ছে…',
    'Failed to save settings': 'সেটিংস সংরক্ষণ ব্যর্থ',
    'Settings saved successfully.': 'সেটিংস সফলভাবে সংরক্ষিত।',
    'Enable Storefront': 'স্টোরফ্রন্ট সক্রিয় করুন',
    'Make your store publicly accessible at your slug URL': 'স্লাগ URL-এ আপনার স্টোর পাবলিকভাবে অ্যাক্সেসযোগ্য করুন',
    'Toggle storefront': 'স্টোরফ্রন্ট টগল',
    'Store Slug': 'স্টোর স্লাগ',
    '/store/': '/store/',
    'my-store': 'my-store',
    'Lowercase letters, numbers, hyphens only. Max 50 characters.': 'শুধু ছোট হাতের অক্ষর, সংখ্যা, হাইফেন। সর্বোচ্চ ৫০ অক্ষর।',
    'Public URL': 'পাবলিক URL',
    'Open store': 'স্টোর খুলুন',
    'Banner Text': 'ব্যানার টেক্সট',
    'Free delivery on orders over ৳500!': '৳৫০০ এর উপরে অর্ডারে ফ্রি ডেলিভারি!',
    'Shown as a banner at the top of your storefront.': 'স্টোরফ্রন্টের উপরে ব্যানার হিসেবে দেখানো হয়।',
    'Optional.': 'ঐচ্ছিক।',
    'Hero Headline': 'হিরো শিরোনাম',
    'New Season Arrivals': 'নতুন সিজনের পণ্য',
    'Used as the main headline in the storefront hero.': 'স্টোরফ্রন্ট হিরোতে প্রধান শিরোনাম হিসেবে ব্যবহৃত।',
    'Hero Image URL': 'হিরো ইমেজ URL',
    'https://...': 'https://...',
    'If empty, the storefront uses a default Unsplash hero image.': 'খালি থাকলে ডিফল্ট Unsplash হিরো ইমেজ ব্যবহার হয়।',
    'Saving...': 'সংরক্ষণ হচ্ছে...',
    'Settings saved successfully!': 'সেটিংস সফলভাবে সংরক্ষিত!',
    'Loading store...': 'স্টোর লোড হচ্ছে...',
    'Store Not Found': 'স্টোর পাওয়া যায়নি',
    "This store doesn't exist or is currently unavailable.": 'এই স্টোর নেই বা বর্তমানে অনুপলব্ধ।',
    'Home': 'হোম',
    'Shop': 'শপ',
    'Contact': 'যোগাযোগ',
    'Sign out': 'সাইন আউট',
    'Sign in': 'সাইন ইন',
    'Sign up': 'সাইন আপ',
    'Cart': 'কার্ট',
    'Checkout': 'চেকআউট',
    'Add to cart': 'কার্টে যোগ করুন',
    'Out of stock': 'স্টক নেই',
    'Categories': 'ক্যাটাগরি',
    'Trending Now': 'এখন ট্রেন্ডিং',
    'All Products': 'সব পণ্য',
    'View all': 'সব দেখুন',
    'Failed to place order': 'অর্ডার দিতে ব্যর্থ',
    'An error occurred during checkout': 'চেকআউটে একটি ত্রুটি ঘটেছে',
    'Order placed successfully!': 'অর্ডার সফলভাবে দেওয়া হয়েছে!',
    'Loyalty points': 'লয়্যালটি পয়েন্ট',
    'Redeem points': 'পয়েন্ট রিডিম করুন',
    'Your details': 'আপনার তথ্য',
    'Name': 'নাম',
    'Email': 'ইমেইল',
    'Phone': 'ফোন',
    'Order notes (optional)': 'অর্ডার নোট (ঐচ্ছিক)',
    'Place order': 'অর্ডার দিন',
    'Placing order…': 'অর্ডার দেওয়া হচ্ছে…',
    'Your cart is empty': 'আপনার কার্ট খালি',
    'Continue shopping': 'কেনাকাটা চালিয়ে যান',
    'Subtotal': 'সাবটোটাল',
    'Store': 'স্টোর',
    'Sign in to your account': 'আপনার অ্যাকাউন্টে সাইন ইন করুন',
    'Track orders and manage your profile': 'অর্ডার ট্র্যাক করুন ও প্রোফাইল পরিচালনা করুন',
    'Create your account': 'আপনার অ্যাকাউন্ট তৈরি করুন',
    'Shop faster and track your orders': 'দ্রুত কেনাকাটা করুন ও অর্ডার ট্র্যাক করুন',
    'Confirm password': 'পাসওয়ার্ড নিশ্চিত করুন',
    'Full name': 'পূর্ণ নাম',
    'Phone (optional)': 'ফোন (ঐচ্ছিক)',
    'Sign in failed': 'সাইন ইন ব্যর্থ',
    'Sign up failed': 'সাইন আপ ব্যর্থ',
    'Something went wrong': 'কিছু ভুল হয়েছে',
    "Don't have an account?": 'অ্যাকাউন্ট নেই?',
    'Already have an account?': 'ইতিমধ্যে অ্যাকাউন্ট আছে?',
    'Create account': 'অ্যাকাউন্ট তৈরি করুন',
    'Signing in…': 'সাইন ইন হচ্ছে…',
    'Creating account…': 'অ্যাকাউন্ট তৈরি হচ্ছে…',
    'Passwords do not match': 'পাসওয়ার্ড মিলছে না',
    'Search products…': 'পণ্য খুঁজুন…',
    'All categories': 'সব ক্যাটাগরি',
    'Sort by': 'সাজান',
    'No products found': 'কোনো পণ্য পাওয়া যায়নি',
};

const helpBn = {
    'Help Center': 'সহায়তা কেন্দ্র',
    'Frequently asked questions and guides': 'প্রায়শই জিজ্ঞাসিত প্রশ্ন ও গাইড',
    'Email Support': 'ইমেইল সহায়তা',
    'Contact Us': 'যোগাযোগ করুন',
    'Send a message': 'বার্তা পাঠান',
    'System Status': 'সিস্টেম স্ট্যাটাস',
    'Check uptime': 'আপটাইম দেখুন',
    "Can't find what you're looking for?": 'যা খুঁজছেন তা পাচ্ছেন না?',
    'Contact our support team': 'আমাদের সহায়তা দলের সাথে যোগাযোগ করুন',
    'Getting Started': 'শুরু করা',
    'Point of Sale (POS)': 'পয়েন্ট অফ সেল (POS)',
};

async function translateModule(name, constName, map) {
    const enMod = await import(path.join(messagesDir, 'en', `${name}.ts`));
    const bnMod = await import(path.join(messagesDir, 'bn', `${name}.ts`));
    const translated = deepTranslate(enMod[constName], bnMod[constName], map);
    const content = `export const ${constName} = ${serializeValue(translated)} as const;\n`;
    fs.writeFileSync(path.join(messagesDir, 'bn', `${name}.ts`), content, 'utf8');
    console.log(`Translated bn/${name}.ts`);
}

await translateModule('settingsExtras', 'settingsExtrasMessages', settingsExtrasBn);
await translateModule('storefront', 'storefrontMessages', storefrontBn);
await translateModule('help', 'helpMessages', helpBn);

console.log('Bengali catalog translation complete.');