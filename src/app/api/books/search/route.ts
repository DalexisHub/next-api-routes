import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const validSortFields = ['title', 'publishedYear', 'createdAt'] as const
const validOrders = ['asc', 'desc'] as const

type SortField = (typeof validSortFields)[number]
type SortOrder = (typeof validOrders)[number]

function getPositiveNumber(value: string | null, fallback: number) {
  const parsed = Number(value)

  if (!Number.isInteger(parsed) || parsed < 1) {
    return fallback
  }

  return parsed
}

// GET - Buscar libros con filtros, ordenamiento y paginación
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)

    const search = searchParams.get('search')?.trim()
    const genre = searchParams.get('genre')?.trim()
    const authorName = searchParams.get('authorName')?.trim()
    const page = getPositiveNumber(searchParams.get('page'), 1)
    const requestedLimit = getPositiveNumber(searchParams.get('limit'), 10)
    const limit = Math.min(requestedLimit, 50)
    const sortByParam = searchParams.get('sortBy')
    const orderParam = searchParams.get('order')
    const sortBy: SortField = validSortFields.includes(sortByParam as SortField)
      ? (sortByParam as SortField)
      : 'createdAt'
    const order: SortOrder = validOrders.includes(orderParam as SortOrder)
      ? (orderParam as SortOrder)
      : 'desc'

    const where = {
      ...(search && {
        title: {
          contains: search,
          mode: 'insensitive' as const,
        },
      }),
      ...(genre && { genre }),
      ...(authorName && {
        author: {
          name: {
            contains: authorName,
            mode: 'insensitive' as const,
          },
        },
      }),
    }

    const [data, total] = await Promise.all([
      prisma.book.findMany({
        where,
        include: {
          author: true,
        },
        orderBy: {
          [sortBy]: order,
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.book.count({ where }),
    ])

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    })
  } catch (error) {
    console.log(error)

    return NextResponse.json(
      { error: 'Error al buscar libros' },
      { status: 500 }
    )
  }
}
