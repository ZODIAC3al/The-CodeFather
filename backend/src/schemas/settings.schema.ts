import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Settings extends Document {
  @Prop({ default: 'The Codefather' })
  siteName: string;

  @Prop({ default: 'Authoritative. Premium. Technical.' })
  siteDescription: string;

  @Prop()
  logo?: string;

  @Prop({ default: 'admin@thecodefather.com' })
  contactEmail: string;

  @Prop({ default: false })
  maintenanceMode: boolean;

  @Prop({ default: 'educare-dark' })
  defaultTheme: string;

  @Prop({ default: true })
  emailNotifications: boolean;

  @Prop({ default: true })
  pushNotifications: boolean;

  @Prop({ default: false })
  stripeConfigured: boolean;
}

export const SettingsSchema = SchemaFactory.createForClass(Settings);
