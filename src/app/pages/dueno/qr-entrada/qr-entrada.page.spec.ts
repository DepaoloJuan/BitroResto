import { ComponentFixture, TestBed } from '@angular/core/testing';
import { QrEntradaPage } from './qr-entrada.page';

describe('QrEntradaPage', () => {
  let component: QrEntradaPage;
  let fixture: ComponentFixture<QrEntradaPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(QrEntradaPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
