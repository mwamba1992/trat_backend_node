import { Test, TestingModule } from '@nestjs/testing';
import { BillItemService } from './bill-item.service';

describe('BillItemService', () => {
  let service: BillItemService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BillItemService],
    }).compile();

    service = module.get<BillItemService>(BillItemService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
