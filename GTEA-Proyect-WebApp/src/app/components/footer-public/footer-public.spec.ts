import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FooterPublic } from './footer-public';

describe('FooterPublic', () => {
  let component: FooterPublic;
  let fixture: ComponentFixture<FooterPublic>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FooterPublic]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FooterPublic);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
