import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Bill } from '../../bill/entities/bill.entity';
import { IsDecimal, IsString } from 'class-validator';



@Entity()
export class BillItem {
  @PrimaryGeneratedColumn()
  id: number; // Auto-generated ID for each BillItem entity

  @Column({ type: 'varchar', length: 255, nullable: true })
  @IsString()
  billItemRef: string; // Reference for the Bill Item

  @Column({ type: 'decimal', precision: 20, scale: 2 })
  @IsDecimal()
  billItemAmount: number; // Amount for the Bill Item

  @Column({ type: 'decimal', precision: 20, scale: 2, nullable: true })
  @IsDecimal()
  billItemMiscAmount: number; // Miscellaneous Amount for the Bill Item

  @Column({ type: 'decimal', precision: 20, scale: 2, nullable: true })
  @IsDecimal()
  billItemEqvAmount: number; // Equivalent Amount for the Bill Item

  @Column({ type: 'varchar', length: 255, nullable: true })
  @IsString()
  billItemDescription: string; // Description of the Bill Item

  @Column({ type: 'varchar', length: 255, nullable: true })
  @IsString()
  sourceName: string; // Source of the Bill Item

  @Column({ type: 'varchar', length: 255, nullable: true })
  @IsString()
  gfsCode: string; // GFS (Government Financial System) Code


  @ManyToOne(() => Bill, (bill) =>  bill.billItems, {
    onDelete: 'CASCADE', // Adjust based on your needs
  })
  bill: Bill;
}
