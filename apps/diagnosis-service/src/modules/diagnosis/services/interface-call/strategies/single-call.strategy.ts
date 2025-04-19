import { Injectable } from '@nestjs/common';
import { InterfaceCallContext } from '../type';

@Injectable()
export class SingleCallStrategy {
  constructor() {}

  async execute(context: InterfaceCallContext): Promise<any> {
    
  }
} 