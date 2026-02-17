import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HeaderPublic } from './header-public';

describe('HeaderPublic', () => {
  let component: HeaderPublic;
  let fixture: ComponentFixture<HeaderPublic>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeaderPublic]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HeaderPublic);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
