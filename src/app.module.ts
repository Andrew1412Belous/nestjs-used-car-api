import { MiddlewareConsumer, Module, ValidationPipe } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ReportsModule } from './reports/reports.module';
import { UsersModule } from './users/users.module';
import { APP_PIPE } from '@nestjs/core';

import * as dbConfig from '../ormconfig';

import CookieSession = require('cookie-session');
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			envFilePath: `.env.${process.env.NODE_ENV}`,
		}),
		TypeOrmModule.forRoot(dbConfig),
		ReportsModule,
		UsersModule,
	],
	controllers: [AppController],
	providers: [
		AppService,
		{
			provide: APP_PIPE,
			useValue: new ValidationPipe({
				transform: true,
				transformOptions: {
					enableImplicitConversion: true,
				},
				whitelist: true,
				stopAtFirstError: true,
			}),
		},
	],
})
export class AppModule {
	constructor(private readonly configService: ConfigService) {}

	configure(consumer: MiddlewareConsumer) {
		consumer
			.apply(
				CookieSession({
					keys: [this.configService.get('COOKIE_KEY')],
				}),
			)
			.forRoutes('*');
	}
}
