import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import * as z from 'zod'

const updateUserSchema = z.object({
  role: z.enum(['COMPANY_ADMIN', 'BDM', 'BDE']).optional(),
  isActive: z.boolean().optional(),
})

export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const companyId = req.headers.get('x-company-id')
    const userRole = req.headers.get('x-user-role')

    if (!companyId) return NextResponse.json({ error: 'Tenant context missing' }, { status: 400 })
    if (userRole !== 'COMPANY_ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const userIdToUpdate = params.id
    const body = await req.json()
    const data = updateUserSchema.parse(body)

    // Ensure user is in company
    const membership = await db.membership.findUnique({
      where: { userId_companyId: { userId: userIdToUpdate, companyId } }
    })

    if (!membership) return NextResponse.json({ error: 'User not found in this company' }, { status: 404 })

    const updateData: any = {}
    
    if (data.role) {
      await db.membership.update({
        where: { id: membership.id },
        data: { role: data.role }
      })
    }

    if (data.isActive !== undefined) {
      await db.user.update({
        where: { id: userIdToUpdate },
        data: { isActive: data.isActive }
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 })
    }
    console.error('Update user error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const companyId = req.headers.get('x-company-id')
    const userRole = req.headers.get('x-user-role')

    if (!companyId) return NextResponse.json({ error: 'Tenant context missing' }, { status: 400 })
    if (userRole !== 'COMPANY_ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const userIdToUpdate = params.id

    const membership = await db.membership.findUnique({
      where: { userId_companyId: { userId: userIdToUpdate, companyId } }
    })

    if (!membership) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    // Soft delete user and membership
    await db.$transaction([
      db.membership.delete({ where: { id: membership.id } }),
      // Also invalidate their sessions
      db.session.deleteMany({ where: { userId: userIdToUpdate } })
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete user error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
