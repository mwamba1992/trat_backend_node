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
import { Party } from '../../../settings/parties/entities/party.entity';
import { CommonSetup } from '../../../settings/common-setup/entities/common-setup.entity';
import { Bill } from '../../../payment/bill/entities/bill.entity';
import { BaseEntity } from '../../../utils/base.entity';
import { Summons } from '../../appeals/entities/summons.entity';



@Entity()
export class ApplicationRegister extends BaseEntity{

  @Column()
  applicationNo: string;

  @CreateDateColumn({ type: 'date' })
  dateOfFilling: Date;

  @CreateDateColumn({ type: 'date' })
  dateOfDecision: Date;

  @Column()
  natureOfRequest: string;

  @Column({ nullable: true })
  personnelResponsibleFor: string;

  @Column({ nullable: true })
  decideBy: string;

  @Column({ nullable: true })
  remarks: string;


  @ManyToMany(() => Party)
  @JoinTable()
  appellantList: Party[];

  @ManyToMany(() => Party)
  @JoinTable()
  respondentList: Party[];

  @ManyToOne(() => CommonSetup, (taxType) => taxType.id, { nullable: false })
  @JoinColumn({ name: 'taxId' })
  taxes: CommonSetup;

  @ManyToOne(() => CommonSetup, (trend) => trend.id, { nullable: false })
  @JoinColumn({ name: 'statusTrend' })
  statusTrend: CommonSetup;

  @OneToOne(() => Bill, { nullable: true })
  @JoinColumn({ name: 'billId' })
  billId: Bill;

  @ManyToOne(() => CommonSetup, (type) => type.id)
  @JoinColumn({ name: 'applicationType' })
  applicationType: CommonSetup;

  @ManyToMany(() => ApplicationRegister)
  @JoinTable()
  applications: ApplicationRegister[];

  @ManyToMany(() => ApplicationRegister)
  @JoinTable()
  appeals: ApplicationRegister[];


  @ManyToMany(() => Summons, (summons) => summons.appealList)
  summonsList: Summons[];

}
