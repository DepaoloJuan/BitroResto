import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DuenoPage } from './dueno.page';

describe('DuenoPage', () => {
  let component: DuenoPage;
  let fixture: ComponentFixture<DuenoPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(DuenoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
