import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EventCardOrganizer } from './event-card-organizer';

describe('EventCardOrganizer', () => {
  let component: EventCardOrganizer;
  let fixture: ComponentFixture<EventCardOrganizer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventCardOrganizer]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EventCardOrganizer);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
