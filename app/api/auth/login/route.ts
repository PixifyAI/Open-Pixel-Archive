import { NextResponse } from 'next/server';
import { readFile, writeFile } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { User } from '@/lib/types';

const USERS_FILE = path.join(process.cwd(), 'data', 'users.json');

// Helper function to read users data
async function readUsersData(): Promise<User[]> {
  try {
    const content = await readFile(USERS_FILE, 'utf-8');
    return JSON.parse(content) as User[];
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return [];
    }
    console.error('Error reading users data:', error);
    throw error;
  }
}

// Helper function to write users data
async function writeUsersData(users: User[]): Promise<void> {
  await writeFile(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
}

// Simple mock for password verification (REPLACE WITH BCRYPT IN PRODUCTION)
const verifyPassword = (password: string, hashedPassword: string) => {
  // In a real application, use a strong hashing library like bcrypt to compare
  return `hashed-${password}` === hashedPassword;
};

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ message: 'Username and password are required' }, { status: 400 });
    }

    const users = await readUsersData();
    const user = users.find(u => u.username === username);

    if (!user || !verifyPassword(password, user.passwordHash)) {
      return NextResponse.json({ message: 'Invalid username or password' }, { status: 401 });
    }

    // Generate a new session ID
    const sessionId = uuidv4();
    user.sessionId = sessionId; // Store session ID with the user

    await writeUsersData(users);

    // Return session ID and user ID
    return NextResponse.json({ success: true, message: 'Login successful', userId: user.id, sessionId });
  } catch (error: any) {
    console.error('Error during login:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
