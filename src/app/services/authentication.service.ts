import { Injectable } from '@angular/core';
import * as firebase from 'firebase/app';
import { Observable } from 'rxjs/Observable';
import { AngularFireAuth } from 'angularfire2/auth';
import { User } from '../models/user.model';
import { AngularFireDatabase, FirebaseListObservable, FirebaseObjectObservable } from 'angularfire2/database';
import 'rxjs/add/operator/map';

@Injectable()
export class AuthenticationService {
  authenticatedUserUID: string;
  user: Observable<firebase.User>

  constructor(public afAuth: AngularFireAuth, public database: AngularFireDatabase) {
    this.user = afAuth.authState;
  }

  loginWithGoogle() {
    this.afAuth.auth.signInWithPopup(new firebase.auth.GoogleAuthProvider())
    .then(signedInUser => {
      if(signedInUser) {
        let uid = firebase.auth().currentUser.uid;
        this.authenticatedUserUID = uid;
        let subscription = this.getUserByUID(uid).subscribe(data => {
          if (!data.$value) {
            const newUser = new User (signedInUser.user.displayName, signedInUser.user.uid, signedInUser.user.email);
            this.pushUserToDatabase(newUser);
            console.log(newUser)
          }
          subscription.unsubscribe();
        });
      }
    });
  }

  logout() {
    return this.afAuth.auth.signOut();
  }

  createUser(email, password, displayName) {
    return this.afAuth.auth.createUserWithEmailAndPassword(email, password).then(signedInUser => {
      if(signedInUser) {
        let uid = firebase.auth().currentUser.uid;
        this.authenticatedUserUID = uid;
        signedInUser.sendEmailVerification();
        signedInUser.updateProfile({displayName:displayName, photoURL:'assets/images/treeicon.jpg'});
        let subscription = this.getUserByUID(uid).subscribe(data => {
          console.log(data.photoURL);
          if (!data.$value) {
            console.log('creating user')
            const newUser = new User (displayName, this.authenticatedUserUID, email);
            this.pushUserToDatabase(newUser);
          }
          subscription.unsubscribe();
        })
      }
    });
  }

  pushUserToDatabase(newUser: User): void {
    this.database.object(`users/${newUser.UID}`).update(newUser);
}

  loginWithEmail(email, password) {
    this.afAuth.auth.signInWithEmailAndPassword(email, password);
  }

  deleteAccount() {
    let uid = firebase.auth().currentUser.uid;
    let user = firebase.auth().currentUser;
    this.database.object(`users/${uid}`).remove();
    this.database.object(`surveys/${uid}`).remove();
    this.database.object(`goals/${uid}`).remove();
    user.delete();
  }

//do we need this?
  userExists(uid: string): Observable<boolean> {
    let userExist = this.getUserByUID(uid).map(data => !!data[0]);
    return userExist;
   }

//do we need this?
   getUserByUID(userUID: string): FirebaseObjectObservable<any> {
     return this.database.object(`users/${userUID}`);
   }


}
