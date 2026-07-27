import { Controller, Get } from '@nestjs/common';
import { Public } from '../common/public.decorator';

@Controller()
export class HealthController {
  @Public()
  @Get()
  root() {
    return {
      name: 'BuildBalance API',
      status: 'ok',
      health: '/health'
    };
  }

  @Public()
  @Get('health')
  health() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString()
    };
  }
}
