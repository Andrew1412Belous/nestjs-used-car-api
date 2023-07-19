import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from './users.service';
import { User } from './users.entity';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('AuthService', () => {
	let service: AuthService;
	let fakeUsersService: Partial<UsersService>;

	beforeEach(async () => {
		const users: User[] = [];

		fakeUsersService = {
			find: (email: string) => {
				const filteredUsers = users.filter((user) => user.email === email);

				return Promise.resolve(filteredUsers);
			},
			create: (email: string, password: string) => {
				const user = {
					id: Math.floor(Math.random() * 999),
					email,
					password,
				} as User;

				users.push(user);

				return Promise.resolve(user);
			},
			isEmailInUse: (email: string) => {
				const isUnique = users.some((user) => user.email === email);

				return Promise.resolve(isUnique);
			},
		};

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				AuthService,
				{
					provide: UsersService,
					useValue: fakeUsersService,
				},
			],
		}).compile();

		service = module.get<AuthService>(AuthService);
	});

	it('creates new user with hash', async () => {
		const user = await service.signup('asdsa@asd.com', 'test123');

		expect(user.password).not.toEqual('test123');
		const [salt, hash] = user.password.split('.');
		expect(salt).toBeDefined();
		expect(hash).toBeDefined();
	});

	it('throws an error if user signs up with email that is in use', async () => {
		await service.signup('asdf@asdf.com', 'asdf');
		await expect(service.signup('asdf@asdf.com', 'asdf')).rejects.toThrow(BadRequestException);
	});

	it('throws if signin is called with an unused email', async () => {
		await expect(service.signin('asdflkj@asdlfkj.com', 'passdflkj')).rejects.toThrow(
			NotFoundException,
		);
	});

	it('throws if an invalid password is provided', async () => {
		await service.signup('laskdjf@alskdfj.com', 'password');
		await expect(service.signin('laskdjf@alskdfj.com', 'laksdlfkj')).rejects.toThrow(
			BadRequestException,
		);
	});

	it('returns a user if correct password is provided', async () => {
		await service.signup('asdf@asdf.com', 'test123');
		expect(await service.signin('asdf@asdf.com', 'test123')).toBeDefined();
	});
});
