
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(EventsGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // Emit events to all connected clients
  emitBusinessCreated(business: any) {
    this.server.emit('business:created', business);
    this.logger.log('Emitted business:created event');
  }

  emitBusinessEnriched(business: any) {
    this.server.emit('business:enriched', business);
    this.logger.log('Emitted business:enriched event');
  }

  emitStatsUpdated(stats: any) {
    this.server.emit('stats:updated', stats);
    this.logger.log('Emitted stats:updated event');
  }

  emitScrapingProgress(progress: any) {
    this.server.emit('scraping:progress', progress);
    this.logger.log('Emitted scraping:progress event');
  }

  emitEnrichmentProgress(progress: any) {
    this.server.emit('enrichment:progress', progress);
    this.logger.log('Emitted enrichment:progress event');
  }

  @SubscribeMessage('ping')
  handlePing(@MessageBody() data: any): string {
    this.logger.log('Received ping');
    return 'pong';
  }
}
