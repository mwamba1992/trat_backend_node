import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, ManyToMany, JoinTable, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Judge } from '../../../settings/judges/entities/judge.entity';
import { Appeal } from './appeal.entity';
import { ApplicationRegister } from '../../application-register/entities/application-register.entity';


export enum SummonsStatus {
  PENDING = 'PENDING',
  SERVED = 'SERVED',
  DISMISSED = 'DISMISSED',
  RESPONDED = 'RESPONDED',
}

@Entity()
export class Summons {
  @PrimaryGeneratedColumn()
  id: number;


  @CreateDateColumn({ type: 'date' })
  startDate: Date;  // Date when the summons is issued

  @CreateDateColumn({ type: 'date' })
  endDate: Date;  // Date when the summons is issued

  @Column({
    type: 'enum',
    enum: SummonsStatus,
    default: SummonsStatus.PENDING,
  })
  status: SummonsStatus;


  @Column({ type: 'text', nullable: true })
  remarks: string;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @ManyToOne(() => Judge, (judge) => judge.id)
  judge: Judge;

  @ManyToOne(() => Judge, (judge) => judge.id)
  member1: Judge;


  @ManyToOne(() => Judge, (judge) => judge.id)
  member2: Judge;

  @ManyToMany(() => Appeal, (appeal) => appeal.summonsList)
  @JoinTable()
  appealList: Appeal[];

  @ManyToMany(() => ApplicationRegister, (applicationRegister) => applicationRegister.summonsList)
  @JoinTable()
  applicationList: ApplicationRegister[];


  @Column({ type: 'text', nullable: true })
  venue: string;

  @Column({ type: 'text', nullable: true })
  time: string;

}
