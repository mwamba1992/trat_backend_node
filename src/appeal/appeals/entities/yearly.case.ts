import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('yearly_cases')  // The name of the table will be 'yearly_cases'
export class YearlyCases {
  @PrimaryColumn({ type: 'varchar', length: 50 })
  id: string;  // Primary key (ID column)

  @Column({ type: 'varchar', nullable: true })
  type: string;  // Type column (nullable)

  @Column({ type: 'int', default: 0 })
  jan: number;  // January count

  @Column({ type: 'int', default: 0 })
  feb: number;  // February count

  @Column({ type: 'int', default: 0 })
  mar: number;  // March count

  @Column({ type: 'int', default: 0 })
  apr: number;  // April count

  @Column({ type: 'int', default: 0 })
  may: number;  // May count

  @Column({ type: 'int', default: 0 })
  jun: number;  // June count

  @Column({ type: 'int', default: 0 })
  jul: number;  // July count

  @Column({ type: 'int', default: 0 })
  aug: number;  // August count

  @Column({ type: 'int', default: 0 })
  sep: number;  // September count

  @Column({ type: 'int', default: 0 })
  oct: number;  // October count

  @Column({ type: 'int', default: 0 })
  nov: number;  // November count

  @Column({ type: 'int', default: 0 })
  dec: number;  // December count


}
