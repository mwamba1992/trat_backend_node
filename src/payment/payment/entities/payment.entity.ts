import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Bill } from '../../bill/entities/bill.entity';
;


@Entity()
export class Payment  {

  @PrimaryGeneratedColumn()// Using UUID for the 'id'
  id: number;

  @Column()
  transactionId: string;

  @Column()
  paidAmount: number;

  @Column()
  billAmount: number;


  @ManyToOne(() => Bill, bill => bill.id)
  bill: Bill;

  @Column()
  paymentDate: Date;

  @Column()
  payerName: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  payerPhone: string;

  @Column()
  gepgReference: string;

  @Column()
  accountNumber: string;

  @Column()
  controlNumber: string

}
