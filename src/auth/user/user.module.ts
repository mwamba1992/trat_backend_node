import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from '../role/entities/role.entity';
import { User } from './entities/user.entity';
import { UserContextService } from './dto/user.context';

@Module({
  imports: [TypeOrmModule.forFeature([User, Role])],
  controllers: [UserController],
  providers: [UserService, UserContextService],
})
export class UserModule {}
