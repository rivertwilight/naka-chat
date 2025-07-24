import { NextResponse } from 'next/server';
import { seedDatabase } from '../../../lib/seedData';

export async function POST() {
  try {
    const result = await seedDatabase();
    return NextResponse.json({ 
      success: true, 
      message: 'Database seeded successfully',
      data: result
    });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
} 
