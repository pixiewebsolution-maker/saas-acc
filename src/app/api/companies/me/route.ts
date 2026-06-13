import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import * as z from 'zod'

const updateCompanySchema = z.object({
  name: z.string().min(2).optional(),
  domain: z.string().optional().nullable(),
  primaryColor: z.string().optional().nullable(),
})

export async function GET(req: NextRequest) {
  try {
    const companyId = req.headers.get('x-company-id')
    
    if (!companyId) {
      return NextResponse.json({ error: 'Tenant context missing' }, { status: 400 })
    }

    const company = await db.company.findUnique({
      where: { id: companyId },
      include: {
        settings: true
      }
    })

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, company })
  } catch (error) {
    console.error('Fetch company error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const companyId = req.headers.get('x-company-id')
    const role = req.headers.get('x-user-role')

    if (!companyId) {
      return NextResponse.json({ error: 'Tenant context missing' }, { status: 400 })
    }

    if (role !== 'COMPANY_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const data = updateCompanySchema.parse(body)

    const updatedCompany = await db.company.update({
      where: { id: companyId },
      data: {
        name: data.name,
        domain: data.domain,
        primaryColor: data.primaryColor
      }
    })

    return NextResponse.json({ success: true, company: updatedCompany })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 })
    }
    console.error('Update company error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
