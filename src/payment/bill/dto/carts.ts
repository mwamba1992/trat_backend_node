import { IsString, IsNotEmpty, IsNumber } from 'class-validator';

export class CartDTO {
  @IsString()
  @IsNotEmpty()
  sourceName: string;

  @IsNumber()
  @IsNotEmpty()
  billedAmount: number;
}
