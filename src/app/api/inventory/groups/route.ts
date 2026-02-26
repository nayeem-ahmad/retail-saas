import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTenantContext } from '@/lib/tenant-context'

export async function GET() {
  try {
    const { tenantId } = await getTenantContext()
    const groups = await prisma.productGroup.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' }
    })
    return NextResponse.json(groups)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 })
  }
}

export async function POST(request: Request) {
  try {
    const { tenantId } = await getTenantContext()
    const { name } = await request.json()

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const group = await prisma.productGroup.create({
      data: {
        name,
        tenantId
      }
    })

    return NextResponse.json(group, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
