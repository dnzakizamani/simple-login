import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import DataTable from 'react-data-table-component'
import Layout from '../components/Layout'
import * as FaIcons from 'react-icons/fa'

export default function Books() {
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingBook, setEditingBook] = useState(null)
  const [search, setSearch] = useState('')
  const [limit, setLimit] = useState(10)
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 })
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    isbn: '',
    published_year: '',
    image_url: '',
    description: '',
  })

  useEffect(() => {
    fetchBooks()
  }, [pagination.page, limit, search])

  const fetchBooks = async () => {
    try {
      const res = await axios.get('http://localhost:4000/api/books', {
        params: { page: pagination.page, limit, search },
        withCredentials: true
      })
      setBooks(res.data.books)
      setPagination(res.data.pagination)
    } catch (err) {
      toast.error('Failed to fetch books')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingBook) {
        await axios.put(`http://localhost:4000/api/books/${editingBook.id}`, formData, { withCredentials: true })
        toast.success('Book updated successfully')
      } else {
        await axios.post('http://localhost:4000/api/books', formData, { withCredentials: true })
        toast.success('Book created successfully')
      }
      setShowModal(false)
      setEditingBook(null)
      resetForm()
      fetchBooks()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this book?')) return
    try {
      await axios.delete(`http://localhost:4000/api/books/${id}`, { withCredentials: true })
      toast.success('Book deleted successfully')
      fetchBooks()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed')
    }
  }

  const handleEdit = (book) => {
    setEditingBook(book)
    setFormData({
      title: book.title || '',
      author: book.author || '',
      isbn: book.isbn || '',
      published_year: book.published_year || '',
      image_url: book.image_url || '',
      description: book.description || '',
    })
    setShowModal(true)
  }

  const resetForm = () => {
    setFormData({
      title: '',
      author: '',
      isbn: '',
      published_year: '',
      image_url: '',
      description: '',
    })
  }

  const columns = [
    {
      name: 'Image',
      cell: row => (
        <img
          src={row.image_url || '/placeholder-book.png'}
          alt={row.title}
          className="w-12 h-16 object-cover rounded cursor-pointer"
          onClick={() => navigate(`/books/${row.id}`)}
        />
      ),
      width: '80px',
    },
    {
      name: 'Title',
      cell: row => (
        <span
          className="text-blue-600 hover:text-blue-800 cursor-pointer"
          onClick={() => navigate(`/books/${row.id}`)}
        >
          {row.title}
        </span>
      ),
      sortable: true,
    },
    {
      name: 'Author',
      selector: row => row.author || 'N/A',
      sortable: true,
    },
    {
      name: 'Year',
      selector: row => row.published_year || 'N/A',
      sortable: true,
      width: '100px',
    },
    {
      name: 'Created',
      selector: row => new Date(row.created_at).toLocaleDateString(),
      sortable: true,
    },
    {
      name: 'Actions',
      cell: row => (
        <div className="flex gap-2">
          <button
            onClick={() => handleEdit(row)}
            className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
          >
            Edit
          </button>
          <button
            onClick={() => handleDelete(row.id)}
            className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
          >
            Delete
          </button>
        </div>
      ),
      ignoreRowClick: true,
      width: '150px'
    },
  ]

  const customStyles = {
    headCells: {
      style: {
        backgroundColor: '#f3f4f6',
        fontWeight: 'bold',
        fontSize: '14px',
        paddingLeft: '16px',
        paddingRight: '16px',
      },
    },
    cells: {
      style: {
        fontSize: '14px',
        paddingLeft: '16px',
        paddingRight: '16px',
      },
    },
  }

  return (
    <Layout title="Books Management">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Books Management</h2>
          <button
            onClick={() => {
              setEditingBook(null)
              resetForm()
              setShowModal(true)
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center gap-2 btn-xs"
          >
            <FaIcons.FaPlus /> Add Book
          </button>
        </div>

        <div className="flex gap-4 mb-4">
          <input
            type="text"
            placeholder="Search books..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={limit}
            onChange={(e) => setLimit(parseInt(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={5}>5 per page</option>
            <option value={10}>10 per page</option>
            <option value={25}>25 per page</option>
            <option value={50}>50 per page</option>
          </select>
        </div>

        <div className="relative">
          <div className="overflow-x-auto">
            <DataTable
              columns={columns}
              data={books}
              progressPending={loading}
              pagination
              paginationServer
              paginationTotalRows={pagination.total}
              paginationPerPage={limit}
              paginationRowsPerPageOptions={[5, 10, 25, 50]}
              onChangePage={(page) => setPagination(prev => ({ ...prev, page }))}
              onChangeRowsPerPage={(newLimit) => setLimit(newLimit)}
              customStyles={customStyles}
              highlightOnHover
              responsive
            />
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              {editingBook ? 'Edit Book' : 'Add Book'}
            </h3>
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Title</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Author</label>
                    <input
                      type="text"
                      value={formData.author}
                      onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">ISBN</label>
                    <input
                      type="text"
                      value={formData.isbn}
                      onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Published Year</label>
                    <input
                      type="number"
                      value={formData.published_year}
                      onChange={(e) => setFormData({ ...formData, published_year: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="1000"
                      max={new Date().getFullYear()}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Image URL</label>
                    <input
                      type="url"
                      value={formData.image_url}
                      onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="https://example.com/book-image.jpg"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows="4"
                      placeholder="Brief description of the book..."
                    />
                  </div>
                </div>

                {/* Tombol */}
                <div className="flex gap-2 mt-6">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    {editingBook ? 'Update' : 'Create'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false)
                      setEditingBook(null)
                      resetForm()
                    }}
                    className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </form>

          </div>
        </div>
      )}
    </Layout>
  )
}
