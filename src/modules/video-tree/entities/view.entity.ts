import { Entity, Index, Column, ManyToOne } from 'typeorm';

import { BaseEntityWithCreatedAt } from 'src/providers/database/entities/database.entity';
import { UserEntity } from 'src/modules/user/entities/user.entity';
import { VideoTreeEntity } from './video-tree.entity';

@Entity('views')
@Index(['videoId', 'userId', 'ip'])
export class ViewEntity extends BaseEntityWithCreatedAt {
  @Column({ type: 'uuid' })
  videoId: string;

  @Column({ type: 'uuid', nullable: true })
  userId: string;

  @Column({ type: 'varchar', length: 50 })
  ip: string;

  @ManyToOne(() => VideoTreeEntity, (tree) => tree.id, { onDelete: 'CASCADE' })
  video: VideoTreeEntity;

  @ManyToOne(() => UserEntity, (user) => user.id, { onDelete: 'SET NULL' })
  user: UserEntity;
}
