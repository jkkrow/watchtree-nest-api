import {
  Entity,
  Check,
  Column,
  OneToOne,
  ManyToOne,
  ManyToMany,
  JoinTable,
} from 'typeorm';

import { BaseEntityWithTimestamps } from 'src/providers/database/entities/database.entity';
import { UserEntity } from 'src/modules/user/entities/user.entity';
import { CategoryEntity } from '../../category/entities/category.entity';
import { VideoNodeEntity } from './video-node.entity';
import {
  VIDEO_TREE_STATUS,
  VideoTreeStatus,
} from '../constants/video-tree.contstant';

@Entity('video_trees')
@Check('size >= 0')
@Check('max_duration >= 0')
@Check('min_duration >= 0')
@Check('max_duration >= min_duration')
export class VideoTreeEntity extends BaseEntityWithTimestamps {
  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'varchar', length: 2000 })
  description: string;

  @Column({ type: 'varchar', length: 200 })
  thumbnail: string;

  @Column({ type: 'varchar', length: 300 })
  defaultThumbnail: string;

  @Column({ type: 'real' })
  size: number;

  @Column({ type: 'real' })
  maxDuration: number;

  @Column({ type: 'real' })
  minDuration: number;

  @Column({ type: 'enum', enum: Object.values(VIDEO_TREE_STATUS) })
  status: VideoTreeStatus;

  @Column({ type: 'boolean' })
  editing: boolean;

  @Column({ type: 'uuid' })
  creatorId: string;

  @ManyToOne(() => UserEntity, (user) => user.id, { onDelete: 'CASCADE' })
  creator: UserEntity;

  @OneToOne(() => VideoNodeEntity, (node) => node.tree, {
    cascade: true,
    eager: true,
  })
  root: VideoNodeEntity;

  @ManyToMany(() => CategoryEntity, { cascade: true, eager: true })
  @JoinTable({
    name: 'categories_video_trees',
    joinColumn: { name: 'video_tree_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'category_name', referencedColumnName: 'name' },
  })
  categories: CategoryEntity[];

  @Column('tsvector', { select: false })
  search: any;
}
