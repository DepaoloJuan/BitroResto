import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AnonimoPage } from './anonimo.page';

describe('AnonimoPage', () => {
  let component: AnonimoPage;
  let fixture: ComponentFixture<AnonimoPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AnonimoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
