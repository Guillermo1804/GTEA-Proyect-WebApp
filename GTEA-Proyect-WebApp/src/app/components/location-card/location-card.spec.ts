import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LocationCard } from './location-card';

describe('LocationCard', () => {
  let component: LocationCard;
  let fixture: ComponentFixture<LocationCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LocationCard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LocationCard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
