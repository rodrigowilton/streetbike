// src/services/firebase.js
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js';
import {
  getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  sendPasswordResetEmail, signOut, onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js';
import {
  getFirestore, doc, setDoc, getDoc, deleteDoc, collection, query, where,
  orderBy, limit, getDocs, updateDoc, addDoc, Timestamp,
  serverTimestamp, increment, arrayUnion, arrayRemove
} from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';

const firebaseConfig = {
  apiKey: "AIzaSyBmFPK1TOKA9bsOn7H7RtWwn631jdOdus0",
  authDomain: "controle-residencial-5d270.firebaseapp.com",
  databaseURL: "https://controle-residencial-5d270.firebaseio.com",
  projectId: "controle-residencial-5d270",
  storageBucket: "controle-residencial-5d270.firebasestorage.app",
  messagingSenderId: "38245804900",
  appId: "1:38245804900:web:0cf77252638b7c34d3a871"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// ===================== AUTH =====================

export async function registerUser(data) {
  const { email, password, name, phone, city, state, bikeModel, bikeYear, bikingStyle } = data;
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const uid = cred.user.uid;
  const now = new Date();
  const expiry = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const user = {
    uid, name, email, phone, city, state,
    bikeModel, bikeYear, bikingStyle,
    profileImageUrl: '', bio: '', instagram: '',
    registrationDate: Timestamp.fromDate(now),
    expirationDate: Timestamp.fromDate(expiry),
    isActive: true, isAdmin: false, isExpired: false,
    totalKm: 0, totalRoutes: 0, fcmToken: ''
  };

  await setDoc(doc(db, 'users', uid), user);
  await addDoc(collection(db, 'notifications'), {
    userId: uid,
    title: '🏍️ Bem-vindo ao StreetBike!',
    message: 'Seu acesso é válido por 30 dias. Explore rotas, eventos e conecte-se com outros ciclistas!',
    type: 'info', isRead: false, createdAt: serverTimestamp()
  });
  return user;
}

export async function loginUser(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  const uid = cred.user.uid;
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) throw new Error('Usuário não encontrado');
  const user = snap.data();
  const now = Date.now();
  const expiry = user.expirationDate?.toDate?.().getTime() || 0;
  if (!user.isAdmin && now > expiry) {
    await updateDoc(doc(db, 'users', uid), { isExpired: true });
    throw new Error('EXPIRED');
  }
  if (!user.isActive) throw new Error('BLOCKED');
  return user;
}

export async function logoutUser() { await signOut(auth); }
export async function resetPassword(email) { await sendPasswordResetEmail(auth, email); }

export async function getCurrentUser() {
  const uid = auth.currentUser?.uid;
  if (!uid) return null;
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? snap.data() : null;
}

export { onAuthStateChanged };

// ===================== POSTS =====================

export async function createPost(content, category = 'Geral') {
  const user = await getCurrentUser();
  return await addDoc(collection(db, 'posts'), {
    authorUid: user.uid, authorName: user.name,
    authorPhotoUrl: user.profileImageUrl || '',
    content, category, imageUrls: [], likes: 0,
    likedBy: [], commentsCount: 0, createdAt: serverTimestamp()
  });
}

export async function getPosts(limitN = 20) {
  const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(limitN));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function toggleLike(postId, uid) {
  const ref = doc(db, 'posts', postId);
  const snap = await getDoc(ref);
  const post = snap.data();
  if (post.likedBy?.includes(uid)) {
    await updateDoc(ref, { likes: increment(-1), likedBy: arrayRemove(uid) });
  } else {
    await updateDoc(ref, { likes: increment(1), likedBy: arrayUnion(uid) });
  }
}

export async function addComment(postId, content) {
  const user = await getCurrentUser();
  await addDoc(collection(db, 'posts', postId, 'comments'), {
    authorUid: user.uid, authorName: user.name,
    authorPhotoUrl: user.profileImageUrl || '',
    content, createdAt: serverTimestamp()
  });
  await updateDoc(doc(db, 'posts', postId), { commentsCount: increment(1) });
}

export async function getComments(postId) {
  const q = query(collection(db, 'posts', postId, 'comments'), orderBy('createdAt', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ===================== ROUTES =====================

export async function createRoute(data) {
  const user = await getCurrentUser();
  return await addDoc(collection(db, 'routes'), {
    ...data, creatorUid: user.uid, creatorName: user.name,
    likes: 0, likedBy: [], isPublic: true, createdAt: serverTimestamp()
  });
}

export async function getRoutes() {
  const q = query(collection(db, 'routes'), orderBy('createdAt', 'desc'), limit(30));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(r => r.isPublic !== false);
}

// ===================== EVENTS =====================

export async function createEvent(data) {
  const user = await getCurrentUser();
  return await addDoc(collection(db, 'events'), {
    ...data, creatorUid: user.uid, creatorName: user.name,
    participants: [], isActive: true, createdAt: serverTimestamp()
  });
}

export async function getEvents() {
  const q = query(collection(db, 'events'), orderBy('createdAt', 'desc'), limit(30));
  const snap = await getDocs(q);
  const now = new Date();
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
    .filter(e => e.isActive !== false)
    .sort((a,b) => (a.eventDate?.seconds||0) - (b.eventDate?.seconds||0));
}

export async function joinEvent(eventId, uid) {
  await updateDoc(doc(db, 'events', eventId), { participants: arrayUnion(uid) });
}

// ===================== NOTIFICATIONS =====================

export async function getNotifications(uid) {
  const [personal, broadcast] = await Promise.all([
    getDocs(query(collection(db, 'notifications'), where('userId', '==', uid), orderBy('createdAt', 'desc'), limit(20))),
    getDocs(query(collection(db, 'notifications'), where('userId', '==', 'all'), orderBy('createdAt', 'desc'), limit(20)))
  ]);
  const all = [
    ...personal.docs.map(d => ({ id: d.id, ...d.data() })),
    ...broadcast.docs.map(d => ({ id: d.id, ...d.data() }))
  ];
  return all.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
}

export async function markRead(notifId) {
  await updateDoc(doc(db, 'notifications', notifId), { isRead: true });
}

// ===================== MAINTENANCE =====================

export async function saveMaintenance(item) {
  const uid = auth.currentUser.uid;
  const ref = item.id
    ? doc(db, 'users', uid, 'maintenance', item.id)
    : doc(collection(db, 'users', uid, 'maintenance'));
  await setDoc(ref, { ...item, id: ref.id, userUid: uid });
  return ref.id;
}

export async function getMaintenance() {
  const uid = auth.currentUser.uid;
  const snap = await getDocs(collection(db, 'users', uid, 'maintenance'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ===================== MARKETPLACE =====================

export async function getMarketplace() {
  const q = query(collection(db, 'marketplace'), orderBy('createdAt', 'desc'), limit(30));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function createListing(data) {
  const user = await getCurrentUser();
  return await addDoc(collection(db, 'marketplace'), {
    ...data, sellerUid: user.uid, sellerName: user.name,
    sellerPhone: user.phone, isAvailable: true, createdAt: serverTimestamp()
  });
}

// ===================== ADMIN =====================

export async function getAllUsers() {
  const snap = await getDocs(query(collection(db, 'users'), orderBy('registrationDate', 'desc')));
  return snap.docs.map(d => d.data()).filter(u => !u.isAdmin);
}

export async function renewAccess(uid, days) {
  const expiry = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  await updateDoc(doc(db, 'users', uid), {
    expirationDate: Timestamp.fromDate(expiry),
    isExpired: false, isActive: true
  });
  await addDoc(collection(db, 'notifications'), {
    userId: uid,
    title: '✅ Acesso Renovado!',
    message: `Seu acesso foi renovado por ${days} dias. Aproveite!`,
    type: 'info', isRead: false, createdAt: serverTimestamp()
  });
}

export async function toggleUserActive(uid, isActive) {
  await updateDoc(doc(db, 'users', uid), { isActive });
}

export async function sendNotificationToUser(uid, title, message) {
  await addDoc(collection(db, 'notifications'), {
    userId: uid, title, message, type: 'admin', isRead: false, createdAt: serverTimestamp()
  });
}

export async function sendBroadcast(title, message) {
  await addDoc(collection(db, 'notifications'), {
    userId: 'all', title, message, type: 'admin', isRead: false, createdAt: serverTimestamp()
  });
}

export async function getAdminStats() {
  const users = await getAllUsers();
  const now = Date.now();
  return {
    total: users.length,
    active: users.filter(u => u.isActive && !u.isExpired).length,
    expiring: users.filter(u => {
      const d = (u.expirationDate?.toDate?.().getTime() - now) / 86400000;
      return d >= 0 && d <= 7 && !u.isExpired;
    }).length,
    expired: users.filter(u => u.isExpired).length
  };
}

// ===================== CHAT / GROUPS =====================

export async function getChatRooms(uid) {
  // Global community chat + groups user is member of
  const [globalSnap, groupSnap] = await Promise.all([
    getDocs(query(collection(db, 'chatrooms'), where('type', '==', 'global'))),
    getDocs(query(collection(db, 'chatrooms'), where('members', 'array-contains', uid)))
  ]);
  const rooms = {};
  globalSnap.docs.forEach(d => { rooms[d.id] = { id: d.id, ...d.data() }; });
  groupSnap.docs.forEach(d => { rooms[d.id] = { id: d.id, ...d.data() }; });
  return Object.values(rooms).sort((a,b) => (b.lastMessageAt?.seconds||0) - (a.lastMessageAt?.seconds||0));
}

export async function createGroup(name, description, category, creatorUid, creatorName) {
  const ref = await addDoc(collection(db, 'chatrooms'), {
    name, description, category,
    type: 'group',
    creatorUid, creatorName,
    members: [creatorUid],
    membersCount: 1,
    lastMessage: '',
    lastMessageAt: serverTimestamp(),
    createdAt: serverTimestamp()
  });
  return ref.id;
}

export async function joinRoom(roomId, uid) {
  await updateDoc(doc(db, 'chatrooms', roomId), {
    members: arrayUnion(uid),
    membersCount: increment(1)
  });
}

export async function leaveRoom(roomId, uid) {
  await updateDoc(doc(db, 'chatrooms', roomId), {
    members: arrayRemove(uid),
    membersCount: increment(-1)
  });
}

export async function getChatMessages(roomId, limitN = 50) {
  const q = query(
    collection(db, 'chatrooms', roomId, 'messages'),
    orderBy('createdAt', 'desc'),
    limit(limitN)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() })).reverse();
}

export async function sendChatMessage(roomId, text, user) {
  const msg = {
    text, senderUid: user.uid, senderName: user.name,
    createdAt: serverTimestamp()
  };
  await addDoc(collection(db, 'chatrooms', roomId, 'messages'), msg);
  await updateDoc(doc(db, 'chatrooms', roomId), {
    lastMessage: text.substring(0, 60),
    lastMessageAt: serverTimestamp()
  });
}

export async function ensureGlobalChat() {
  const q = query(collection(db, 'chatrooms'), where('type', '==', 'global'));
  const snap = await getDocs(q);
  if (snap.empty) {
    await addDoc(collection(db, 'chatrooms'), {
      name: '🌎 Comunidade Geral',
      description: 'Chat aberto para todos os ciclistas',
      type: 'global',
      members: [],
      membersCount: 0,
      lastMessage: 'Bem-vindo ao chat da comunidade!',
      lastMessageAt: serverTimestamp(),
      createdAt: serverTimestamp()
    });
  }
}

// ===================== DELETE =====================
export async function deleteItem(collection_name, id) {
  await deleteDoc(doc(db, collection_name, id));
}
