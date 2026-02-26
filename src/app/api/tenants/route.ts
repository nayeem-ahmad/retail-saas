import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, storeName } = await request.json()

    if (!name || !storeName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // 1. Create Tenant and associated entities in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Find or create default Basic Plan (In production, this would be pre-seeded)
      let basicPlan = await tx.subscriptionPlan.findFirst({
        where: { name: 'Basic' }
      })

      if (!basicPlan) {
        basicPlan = await tx.subscriptionPlan.create({
          data: {
            name: 'Basic',
            monthlyPrice: 0,
            featuresJson: { stores: 1, warehouses: 1 }
          }
        })
      }

      // Create Tenant
      const tenant = await tx.tenant.create({
        data: {
          name,
          ownerId: session.user.id,
          users: {
            create: {
              userId: session.user.id,
              role: 'owner'
            }
          },
          subscription: {
            create: {
              planId: basicPlan.id,
              status: 'active',
              currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
            }
          },
          stores: {
            create: {
              name: storeName,
              warehouses: {
                create: {
                  name: 'Main Warehouse',
                  tenantId: '' // Will be filled by trigger/logic if needed, but here we can handle it
                }
              }
            }
          }
        },
        include: {
          stores: {
            include: {
              warehouses: true
            }
          }
        }
      })

      // Update the warehouse with the correct tenantId (Prisma nested create doesn't easily expose parent ID during the same object creation)
      await tx.warehouse.update({
        where: { id: tenant.stores[0].warehouses[0].id },
        data: { tenantId: tenant.id }
      })

      return tenant
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error: any) {
    console.error('Tenant creation error:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
