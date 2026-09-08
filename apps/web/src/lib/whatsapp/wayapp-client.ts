export class WhatsAppClient {
  constructor() {}
  async sendText(to: string, body: string) { return { success: false, messageId: null } }
  async sendTemplate(to: string, name: string, lang: string) { return { success: false, messageId: null } }
  async sendTemplateMessage(params: any): Promise<any> { return { messages: [{ id: null }] } }
  async sendMediaMessage(params: any): Promise<any> { return null }
  async fetchTemplate(id: string): Promise<any> { return null }
  async fetchTemplates(): Promise<any[]> { return [] }
  static async createFromSettings(): Promise<WhatsAppClient> { return new WhatsAppClient() }
}

export async function sendText(to: string, body: string) { return { success: false, messageId: null }; }
export async function sendTemplate(to: string, name: string, lang: string) { return { success: false, messageId: null }; }
