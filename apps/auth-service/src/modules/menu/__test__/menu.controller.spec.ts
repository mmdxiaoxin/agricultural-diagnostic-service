import { Test, TestingModule } from '@nestjs/testing';
import { MenuController } from '../menu.controller';
import { MenuService } from '../menu.service';
import { Menu } from '@app/database/entities/menu.entity';

describe('MenuController', () => {
  let controller: MenuController;
  let menuService: MenuService;

  const mockMenuService = {
    findAuthRoutes: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MenuController],
      providers: [
        {
          provide: MenuService,
          useValue: mockMenuService,
        },
      ],
    }).compile();

    controller = module.get<MenuController>(MenuController);
    menuService = module.get<MenuService>(MenuService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getRoutes', () => {
    it('should call menuService.findAuthRoutes with correct roles', async () => {
      const roles = ['admin', 'user'];
      await controller.getRoutes({ roles });
      expect(mockMenuService.findAuthRoutes).toHaveBeenCalledWith(roles);
    });
  });

  describe('findAll', () => {
    it('should call menuService.findAll', async () => {
      await controller.findAll();
      expect(mockMenuService.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should call menuService.findOne with correct id', async () => {
      const id = 1;
      await controller.findOne({ id });
      expect(mockMenuService.findOne).toHaveBeenCalledWith(id);
    });
  });

  describe('create', () => {
    it('should call menuService.create with menu data', async () => {
      const menuData: Partial<Menu> = {
        title: 'Test Menu',
        path: '/test',
        icon: 'test-icon',
        sort: 0,
      };
      await controller.create({ menuData });
      expect(mockMenuService.create).toHaveBeenCalledWith(menuData);
    });
  });

  describe('update', () => {
    it('should call menuService.update with menu data', async () => {
      const menuData: Partial<Menu> & { id: number } = {
        id: 1,
        title: 'Updated Menu',
        path: '/updated',
        icon: 'updated-icon',
        sort: 1,
      };
      await controller.update({ menuData });
      expect(mockMenuService.update).toHaveBeenCalledWith(
        menuData.id,
        menuData,
      );
    });
  });

  describe('remove', () => {
    it('should call menuService.remove with correct id', async () => {
      const id = 1;
      await controller.remove({ id });
      expect(mockMenuService.remove).toHaveBeenCalledWith(id);
    });
  });
});
