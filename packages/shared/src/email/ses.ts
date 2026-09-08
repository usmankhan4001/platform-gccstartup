import {
  SESv2Client,
  SendEmailCommand,
  type SESv2ClientConfig,
  type SendEmailCommandInput,
} from '@aws-sdk/client-sesv2'
import { logger } from '../utils/logger'
import type { EmailProvider, EmailSendParams, EmailBulkSendParams, EmailSendResult } from './provider'

function getSESConfig(): SESv2ClientConfig | null {
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY
  const region = process.env.AWS_REGION

  if (!accessKeyId || !secretAccessKey || !region) {
    logger.warn('SES: missing AWS credentials in environment')
    return null
  }

  return { region, credentials: { accessKeyId, secretAccessKey } }
}

/**
 * Build a SendEmailCommandInput from provider params.
 */
function buildSendInput(params: EmailSendParams): SendEmailCommandInput {
  const destinations = Array.isArray(params.to) ? params.to : [params.to]

  return {
    FromEmailAddress: params.from,
    Destination: { ToAddresses: destinations },
    Content: {
      Simple: {
        Subject: { Data: params.subject, Charset: 'UTF-8' },
        Body: {
          Html: { Data: params.html, Charset: 'UTF-8' },
          ...(params.text ? { Text: { Data: params.text, Charset: 'UTF-8' } } : {}),
        },
      },
    },
    ...(params.tags
      ? {
          EmailTags: Object.entries(params.tags).map(([Name, Value]) => ({ Name, Value })),
        }
      : {}),
  }
}

/**
 * Create an Amazon SES v2 email provider.
 * Returns null if AWS credentials are not configured.
 */
export function createSESProvider(): EmailProvider | null {
  const config = getSESConfig()
  if (!config) return null

  const client = new SESv2Client(config)

  async function send(params: EmailSendParams): Promise<EmailSendResult> {
    const input = buildSendInput(params)
    const command = new SendEmailCommand(input)
    const response = await client.send(command)

    return {
      id: response.MessageId ?? `ses-${Date.now()}`,
      status: 'queued',
    }
  }

  async function sendBulk(params: EmailBulkSendParams): Promise<EmailSendResult[]> {
    // SES v2 does not have a native bulk API in the same command;
    // send individually — rate limiting handled by AWS.
    const results: EmailSendResult[] = []

    for (const recipient of params.to) {
      try {
        const result = await send({ ...params, to: recipient })
        results.push(result)
      } catch (error) {
        logger.error('SES: bulk send failed for recipient', {
          recipient,
          error: (error as Error).message,
        })
        results.push({ id: `failed-${recipient}`, status: 'failed' })
      }
    }

    return results
  }

  return { send, sendBulk }
}
