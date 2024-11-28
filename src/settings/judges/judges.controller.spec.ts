import { Test, TestingModule } from '@nestjs/testing';
import { JudgesController } from './judges.controller';
import { JudgesService } from './judges.service';

describe('JudgesController', () => {
  let controller: JudgesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [JudgesController],
      providers: [JudgesService],
    }).compile();

    controller = module.get<JudgesController>(JudgesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
