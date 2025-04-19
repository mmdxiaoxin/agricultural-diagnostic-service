import { Module } from '@nestjs/common';
import { InterfaceCallManager } from './core/interface-call.manager';
import { UrlProcessorUtil } from './utils/url-processor.util';
import { ParamProcessorUtil } from './utils/param-processor.util';
import { RequestHandler } from './handlers/request-handler';
import { PollingHandler } from './handlers/polling-handler';
import { RetryHandler } from './handlers/retry-handler';
import { DiagnosisLogService } from '../diagnosis-log.service';
import { HttpService } from '@common/services/http.service';

@Module({
  providers: [
    InterfaceCallManager,
    UrlProcessorUtil,
    ParamProcessorUtil,
    RequestHandler,
    PollingHandler,
    RetryHandler,
    DiagnosisLogService,
    HttpService,
  ],
  exports: [InterfaceCallManager],
})
export class InterfaceCallModule {} 