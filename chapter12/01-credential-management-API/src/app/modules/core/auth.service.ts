import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { BehaviorSubject, Observable, ReplaySubject, Subject } from 'rxjs';
import { tap, map, share } from 'rxjs/operators';
import { Router } from '@angular/router';

interface User {
  uid: string;
  email: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  public authErrorMessages$ = new BehaviorSubject<string>(null);
  public isLoading$ = new BehaviorSubject<boolean>(true);
  public user$ = new BehaviorSubject<User>(null);

  private authState = null;

  constructor(private afAuth: AngularFireAuth, private router: Router) {
    this.isLoggedIn().subscribe(user => {
      if (user) {
        this.authState = user;
        this.router.navigateByUrl('/notes');
      }
    });
  }

  get authenticated(): boolean {
    return this.authState !== null;
  }

  get id(): string {
    return this.authenticated ? this.authState.uid : '';
  }

  private isLoggedIn(): Observable<User | null> {
    return this.afAuth.authState.pipe(
      map(user => {
        if (user) {
          const { email, uid } = user;
          this.user$.next({ email, uid });
          return { email, uid };
        }
        return null;
      }),
      tap(() => this.isLoading$.next(false))
    );
  }

  public getToken(): Observable<string> {
    return this.afAuth.idToken;
  }

  public getCurrentUserUid(): string {
    return this.afAuth.auth.currentUser.uid;
  }

  public signUpFirebase({ email, password }) {
    this.isLoading$.next(true);
    try {
      return this.afAuth.auth.createUserWithEmailAndPassword(email, password);
    } catch (e) {
      this.handleSignUpLoginError(e);
    }
  }

  public loginFirebase({ email, password }) {
    this.isLoading$.next(true);
    try {
      return this.afAuth.auth.signInWithEmailAndPassword(email, password);
    } catch (e) {
      this.handleSignUpLoginError(e);
    }
  }

  public logOutFirebase() {
    this.authState = null;
    this.isLoading$.next(true);
    return this.afAuth.auth.signOut();
  }

  public async authenticateUser(UserCredential) {
    const {
      user: { email, uid }
    } = UserCredential;
    this.isLoading$.next(false);
    return true;
  }

  private handleSignUpLoginError(error: { code: string; message: string }) {
    this.isLoading$.next(false);
    const errorMessage = error.message;
    this.authErrorMessages$.next(errorMessage);
  }
}
