import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';

import { UpdatePictureCommand } from '../impl/update-picture.command';
import { UserRepository } from '../../models/user.repository';

@CommandHandler(UpdatePictureCommand)
export class UpdatePictureHandler
  implements ICommandHandler<UpdatePictureCommand>
{
  constructor(private readonly repository: UserRepository) {}

  async execute({ id, picture }: UpdatePictureCommand) {
    const user = await this.repository.findById(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.updatePicture(picture);

    await this.repository.save(user);

    user.commit();
  }
}
