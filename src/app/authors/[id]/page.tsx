'use client'

import Link from 'next/link'
import { FormEvent, useCallback, useEffect, useState } from 'react'

type PageProps = {
  params: Promise<{
    id: string
  }>
}

type Book = {
  id: string
  title: string
  description: string | null
  isbn: string
  publishedYear: number | null
  genre: string | null
  pages: number | null
}

type Author = {
  id: string
  name: string
  email: string
  bio: string | null
  nationality: string | null
  birthYear: number | null
  books: Book[]
  _count: {
    books: number
  }
}

type AuthorStats = {
  authorId: string
  authorName: string
  totalBooks: number
  firstBook: { title: string; year: number | null } | null
  latestBook: { title: string; year: number | null } | null
  averagePages: number
  genres: string[]
  longestBook: { title: string; pages: number | null } | null
  shortestBook: { title: string; pages: number | null } | null
}

export default function AuthorDetailPage({ params }: PageProps) {
  const [authorId, setAuthorId] = useState('')
  const [author, setAuthor] = useState<Author | null>(null)
  const [stats, setStats] = useState<AuthorStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  useEffect(() => {
    params.then(({ id }) => setAuthorId(id))
  }, [params])

  const loadAuthor = useCallback(async (id = authorId) => {
    if (!id) {
      return
    }

    setLoading(true)
    setMessage('')

    try {
      const [authorResponse, statsResponse] = await Promise.all([
        fetch(`/api/authors/${id}`),
        fetch(`/api/authors/${id}/stats`),
      ])
      const authorData = await authorResponse.json()
      const statsData = await statsResponse.json()

      if (!authorResponse.ok) {
        throw new Error(authorData.error || 'No se pudo cargar el autor')
      }

      if (!statsResponse.ok) {
        throw new Error(statsData.error || 'No se pudieron cargar las estadísticas')
      }

      setAuthor(authorData)
      setStats(statsData)
    } catch (loadError) {
      setMessage(loadError instanceof Error ? loadError.message : 'Error inesperado')
    } finally {
      setLoading(false)
    }
  }, [authorId])

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      loadAuthor(authorId)
    }, 0)

    return () => window.clearTimeout(timeout)
  }, [authorId, loadAuthor])

  async function updateAuthor(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!author) {
      return
    }

    const form = event.currentTarget
    const formData = new FormData(form)

    try {
      const response = await fetch(`/api/authors/${author.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.get('name'),
          email: formData.get('email'),
          nationality: formData.get('nationality'),
          birthYear: formData.get('birthYear'),
          bio: formData.get('bio'),
        }),
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'No se pudo actualizar el autor')
      }

      setMessage('Autor actualizado correctamente')
      await loadAuthor(author.id)
    } catch (updateError) {
      setMessage(updateError instanceof Error ? updateError.message : 'Error inesperado')
    }
  }

  async function addBook(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!author) {
      return
    }

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
          isbn: formData.get('isbn'),
          genre: formData.get('genre'),
          description: formData.get('description'),
          publishedYear: formData.get('publishedYear'),
          pages: formData.get('pages'),
          authorId: author.id,
        }),
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'No se pudo crear el libro')
      }

      form.reset()
      setMessage('Libro agregado correctamente')
      await loadAuthor(author.id)
    } catch (createError) {
      setMessage(createError instanceof Error ? createError.message : 'Error inesperado')
    }
  }

  if (loading) {
    return <main className="min-h-screen bg-[#f4efe6] p-8 font-bold">Cargando autor...</main>
  }

  if (!author) {
    return <main className="min-h-screen bg-[#f4efe6] p-8 font-bold">{message || 'Autor no encontrado'}</main>
  }

  return (
    <main className="min-h-screen bg-[#f4efe6] text-[#25170f]">
      <section className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-8 sm:px-8">
        <header className="rounded-[2rem] bg-[#5b2e20] p-7 text-white">
          <Link href="/" className="mb-6 inline-flex rounded-full bg-white px-4 py-2 text-sm font-bold text-[#5b2e20]">
            Volver
          </Link>
          <h1 className="text-4xl font-black sm:text-5xl">{author.name}</h1>
          <p className="mt-3 max-w-2xl text-white/80">{author.bio || 'Sin biografía registrada'}</p>
        </header>

        {message && <p className="rounded-2xl bg-white p-4 text-sm font-bold shadow-sm">{message}</p>}

        <section className="grid gap-4 md:grid-cols-4">
          <article className="rounded-3xl bg-white p-5 shadow-sm">
            <p className="text-sm font-bold text-[#8a5a36]">Total libros</p>
            <strong className="text-3xl">{stats?.totalBooks ?? 0}</strong>
          </article>
          <article className="rounded-3xl bg-white p-5 shadow-sm">
            <p className="text-sm font-bold text-[#8a5a36]">Primer libro</p>
            <strong>{stats?.firstBook?.title || 'Sin datos'}</strong>
          </article>
          <article className="rounded-3xl bg-white p-5 shadow-sm">
            <p className="text-sm font-bold text-[#8a5a36]">Último libro</p>
            <strong>{stats?.latestBook?.title || 'Sin datos'}</strong>
          </article>
          <article className="rounded-3xl bg-white p-5 shadow-sm">
            <p className="text-sm font-bold text-[#8a5a36]">Promedio páginas</p>
            <strong className="text-3xl">{stats?.averagePages ?? 0}</strong>
          </article>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <article className="rounded-[2rem] bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-black">Estadísticas</h2>
            <dl className="mt-4 grid gap-3 text-sm">
              <div className="rounded-2xl bg-[#f8f3ea] p-4">
                <dt className="font-bold">Géneros</dt>
                <dd>{stats?.genres.join(', ') || 'Sin géneros'}</dd>
              </div>
              <div className="rounded-2xl bg-[#f8f3ea] p-4">
                <dt className="font-bold">Libro con más páginas</dt>
                <dd>{stats?.longestBook ? `${stats.longestBook.title} (${stats.longestBook.pages})` : 'Sin datos'}</dd>
              </div>
              <div className="rounded-2xl bg-[#f8f3ea] p-4">
                <dt className="font-bold">Libro con menos páginas</dt>
                <dd>{stats?.shortestBook ? `${stats.shortestBook.title} (${stats.shortestBook.pages})` : 'Sin datos'}</dd>
              </div>
            </dl>
          </article>

          <form onSubmit={updateAuthor} className="rounded-[2rem] bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-black">Editar autor</h2>
            <div className="mt-5 grid gap-3">
              <input className="rounded-2xl border px-4 py-3" name="name" defaultValue={author.name} required />
              <input className="rounded-2xl border px-4 py-3" name="email" defaultValue={author.email} type="email" required />
              <input className="rounded-2xl border px-4 py-3" name="nationality" defaultValue={author.nationality || ''} />
              <input className="rounded-2xl border px-4 py-3" name="birthYear" defaultValue={author.birthYear || ''} type="number" />
              <textarea className="min-h-24 rounded-2xl border px-4 py-3" name="bio" defaultValue={author.bio || ''} />
              <button className="rounded-2xl bg-[#5b2e20] px-5 py-3 font-bold text-white">
                Guardar cambios
              </button>
            </div>
          </form>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <article className="rounded-[2rem] bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-black">Libros del autor</h2>
            <div className="mt-5 grid gap-4">
              {author.books.map((book) => (
                <div key={book.id} className="rounded-3xl border p-5">
                  <h3 className="text-xl font-black">{book.title}</h3>
                  <p className="text-sm text-[#6b5a4e]">{book.genre || 'Sin género'} · {book.publishedYear || 'Sin año'} · {book.pages || 0} páginas</p>
                  <p className="mt-2 text-sm">{book.description || 'Sin descripción'}</p>
                </div>
              ))}
            </div>
          </article>

          <form onSubmit={addBook} className="rounded-[2rem] bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-black">Agregar libro</h2>
            <div className="mt-5 grid gap-3">
              <input className="rounded-2xl border px-4 py-3" name="title" placeholder="Título" required />
              <input className="rounded-2xl border px-4 py-3" name="isbn" placeholder="ISBN único" required />
              <input className="rounded-2xl border px-4 py-3" name="genre" placeholder="Género" />
              <input className="rounded-2xl border px-4 py-3" name="publishedYear" placeholder="Año" type="number" />
              <input className="rounded-2xl border px-4 py-3" name="pages" placeholder="Páginas" type="number" />
              <textarea className="min-h-24 rounded-2xl border px-4 py-3" name="description" placeholder="Descripción" />
              <button className="rounded-2xl bg-[#5b2e20] px-5 py-3 font-bold text-white">
                Agregar libro
              </button>
            </div>
          </form>
        </section>
      </section>
    </main>
  )
}
