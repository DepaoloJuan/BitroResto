import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AgregarPlatoPage } from './agregar-plato.page';

describe('AgregarPlatoPage', () => {
  let component: AgregarPlatoPage;
  let fixture: ComponentFixture<AgregarPlatoPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AgregarPlatoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
