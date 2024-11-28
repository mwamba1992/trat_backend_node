import { Injectable } from '@nestjs/common';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Role } from './entities/role.entity';
import { Repository } from 'typeorm';
import { Permission } from '../permission/entities/permission.entity';

@Injectable()
export class RoleService {


  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
  ) {}



  async create(createRoleDto: CreateRoleDto): Promise<Role> {
    const role = new Role();
    role.name = createRoleDto.name;
    role.desc = createRoleDto.desc;
    role.permissions = createRoleDto.permissions;
    return this.roleRepository.save(role);
  }

  // Get all roles with their permissions
  async findAll(): Promise<Role[]> {
    return this.roleRepository.find({ relations: ['permissions'] });
  }

  // Find a role by ID
  async findOne(id: number): Promise<Role> {
    return this.roleRepository.findOne({
      where: { id },                // The condition to find the role by ID
      relations: ['permissions'],   // Eager load the associated permissions
    });
  }

  // Update role permissions
  async update(id: number, updateRoleDto: UpdateRoleDto): Promise<Role> {
    const role = await this.roleRepository.findOne({
      where: { id },                // The condition to find the role by ID
      relations: ['permissions'],   // Eager load the associated permissions
    });
    if (!role) throw new Error('Role not found');

    role.name = updateRoleDto.name || role.name;
    role.permissions = updateRoleDto.permissions || role.permissions;
    return this.roleRepository.save(role);
  }


// Example: Add permissions to a role
  async addPermissionsToRole(roleId:number, permissionIds: number[]): Promise<Role> {
    const role = await this.roleRepository.findOne({
      where: { id: roleId },
      relations: ['permissions'],  // Load permissions
    });

    if (!role) {
      throw new Error('Role not found');
    }

    const permissions = await this.permissionRepository.findByIds(permissionIds);
    role.permissions = [...role.permissions, ...permissions];

    return this.roleRepository.save(role);
  }
}
