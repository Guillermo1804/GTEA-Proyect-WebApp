import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EventCardHistory } from './event-card-history';

describe('EventCardHistory', () => {
  let component: EventCardHistory;
  let fixture: ComponentFixture<EventCardHistory>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventCardHistory]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EventCardHistory);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
