import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../auth.service';
import { JwtService } from '@nestjs/jwt';
import { MailService } from '@app/mail';
import { RedisService } from '@app/redis';
import { ClientProxy } from '@nestjs/microservices';
import { RpcException } from '@nestjs/microservices';
import { of, throwError } from 'rxjs';
import { compare } from 'bcryptjs';

jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;
  let mailService: MailService;
  let redisService: RedisService;
  let userClient: ClientProxy;

  const mockJwtService = {
    sign: jest.fn(),
    decode: jest.fn(),
  };

  const mockMailService = {
    sendMail: jest.fn(),
  };

  const mockRedisService = {
    set: jest.fn(),
    get: jest.fn(),
    del: jest.fn(),
    increment: jest.fn(),
  };

  const mockUserClient = {
    send: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: MailService,
          useValue: mockMailService,
        },
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
        {
          provide: 'USER_SERVICE',
          useValue: mockUserClient,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
    mailService = module.get<MailService>(MailService);
    redisService = module.get<RedisService>(RedisService);
    userClient = module.get('USER_SERVICE');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    const email = 'test@example.com';
    const password = 'password123';

    it('should throw RpcException if email already exists', async () => {
      mockUserClient.send.mockReturnValue(of({ id: 1 }));

      await expect(service.register(email, password)).rejects.toThrow(
        RpcException,
      );
      expect(mockUserClient.send).toHaveBeenCalledWith(
        { cmd: 'user.find.byEmail' },
        { email },
      );
    });

    it('should register successfully and return JWT token', async () => {
      mockUserClient.send
        .mockReturnValueOnce(of(null))
        .mockReturnValueOnce(
          of({ code: 200, data: { id: 1 }, message: 'success' }),
        );
      mockJwtService.sign.mockReturnValue('jwt-token');

      const result = await service.register(email, password);

      expect(result).toBe('jwt-token');
      expect(mockUserClient.send).toHaveBeenCalledTimes(2);
      expect(mockJwtService.sign).toHaveBeenCalledWith(
        { userId: 1 },
        { expiresIn: '30m' },
      );
    });
  });

  describe('login', () => {
    const login = 'test@example.com';
    const password = 'password123';
    const mockUser = {
      id: 1,
      username: 'test',
      password: 'hashedPassword',
      status: 1,
      roles: [{ name: 'user' }],
    };

    beforeEach(() => {
      mockRedisService.get.mockReturnValue(null);
    });

    it('should throw RpcException if user not found', async () => {
      mockUserClient.send.mockReturnValue(of(null));

      await expect(service.login(login, password)).rejects.toThrow(
        RpcException,
      );
      expect(mockUserClient.send).toHaveBeenCalledWith(
        { cmd: 'user.find.byLogin' },
        { login },
      );
    });

    it('should throw RpcException if account is not activated', async () => {
      mockUserClient.send.mockReturnValue(of({ ...mockUser, status: 0 }));

      await expect(service.login(login, password)).rejects.toThrow(
        RpcException,
      );
    });

    it('should throw RpcException if password is incorrect', async () => {
      mockUserClient.send.mockReturnValue(of(mockUser));
      (compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(login, password)).rejects.toThrow(
        RpcException,
      );
      expect(mockRedisService.increment).toHaveBeenCalled();
    });

    it('should login successfully and return tokens', async () => {
      mockUserClient.send.mockReturnValue(of(mockUser));
      (compare as jest.Mock).mockResolvedValue(true);
      mockJwtService.sign.mockReturnValue('access-token');

      const result = await service.login(login, password);

      expect(result).toEqual({
        access_token: 'access-token',
        token_type: 'Bearer',
        expires_in: 3600 * 24,
        sessionId: expect.any(String),
      });
      expect(mockRedisService.set).toHaveBeenCalled();
      expect(mockRedisService.del).toHaveBeenCalled();
    });
  });

  describe('notifyAccount', () => {
    const email = 'test@example.com';
    const link = 'http://example.com/verify';

    it('should send verification email', async () => {
      mockMailService.sendMail.mockResolvedValue(undefined);

      await service.notifyAccount(email, link);

      expect(mockMailService.sendMail).toHaveBeenCalledWith(
        email,
        '邮箱验证 - 病害智能诊断系统',
        expect.any(String),
        expect.any(String),
      );
    });
  });

  describe('verifyAccount', () => {
    const token = 'valid-token';

    it('should throw RpcException if token is invalid', async () => {
      mockJwtService.decode.mockReturnValue(null);

      await expect(service.verifyAccount(token)).rejects.toThrow(RpcException);
    });

    it('should verify account successfully', async () => {
      mockJwtService.decode.mockReturnValue({ userId: 1 });
      mockUserClient.send.mockReturnValue(
        of({ code: 200, message: 'success' }),
      );

      const result = await service.verifyAccount(token);

      expect(result).toEqual({ code: 200, message: 'success' });
      expect(mockUserClient.send).toHaveBeenCalledWith(
        { cmd: 'user.update.activate' },
        { id: 1 },
      );
    });
  });

  describe('buttonsGet', () => {
    it('should return button configuration', async () => {
      const result = await service.buttonsGet();

      expect(result).toEqual({
        useHooks: { add: true, delete: true },
      });
    });
  });
});
