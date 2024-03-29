import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { v4 as uuidv4 } from 'uuid';

import { ConflictException } from 'src/common/exceptions';
import { EncryptService } from 'src/auth/services/encrypt.service';
import { OAuthService } from 'src/providers/gcp/oauth/services/oauth.service';
import { CreateGoogleUserCommand } from '../impl/create-google-user.command';
import { UserRepository } from '../../models/user.repository';
import { UserFactory } from '../../models/user.factory';

@CommandHandler(CreateGoogleUserCommand)
export class CreateGoogleUserHandler
  implements ICommandHandler<CreateGoogleUserCommand>
{
  constructor(
    private readonly repository: UserRepository,
    private readonly factory: UserFactory,
    private readonly encryptService: EncryptService,
    private readonly oAuthService: OAuthService,
  ) {}

  async execute({ token }: CreateGoogleUserCommand) {
    const { name, email, picture } = await this.oAuthService.verifyToken(token);

    const existingUser = await this.repository.findOneByEmail(email);

    if (existingUser && existingUser.type !== 'google') {
      throw new ConflictException('Email already exists');
    }

    if (existingUser && existingUser.type === 'google') {
      return;
    }

    const id = uuidv4();
    const hash = await this.encryptService.hash(uuidv4() + email);

    const user = this.factory.create({
      id,
      type: 'google',
      name,
      email,
      password: hash,
      picture,
      verified: true,
    });

    await this.repository.save(user);

    user.commit();
  }
}
