import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HeaderStudent } from './header-student';

describe('HeaderStudent', () => {
  let component: HeaderStudent;
  let fixture: ComponentFixture<HeaderStudent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeaderStudent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HeaderStudent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
