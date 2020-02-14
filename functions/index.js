// firebase
const functions = require('firebase-functions');
const { db } = require('./utilities/admin');
// express   
const app = require('express')();
// middleware for auth
const FBAuth = require('./utilities/fbAuth');
// cors
const cors = require('cors');
app.use(cors({ origin: true }));
 
// handlers
const { getAllScreams, postOneScream, getScream, commentOnScream ,likeScream, unlikeScream, deleteScream  } = require('./handlers/screams');
const { signup, login, uploadImage, addUserDetails, getAuthenticatedUser, getUserDetails, markNotificationsRead  } = require('./handlers/users');


// REST ROUTES

// Screams
// route to get all screams
app.get('/screams', getAllScreams);
// route to post a new scream
app.post('/scream', FBAuth, postOneScream);
// route to get fetch one scream
app.get('/scream/:screamId', getScream);
// route to delete one scream
app.delete('/scream/:screamId', FBAuth, deleteScream);
// route to post comment on a scream
app.post('/scream/:screamId/comment', FBAuth, commentOnScream);
// route to like a scream
app.get('/scream/:screamId/like', FBAuth, likeScream);
// route to unlike a scream
app.get('/scream/:screamId/unlike', FBAuth, unlikeScream);

// User
// route to signup new users
app.post('/signup', signup);
// route to login users
app.post('/login', login);
// route to upload image
app.post('/user/image', FBAuth, uploadImage);
// route to add user details
app.post('/user', FBAuth, addUserDetails);
// route to get all own user data (auth)
app.get('/user', FBAuth, getAuthenticatedUser);
// get any user's details
app.get('/user/:handle', getUserDetails);
// mark if the notifications was read 
app.post('/notifications', FBAuth, markNotificationsRead);


exports.api = functions.https.onRequest(app);

// NOTIFICATIONS FOR DB WITH SOME ACTIONS IN DB 

// trigger db notifications for likes
exports.createNotificationOnLike = functions.firestore.document('likes/{id}')
    .onCreate((snapshot) => {
    return db
        .doc(`/screams/${snapshot.data().screamId}`)
        .get()
        .then((doc) => {
            if (doc.exists && doc.data().userHandle !== snapshot.data().userHandle) {
            return db.doc(`/notifications/${snapshot.id}`).set({
                createdAt: new Date().toISOString(),
                recipient: doc.data().userHandle,
                sender: snapshot.data().userHandle,
                type: 'like',
                read: false,
                screamId: doc.id
            });
            }
        })
        .catch((err) => console.error(err));
}); 

// delete unlike notification
exports.deleteNotificationOnUnLike = functions.firestore.document('likes/{id}')
    .onDelete((snapshot) => {
    return db
        .doc(`/notifications/${snapshot.id}`)
        .delete()
        .catch((err) => {
            console.error(err);
            return;
        });
});

// trigger db notifications for comments
exports.createNotificationOnComment = functions.firestore.document('comments/{id}')
    .onCreate((snapshot) => {
        return db
            .doc(`/screams/${snapshot.data().screamId}`)
            .get()
            .then((doc) => {
                if (doc.exists && doc.data().userHandle !== snapshot.data().userHandle) {
                    return db.doc(`/notifications/${snapshot.id}`).set({
                        createdAt: new Date().toISOString(),
                        recipient: doc.data().userHandle,
                        sender: snapshot.data().userHandle,
                        type: 'comment',
                        read: false,
                        screamId: doc.id
                    });
                }
            })
            .catch((err) => {
                console.error(err);
                return;
            });
});

// batch functions in db to update the db

// trigger db "notifications" when the user image is changed 
exports.onUserImageChange = functions.firestore.document('/users/{userId}')
    .onUpdate((change) => {
        console.log(change.before.data());
        console.log(change.after.data());
        if (change.before.data().imageUrl !== change.after.data().imageUrl) {
            console.log('image has changed');
            const batch = db.batch();
            return db
                .collection('screams')
                .where('userHandle', '==', change.before.data().handle)
                .get()
                .then((data) => {
                data.forEach((doc) => {
                    const scream = db.doc(`/screams/${doc.id}`);
                    batch.update(scream, { userImage: change.after.data().imageUrl });
                });
                return batch.commit();
                });
            } else return true;
});

// trigger db deletes for all data related with an ex-scream (just deleted scream)
exports.onScreamDelete = functions.firestore.document('/screams/{screamId}')
    .onDelete((snapshot, context) => {
        const screamId = context.params.screamId;
        const batch = db.batch();
        return db
            .collection('comments')
            .where('screamId', '==', screamId)
            .get()
            .then((data) => {
                data.forEach((doc) => {
                batch.delete(db.doc(`/comments/${doc.id}`));
                });
                return db
                    .collection('likes')
                    .where('screamId', '==', screamId)  
                    .get();
            })
            .then((data) => {
                data.forEach((doc) => {
                batch.delete(db.doc(`/likes/${doc.id}`));
                });

                return db
                    .collection('notifications')
                    .where('screamId', '==', screamId)
                    .get();
            })
            .then((data) => {
                data.forEach((doc) => {
                batch.delete(db.doc(`/notifications/${doc.id}`));
                });
                return batch.commit();
            })
            .catch((err) => console.error(err));
});
