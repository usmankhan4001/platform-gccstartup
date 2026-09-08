// Polls for scheduled campaigns that are ready to run.
// Delegates to the same dispatch paths the worker tick uses, so an external
// cron hitting this (or the worker loop) both end up in one implementation.

import { dispatchDueCampaigns } from '../lib/email/send'
import { dispatchDueWhatsappCampaigns } from './dispatcher'

export async function pollScheduledCampaigns(): Promise<void> {
  try {
    await dispatchDueCampaigns(null)
    await dispatchDueWhatsappCampaigns()
  } catch (error) {
    console.error('[Scheduler] Error in scheduler poll cycle', error)
  }
}
