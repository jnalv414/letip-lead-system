
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
import { OnEvent } from '@nestjs/event-emitter';
import { WsAuthGuard } from '../features/auth/guards/ws-auth.guard';

@WebSocketGateway({
  cors: {
    origin: [
      'http://localhost:3030',
      'https://jjailabs-letip.com',
      'https://www.jjailabs-letip.com',
      ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
    ],
    credentials: true,
  },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(EventsGateway.name);

  constructor(private readonly wsAuthGuard: WsAuthGuard) {}

  /**
   * Authenticate WebSocket connections during handshake.
   *
   * Validates the JWT token and attaches user data to the socket.
   * Unauthenticated clients are disconnected immediately.
   */
  async handleConnection(client: Socket) {
    const user = await this.wsAuthGuard.validateClient(client);

    if (!user) {
      this.logger.warn(`Rejecting unauthenticated WebSocket connection: ${client.id}`);
      client.emit('auth:error', { message: 'Authentication required' });
      client.disconnect(true);
      return;
    }

    this.logger.log(
      `Client connected: ${client.id} (user: ${user.email}, role: ${user.role})`,
    );

    // Join a user-specific room for targeted events
    client.join(`user:${user.id}`);
  }

  handleDisconnect(client: Socket) {
    const user = client.data?.user;
    this.logger.log(
      `Client disconnected: ${client.id}${user ? ` (user: ${user.email})` : ''}`,
    );
  }

  // Emit events to all connected (authenticated) clients
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

  /**
   * Generic event emitter for any event type.
   * Used by job workers for dynamic event emission.
   *
   * @param eventName - Name of the event to emit
   * @param payload - Event payload
   */
  emitEvent(eventName: string, payload: any) {
    this.server.emit(eventName, payload);
    this.logger.log(`Emitted ${eventName} event`);
  }

  // CSV Import specific event methods
  emitCsvProgress(progress: any) {
    this.server.emit('csv:progress', progress);
    this.logger.log('Emitted csv:progress event');
  }

  emitCsvCompleted(result: any) {
    this.server.emit('csv:completed', result);
    this.logger.log('Emitted csv:completed event');
  }

  emitCsvFailed(error: any) {
    this.server.emit('csv:failed', error);
    this.logger.log('Emitted csv:failed event');
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

  @OnEvent('business:enriched')
  handleBusinessEnrichedEvent(payload: any) {
    this.server.emit('business:enriched', payload);
    this.logger.log('Emitted business:enriched event from EventEmitter');
  }

  @OnEvent('analytics:updated')
  handleAnalyticsUpdatedEvent(payload: any) {
    this.server.emit('analytics:updated', payload);
    this.logger.log('Emitted analytics:updated event from EventEmitter');
  }

  // CSV Import event listeners
  @OnEvent('csv:progress')
  handleCsvProgressEvent(payload: any) {
    this.server.emit('csv:progress', payload);
    this.logger.log('Emitted csv:progress event from EventEmitter');
  }

  @OnEvent('csv:completed')
  handleCsvCompletedEvent(payload: any) {
    this.server.emit('csv:completed', payload);
    this.logger.log('Emitted csv:completed event from EventEmitter');
  }

  @OnEvent('csv:failed')
  handleCsvFailedEvent(payload: any) {
    this.server.emit('csv:failed', payload);
    this.logger.log('Emitted csv:failed event from EventEmitter');
  }
}
