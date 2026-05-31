import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AnonimoMesaPage } from './anonimo-mesa.page';

describe('AnonimoMesaPage', () => {
  let component: AnonimoMesaPage;
  let fixture: ComponentFixture<AnonimoMesaPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AnonimoMesaPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
