import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Review, CreateReviewRequest } from '../models/review.model';
import { ApiResponse,PageResponse } from '../models/api-response.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ReviewService {
  private readonly API = `${environment.apiUrl}/reviews`;

  constructor(private http: HttpClient) {}
/*
  getUserReviews(userId: string): Observable<ApiResponse<Review[]>> {
    return this.http.get<ApiResponse<Review[]>>(`${this.API}/user/${userId}`);
  } */

  getUserReviews(userId: string): Observable<PageResponse<Review[]>> {
    return this.http.get<PageResponse<Review[]>>(`${this.API}/user/${userId}`);
  }

  getTripReviews(tripId: string): Observable<ApiResponse<Review[]>> {
    return this.http.get<ApiResponse<Review[]>>(`${this.API}/trip/${tripId}`);
  }


  flagReview(reviewId: string, reason: string) {
    return this.http.post(
      `${this.API}/${reviewId}/flag`,
      { reason }
    );
  }

 canReview(tripId: string, targetId: string) {
   return this.http.get<ApiResponse<boolean>>(
     `${this.API}/can-review`,
     {
       params: {
         tripId,
         targetId
       }
     }
   );
 }

  create(data: CreateReviewRequest): Observable<ApiResponse<Review>> {
    return this.http.post<ApiResponse<Review>>(this.API, data);
  }
}
