import { Test, TestingModule } from '@nestjs/testing';
import { JudgesService } from './judges.service';

describe('JudgesService', () => {
  let service: JudgesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [JudgesService],
    }).compile();

    service = module.get<JudgesService>(JudgesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
