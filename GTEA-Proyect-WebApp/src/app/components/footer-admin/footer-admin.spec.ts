import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FooterAdmin } from './footer-admin';

describe('FooterAdmin', () => {
  let component: FooterAdmin;
  let fixture: ComponentFixture<FooterAdmin>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FooterAdmin]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FooterAdmin);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
