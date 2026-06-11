import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NotebookEntry, NotebookEntrySchema } from '../../schemas/notebook-entry.schema';
import { NotebookController } from './notebook.controller';
import { NotebookService } from './notebook.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: NotebookEntry.name, schema: NotebookEntrySchema },
    ]),
  ],
  controllers: [NotebookController],
  providers: [NotebookService],
})
export class NotebookModule {}