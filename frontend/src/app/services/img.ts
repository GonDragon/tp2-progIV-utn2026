import { Injectable, inject } from '@angular/core';
import { Backend } from './backend';
import { Observable } from 'rxjs';

export interface UploadImgResponse {
  filename: string;
  originalname: string;
  mimetype: string;
  size: number;
  url: string;
}

@Injectable({
  providedIn: 'root',
})
export class ImgService {
  private backend = inject(Backend);

  public upload(file: File): Observable<UploadImgResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return this.backend.post<UploadImgResponse>('/img/upload', formData);
  }
}
