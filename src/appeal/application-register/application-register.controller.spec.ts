import { Test, TestingModule } from '@nestjs/testing';
import { ApplicationRegisterController } from './application-register.controller';
import { ApplicationRegisterService } from './application-register.service';

describe('ApplicationRegisterController', () => {
  let controller: ApplicationRegisterController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ApplicationRegisterController],
      providers: [ApplicationRegisterService],
    }).compile();

    controller = module.get<ApplicationRegisterController>(ApplicationRegisterController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
