import { NextResponse } from 'next/server';
import { writeFile, readFile } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { User, Comment } from '@/lib/types'; // Import User and Comment types

const USERS_FILE = path.join(process.cwd(), 'data', 'users.json');

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Helper function to read users data
async function readUsersData(): Promise<User[]> {
  try {
    const content = await readFile(USERS_FILE, 'utf-8');
    return JSON.parse(content) as User[];
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return []; // Return empty array if file doesn't exist
    }
    console.error('Error reading users data:', error);
    throw error;
  }
}

// Helper function to write users data
async function writeUsersData(users: User[]): Promise<void> {
  await writeFile(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
}

// Helper function to find or create a user
function findOrCreateUser(users: User[], userId: string, username: string = 'anonymous'): User {
  let user = users.find(u => u.id === userId);
  if (!user) {
    user = {
      id: userId,
      username: username,
      passwordHash: '', // Initialize passwordHash
      comments: [],
      favoriteFileUniqueNames: [], // Initialize new property
    };
    users.push(user);
  }
  return user;
}

export async function POST(request: Request) {
  try {
    const { fileUniqueName, userId, content } = await request.json();

    if (!fileUniqueName || !userId || !content) {
      return NextResponse.json({ success: false, message: 'File unique name, user ID, and content are required' }, { status: 400 });
    }

    const users = await readUsersData();
    const user = findOrCreateUser(users, userId);

    const newComment: Comment = {
      commentId: uuidv4(),
      fileUniqueName,
      userId,
      content,
      date: new Date().toISOString(),
    };

    user.comments.push(newComment);

    await writeUsersData(users);

    return NextResponse.json({ success: true, message: 'Comment added successfully', comment: newComment });
  } catch (error: any) {
    console.error('Error adding comment:', error);
    return NextResponse.json({ success: false, message: `Failed to add comment: ${error.message}` }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fileUniqueName = searchParams.get('fileUniqueName');
    const userId = searchParams.get('userId');

    if (!fileUniqueName || !userId) {
      return NextResponse.json({ success: false, message: 'fileUniqueName and userId parameters are required' }, { status: 400 });
    }

    const users = await readUsersData();
    const user = findOrCreateUser(users, userId);

    const fileComments = user.comments.filter(comment => comment.fileUniqueName === fileUniqueName);

    return NextResponse.json({ success: true, comments: fileComments });
  } catch (error: any) {
    console.error('Error fetching comments:', error);
    return NextResponse.json({ success: false, message: `Failed to fetch comments: ${error.message}` }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { commentId, fileUniqueName, userId } = await request.json();

    if (!commentId || !fileUniqueName || !userId) {
      return NextResponse.json({ success: false, message: 'Comment ID, file unique name, and user ID are required for deletion' }, { status: 400 });
    }

    const users = await readUsersData();
    const user = findOrCreateUser(users, userId);

    const initialCommentCount = user.comments.length;
    user.comments = user.comments.filter(comment => comment.commentId !== commentId || comment.fileUniqueName !== fileUniqueName);

    if (user.comments.length === initialCommentCount) {
      return NextResponse.json({ success: false, message: 'Comment not found or not authorized' }, { status: 404 });
    }

    await writeUsersData(users);

    return NextResponse.json({ success: true, message: 'Comment deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting comment:', error);
    return NextResponse.json({ success: false, message: `Failed to delete comment: ${error.message}` }, { status: 500 });
  }
}
