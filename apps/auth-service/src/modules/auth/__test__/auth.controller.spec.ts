import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
    notifyAccount: jest.fn(),
    verifyAccount: jest.fn(),
    buttonsGet: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should call authService.register with correct parameters', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'password123',
      };
      await controller.register({ dto: registerDto });
      expect(mockAuthService.register).toHaveBeenCalledWith(
        registerDto.email,
        registerDto.password,
      );
    });
  });

  describe('login', () => {
    it('should call authService.login with correct parameters', async () => {
      const loginDto = { login: 'test@example.com', password: 'password123' };
      await controller.login({ dto: loginDto });
      expect(mockAuthService.login).toHaveBeenCalledWith(
        loginDto.login,
        loginDto.password,
      );
    });
  });

  describe('notify', () => {
    it('should call authService.notifyAccount with correct parameters', async () => {
      const payload = { email: 'test@example.com', link: 'http://example.com' };
      await controller.notify(payload);
      expect(mockAuthService.notifyAccount).toHaveBeenCalledWith(
        payload.email,
        payload.link,
      );
    });
  });

  describe('verify', () => {
    it('should call authService.verifyAccount with correct token', async () => {
      const payload = { token: 'test-token' };
      await controller.verify(payload);
      expect(mockAuthService.verifyAccount).toHaveBeenCalledWith(payload.token);
    });
  });

  describe('buttonsGet', () => {
    it('should call authService.buttonsGet', async () => {
      await controller.buttonsGet();
      expect(mockAuthService.buttonsGet).toHaveBeenCalled();
    });
  });
});
