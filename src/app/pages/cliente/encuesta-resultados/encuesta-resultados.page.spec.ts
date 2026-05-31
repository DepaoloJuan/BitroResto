import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EncuestaResultadosPage } from './encuesta-resultados.page';

describe('EncuestaResultadosPage', () => {
  let component: EncuestaResultadosPage;
  let fixture: ComponentFixture<EncuestaResultadosPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(EncuestaResultadosPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
