import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FooterOrganizer } from './footer-organizer';

describe('FooterOrganizer', () => {
  let component: FooterOrganizer;
  let fixture: ComponentFixture<FooterOrganizer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FooterOrganizer]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FooterOrganizer);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
