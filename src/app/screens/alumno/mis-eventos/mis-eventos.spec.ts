import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MisEventos } from './mis-eventos';

describe('MisEventos', () => {
  let component: MisEventos;
  let fixture: ComponentFixture<MisEventos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MisEventos]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MisEventos);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
