/**
 * Email Notification System
 * Handles sending email notifications
 */

export interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  attachments?: EmailAttachment[];
  from?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
}

export interface EmailAttachment {
  filename: string;
  content: string | Buffer;
  contentType?: string;
}

export interface EmailTemplate {
  name: string;
  subject: string;
  html: string;
  text?: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

class EmailNotificationSystem {
  private templates = new Map<string, EmailTemplate>();
  private fromAddress: string;
  private replyToAddress?: string;

  constructor(fromAddress: string, replyToAddress?: string) {
    this.fromAddress = fromAddress;
    this.replyToAddress = replyToAddress;
  }

  /**
   * Registers an email template
   */
  registerTemplate(template: EmailTemplate): void {
    this.templates.set(template.name, template);
  }

  /**
   * Gets a template
   */
  getTemplate(name: string): EmailTemplate | undefined {
    return this.templates.get(name);
  }

  /**
   * Sends an email
   */
  async send(options: EmailOptions): Promise<EmailResult> {
    try {
      // In a real implementation, this would use a service like SendGrid, AWS SES, or Nodemailer
      console.log('Sending email:', {
        to: options.to,
        subject: options.subject,
        from: options.from || this.fromAddress,
      });

      // Simulate email sending
      await new Promise(resolve => setTimeout(resolve, 100));

      const messageId = `msg-${Date.now()}-${Math.random().toString(36).substring(7)}`;

      return {
        success: true,
        messageId,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Sends an email using a template
   */
  async sendTemplate(
    templateName: string,
    to: string | string[],
    variables: Record<string, any> = {}
  ): Promise<EmailResult> {
    const template = this.templates.get(templateName);
    if (!template) {
      return {
        success: false,
        error: `Template '${templateName}' not found`,
      };
    }

    // Replace variables in subject and content
    const subject = this.replaceVariables(template.subject, variables);
    const html = this.replaceVariables(template.html, variables);
    const text = template.text ? this.replaceVariables(template.text, variables) : undefined;

    return this.send({
      to,
      subject,
      html,
      text,
    });
  }

  /**
   * Replaces variables in a string
   */
  private replaceVariables(template: string, variables: Record<string, any>): string {
    let result = template;

    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, String(value));
    }

    return result;
  }

  /**
   * Sends a batch of emails
   */
  async sendBatch(optionsArray: EmailOptions[]): Promise<EmailResult[]> {
    const results = await Promise.all(
      optionsArray.map(options => this.send(options))
    );
    return results;
  }

  /**
   * Queues an email for later sending
   */
  queueEmail(options: EmailOptions, delay: number = 0): void {
    setTimeout(() => {
      this.send(options);
    }, delay);
  }

  /**
   * Updates the from address
   */
  setFromAddress(address: string): void {
    this.fromAddress = address;
  }

  /**
   * Updates the reply-to address
   */
  setReplyToAddress(address: string): void {
    this.replyToAddress = address;
  }
}

// Create singleton instance
const emailSystem = new EmailNotificationSystem(
  process.env.EMAIL_FROM || 'noreply@axiora.com',
  process.env.EMAIL_REPLY_TO
);

/**
 * Registers an email template
 */
export function registerEmailTemplate(template: EmailTemplate): void {
  emailSystem.registerTemplate(template);
}

/**
 * Gets an email template
 */
export function getEmailTemplate(name: string): EmailTemplate | undefined {
  return emailSystem.getTemplate(name);
}

/**
 * Sends an email
 */
export async function sendEmail(options: EmailOptions): Promise<EmailResult> {
  return emailSystem.send(options);
}

/**
 * Sends an email using a template
 */
export async function sendEmailTemplate(
  templateName: string,
  to: string | string[],
  variables?: Record<string, any>
): Promise<EmailResult> {
  return emailSystem.sendTemplate(templateName, to, variables);
}

/**
 * Sends a batch of emails
 */
export async function sendEmailBatch(optionsArray: EmailOptions[]): Promise<EmailResult[]> {
  return emailSystem.sendBatch(optionsArray);
}

/**
 * Queues an email for later sending
 */
export function queueEmail(options: EmailOptions, delay?: number): void {
  emailSystem.queueEmail(options, delay);
}

/**
 * Sets the from address
 */
export function setEmailFromAddress(address: string): void {
  emailSystem.setFromAddress(address);
}

/**
 * Sets the reply-to address
 */
export function setEmailReplyToAddress(address: string): void {
  emailSystem.setReplyToAddress(address);
}

/**
 * Common email templates
 */
export const EmailTemplates = {
  welcome: {
    name: 'welcome',
    subject: 'Welcome to Axiora',
    html: `
      <h1>Welcome {{name}}!</h1>
      <p>Thank you for joining Axiora. We're excited to have you on board.</p>
      <p>Get started by exploring our projects and resources.</p>
    `,
    text: 'Welcome {{name}}! Thank you for joining Axiora.',
  },
  passwordReset: {
    name: 'passwordReset',
    subject: 'Reset Your Password',
    html: `
      <h1>Reset Your Password</h1>
      <p>Click the link below to reset your password:</p>
      <a href="{{resetUrl}}">Reset Password</a>
      <p>This link will expire in 1 hour.</p>
    `,
    text: 'Reset your password at {{resetUrl}}',
  },
  verification: {
    name: 'verification',
    subject: 'Verify Your Email',
    html: `
      <h1>Verify Your Email</h1>
      <p>Click the link below to verify your email address:</p>
      <a href="{{verificationUrl}}">Verify Email</a>
    `,
    text: 'Verify your email at {{verificationUrl}}',
  },
  notification: {
    name: 'notification',
    subject: '{{title}}',
    html: `
      <h1>{{title}}</h1>
      <p>{{message}}</p>
    `,
    text: '{{title}}: {{message}}',
  },
};

// Register common templates
Object.values(EmailTemplates).forEach(template => {
  emailSystem.registerTemplate(template);
});

export default emailSystem;
