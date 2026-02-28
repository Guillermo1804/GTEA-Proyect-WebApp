import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EventCardPublic } from './event-card-public';

describe('EventCardPublic', () => {
  let component: EventCardPublic;
  let fixture: ComponentFixture<EventCardPublic>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventCardPublic]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EventCardPublic);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
