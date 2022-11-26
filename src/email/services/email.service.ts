import { NotFoundException, Injectable } from '@nestjs/common';
import { ServerClient } from 'postmark';

import { ConfigService } from 'src/config/services/config.service';
import { BounceService } from './bounce.service';
import { From } from '../constants/email.constant';
import { Template } from '../constants/email.constant';

@Injectable()
export class EmailService {
  private readonly client: ServerClient;

  constructor(
    private readonly config: ConfigService,
    private readonly bounceService: BounceService,
  ) {
    this.client = new ServerClient(this.config.get('EMAIL_SERVER_API_TOKEN'));
  }

  async sendEmail(options: {
    from: From;
    to: string;
    subject: string;
    message: string;
    messageStream?: string;
  }) {
    await this.checkBounce(options.to);
    const sender = this.config.get('EMAIL_FROM');

    return this.client.sendEmail({
      From: sender.replace('@', options.from + '@'),
      To: options.to,
      Subject: options.subject,
      HtmlBody: options.message,
      MessageStream: options.messageStream,
    });
  }

  async sendEmailWithTemplate(options: {
    from: From;
    to: string;
    template: Template;
    templateModel: object;
    messageStream?: string;
  }) {
    await this.checkBounce(options.to);
    const sender = this.config.get('EMAIL_FROM');

    return this.client.sendEmailWithTemplate({
      From: sender.replace('@', options.from + '@'),
      To: options.to,
      TemplateAlias: options.template,
      TemplateModel: options.templateModel,
      MessageStream: options.messageStream,
    });
  }

  private async checkBounce(email: string) {
    const bounce = await this.bounceService.findOneByEmail(email);

    if (bounce) {
      throw new NotFoundException('Invalid email: Bounced');
    }

    return;
  }
}
