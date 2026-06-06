import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type RouteContext = {
  params: Promise<{
    id: string
  }>
}

type AuthorBook = {
  title: string
  publishedYear: number | null
  pages: number | null
  genre: string | null
}

function bookYear(book: { title: string; publishedYear: number | null }) {
  return {
    title: book.title,
    year: book.publishedYear,
  }
}

function bookPages(book: { title: string; pages: number | null }) {
  return {
    title: book.title,
    pages: book.pages,
  }
}

// GET - Obtener estadísticas completas de un autor
export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
    const { id } = await context.params

    const author = await prisma.author.findUnique({
      where: {
        id,
      },
      include: {
        books: true,
      },
    })

    if (!author) {
      return NextResponse.json(
        { error: 'Autor no encontrado' },
        { status: 404 }
      )
    }

    const books: AuthorBook[] = author.books
    const booksWithYear = books.filter(
      (book) => book.publishedYear !== null
    )
    const booksWithPages = books.filter((book) => book.pages !== null)
    const sortedByYear = [...booksWithYear].sort(
      (a, b) => Number(a.publishedYear) - Number(b.publishedYear)
    )
    const sortedByPages = [...booksWithPages].sort(
      (a, b) => Number(a.pages) - Number(b.pages)
    )
    const totalPages = booksWithPages.reduce(
      (sum, book) => sum + Number(book.pages),
      0
    )
    const genres = Array.from(
      new Set(books.map((book) => book.genre).filter(Boolean))
    )

    return NextResponse.json({
      authorId: author.id,
      authorName: author.name,
      totalBooks: books.length,
      firstBook: sortedByYear[0] ? bookYear(sortedByYear[0]) : null,
      latestBook: sortedByYear.at(-1) ? bookYear(sortedByYear.at(-1)!) : null,
      averagePages: booksWithPages.length
        ? Math.round(totalPages / booksWithPages.length)
        : 0,
      genres,
      longestBook: sortedByPages.at(-1)
        ? bookPages(sortedByPages.at(-1)!)
        : null,
      shortestBook: sortedByPages[0] ? bookPages(sortedByPages[0]) : null,
    })
  } catch (error) {
    console.log(error)

    return NextResponse.json(
      { error: 'Error al obtener estadísticas del autor' },
      { status: 500 }
    )
  }
}
