import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AgregarMesaPage } from './agregar-mesa.page';

describe('AgregarMesaPage', () => {
  let component: AgregarMesaPage;
  let fixture: ComponentFixture<AgregarMesaPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AgregarMesaPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
