import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../../utils/base.entity';

@Entity()
export class CommonSetup extends BaseEntity{

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column()
  setupType: string;

}
