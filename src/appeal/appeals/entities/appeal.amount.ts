import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { CommonSetup } from '../../../settings/common-setup/entities/common-setup.entity';
import { Appeal } from './appeal.entity';

@Entity()
export class AppealAmount {
  @PrimaryGeneratedColumn() // Using UUID for the 'id'
  id: number;

  @Column({ type: 'float', nullable: true })
  amount: number;

  @Column({ type: 'float', nullable: true })
  amountAllowed: number;

  @ManyToOne(() => CommonSetup, (currency) => currency.id, { nullable: false })
  currency: CommonSetup;

  @ManyToOne(() => Appeal, (appeal) => appeal.appealAmount, {
    onDelete: 'CASCADE', // Adjust based on your needs
  })
  entity: Appeal;
}
