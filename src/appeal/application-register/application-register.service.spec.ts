import { Test, TestingModule } from '@nestjs/testing';
import { ApplicationRegisterService } from './application-register.service';

describe('ApplicationRegisterService', () => {
  let service: ApplicationRegisterService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ApplicationRegisterService],
    }).compile();

    service = module.get<ApplicationRegisterService>(ApplicationRegisterService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
