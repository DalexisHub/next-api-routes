import { NextResponse } from 'next/server'
import { hasPrismaErrorCode } from '@/lib/prisma-error'
import { prisma } from '@/lib/prisma'

type RouteContext = {
  params: Promise<{
    id: string
  }>
}

// GET - Obtener un libro específico por ID
export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
    const { id } = await context.params

    const book = await prisma.book.findUnique({
      where: {
        id,
      },
      include: {
        author: true,
      },
    })

    if (!book) {
      return NextResponse.json(
        { error: 'Libro no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(book)
  } catch (error) {
    console.log(error)

    return NextResponse.json(
      { error: 'Error al obtener libro' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar un libro
export async function PUT(
  request: Request,
  context: RouteContext
) {
  try {
    const { id } = await context.params
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

    const book = await prisma.book.update({
      where: {
        id,
      },
      data: {
        title,
        description,
        isbn,
        publishedYear: publishedYear ? parseInt(publishedYear) : undefined,
        genre,
        pages: pages ? parseInt(pages) : undefined,
        authorId,
      },
      include: {
        author: true,
      },
    })

    return NextResponse.json(book)
  } catch (error) {
    if (hasPrismaErrorCode(error, 'P2025')) {
      return NextResponse.json(
        { error: 'Libro no encontrado' },
        { status: 404 }
      )
    }

    if (hasPrismaErrorCode(error, 'P2002')) {
      return NextResponse.json(
        { error: 'El ISBN ya está registrado' },
        { status: 409 }
      )
    }

    if (hasPrismaErrorCode(error, 'P2003')) {
      return NextResponse.json(
        { error: 'El autor indicado no existe' },
        { status: 400 }
      )
    }

    console.log(error)

    return NextResponse.json(
      { error: 'Error al actualizar libro' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar un libro
export async function DELETE(
  request: Request,
  context: RouteContext
) {
  try {
    const { id } = await context.params

    await prisma.book.delete({
      where: {
        id,
      },
    })

    return NextResponse.json({
      message: 'Libro eliminado correctamente',
    })
  } catch (error) {
    if (hasPrismaErrorCode(error, 'P2025')) {
      return NextResponse.json(
        { error: 'Libro no encontrado' },
        { status: 404 }
      )
    }

    console.log(error)

    return NextResponse.json(
      { error: 'Error al eliminar libro' },
      { status: 500 }
    )
  }
}
