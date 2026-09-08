import { NextRequest, NextResponse } from 'next/server'
import { requireApiKey, addCorsHeaders } from '@/lib/api-auth'

// Complete list of webhook events available for subscription
const webhookEvents = [
  // CRM Events
  {
    event: 'contact.created',
    category: 'CRM',
    description: 'Triggered when a new contact is created',
    payload: {
      contact: '{ id, email, name }',
      source: 'string',
    },
  },
  {
    event: 'contact.updated',
    category: 'CRM',
    description: 'Triggered when a contact is updated',
    payload: {
      contact: '{ id, email, name }',
      changes: 'object',
    },
  },
  {
    event: 'contact.stage_changed',
    category: 'CRM',
    description: 'Triggered when a contact moves to a different pipeline stage',
    payload: {
      contact: '{ id, email }',
      oldStage: 'string',
      newStage: 'string',
    },
  },
  {
    event: 'deal.created',
    category: 'CRM',
    description: 'Triggered when a new deal is created',
    payload: {
      deal: '{ id, title, value, currency }',
      contact: '{ id }',
    },
  },
  {
    event: 'deal.won',
    category: 'CRM',
    description: 'Triggered when a deal is marked as won',
    payload: {
      deal: '{ id, title, value, currency }',
      contact: '{ id }',
      closedAt: 'ISO datetime',
    },
  },
  {
    event: 'deal.lost',
    category: 'CRM',
    description: 'Triggered when a deal is marked as lost',
    payload: {
      deal: '{ id, title, value, currency }',
      contact: '{ id }',
      closeReason: 'string',
    },
  },
  {
    event: 'lead.captured',
    category: 'CRM',
    description: 'Triggered when a new lead is captured from a form or tool',
    payload: {
      lead: '{ id, email, source, tool }',
    },
  },
  {
    event: 'lead.converted',
    category: 'CRM',
    description: 'Triggered when a lead is converted to a contact',
    payload: {
      lead: '{ id }',
      contact: '{ id }',
    },
  },

  // Conversation Events
  {
    event: 'message.received',
    category: 'Conversations',
    description: 'Triggered when a message is received in a conversation',
    payload: {
      conversation: '{ id, channel }',
      message: '{ id, body, direction }',
      contact: '{ id }',
    },
  },
  {
    event: 'conversation.assigned',
    category: 'Conversations',
    description: 'Triggered when a conversation is assigned to a team member',
    payload: {
      conversation: '{ id, channel }',
      assignedTo: 'string',
    },
  },

  // Campaign Events
  {
    event: 'campaign.dispatched',
    category: 'Campaigns',
    description: 'Triggered when a campaign starts sending',
    payload: {
      campaign: '{ id, name, type }',
      recipientCount: 'number',
    },
  },
  {
    event: 'campaign.completed',
    category: 'Campaigns',
    description: 'Triggered when a campaign finishes sending',
    payload: {
      campaign: '{ id, name, type }',
      stats: '{ sent, delivered, failed }',
    },
  },

  // Email Events
  {
    event: 'email.sent',
    category: 'Email',
    description: 'Triggered when an email is sent',
    payload: {
      email: '{ id, to, subject }',
      campaign: '{ id } | null',
    },
  },
  {
    event: 'email.opened',
    category: 'Email',
    description: 'Triggered when an email is opened',
    payload: {
      email: '{ id, to }',
      openedAt: 'ISO datetime',
    },
  },
  {
    event: 'email.clicked',
    category: 'Email',
    description: 'Triggered when a link in an email is clicked',
    payload: {
      email: '{ id, to }',
      clickedAt: 'ISO datetime',
      url: 'string',
    },
  },
  {
    event: 'email.bounced',
    category: 'Email',
    description: 'Triggered when an email bounces',
    payload: {
      email: '{ id, to }',
      bounceType: 'string',
      reason: 'string',
    },
  },

  // Support Events
  {
    event: 'ticket.created',
    category: 'Support',
    description: 'Triggered when a new support ticket is created',
    payload: {
      ticket: '{ id, number, subject, priority }',
      contact: '{ id }',
    },
  },
  {
    event: 'ticket.resolved',
    category: 'Support',
    description: 'Triggered when a support ticket is resolved',
    payload: {
      ticket: '{ id, number }',
      resolvedAt: 'ISO datetime',
    },
  },

  // Automation Events
  {
    event: 'flow.enrollment_created',
    category: 'Automation',
    description: 'Triggered when a contact is enrolled in an automation flow',
    payload: {
      flow: '{ id }',
      contact: '{ id }',
      enrollment: '{ id }',
    },
  },
  {
    event: 'flow.completed',
    category: 'Automation',
    description: 'Triggered when a contact completes an automation flow',
    payload: {
      flow: '{ id }',
      contact: '{ id }',
      completedAt: 'ISO datetime',
    },
  },

  // Order Events
  {
    event: 'order.paid',
    category: 'Orders',
    description: 'Triggered when an order payment is successful',
    payload: {
      order: '{ id, amount, currency }',
      contact: '{ id }',
      company: '{ id } | null',
    },
  },
  {
    event: 'order.payment_failed',
    category: 'Orders',
    description: 'Triggered when an order payment fails',
    payload: {
      order: '{ id, amount, currency }',
      contact: '{ id }',
      error: 'string',
    },
  },

  // System Events
  {
    event: 'user.created',
    category: 'System',
    description: 'Triggered when a new user is created',
    payload: {
      user: '{ id, email, name, role }',
    },
  },
  {
    event: 'user.role_changed',
    category: 'System',
    description: 'Triggered when a user role is changed',
    payload: {
      user: '{ id, email }',
      oldRole: 'string',
      newRole: 'string',
    },
  },
]

export const GET = requireApiKey(async (request: NextRequest, context: any, key: any) => {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')

    let events = [...webhookEvents]

    if (category) {
      events = events.filter(e => e.category.toLowerCase() === category.toLowerCase())
    }

    const categories = [...new Set(webhookEvents.map(e => e.category))]

    const response = NextResponse.json({
      data: events,
      meta: {
        total: events.length,
        categories,
      },
    })
    return addCorsHeaders(response)
  } catch (error: any) {
    const response = NextResponse.json({ error: error.message }, { status: 500 })
    return addCorsHeaders(response)
  }
})

export async function OPTIONS() {
  return addCorsHeaders(new NextResponse(null, { status: 204 }))
}
