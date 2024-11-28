import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne, OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { IsBoolean, IsDecimal, IsEmail, IsPhoneNumber, IsString } from 'class-validator';
import { User } from '../../../auth/user/entities/user.entity';
import { BillItem } from '../../bill-item/entities/bill-item.entity';
import { AppealAmount } from '../../../appeal/appeals/entities/appeal.amount';


@Entity()
export class Bill {

  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  billId:string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @IsString()
  approvedBy: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @IsString()
  billDescription: string;

  @Column({ type: 'boolean', default: false })
  @IsBoolean()
  billPayed: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @IsString()
  billReference: string;

  @Column({ type: 'decimal', precision: 20, scale: 2 })
  @IsDecimal()
  billedAmount: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @IsString()
  billControlNumber: string;

  @Column({ type: 'decimal', precision: 20, scale: 2, nullable: true })
  @IsDecimal()
  billEquivalentAmount: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  @IsString()
  appType: string;

  @Column({ type: 'date', nullable: true })
  expiryDate: Date;

  @Column({ type: 'date', nullable: false })
  @IsString()
  generatedDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastReminder: Date;

  @Column({ type: 'decimal', precision: 20, scale: 2 })
  @IsDecimal()
  miscellaneousAmount: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @IsEmail()
  payerEmail: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @IsString()
  remarks: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  @IsString()
  @IsPhoneNumber()
  payerPhone: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @IsString()
  payerName: string;


  @Column({ type: 'varchar', length: 255, nullable: true })
  @IsString()
  spSystemId: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  @IsString()
  billPayType: string;

  @Column({ type: 'timestamp', nullable: true })
  receivedTime: Date;

  @Column({ type: 'varchar',  nullable: true })
  @IsString()
  currency: string;

  @Column({ type: 'varchar', nullable: true })
  @IsString()
  status: string;


  @Column({ type: 'int', default: 0 })
  debtCount: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  @IsDecimal()
  paidAmount: number;

  @Column({ type: 'varchar',  nullable: true })
  @IsString()
  responseCode: string;

  @Column({ type: 'varchar', nullable: true })
  @IsString()
  financialYear: string;

  // Optionally, you can define relationships like so:
  @ManyToOne(() => User, (user) => user.id, { nullable: true })
  @JoinColumn({ name: 'createdBy' })
  createdByUser: User;


  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;


  @OneToMany(() => BillItem, (billitem) => billitem.bill, {
    cascade: true,
    eager: false, // Adjust based on whether you want the relationship loaded automatically
  })
  @JoinColumn({ name: ' bill_items', referencedColumnName: 'id' })
  billItems: BillItem[];




}
