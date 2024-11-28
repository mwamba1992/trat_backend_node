
import { CommonSetup } from '../../common-setup/entities/common-setup.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../utils/base.entity';





@Entity()
export class Fee extends BaseEntity{

  @Column()
  revenueName: string;

  @Column('decimal')
  amount: number;


  @Column()
  type: string

  @ManyToOne(() => CommonSetup, (commonSetup) => commonSetup.id, { nullable: false })
  @JoinColumn({ name: 'gfsId' }) // Foreign key column
  gfs: CommonSetup;


  @Column( { nullable: true })
  approvedBy: string

  @Column({ nullable: true })
  approvedDate: Date
}
