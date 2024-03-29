import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { NotFoundException } from 'src/common/exceptions';
import { ConfigService } from 'src/config/services/config.service';
import { JwtService } from 'src/auth/services/jwt.service';
import { EmailService } from 'src/providers/email/services/email.service';
import { SendRecoveryCommand } from '../impl/send-recovery.command';
import { UserRepository } from '../../models/user.repository';

@CommandHandler(SendRecoveryCommand)
export class SendRecoveryHandler
  implements ICommandHandler<SendRecoveryCommand>
{
  constructor(
    private readonly repository: UserRepository,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
  ) {}

  async execute({ email }: SendRecoveryCommand) {
    const user = await this.repository.findOneByEmail(email);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const clientUrl = this.configService.get('CLIENT_URL');
    const token = this.jwtService.sign(
      { userId: user.id },
      {
        sub: 'recovery',
        exp: '1h',
      },
    );

    const actionUrl = `${clientUrl}/auth/reset-password?token=${token}`;
    const retryUrl = `${clientUrl}/user/account`;

    await this.emailService.sendEmailWithTemplate({
      from: 'auth',
      to: email,
      template: 'password-reset',
      templateModel: { actionUrl, retryUrl },
    });
  }
}
