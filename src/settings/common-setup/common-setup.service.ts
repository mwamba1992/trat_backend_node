import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCommonSetupDto } from './dto/create-common-setup.dto';
import { CommonSetup } from './entities/common-setup.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { UserContextService } from '../../auth/user/dto/user.context';

@Injectable()
export class CommonSetupService {
  constructor(
    @InjectRepository(CommonSetup)
    private readonly setupRepository: Repository<CommonSetup>,
    private readonly userContextService: UserContextService
  ) {}

  async create(createSetupDto: CreateCommonSetupDto, type:string): Promise<CommonSetup> {
    console.log(createSetupDto);

    if(await this.setupRepository.findOne(
      { where: { name: createSetupDto.name, setupType: type } })){
        throw new NotFoundException(`Setup with name ${createSetupDto.name} already exists`);
    }

    createSetupDto.setupType = type
    const setup = this.setupRepository.create(createSetupDto);


    console.log(this.userContextService.getUser())
    setup.createdBy = this.userContextService.getUser().userName
    return this.setupRepository.save(setup);
  }

  async findAll(setupType: string): Promise<CommonSetup[]> {
    return this.setupRepository.find({ where: { setupType }, order: {
        createdAt: "ASC"
      }}, );
  }

  async findOne(id: number): Promise<CommonSetup> {
    const setup = await this.setupRepository.findOne({ where: { id } });
    if (!setup) {
      throw new NotFoundException(`Setup with ID ${id} not found`);
    }
    return setup;
  }

  async update(id: number, updateSetupDto: CreateCommonSetupDto): Promise<CommonSetup> {
    const setup = await this.findOne(id);
    Object.assign(setup, updateSetupDto);
    return this.setupRepository.save(setup);
  }

  async remove(id: number): Promise<void> {
    const setup = await this.findOne(id);
    await this.setupRepository.remove(setup);
  }

  async
}
