import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HeaderOrganizer } from './header-organizer';

describe('HeaderOrganizer', () => {
  let component: HeaderOrganizer;
  let fixture: ComponentFixture<HeaderOrganizer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeaderOrganizer]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HeaderOrganizer);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
