'use client'

import Link from 'next/link'
import { FormEvent, useEffect, useState } from 'react'

type Book = {
  id: string
  title: string
  genre: string | null
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

export default function Home() {
  const [authors, setAuthors] = useState<Author[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function loadAuthors() {
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/authors')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'No se pudieron cargar los autores')
      }

      setAuthors(data)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Error inesperado')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      loadAuthors()
    }, 0)

    return () => window.clearTimeout(timeout)
  }, [])

  async function createAuthor(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError('')

    const form = event.currentTarget
    const formData = new FormData(form)

    try {
      const response = await fetch('/api/authors', {
        method: 'POST',
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
        throw new Error(data.error || 'No se pudo crear el autor')
      }

      form.reset()
      await loadAuthors()
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Error inesperado')
    } finally {
      setSaving(false)
    }
  }

  async function updateAuthor(author: Author) {
    const name = window.prompt('Nuevo nombre del autor', author.name)

    if (!name) {
      return
    }

    const bio = window.prompt('Nueva biografía', author.bio || '')

    try {
      const response = await fetch(`/api/authors/${author.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          bio,
        }),
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'No se pudo actualizar el autor')
      }

      await loadAuthors()
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Error inesperado')
    }
  }

  async function deleteAuthor(author: Author) {
    const confirmed = window.confirm(
      `¿Eliminar a ${author.name}? También se eliminarán sus libros.`
    )

    if (!confirmed) {
      return
    }

    try {
      const response = await fetch(`/api/authors/${author.id}`, {
        method: 'DELETE',
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'No se pudo eliminar el autor')
      }

      await loadAuthors()
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Error inesperado')
    }
  }

  const totalBooks = authors.reduce((sum, author) => sum + author._count.books, 0)
  const nationalities = new Set(
    authors.map((author) => author.nationality).filter(Boolean)
  ).size

  return (
    <main className="min-h-screen bg-[#f4efe6] text-[#25170f]">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-5 py-8 sm:px-8 lg:px-10">
        <header className="overflow-hidden rounded-[2rem] bg-[#183d3d] p-8 text-white shadow-2xl shadow-[#183d3d]/20">
          <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
            <div>
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.35em] text-[#f2c078]">
                Sistema de biblioteca
              </p>
              <h1 className="max-w-3xl text-4xl font-black tracking-tight sm:text-6xl">
                Autores, libros y estadísticas en una sola vista.
              </h1>
            </div>
            <Link
              href="/books"
              className="rounded-full bg-[#f2c078] px-6 py-3 text-center font-bold text-[#25170f] transition hover:bg-white"
            >
              Buscar libros
            </Link>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <article className="rounded-3xl bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-[#8a5a36]">Autores</p>
            <strong className="mt-2 block text-4xl">{authors.length}</strong>
          </article>
          <article className="rounded-3xl bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-[#8a5a36]">Libros</p>
            <strong className="mt-2 block text-4xl">{totalBooks}</strong>
          </article>
          <article className="rounded-3xl bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-[#8a5a36]">Nacionalidades</p>
            <strong className="mt-2 block text-4xl">{nationalities}</strong>
          </article>
        </section>

        {error && (
          <p className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            {error}
          </p>
        )}

        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.4fr]">
          <form
            onSubmit={createAuthor}
            className="rounded-[2rem] bg-white p-6 shadow-sm"
          >
            <h2 className="text-2xl font-black">Crear autor</h2>
            <div className="mt-5 grid gap-3">
              <input className="rounded-2xl border px-4 py-3" name="name" placeholder="Nombre" required />
              <input className="rounded-2xl border px-4 py-3" name="email" placeholder="Email" type="email" required />
              <input className="rounded-2xl border px-4 py-3" name="nationality" placeholder="Nacionalidad" />
              <input className="rounded-2xl border px-4 py-3" name="birthYear" placeholder="Año de nacimiento" type="number" />
              <textarea className="min-h-28 rounded-2xl border px-4 py-3" name="bio" placeholder="Biografía" />
              <button
                disabled={saving}
                className="rounded-2xl bg-[#183d3d] px-5 py-3 font-bold text-white transition hover:bg-[#285f5f] disabled:opacity-60"
              >
                {saving ? 'Guardando...' : 'Crear autor'}
              </button>
            </div>
          </form>

          <section className="rounded-[2rem] bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between gap-3">
              <h2 className="text-2xl font-black">Autores registrados</h2>
              <button
                onClick={loadAuthors}
                className="rounded-full border px-4 py-2 text-sm font-bold"
              >
                Actualizar
              </button>
            </div>

            {loading ? (
              <p>Cargando autores...</p>
            ) : (
              <div className="grid gap-4">
                {authors.map((author) => (
                  <article key={author.id} className="rounded-3xl border p-5">
                    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                      <div>
                        <h3 className="text-xl font-black">{author.name}</h3>
                        <p className="text-sm text-[#6b5a4e]">{author.email}</p>
                        <p className="mt-2 text-sm">
                          {author.nationality || 'Sin nacionalidad'} ·{' '}
                          {author._count.books} libro(s)
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Link className="rounded-full bg-[#f2c078] px-4 py-2 text-sm font-bold" href={`/authors/${author.id}`}>
                          Ver detalle
                        </Link>
                        <button className="rounded-full border px-4 py-2 text-sm font-bold" onClick={() => updateAuthor(author)}>
                          Editar
                        </button>
                        <button className="rounded-full border border-red-200 px-4 py-2 text-sm font-bold text-red-700" onClick={() => deleteAuthor(author)}>
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </section>
      </section>
    </main>
  )
}
