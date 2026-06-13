import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import * as z from 'zod'
import bcrypt from 'bcryptjs'

const createUserSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email(),
  role: z.enum(['COMPANY_ADMIN', 'BDM', 'BDE']),
  password: z.string().min(8) // In a real app, send an invite email. For Sprint 1 we create directly.
})

export async function GET(req: NextRequest) {
  try {
    const companyId = req.headers.get('x-company-id')
    if (!companyId) return NextResponse.json({ error: 'Tenant context missing' }, { status: 400 })

    const memberships = await db.membership.findMany({
      where: { companyId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            isActive: true,
            lastLoginAt: true,
            createdAt: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    const users = memberships.map(m => ({
      ...m.user,
      role: m.role,
      membershipId: m.id
    }))

    return NextResponse.json({ success: true, users })
  } catch (error) {
    console.error('Fetch users error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const companyId = req.headers.get('x-company-id')
    const userRole = req.headers.get('x-user-role')

    if (!companyId) return NextResponse.json({ error: 'Tenant context missing' }, { status: 400 })
    if (userRole !== 'COMPANY_ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await req.json()
    const data = createUserSchema.parse(body)

    const existingUser = await db.user.findUnique({ where: { email: data.email } })
    if (existingUser) {
      // In a real multi-workspace app, we'd just create a Membership if they exist.
      // But we must verify they want to join. For now, we assume simple flow.
      const existingMembership = await db.membership.findUnique({
        where: { userId_companyId: { userId: existingUser.id, companyId } }
      })
      if (existingMembership) {
        return NextResponse.json({ error: 'User already in company' }, { status: 400 })
      }

      await db.membership.create({
        data: {
          userId: existingUser.id,
          companyId,
          role: data.role
        }
      })
      
      return NextResponse.json({ success: true, message: 'Added existing user to company' })
    }

    const passwordHash = await bcrypt.hash(data.password, 12)

    const result = await db.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          passwordHash,
        }
      })

      const membership = await tx.membership.create({
        data: {
          userId: newUser.id,
          companyId,
          role: data.role
        }
      })

      return { user: newUser, membership }
    })

    return NextResponse.json({ success: true, user: result.user })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 })
    }
    console.error('Create user error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
