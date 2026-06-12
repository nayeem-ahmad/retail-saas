import fs from 'fs';
import vm from 'vm';

const enSrc = fs.readFileSync('src/lib/localization/messages/en/sales.ts', 'utf8').replace(/ as const;?\s*$/, ';');
const sandbox = {};
vm.runInNewContext(enSrc.replace('export const salesMessages', 'salesMessages'), sandbox);
const en = sandbox.salesMessages;

const extraBn = {
  'Failed to delete order': 'অর্ডার মুছতে ব্যর্থ',
  'Failed to delete quotation': 'কোটেশন মুছতে ব্যর্থ',
  'Failed to create order': 'অর্ডার তৈরি করতে ব্যর্থ',
  'Failed to create quotation': 'কোটেশন তৈরি করতে ব্যর্থ',
  'Failed to process return': 'ফেরত প্রক্রিয়া করতে ব্যর্থ',
  'Failed to save sale. Please check your changes and try again.': 'বিক্রয় সংরক্ষণ ব্যর্থ। পরিবর্তনগুলো পরীক্ষা করে আবার চেষ্টা করুন।',
  'Failed to save quotation. Please review your changes and try again.': 'কোটেশন সংরক্ষণ ব্যর্থ। পরিবর্তনগুলো পরীক্ষা করে আবার চেষ্টা করুন।',
  'Failed to save return. Please check your changes and try again.': 'ফেরত সংরক্ষণ ব্যর্থ। পরিবর্তনগুলো পরীক্ষা করে আবার চেষ্টা করুন।',
  'Failed to save: {message}': 'সংরক্ষণ ব্যর্থ: {message}',
  'Failed to update status: {message}': 'অবস্থা আপডেট ব্যর্থ: {message}',
  'Error occurred. Please check stock levels if assigning to Delivered status.': 'ত্রুটি ঘটেছে। ডেলিভারি অবস্থায় নির্ধারণ করলে স্টক পরিমাণ পরীক্ষা করুন।',
  'Failed to add deposit: {message}': 'জমা যোগ করতে ব্যর্থ: {message}',
  'Failed to open session': 'সেশন খুলতে ব্যর্থ',
  'Failed to close session': 'সেশন বন্ধ করতে ব্যর্থ',
  'Failed to add transaction': 'লেনদেন যোগ করতে ব্যর্থ',
  'Failed to load customers.': 'গ্রাহক লোড করতে ব্যর্থ।',
  'Failed to load transactions.': 'লেনদেন লোড করতে ব্যর্থ।',
  'Failed to adjust points.': 'পয়েন্ট সমন্বয় করতে ব্যর্থ।',
  'Failed to load report': 'রিপোর্ট লোড করতে ব্যর্থ',
  'Serial number not found.': 'সিরিয়াল নম্বর পাওয়া যায়নি।',
  'Failed to submit claim.': 'দাবি জমা দিতে ব্যর্থ।',
  'Failed to load invoice': 'ইনভয়েস লোড করতে ব্যর্থ',
  'Error duplicating revision: {message}': 'সংশোধন অনুলিপি করতে ত্রুটি: {message}',
  'Error converting quote: {message}': 'কোট রূপান্তর করতে ত্রুটি: {message}',
  'Are you sure you want to delete this order?': 'আপনি কি নিশ্চিত যে এই অর্ডার মুছতে চান?',
  'Are you sure you want to delete this quotation?': 'আপনি কি নিশ্চিত যে এই কোটেশন মুছতে চান?',
  'Are you sure you want to delete this return?': 'আপনি কি নিশ্চিত যে এই ফেরত মুছতে চান?',
  'Successfully converted! Order Number: {orderNumber}': 'সফলভাবে রূপান্তরিত! অর্ডার নম্বর: {orderNumber}',
  'Points adjusted successfully.': 'পয়েন্ট সফলভাবে সমন্বয় করা হয়েছে।',
  'Loading sale...': 'বিক্রয় লোড হচ্ছে…',
  'Loading order...': 'অর্ডার লোড হচ্ছে…',
  'Loading quote...': 'কোট লোড হচ্ছে…',
  'Loading return...': 'ফেরত লোড হচ্ছে…',
  'Loading invoice…': 'ইনভয়েস লোড হচ্ছে…',
  'Loading claims...': 'দাবি লোড হচ্ছে…',
  'Loading transactions…': 'লেনদেন লোড হচ্ছে…',
  'Loading…': 'লোড হচ্ছে…',
  'Sale not found': 'বিক্রয় পাওয়া যায়নি',
  'Order not found': 'অর্ডার পাওয়া যায়নি',
  'Quote not found.': 'কোট পাওয়া যায়নি।',
  'Return not found': 'ফেরত পাওয়া যায়নি',
  'Invoice not found': 'ইনভয়েস পাওয়া যায়নি',
  'Edit Mode — Modify quote details, items, and notes': 'সম্পাদনা মোড — কোট বিবরণ, আইটেম ও নোট পরিবর্তন করুন',
  'Edit Mode — Modify returned items and reason': 'সম্পাদনা মোড — ফেরত আইটেম ও কারণ পরিবর্তন করুন',
  'Edit Mode — Modify items, payments, customer, status, and note': 'সম্পাদনা মোড — আইটেম, পেমেন্ট, গ্রাহক, অবস্থা ও নোট পরিবর্তন করুন',
  'Edit Mode — Modify order details and items': 'সম্পাদনা মোড — অর্ডার বিবরণ ও আইটেম পরিবর্তন করুন',
  'Search and add products above': 'উপরে পণ্য খুঁজে যোগ করুন',
  'No items — search to add products': 'কোনো আইটেম নেই — যোগ করতে পণ্য খুঁজুন',
  'No payments — click Add Payment above': 'কোনো পেমেন্ট নেই — উপরে পেমেন্ট যোগ করুন ক্লিক করুন',
  'No payment records': 'কোনো পেমেন্ট রেকর্ড নেই',
  'No note added': 'কোনো নোট যোগ করা হয়নি',
  'No reason provided': 'কোনো কারণ দেওয়া হয়নি',
  'No items — all removed': 'কোনো আইটেম নেই — সব সরানো হয়েছে',
  'No transactions yet': 'এখনও কোনো লেনদেন নেই',
  'No customers found': 'কোনো গ্রাহক পাওয়া যায়নি',
  'Try a different search term.': 'ভিন্ন অনুসন্ধান শব্দ চেষ্টা করুন।',
  'No data available.': 'কোনো তথ্য নেই।',
  'Date: {date} | Status: {status}': 'তারিখ: {date} | অবস্থা: {status}',
  'Date: {date} | Status: {status} | Payment: {payment}': 'তারিখ: {date} | অবস্থা: {status} | পেমেন্ট: {payment}',
  'Created: {date} | Status: {status} | Valid Until: {validUntil}': 'তৈরি: {date} | অবস্থা: {status} | বৈধ পর্যন্ত: {validUntil}',
  'Date: {date} | Original Receipt: {receipt}': 'তারিখ: {date} | মূল রসিদ: {receipt}',
  'Customer:': 'গ্রাহক:',
  'Paid:': 'পরিশোধিত:',
  'Due:': 'বাকি:',
  'Payments:': 'পেমেন্টসমূহ:',
  'Notes:': 'নোট:',
  'Open Shift': 'শিফট খুলুন',
  'Close Shift': 'শিফট বন্ধ করুন',
  'Open Shift': 'শিফট খুলুন',
  'Close Shift': 'শিফট বন্ধ করুন',
  'Cash In/Out': 'নগদ ইন/আউট',
  'Description (optional)': 'বিবরণ (ঐচ্ছিক)',
  'Reason': 'কারণ',
  'View': 'দেখুন',
  'Print': 'প্রিন্ট',
};

const extraMs = {
  'Failed to delete order': 'Gagal memadam pesanan',
  'Failed to delete quotation': 'Gagal memadam sebut harga',
  'Failed to create order': 'Gagal mencipta pesanan',
  'Failed to create quotation': 'Gagal mencipta sebut harga',
  'Failed to process return': 'Gagal memproses pulangan',
  'Failed to save sale. Please check your changes and try again.': 'Gagal menyimpan jualan. Sila semak perubahan anda dan cuba lagi.',
  'Failed to save quotation. Please review your changes and try again.': 'Gagal menyimpan sebut harga. Sila semak perubahan anda dan cuba lagi.',
  'Failed to save return. Please check your changes and try again.': 'Gagal menyimpan pulangan. Sila semak perubahan anda dan cuba lagi.',
  'Failed to save: {message}': 'Gagal menyimpan: {message}',
  'Failed to update status: {message}': 'Gagal mengemas kini status: {message}',
  'Error occurred. Please check stock levels if assigning to Delivered status.': 'Ralat berlaku. Sila semak tahap stok jika menetapkan status Dihantar.',
  'Failed to add deposit: {message}': 'Gagal menambah deposit: {message}',
  'Failed to open session': 'Gagal membuka sesi',
  'Failed to close session': 'Gagal menutup sesi',
  'Failed to add transaction': 'Gagal menambah transaksi',
  'Failed to load customers.': 'Gagal memuatkan pelanggan.',
  'Failed to load transactions.': 'Gagal memuatkan transaksi.',
  'Failed to adjust points.': 'Gagal melaraskan mata.',
  'Failed to load report': 'Gagal memuatkan laporan',
  'Serial number not found.': 'Nombor siri tidak dijumpai.',
  'Failed to submit claim.': 'Gagal menghantar tuntutan.',
  'Failed to load invoice': 'Gagal memuatkan invois',
  'Error duplicating revision: {message}': 'Ralat menduplikasi semakan: {message}',
  'Error converting quote: {message}': 'Ralat menukar sebut harga: {message}',
  'Are you sure you want to delete this order?': 'Adakah anda pasti mahu memadam pesanan ini?',
  'Are you sure you want to delete this quotation?': 'Adakah anda pasti mahu memadam sebut harga ini?',
  'Are you sure you want to delete this return?': 'Adakah anda pasti mahu memadam pulangan ini?',
  'Successfully converted! Order Number: {orderNumber}': 'Berjaya ditukar! Nombor Pesanan: {orderNumber}',
  'Points adjusted successfully.': 'Mata berjaya dilaraskan.',
  'Loading sale...': 'Memuatkan jualan...',
  'Loading order...': 'Memuatkan pesanan...',
  'Loading quote...': 'Memuatkan sebut harga...',
  'Loading return...': 'Memuatkan pulangan...',
  'Loading invoice…': 'Memuatkan invois…',
  'Loading claims...': 'Memuatkan tuntutan...',
  'Loading transactions…': 'Memuatkan transaksi…',
  'Loading…': 'Memuatkan…',
  'Sale not found': 'Jualan tidak dijumpai',
  'Order not found': 'Pesanan tidak dijumpai',
  'Quote not found.': 'Sebut harga tidak dijumpai.',
  'Return not found': 'Pulangan tidak dijumpai',
  'Invoice not found': 'Invois tidak dijumpai',
  'Edit Mode — Modify quote details, items, and notes': 'Mod Edit — Ubah butiran sebut harga, item, dan nota',
  'Edit Mode — Modify returned items and reason': 'Mod Edit — Ubah item dipulangkan dan sebab',
  'Edit Mode — Modify items, payments, customer, status, and note': 'Mod Edit — Ubah item, bayaran, pelanggan, status, dan nota',
  'Edit Mode — Modify order details and items': 'Mod Edit — Ubah butiran pesanan dan item',
  'Search and add products above': 'Cari dan tambah produk di atas',
  'No items — search to add products': 'Tiada item — cari untuk tambah produk',
  'No payments — click Add Payment above': 'Tiada bayaran — klik Tambah Bayaran di atas',
  'No payment records': 'Tiada rekod bayaran',
  'No note added': 'Tiada nota ditambah',
  'No reason provided': 'Tiada sebab diberikan',
  'No items — all removed': 'Tiada item — semua dibuang',
  'No transactions yet': 'Belum ada transaksi',
  'No customers found': 'Tiada pelanggan dijumpai',
  'Try a different search term.': 'Cuba istilah carian lain.',
  'No data available.': 'Tiada data tersedia.',
  'Date: {date} | Status: {status}': 'Tarikh: {date} | Status: {status}',
  'Date: {date} | Status: {status} | Payment: {payment}': 'Tarikh: {date} | Status: {status} | Bayaran: {payment}',
  'Created: {date} | Status: {status} | Valid Until: {validUntil}': 'Dicipta: {date} | Status: {status} | Sah Sehingga: {validUntil}',
  'Date: {date} | Original Receipt: {receipt}': 'Tarikh: {date} | Resit Asal: {receipt}',
  'Customer:': 'Pelanggan:',
  'Paid:': 'Dibayar:',
  'Due:': 'Baki:',
  'Payments:': 'Bayaran:',
  'Notes:': 'Nota:',
};

// Base maps copied from generation script (main UI strings)
const baseBn = JSON.parse(fs.readFileSync(new URL('./sales-locale-base-bn.json', import.meta.url), 'utf8').catch?.() || 'null') || {});
const baseMs = JSON.parse(fs.readFileSync(new URL('./sales-locale-base-ms.json', import.meta.url), 'utf8').catch?.() || 'null') || {});

// Inline fallback if JSON files missing - use merged maps from script above via require inline
const bnMap = { ...baseBn, ...extraBn };
const msMap = { ...baseMs, ...extraMs };

function translateTree(obj, map) {
  if (typeof obj === 'string') return map[obj] || obj;
  const out = {};
  for (const [k, v] of Object.entries(obj)) out[k] = translateTree(v, map);
  return out;
}

function serialize(obj, indent = 0) {
  const pad = '    '.repeat(indent);
  const padIn = '    '.repeat(indent + 1);
  if (typeof obj === 'string') return JSON.stringify(obj);
  const entries = Object.entries(obj);
  return '{\n' + entries.map(([k, v]) => `${padIn}${k}: ${serialize(v, indent + 1)},`).join('\n') + '\n' + pad + '}';
}

// Load maps from en by auto-translating with comprehensive inline map
import { bnTranslations, msTranslations } from './sales-locale-maps.mjs';

for (const [locale, map] of [['bn', { ...bnTranslations, ...extraBn }], ['ms', { ...msTranslations, ...extraMs }]]) {
  const translated = translateTree(en, map);
  fs.writeFileSync(`src/lib/localization/messages/${locale}/sales.ts`, `export const salesMessages = ${serialize(translated)} as const;\n`);
  console.log(`Wrote ${locale}/sales.ts`);
}

SCRIPT