import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { Notice } from '../../notice/entities/notice.entity';
import { BaseEntity } from '../../../utils/base.entity';
import { CommonSetup } from '../../../settings/common-setup/entities/common-setup.entity';
import { Bill } from '../../../payment/bill/entities/bill.entity';
import { Party } from '../../../settings/parties/entities/party.entity';
import { AppealAmount } from './appeal.amount';
import { ProgressStatus } from '../dto/appeal.status.enum';
import { Summons } from './summons.entity';
import { NoticeHighCourt } from '../../notice/entities/notice.high.court';
import { Judge } from "../../../settings/judges/entities/judge.entity";

@Entity()
export class Appeal extends BaseEntity {
  @Column()
  appealNo: string;

  @CreateDateColumn({ type: 'date' })
  dateOfFilling: Date;

  @CreateDateColumn({ type: 'date', nullable: true })
  dateOfDecision: Date;

  @CreateDateColumn({ type: 'date', nullable: true })
  concludingDate: Date;

  @CreateDateColumn({ type: 'date', nullable: true })
  dateOfLastOrder: Date;

  @Column()
  natureOfRequest: string;

  @ManyToOne(() => Notice, (notice) => notice.id)
  notice: Notice;

  @ManyToOne(() => CommonSetup, (taxType) => taxType.id, { nullable: false })
  @JoinColumn({ name: 'taxId' })
  taxes: CommonSetup;

  @ManyToOne(() => CommonSetup, (trend) => trend.id, { nullable: false })
  @JoinColumn({ name: 'statusTrend' })
  statusTrend: CommonSetup;

  @OneToOne(() => Bill, { nullable: true })
  @JoinColumn({ name: 'billId' })
  billId: Bill;

  @ManyToMany(() => Party)
  @JoinTable()
  appellantList: Party[];

  @ManyToMany(() => Party)
  @JoinTable()
  respondentList: Party[];


  @Column({type: 'text', nullable: true })
  remarks: string;

  @Column({ type: 'text', nullable: true })
  taxedOff: string;

  @Column({ type: 'text', nullable: true })
  assNo: string;

  @Column({ type: 'text', nullable: true })
  billNo: string;

  @Column({ type: 'text', nullable: true })
  bankNo: string;

  @Column({ type: 'text', nullable: true })
  wonBy: string;

  // New fields
  @Column({ type: 'text', nullable: true })
  summaryOfDecisionFromBoard: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  decisionStatusFromBoard: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  financialYear: string;

  @Column({ type: 'boolean', default: false })
  isLoaded: boolean;

  @OneToMany(() => AppealAmount, (appealAmount) => appealAmount.entity, {
    cascade: true,
    eager: false, // Adjust based on whether you want the relationship loaded automatically
  })
  @JoinColumn({ name: 'amount_id', referencedColumnName: 'id' }) // Foreign key column in the database
  appealAmount: AppealAmount[];

  @Column({
    type: 'enum',
    enum: ProgressStatus,
    default: ProgressStatus.PENDING, // Default value
  })
  progressStatus: ProgressStatus;

  @ManyToMany(() => Summons, (summons) => summons.appealList)
  summonsList: Summons[];

  @Column({ type: 'text', nullable: true, array: true })
  trabAppeals: string[];

  @ManyToMany(() => NoticeHighCourt, (notice) => notice.listOfAppeals)
  noticesHigh: NoticeHighCourt[];

  @Column({ type: 'text', array: true, nullable: true })
  decisionFiles: string[];

  @CreateDateColumn({ type: 'date', nullable: true })
  receivedDate: Date;

  setDateFromString(dateString: string): void {
    const dateParts = dateString.split('/'); // Split 'DD/MM/YYYY'
    const year = parseInt(dateParts[2], 10);
    const month = parseInt(dateParts[1], 10) - 1; // Months are 0-indexed
    const day = parseInt(dateParts[0], 10);
    this.dateOfFilling = new Date(year, month, day); // Creates the Date object
  }

  @ManyToOne(() => Judge, (judge) => judge.id)
  judge: Judge;
}
