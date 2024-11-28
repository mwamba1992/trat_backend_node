import { Test, TestingModule } from '@nestjs/testing';
import { CommonSetupService } from './common-setup.service';

describe('CommonSetupService', () => {
  let service: CommonSetupService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CommonSetupService],
    }).compile();

    service = module.get<CommonSetupService>(CommonSetupService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
