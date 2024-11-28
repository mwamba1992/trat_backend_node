import { BaseEntity } from '../../../utils/base.entity';
import { Column, Entity, ManyToMany, ManyToOne } from 'typeorm';
import { CommonSetup } from '../../common-setup/entities/common-setup.entity';
import { ApplicationRegister } from '../../../appeal/application-register/entities/application-register.entity';




@Entity()
export class Party extends  BaseEntity{

  @Column({ type: 'varchar', length: 15 })
  phone_number: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 255 })
  nature_of_business: string;

  @Column({ type: 'varchar', length: 100 })
  email_address: string;

  @Column({ type: 'varchar', length: 20 })
  tin_number: string;

  @Column({ type: 'varchar', length: 20 })
  income_tax_file_number: string;

  @Column({ type: 'varchar', length: 20 })
  vat_number: string;

  @ManyToOne(() => CommonSetup, commonSetup => commonSetup.id)
  type: CommonSetup


  @ManyToMany(() => ApplicationRegister, (applicationRegister) => applicationRegister.appellantList)
  respondents: ApplicationRegister[];

  @ManyToMany(() => ApplicationRegister, (applicationRegister) => applicationRegister.appellantList)
  applicants: ApplicationRegister[];

  @ManyToMany(() => ApplicationRegister, (applicationRegister) => applicationRegister.appellantList)
  applicationRegisters: ApplicationRegister[];
}
