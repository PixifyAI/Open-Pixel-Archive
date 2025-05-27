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

// Simple mock for password hashing (REPLACE WITH BCRYPT IN PRODUCTION)
const hashPassword = (password: string) => {
  // In a real application, use a strong hashing library like bcrypt
  return `hashed-${password}`;
};

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ message: 'Username and password are required' }, { status: 400 });
    }

    const users = await readUsersData();

    // Check if username already exists
    if (users.some(user => user.username === username)) {
      return NextResponse.json({ message: 'Username already exists' }, { status: 409 });
    }

    const hashedPassword = hashPassword(password);
    const newUser: User = {
      id: uuidv4(),
      username,
      passwordHash: hashedPassword, // Store hashed password
      comments: [],
      favoriteFileUniqueNames: [], // Initialize new property
    };

    users.push(newUser);
    await writeUsersData(users);

    return NextResponse.json({ success: true, message: 'User registered successfully', userId: newUser.id });
  } catch (error: any) {
    console.error('Error during signup:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
