import { Test, TestingModule } from '@nestjs/testing';
import { CommonSetupController } from './common-setup.controller';
import { CommonSetupService } from './common-setup.service';

describe('CommonSetupController', () => {
  let controller: CommonSetupController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CommonSetupController],
      providers: [CommonSetupService],
    }).compile();

    controller = module.get<CommonSetupController>(CommonSetupController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
