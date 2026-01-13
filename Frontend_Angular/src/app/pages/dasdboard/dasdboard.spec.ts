import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Dasdboard } from './dasdboard';

describe('Dasdboard', () => {
  let component: Dasdboard;
  let fixture: ComponentFixture<Dasdboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Dasdboard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Dasdboard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
