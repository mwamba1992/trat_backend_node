import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../../utils/base.entity';


@Entity()
export class Judge extends BaseEntity{
  @Column({ length: 100 })
  name: string;

  @Column({ unique: true })
  email: string;

  @Column({ length: 15 })
  phone: string;
}
