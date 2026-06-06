'use client'

import Link from 'next/link'
import { FormEvent, useCallback, useEffect, useState } from 'react'

type Author = {
  id: string
  name: string
}

type Book = {
  id: string
  title: string
  description: string | null
  isbn: string
  publishedYear: number | null
  genre: string | null
  pages: number | null
  authorId: string
  author: Author
}

type SearchResponse = {
  data: Book[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export default function BooksPage() {
  const [authors, setAuthors] = useState<Author[]>([])
  const [books, setBooks] = useState<Book[]>([])
  const [genres, setGenres] = useState<string[]>([])
  const [search, setSearch] = useState('')
  const [genre, setGenre] = useState('')
  const [authorName, setAuthorName] = useState('')
  const [sortBy, setSortBy] = useState('createdAt')
  const [order, setOrder] = useState('desc')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState<SearchResponse['pagination'] | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const loadAuthorsAndGenres = useCallback(async () => {
    const [authorsResponse, booksResponse] = await Promise.all([
      fetch('/api/authors'),
      fetch('/api/books'),
    ])
    const authorsData = await authorsResponse.json()
    const booksData: Book[] = await booksResponse.json()

    setAuthors(authorsData)
    setGenres(Array.from(new Set(booksData.map((book) => book.genre).filter(Boolean) as string[])))
  }, [])

  const searchBooks = useCallback(async (currentPage: number) => {
    setLoading(true)
    setMessage('')

    const params = new URLSearchParams({
      page: String(currentPage),
      limit: '6',
      sortBy,
      order,
    })

    if (search) params.set('search', search)
    if (genre) params.set('genre', genre)
    if (authorName) params.set('authorName', authorName)

    try {
      const response = await fetch(`/api/books/search?${params.toString()}`)
      const data: SearchResponse = await response.json()

      if (!response.ok) {
        throw new Error('No se pudo buscar libros')
      }

      setBooks(data.data)
      setPagination(data.pagination)
    } catch (searchError) {
      setMessage(searchError instanceof Error ? searchError.message : 'Error inesperado')
    } finally {
      setLoading(false)
    }
  }, [authorName, genre, order, search, sortBy])

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      loadAuthorsAndGenres()
    }, 0)

    return () => window.clearTimeout(timeout)
  }, [loadAuthorsAndGenres])

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setPage(1)
      searchBooks(1)
    }, 350)

    return () => window.clearTimeout(timeout)
  }, [authorName, genre, order, search, searchBooks, sortBy])

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      searchBooks(page)
    }, 0)

    return () => window.clearTimeout(timeout)
  }, [page, searchBooks])

  async function createBook(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')

    const form = event.currentTarget
    const formData = new FormData(form)

    try {
      const response = await fetch('/api/books', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.get('title'),
          description: formData.get('description'),
          isbn: formData.get('isbn'),
          publishedYear: formData.get('publishedYear'),
          genre: formData.get('genre'),
          pages: formData.get('pages'),
          authorId: formData.get('authorId'),
        }),
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'No se pudo crear el libro')
      }

      form.reset()
      setMessage('Libro creado correctamente')
      await loadAuthorsAndGenres()
      await searchBooks(1)
    } catch (createError) {
      setMessage(createError instanceof Error ? createError.message : 'Error inesperado')
    }
  }

  async function editBook(book: Book) {
    const title = window.prompt('Nuevo título', book.title)

    if (!title) {
      return
    }

    const genreValue = window.prompt('Género', book.genre || '')
    const pagesValue = window.prompt('Páginas', String(book.pages || ''))

    try {
      const response = await fetch(`/api/books/${book.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          genre: genreValue,
          pages: pagesValue,
        }),
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'No se pudo editar el libro')
      }

      setMessage('Libro actualizado correctamente')
      await searchBooks(page)
    } catch (editError) {
      setMessage(editError instanceof Error ? editError.message : 'Error inesperado')
    }
  }

  async function deleteBook(book: Book) {
    if (!window.confirm(`¿Eliminar "${book.title}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/books/${book.id}`, {
        method: 'DELETE',
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'No se pudo eliminar el libro')
      }

      setMessage('Libro eliminado correctamente')
      await loadAuthorsAndGenres()
      await searchBooks(page)
    } catch (deleteError) {
      setMessage(deleteError instanceof Error ? deleteError.message : 'Error inesperado')
    }
  }

  return (
    <main className="min-h-screen bg-[#eef4ee] text-[#172118]">
      <section className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-8 sm:px-8">
        <header className="flex flex-col justify-between gap-4 rounded-[2rem] bg-[#20351f] p-7 text-white lg:flex-row lg:items-end">
          <div>
            <p className="mb-2 text-sm font-bold uppercase tracking-[0.3em] text-[#b8e986]">Libros</p>
            <h1 className="text-4xl font-black sm:text-5xl">Búsqueda, filtros y paginación</h1>
          </div>
          <Link href="/" className="rounded-full bg-white px-5 py-3 text-center font-bold text-[#20351f]">
            Volver al dashboard
          </Link>
        </header>

        {message && <p className="rounded-2xl bg-white p-4 text-sm font-bold shadow-sm">{message}</p>}

        <section className="grid gap-6 lg:grid-cols-[0.85fr_1.4fr]">
          <form onSubmit={createBook} className="rounded-[2rem] bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-black">Crear libro</h2>
            <div className="mt-5 grid gap-3">
              <input className="rounded-2xl border px-4 py-3" name="title" placeholder="Título" required />
              <input className="rounded-2xl border px-4 py-3" name="isbn" placeholder="ISBN único" required />
              <input className="rounded-2xl border px-4 py-3" name="genre" placeholder="Género" />
              <input className="rounded-2xl border px-4 py-3" name="publishedYear" placeholder="Año de publicación" type="number" />
              <input className="rounded-2xl border px-4 py-3" name="pages" placeholder="Páginas" type="number" />
              <select className="rounded-2xl border px-4 py-3" name="authorId" required defaultValue="">
                <option value="" disabled>Seleccionar autor</option>
                {authors.map((author) => (
                  <option key={author.id} value={author.id}>{author.name}</option>
                ))}
              </select>
              <textarea className="min-h-24 rounded-2xl border px-4 py-3" name="description" placeholder="Descripción" />
              <button className="rounded-2xl bg-[#20351f] px-5 py-3 font-bold text-white">
                Crear libro
              </button>
            </div>
          </form>

          <section className="rounded-[2rem] bg-white p-6 shadow-sm">
            <div className="grid gap-3 md:grid-cols-2">
              <input className="rounded-2xl border px-4 py-3" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por título..." />
              <input className="rounded-2xl border px-4 py-3" value={authorName} onChange={(event) => setAuthorName(event.target.value)} placeholder="Filtrar por autor..." />
              <select className="rounded-2xl border px-4 py-3" value={genre} onChange={(event) => setGenre(event.target.value)}>
                <option value="">Todos los géneros</option>
                {genres.map((genreOption) => (
                  <option key={genreOption} value={genreOption}>{genreOption}</option>
                ))}
              </select>
              <div className="grid grid-cols-2 gap-3">
                <select className="rounded-2xl border px-4 py-3" value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                  <option value="createdAt">Fecha</option>
                  <option value="title">Título</option>
                  <option value="publishedYear">Año</option>
                </select>
                <select className="rounded-2xl border px-4 py-3" value={order} onChange={(event) => setOrder(event.target.value)}>
                  <option value="desc">Desc</option>
                  <option value="asc">Asc</option>
                </select>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between">
              <p className="font-bold">
                {pagination ? `${pagination.total} resultado(s)` : 'Sin resultados'}
              </p>
              {loading && <span className="text-sm font-bold text-[#587d52]">Buscando...</span>}
            </div>

            <div className="mt-5 grid gap-4">
              {books.map((book) => (
                <article key={book.id} className="rounded-3xl border p-5">
                  <div className="flex flex-col justify-between gap-4 md:flex-row">
                    <div>
                      <h3 className="text-xl font-black">{book.title}</h3>
                      <p className="text-sm text-[#5f6b5c]">{book.author.name} · {book.genre || 'Sin género'} · {book.publishedYear || 'Sin año'}</p>
                      <p className="mt-2 text-sm">{book.description || 'Sin descripción'}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button className="rounded-full border px-4 py-2 text-sm font-bold" onClick={() => editBook(book)}>Editar</button>
                      <button className="rounded-full border border-red-200 px-4 py-2 text-sm font-bold text-red-700" onClick={() => deleteBook(book)}>Eliminar</button>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-6 flex items-center justify-between">
              <button disabled={!pagination?.hasPrev} onClick={() => setPage((value) => Math.max(1, value - 1))} className="rounded-full border px-4 py-2 font-bold disabled:opacity-40">
                Anterior
              </button>
              <span className="text-sm font-bold">
                Página {pagination?.page || 1} de {pagination?.totalPages || 1}
              </span>
              <button disabled={!pagination?.hasNext} onClick={() => setPage((value) => value + 1)} className="rounded-full border px-4 py-2 font-bold disabled:opacity-40">
                Siguiente
              </button>
            </div>
          </section>
        </section>
      </section>
    </main>
  )
}
