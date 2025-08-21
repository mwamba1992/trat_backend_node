import { BaseEntity } from '../../../utils/base.entity';

import { Entity, Column, JoinColumn, ManyToOne } from 'typeorm';
import { Bill } from '../../../payment/bill/entities/bill.entity';

@Entity()
export class Notice extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  noticeNo: string;

  @Column({ type: 'varchar', length: 255 })
  appellantFullName: string;

  @Column({ type: 'varchar', length: 255 })
  respondentFullName: string;

  @Column({ type: 'varchar', length: 15, nullable: true })
  appellantPhone: string;

  @Column({ type: 'varchar', length: 15, nullable: true })
  respondentPhone: string;

  @ManyToOne(() => Bill, { nullable: true })
  @JoinColumn({ name: 'billId', referencedColumnName: 'id' })
  bill: Bill;

  @Column('simple-array', { nullable: true })
  listAppeal: string[];

  @Column('simple-array', { nullable: true })
  listApplication: string[];

  @Column({ type: 'varchar', length: 10, nullable: true })
  financialYear: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  appealAgaints: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  noticeType: string;
}
