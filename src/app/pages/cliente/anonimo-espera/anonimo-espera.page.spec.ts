import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AnonimoEsperaPage } from './anonimo-espera.page';

describe('AnonimoEsperaPage', () => {
  let component: AnonimoEsperaPage;
  let fixture: ComponentFixture<AnonimoEsperaPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AnonimoEsperaPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
