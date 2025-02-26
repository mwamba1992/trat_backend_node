import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
} from 'typeorm';
import { Bill } from '../../../payment/bill/entities/bill.entity';
import { Appeal } from '../../appeals/entities/appeal.entity';
import { BaseEntity } from '../../../utils/base.entity';

@Entity()
export class NoticeHighCourt extends BaseEntity {
  @Column()
  appellantType: string;

  @Column()
  appellantName: string;

  @Column()
  appellantPhone: string;

  @Column()
  respondentName: string;

  @ManyToOne(() => Bill, { nullable: true })
  @JoinColumn({ name: 'billId', referencedColumnName: 'id' })
  bill: Bill;

  @ManyToMany(() => Appeal)
  @JoinTable()
  listOfAppeals: Appeal[];

}
