import { Column } from 'typeorm';

import { IUserPremium } from '../../interfaces/user.interface';

export class PremiumColumn implements IUserPremium {
  @Column({ type: 'varchar', length: 100, nullable: true })
  id: string;

  @Column({
    type: 'enum',
    enum: ['standard', 'business', 'enterprise'],
    nullable: true,
  })
  name: IUserPremium['name'];

  @Column({ type: 'timestamp', nullable: true })
  expiredAt: Date;

  @Column({ type: 'boolean', nullable: true })
  cancelled: boolean;
}