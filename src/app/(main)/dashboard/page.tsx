export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Overview</h2>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { title: 'Total Revenue', value: '৳ 0.00', change: '+0% from last month' },
          { title: 'Active Sales', value: '0', change: '0 today' },
          { title: 'Low Stock Items', value: '0', change: 'Immediate attention' },
          { title: 'Active Employees', value: '1', change: 'In Uttara Branch' },
        ].map((kpi) => (
          <div key={kpi.title} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="text-sm font-medium text-gray-500">{kpi.title}</div>
            <div className="mt-2 text-2xl font-bold">{kpi.value}</div>
            <div className="mt-1 text-xs text-gray-400">{kpi.change}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm h-80 flex items-center justify-center text-gray-400">
          Sales Trend Chart Placeholder
        </div>
        <div className="col-span-3 rounded-xl border border-gray-200 bg-white p-6 shadow-sm h-80 flex items-center justify-center text-gray-400">
          Recent Transactions Placeholder
        </div>
      </div>
    </div>
  )
}
