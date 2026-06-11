import { Controller, Get, Post, Body } from '@nestjs/common';
import { HelpService } from './help.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('help')
@Controller('help')
export class HelpController {
  constructor(private helpService: HelpService) {}

  @Get()
  getHelp() {
    return this.helpService.getHelp();
  }

  @Post('ticket')
  createTicket(@Body() body: { subject: string; message: string }) {
    return this.helpService.createTicket(body);
  }

  @Get('faqs')
  getFaqs() {
    return this.helpService.getFaqs();
  }
}
