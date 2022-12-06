import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { NotFoundException } from 'src/common/exceptions';
import { JwtService } from 'src/auth/services/jwt.service';
import { OAuthService } from 'src/providers/gcp/oauth/oauth.service';
import { GoogleSigninQuery } from '../impl/google-signin.query';
import { UserEntity } from '../../entities/user.entity';

@QueryHandler(GoogleSigninQuery)
export class GoogleSigninHandler implements IQueryHandler<GoogleSigninQuery> {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly jwtService: JwtService,
    private readonly oAuthService: OAuthService,
  ) {}

  async execute({ token }: GoogleSigninQuery) {
    const { email } = await this.oAuthService.verifyToken(token);

    const user = await this.userRepository.findOneBy({ email });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { refreshToken, accessToken } = this.jwtService.signAuthToken(
      user.id,
    );

    return { user, refreshToken, accessToken };
  }
}
