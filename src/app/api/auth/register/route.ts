import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createSession } from '@/lib/auth'
import * as z from 'zod'
import bcrypt from 'bcryptjs'

const registerSchema = z.object({
  companyName: z.string().min(2),
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { companyName, firstName, lastName, email, password } = registerSchema.parse(body)

    const existingUser = await db.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 400 })
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12)

    // Generate slug from company name
    const slug = companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')

    // Transaction to create company and user
    const result = await db.$transaction(async (tx) => {
      let uniqueSlug = slug
      let counter = 1
      while (await tx.company.findUnique({ where: { slug: uniqueSlug } })) {
        uniqueSlug = `${slug}-${counter}`
        counter++
      }

      const company = await tx.company.create({
        data: {
          name: companyName,
          slug: uniqueSlug,
          status: 'TRIAL',
        }
      })

      const user = await tx.user.create({
        data: {
          email,
          firstName,
          lastName,
          passwordHash,
          role: 'COMPANY_ADMIN',
          companyId: company.id,
        }
      })

      return { company, user }
    })

    // Create session
    await createSession(result.user.id, result.company.id, result.user.role)

    return NextResponse.json({ 
      success: true, 
      user: {
        id: result.user.id,
        email: result.user.email,
        role: result.user.role,
        companyId: result.company.id,
        companySlug: result.company.slug
      }
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 })
    }
    console.error('Register error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
