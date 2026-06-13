import { NextRequest, NextResponse } from 'next/server'

// SAAS PRODUCTION NOTE:
// 1. You must register an app in the Meta Developer Portal.
// 2. Add the WhatsApp Business Cloud API product.
// 3. Configure this webhook URL: `https://your-domain.com/api/auth/whatsapp/webhook`.
// 4. Set a strong verify token and validate the GET request from Meta.
// 5. Handle inbound POST messages (messages from leads) and log them to the Activity Timeline.

export async function GET(req: NextRequest) {
  // Meta webhook verification flow
  const { searchParams } = new URL(req.url)
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 })
  }

  return NextResponse.json({ error: 'Invalid verification token' }, { status: 403 })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Example shape of inbound WhatsApp message:
    // {
    //   "object": "whatsapp_business_account",
    //   "entry": [{
    //     "changes": [{
    //       "value": {
    //         "messages": [{
    //           "from": "1234567890",
    //           "text": { "body": "Hello I am interested in your services" }
    //         }]
    //       }
    //     }]
    //   }]
    // }

    // Logic: 
    // 1. Extract phone number.
    // 2. Query DB to find matching Lead by `phone`.
    // 3. Create an Activity log for that Lead.
    // 4. Fire a Notification to the assigned BDE.

    console.log('Received WhatsApp Webhook:', JSON.stringify(body, null, 2))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('WhatsApp webhook error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
