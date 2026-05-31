import { ComponentFixture, TestBed } from '@angular/core/testing';
import { QrPropinasPage } from './qr-propinas.page';

describe('QrPropinasPage', () => {
  let component: QrPropinasPage;
  let fixture: ComponentFixture<QrPropinasPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(QrPropinasPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
