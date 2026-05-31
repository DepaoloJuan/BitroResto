import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-splash',
  templateUrl: './splash.page.html',
  styleUrls: ['./splash.page.scss'],
  standalone: true,
  imports: [IonContent, CommonModule],
})
export class SplashPage implements OnInit {
  animando = false;
  mostrarTexto = false;
  mostrarIntegrantes = false;

  constructor(private router: Router) {}

  ngOnInit() {
    setTimeout(() => (this.animando = true), 300);
    setTimeout(() => (this.mostrarTexto = true), 600);
    setTimeout(() => (this.mostrarIntegrantes = true), 1000);
    setTimeout(() => this.router.navigate(['/login']), 3500);
  }
}
