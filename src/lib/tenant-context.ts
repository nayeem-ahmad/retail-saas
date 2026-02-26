import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { prisma } from './prisma'
import { UserRole } from '@prisma/client'

export interface TenantContext {
  tenantId: string
  userId: string
  role: UserRole
}

/**
 * Retrieves and validates the current tenant context from cookies/session.
 * Throws an error if unauthorized or no tenant is selected.
 */
export async function getTenantContext(): Promise<TenantContext> {
  const supabase = createServerComponentClient({ cookies })
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    throw new Error('Unauthorized: No active session')
  }

  // Retrieve tenant ID from cookie
  const cookieStore = await cookies()
  const tenantId = cookieStore.get('x-tenant-id')?.value

  if (!tenantId) {
    throw new Error('No tenant selected')
  }

  // Verify membership and role in database
  const membership = await prisma.tenantUser.findUnique({
    where: {
      tenantId_userId: {
        tenantId,
        userId: session.user.id
      }
    }
  })

  if (!membership) {
    throw new Error('Forbidden: You are not a member of this organization')
  }

  return {
    tenantId: membership.tenantId,
    userId: membership.userId,
    role: membership.role
  }
}
