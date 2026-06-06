import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'

// GET - Obtener todos los libros
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const genre = searchParams.get('genre')

    const books = await prisma.book.findMany({
      where: {
        ...(genre && { genre }),
      },
      include: {
        author: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(books)
  } catch (error) {
    console.log(error)

    return NextResponse.json(
      { error: 'Error al obtener libros' },
      { status: 500 }
    )
  }
}

// POST - Crear un nuevo libro
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      title,
      description,
      isbn,
      publishedYear,
      genre,
      pages,
      authorId,
    } = body

    if (!title || !isbn || !authorId) {
      return NextResponse.json(
        { error: 'Título, ISBN y authorId son requeridos' },
        { status: 400 }
      )
    }

    const book = await prisma.book.create({
      data: {
        title,
        description,
        isbn,
        publishedYear: publishedYear ? parseInt(publishedYear) : null,
        genre,
        pages: pages ? parseInt(pages) : null,
        authorId,
      },
      include: {
        author: true,
      },
    })

    return NextResponse.json(book, { status: 201 })
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      return NextResponse.json(
        { error: 'El ISBN ya está registrado' },
        { status: 409 }
      )
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2003'
    ) {
      return NextResponse.json(
        { error: 'El autor indicado no existe' },
        { status: 400 }
      )
    }

    console.log(error)

    return NextResponse.json(
      { error: 'Error al crear libro' },
      { status: 500 }
    )
  }
}
