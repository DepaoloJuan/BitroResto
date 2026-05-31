import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AgregarEmpleadoPage } from './agregar-empleado.page';

describe('AgregarEmpleadoPage', () => {
  let component: AgregarEmpleadoPage;
  let fixture: ComponentFixture<AgregarEmpleadoPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AgregarEmpleadoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
