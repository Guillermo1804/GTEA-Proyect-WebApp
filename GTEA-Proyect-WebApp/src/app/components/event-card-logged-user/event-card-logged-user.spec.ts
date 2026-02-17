import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EventCardLoggedUser } from './event-card-logged-user';

describe('EventCardLoggedUser', () => {
  let component: EventCardLoggedUser;
  let fixture: ComponentFixture<EventCardLoggedUser>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventCardLoggedUser]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EventCardLoggedUser);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
