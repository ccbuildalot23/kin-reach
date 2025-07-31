import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { Resend } from "npm:resend@2.0.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SupportContact {
  id: string
  name: string
  phoneNumber: string
  relationship?: string
  isActive: boolean
}

interface SendMessageRequest {
  contacts: SupportContact[]
  message: string
  senderName?: string
}

const resend = new Resend(Deno.env.get('RESEND_API_KEY'))
const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID')
const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN')
const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER')

const sendSMS = async (to: string, message: string) => {
  const url = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`
  
  const body = new URLSearchParams({
    'From': twilioPhoneNumber!,
    'To': to,
    'Body': message
  })

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${btoa(`${twilioAccountSid}:${twilioAuthToken}`)}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: body.toString()
  })

  return response.json()
}

const sendEmail = async (to: string, name: string, message: string, senderName: string) => {
  const emailResponse = await resend.emails.send({
    from: 'Connect Button Support <support@yourdomain.com>',
    to: [to],
    subject: `${senderName} needs your support`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #4ade80, #06b6d4); padding: 30px; border-radius: 12px; color: white; text-align: center; margin-bottom: 20px;">
          <h1 style="margin: 0; font-size: 24px;">${senderName} reached out for support</h1>
        </div>
        
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #1e293b; margin-top: 0;">Message:</h2>
          <p style="color: #475569; font-size: 16px; line-height: 1.5; margin-bottom: 0;">"${message}"</p>
        </div>
        
        <div style="background: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b;">
          <p style="margin: 0; color: #92400e; font-weight: 500;">
            <strong>This person is reaching out because they need support right now.</strong> 
            Please consider giving them a call, sending a message, or offering to spend time together.
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
          <p style="color: #64748b; font-size: 14px; margin: 0;">
            Sent via Connect Button - Supporting mental health and recovery
          </p>
        </div>
      </div>
    `,
  })

  return emailResponse
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { contacts, message, senderName = 'Someone you care about' }: SendMessageRequest = await req.json()
    
    console.log('Sending support messages:', { 
      contactCount: contacts.length, 
      senderName,
      message: message.substring(0, 50) + '...' 
    })

    const results = []
    
    for (const contact of contacts) {
      if (!contact.isActive) continue
      
      const personalizedMessage = `${message}\n\n- ${senderName}`
      
      try {
        // Send SMS
        if (contact.phoneNumber) {
          console.log(`Sending SMS to ${contact.name} at ${contact.phoneNumber}`)
          const smsResult = await sendSMS(contact.phoneNumber, personalizedMessage)
          results.push({
            contact: contact.name,
            method: 'sms',
            success: smsResult.sid ? true : false,
            details: smsResult
          })
        }

        // Send email if available (you might want to add email field to contacts)
        // For now, we'll just log that SMS was sent
        console.log(`Successfully notified ${contact.name}`)
        
      } catch (error) {
        console.error(`Failed to notify ${contact.name}:`, error)
        results.push({
          contact: contact.name,
          method: 'sms',
          success: false,
          error: error.message
        })
      }
    }

    const successCount = results.filter(r => r.success).length
    
    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully notified ${successCount} out of ${contacts.length} contacts`,
        results: results
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    )

  } catch (error: any) {
    console.error('Error in send-support-message function:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      {
        status: 500,
        headers: { 
          'Content-Type': 'application/json', 
          ...corsHeaders 
        },
      }
    )
  }
}

serve(handler)