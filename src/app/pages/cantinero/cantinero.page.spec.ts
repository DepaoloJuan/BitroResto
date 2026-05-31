import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CantineroPage } from './cantinero.page';

describe('CantineroPage', () => {
  let component: CantineroPage;
  let fixture: ComponentFixture<CantineroPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(CantineroPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
