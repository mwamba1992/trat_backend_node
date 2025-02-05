import { BaseEntity } from '../../../utils/base.entity';
import { Column, Entity, ManyToMany, ManyToOne, OneToMany } from 'typeorm';
import { CommonSetup } from '../../common-setup/entities/common-setup.entity';
import { ApplicationRegister } from '../../../appeal/application-register/entities/application-register.entity';
import { Appeal } from '../../../appeal/appeals/entities/appeal.entity';
import { Summons } from '../../../appeal/appeals/entities/summons.entity';




@Entity()
export class Party extends  BaseEntity{

  @Column({ type: 'varchar', length: 15 })
  phone_number: string;

  @Column({ type: 'varchar', nullable: true})
  name: string;

  @Column({ type: 'varchar', nullable: true})
  nature_of_business: string;

  @Column({ type: 'varchar', nullable: true})
  email_address: string;

  @Column({ type: 'varchar', nullable: true})
  tin_number: string;

  @Column({ type: 'varchar', nullable: true})
  income_tax_file_number: string;

  @Column({ type: 'varchar', nullable: true})
  vat_number: string;

  @ManyToOne(() => CommonSetup, (commonSetup) => commonSetup.id)
  type: CommonSetup;

  @ManyToMany(
    () => ApplicationRegister,
    (applicationRegister) => applicationRegister.appellantList,
  )
  respondents: ApplicationRegister[];

  @ManyToMany(
    () => ApplicationRegister,
    (applicationRegister) => applicationRegister.appellantList,
  )
  applicants: ApplicationRegister[];

  @ManyToMany(
    () => ApplicationRegister,
    (applicationRegister) => applicationRegister.appellantList,
  )
  applicationRegisters: ApplicationRegister[];

  @ManyToMany(() => Appeal, (appeal) => appeal.appellantList)
  appellantList: Appeal[];

  @ManyToMany(() => Appeal, (appeal) => appeal.appellantList)
  respondentList: Appeal[];


}
