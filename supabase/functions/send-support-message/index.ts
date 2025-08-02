import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
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

const resendApiKey = Deno.env.get('RESEND_API_KEY')
const resend = resendApiKey ? new Resend(resendApiKey) : null
const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID')
const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN')
const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER')

const sendSMS = async (to: string, message: string) => {
  const url = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`
  
  // Format phone number to E.164 format for Twilio
  let formattedTo = to.replace(/\D/g, '') // Remove all non-digits
  if (!formattedTo.startsWith('1') && formattedTo.length === 10) {
    formattedTo = '1' + formattedTo // Add US country code if missing
  }
  formattedTo = '+' + formattedTo // Add + prefix
  
  console.log(`Formatting phone ${to} to ${formattedTo}`)
  
  const body = new URLSearchParams({
    'From': twilioPhoneNumber!,
    'To': formattedTo,
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

  const result = await response.json()
  console.log(`Twilio response status: ${response.status}`)
  console.log(`Twilio response:`, JSON.stringify(result, null, 2))
  
  if (!response.ok) {
    console.error(`Twilio API error: ${response.status} - ${result.message || 'Unknown error'}`)
  }

  return result
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
    // Get user ID from JWT token
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Authentication required' 
        }),
        {
          status: 401,
          headers: { 
            'Content-Type': 'application/json', 
            ...corsHeaders 
          },
        }
      )
    }

    // Create Supabase client for database operations
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    )

    // Get current user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Invalid authentication' 
        }),
        {
          status: 401,
          headers: { 
            'Content-Type': 'application/json', 
            ...corsHeaders 
          },
        }
      )
    }

    const { contacts, message, senderName = 'Someone you care about' }: SendMessageRequest = await req.json()
    
    // Check if Twilio is configured
    if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
      console.error('Missing Twilio configuration')
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'SMS service not configured. Please set up Twilio credentials.' 
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

    // Check rate limit for crisis alerts
    const { data: rateLimitCheck, error: rateLimitError } = await supabaseClient
      .rpc('check_sms_rate_limit', {
        user_uuid: user.id,
        operation_type: 'crisis_alert',
        max_operations: 3,
        window_minutes: 5
      })

    if (rateLimitError || !rateLimitCheck) {
      console.error('Rate limit check failed:', rateLimitError)
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Too many crisis alerts sent recently. Please wait before sending another.' 
        }),
        {
          status: 429,
          headers: { 
            'Content-Type': 'application/json', 
            ...corsHeaders 
          },
        }
      )
    }

    // Validate input data
    const { data: validationResult, error: validationError } = await supabaseClient
      .rpc('validate_sms_input', {
        phone_number: contacts[0]?.phoneNumber || '',
        message_content: message,
        user_uuid: user.id
      })

    if (validationError || !validationResult?.is_valid) {
      console.error('Input validation failed:', validationError || validationResult?.errors)
      return new Response(
        JSON.stringify({ 
          success: false,
          error: validationResult?.errors?.[0] || 'Invalid input data' 
        }),
        {
          status: 400,
          headers: { 
            'Content-Type': 'application/json', 
            ...corsHeaders 
          },
        }
      )
    }
    
    console.log('Sending support messages:', { 
      contactCount: contacts.length, 
      senderName,
      message: message.substring(0, 50) + '...' 
    })

    const results = []
    
    for (const contact of contacts) {
      if (!contact.isActive) continue
      
      // Verify contact ownership
      const { data: ownershipCheck, error: ownershipError } = await supabaseClient
        .rpc('verify_contact_ownership', {
          user_uuid: user.id,
          contact_phone: contact.phoneNumber
        })

      if (ownershipError || !ownershipCheck) {
        console.error(`Unauthorized contact access for ${contact.name}`)
        results.push({
          contact: contact.name,
          method: 'sms',
          success: false,
          error: 'Unauthorized contact access'
        })
        continue
      }
      
      const personalizedMessage = validationResult.sanitized_message + `\n\n- ${senderName}`
      
      try {
        // Send SMS
        if (contact.phoneNumber) {
          console.log(`Sending SMS to ${contact.name} at ${contact.phoneNumber}`)
          const smsResult = await sendSMS(validationResult.clean_phone, personalizedMessage)
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