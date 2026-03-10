import {
  collection, addDoc, getDocs, getDoc, doc,
  updateDoc, deleteDoc, query, orderBy, arrayUnion, arrayRemove, where
} from 'firebase/firestore'
import { db, auth } from '../config/firebase'
import notificationService from './notificationService'

class AnnouncementsService {
  // ─── Internal: broadcast notification to all residents ────────────────────
  async _notifyAllResidents({ type, category, message, relatedId, relatedType }) {
    try {
      const snapshot = await getDocs(
        query(collection(db, 'users'), where('role', '==', 'resident'))
      )
      const currentUid = auth.currentUser?.uid

      const tasks = snapshot.docs
        .map(d => d.id)
        .filter(uid => uid !== currentUid) // don't notify the poster themselves
        .map(uid =>
          notificationService.createNotification({
            userId: uid,
            type,
            category,
            message,
            relatedId,
            relatedType
          })
        )

      await Promise.all(tasks)
      console.log(`🔔 [Announcements] Notified ${tasks.length} resident(s)`)
    } catch (err) {
      console.warn('⚠️ [Announcements] Could not notify residents:', err.message)
    }
  }

  // ─── Internal: notify a single user ──────────────────────────────────────
  async _notifyUser(userId, { type, category, message, relatedId, relatedType }) {
    if (!userId || userId === auth.currentUser?.uid) return
    try {
      await notificationService.createNotification({
        userId,
        type,
        category,
        message,
        relatedId,
        relatedType
      })
    } catch (err) {
      console.warn('⚠️ [Announcements] Could not notify user:', err.message)
    }
  }

  // ─── Fetch all posts ordered newest first ─────────────────────────────────
  async getAllPosts() {
    try {
      let snapshot
      try {
        const q = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'))
        snapshot = await getDocs(q)
      } catch {
        snapshot = await getDocs(collection(db, 'announcements'))
      }
      return snapshot.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    } catch (error) {
      console.error('Error fetching announcements:', error)
      return []
    }
  }

  // ─── Create a new post (admins/officials only) + notify all residents ─────
  async createPost({ title, content, type, eventDate, eventTime, eventVenue, authorName, authorRole }) {
    const userId = auth.currentUser?.uid
    if (!userId) throw new Error('Not authenticated')

    const post = {
      title,
      content,
      type, // 'announcement' | 'event'
      authorId: userId,
      authorName: authorName || 'Official',
      authorRole,
      likes: [],
      commentCount: 0,
      createdAt: new Date().toISOString(),
      ...(type === 'event' && {
        eventDate: eventDate || '',
        eventTime: eventTime || '',
        eventVenue: eventVenue || ''
      })
    }

    const ref = await addDoc(collection(db, 'announcements'), post)
    const newPost = { id: ref.id, ...post }

    // Notify all residents about the new post/event
    const isEvent = type === 'event'
    await this._notifyAllResidents({
      type: 'info',
      category: 'community',
      message: isEvent
        ? `📅 New event posted: "${title}" — check the Community Board for details.`
        : `📢 New announcement from ${authorName || 'an official'}: "${title}"`,
      relatedId: ref.id,
      relatedType: 'announcement'
    })

    return newPost
  }

  // ─── Toggle like ──────────────────────────────────────────────────────────
  async toggleLike(postId) {
    const userId = auth.currentUser?.uid
    if (!userId) throw new Error('Not authenticated')

    const ref = doc(db, 'announcements', postId)
    const snap = await getDoc(ref)
    const likes = snap.data()?.likes || []
    const isLiked = likes.includes(userId)

    if (isLiked) {
      await updateDoc(ref, { likes: arrayRemove(userId) })
      return { liked: false, newLikes: likes.filter(id => id !== userId) }
    } else {
      await updateDoc(ref, { likes: arrayUnion(userId) })
      return { liked: true, newLikes: [...likes, userId] }
    }
  }

  // ─── Fetch comments for a post (ordered oldest first) ────────────────────
  async getComments(postId) {
    try {
      let snapshot
      try {
        const q = query(
          collection(db, 'announcements', postId, 'comments'),
          orderBy('createdAt', 'asc')
        )
        snapshot = await getDocs(q)
      } catch {
        snapshot = await getDocs(collection(db, 'announcements', postId, 'comments'))
      }
      return snapshot.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    } catch (error) {
      console.error('Error fetching comments:', error)
      return []
    }
  }

  // ─── Add a comment + notify the post author ───────────────────────────────
  async addComment(postId, content, authorName, authorRole) {
    const userId = auth.currentUser?.uid
    if (!userId) throw new Error('Not authenticated')

    const comment = {
      authorId: userId,
      authorName: authorName || 'Resident',
      authorRole,
      content,
      replies: [],
      createdAt: new Date().toISOString()
    }

    const colRef = collection(db, 'announcements', postId, 'comments')
    const ref = await addDoc(colRef, comment)

    // Increment commentCount and grab the post's authorId in one getDoc
    const postRef = doc(db, 'announcements', postId)
    const postSnap = await getDoc(postRef)
    const postData = postSnap.data() || {}

    await updateDoc(postRef, { commentCount: (postData.commentCount || 0) + 1 })

    // Notify the post author that someone commented
    if (postData.authorId) {
      await this._notifyUser(postData.authorId, {
        type: 'info',
        category: 'community',
        message: `💬 ${authorName || 'A resident'} commented on your post "${postData.title || 'your announcement'}"`,
        relatedId: postId,
        relatedType: 'announcement'
      })
    }

    return { id: ref.id, ...comment }
  }

  // ─── Reply to a comment (officials only) + notify the commenter ───────────
  async replyToComment(postId, commentId, content, authorName, authorRole) {
    const userId = auth.currentUser?.uid
    if (!userId) throw new Error('Not authenticated')

    const reply = {
      authorId: userId,
      authorName: authorName || 'Official',
      authorRole,
      content,
      createdAt: new Date().toISOString()
    }

    const commentRef = doc(db, 'announcements', postId, 'comments', commentId)

    // Fetch the comment first so we know who to notify
    const commentSnap = await getDoc(commentRef)
    const commentData = commentSnap.data() || {}

    await updateDoc(commentRef, { replies: arrayUnion(reply) })

    // Also fetch post title for a nicer message
    let postTitle = 'your comment'
    try {
      const postSnap = await getDoc(doc(db, 'announcements', postId))
      postTitle = `"${postSnap.data()?.title || 'your comment'}"`
    } catch { /* non-fatal */ }

    // Notify the original commenter that an official replied
    if (commentData.authorId) {
      await this._notifyUser(commentData.authorId, {
        type: 'info',
        category: 'community',
        message: `↩️ ${authorName || 'An official'} replied to your comment on ${postTitle}`,
        relatedId: postId,
        relatedType: 'announcement'
      })
    }

    return reply
  }

  // ─── Delete a post ────────────────────────────────────────────────────────
  async deletePost(postId) {
    await deleteDoc(doc(db, 'announcements', postId))
    return { success: true }
  }
}

export default new AnnouncementsService()
