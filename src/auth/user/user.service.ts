import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { Role } from '../role/entities/role.entity';
import { encodePassword } from '../../utils/helper.utils';

@Injectable()
export class UserService {

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}


  async create(createUserDto: CreateUserDto) {
    console.log(createUserDto);

    // check if email is available

    if(await this.userRepository.findOne({where: {email: createUserDto.email}})){
      throw new ConflictException('Email already exists');
    }


    if(await this.userRepository.findOne({where: {username: createUserDto.username}})){
      throw new ConflictException('Username already exists');
    }

    if(await this.userRepository.findOne({where: {mobileNumber: createUserDto.mobileNumber}})){
      throw new ConflictException('Mobile Number already exists');
    }

    if(await this.userRepository.findOne({where: {checkNumber: createUserDto.checkNumber}})){
      throw new ConflictException('Check Number already exists');
    }

    try {

    const user = new User();
    user.active = true;
    user.createdAt = new Date();
    user.email = createUserDto.email;
    user.checkNumber = createUserDto.checkNumber;
    user.mobileNumber = createUserDto.mobileNumber;
    user.password =  await encodePassword("Trat@1234*");
    user.name = createUserDto.name;
    user.username = createUserDto.username;
    user.address = createUserDto.address

    return this.userRepository.save(user);
    }catch (Error){
      console.log(Error);
      return Error;
    }
  }

  async findAll(): Promise<User[]> {
    const users = await this.userRepository.find({
      relations: ['rolesList'] });
    return users.map(user => user);
  }



   async  findOne(id: number) {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['rolesList'],
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }


  async findOneByEmail(email: string) {
    const user = await this.userRepository.findOne({
      where: { email },
      relations: ['rolesList'],
    });
    if (!user) {
      throw new NotFoundException(`User with email ${email} not found`);
    }
    return user;
  }

  async findOneByUsername(username: string) {
    const user = await this.userRepository.findOne({
      where: { username },
      relations: ['rolesList'],
    });
    if (!user) {
      throw new NotFoundException(`User with username ${username} not found`);
    }
    return user;
  }
  async update(id: number, updateUserDto: UpdateUserDto) {
    const user = await this.findOne(id);
    // Update user fields
    Object.assign(user, updateUserDto);

    await this.userRepository.save(user);
    return user;
  }

// Delete a user
  async remove(id:  number): Promise<void> {
    const user = await this.findOne(id);
    await this.userRepository.remove(user);
  }


  async  addRoleToUser(userId: number, roleId: number) {
    const user = await this.findOne(userId);
    const role = await this.roleRepository.findOne({
      where: { id: roleId },
    });

    if (!role) {
      throw new NotFoundException(`Role with ID ${roleId} not found`);
    }

    user.rolesList.push(role);
    await this.userRepository.save(user);
    return user;
  }
}