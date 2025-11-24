
import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { EventsGateway } from './websocket.gateway';

@Module({
  imports: [EventEmitterModule],
  providers: [EventsGateway],
  exports: [EventsGateway],
})
export class WebsocketModule {}
