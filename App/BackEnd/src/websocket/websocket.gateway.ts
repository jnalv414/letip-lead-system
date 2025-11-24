
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
} from '@nestjs/websockets';
import { Logger, Injectable } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { OnEvent } from '@nestjs/event-emitter';

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

  // Event listeners for EventEmitter integration
  @OnEvent('scraping:started')
  handleScrapingStarted(payload: any) {
    this.server.emit('scraping:started', payload);
    this.logger.log('Emitted scraping:started event');
  }

  @OnEvent('scraping:completed')
  handleScrapingCompleted(payload: any) {
    this.server.emit('scraping:completed', payload);
    this.logger.log('Emitted scraping:completed event');
  }

  @OnEvent('scraping:failed')
  handleScrapingFailed(payload: any) {
    this.server.emit('scraping:failed', payload);
    this.logger.log('Emitted scraping:failed event');
  }

  @OnEvent('business:created')
  handleBusinessCreatedEvent(payload: any) {
    this.server.emit('business:created', payload);
    this.logger.log('Emitted business:created event from EventEmitter');
  }
}
