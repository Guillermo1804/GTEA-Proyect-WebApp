import { CookieOptionsProvider } from './cookie-options.provider';
import { ICookieWriterService } from './cookie.model';
import { CookieService } from './cookie.service';
export declare function cookieServiceFactory(document: Document, cookieOptionsProvider: CookieOptionsProvider, cookieWriterService: ICookieWriterService): CookieService;
