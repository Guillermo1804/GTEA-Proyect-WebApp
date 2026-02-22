import { TestBed } from '@angular/core/testing';

import { OrganizadorService } from './organizador-service';

describe('OrganizadorService', () => {
  let service: OrganizadorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OrganizadorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
