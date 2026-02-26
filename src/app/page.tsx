import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4 text-center">
      <h1 className="text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl">
        Retail <span className="text-green-600">SaaS</span>
      </h1>
      <p className="mt-6 text-lg leading-8 text-gray-600 max-w-2xl">
        The complete management system for small to medium grocery shops. 
        Inventory, POS, Accounting, and Payroll in one simple platform.
      </p>
      <div className="mt-10 flex items-center justify-center gap-x-6">
        <Link
          href="/signup"
          className="rounded-md bg-green-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
        >
          Get Started
        </Link>
        <Link href="/login" className="text-sm font-semibold leading-6 text-gray-900">
          Sign in <span aria-hidden="true">→</span>
        </Link>
      </div>
    </div>
  )
}
