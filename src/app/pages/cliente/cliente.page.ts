import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-cliente',
  template: '',
  standalone: true,
  imports: [],
})
export class ClientePage implements OnInit {
  constructor(private router: Router) {}

  ngOnInit() {
    this.router.navigate(['/cliente/home'], { replaceUrl: true });
  }
}
