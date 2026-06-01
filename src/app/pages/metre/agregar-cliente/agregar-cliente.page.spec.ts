import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AgregarClientePage } from './agregar-cliente.page';

describe('AgregarClientePage', () => {
  let component: AgregarClientePage;
  let fixture: ComponentFixture<AgregarClientePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AgregarClientePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
