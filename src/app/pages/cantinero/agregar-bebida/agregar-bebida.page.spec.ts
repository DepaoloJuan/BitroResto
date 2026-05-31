import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AgregarBebidaPage } from './agregar-bebida.page';

describe('AgregarBebidaPage', () => {
  let component: AgregarBebidaPage;
  let fixture: ComponentFixture<AgregarBebidaPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AgregarBebidaPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
