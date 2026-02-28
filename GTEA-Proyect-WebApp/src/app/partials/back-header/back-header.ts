import { Component, Input } from '@angular/core';
import { Location } from '@angular/common';

@Component({
  selector: 'app-back-header',
  imports: [],
  templateUrl: './back-header.html',
  styleUrl: './back-header.scss',
})
export class BackHeader {
  @Input() title = '';
  @Input() showAvatar = false;

  constructor(private location: Location) { }

  goBack(): void {
    this.location.back();
  }
}
