import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTenantContext } from '@/lib/tenant-context'

export async function GET() {
  try {
    const { tenantId } = await getTenantContext()
    const products = await prisma.product.findMany({
      where: { tenantId },
      include: {
        group: true,
        subgroup: true,
        stocks: true
      },
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(products)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 })
  }
}

export async function POST(request: Request) {
  try {
    const { tenantId } = await getTenantContext()
    const body = await request.json()
    const { name, sku, price, groupId, subgroupId, reorderLevel } = body

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const product = await prisma.product.create({
      data: {
        tenantId,
        name,
        sku,
        price: price || 0,
        groupId,
        subgroupId,
        reorderLevel: reorderLevel || 10
      }
    })

    return NextResponse.json(product, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
