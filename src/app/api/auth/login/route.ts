import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createSession } from '@/lib/auth'
import * as z from 'zod'
import bcrypt from 'bcryptjs'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password } = loginSchema.parse(body)

    const user = await db.user.findUnique({
      where: { email },
      include: { memberships: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    if (!user.isActive) {
      return NextResponse.json({ error: 'Account is deactivated' }, { status: 403 })
    }

    const isValid = await bcrypt.compare(password, user.passwordHash)
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const primaryMembership = user.memberships[0]
    const role = user.isSuperAdmin ? 'SUPER_ADMIN' : (primaryMembership?.role || 'USER')
    const companyId = primaryMembership?.companyId || null

    // Create session
    await createSession(user.id, companyId, role)

    // Log the login activity
    await db.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    })

    return NextResponse.json({ 
      success: true, 
      user: {
        id: user.id,
        email: user.email,
        role: role,
        firstName: user.firstName,
        lastName: user.lastName,
        companyId: companyId
      }
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 })
    }
    console.error('Login error:', error)
    return NextResponse.json({ error: error?.message || String(error), stack: error?.stack }, { status: 500 })
  }
}
