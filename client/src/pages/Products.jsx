import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import DataTable from 'react-data-table-component'
import Layout from '../components/Layout'
import * as FaIcons from 'react-icons/fa'

export default function Products() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [search, setSearch] = useState('')
  const [limit, setLimit] = useState(10)
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 })
  const [formData, setFormData] = useState({
    name: '',
  })

  useEffect(() => {
    fetchProducts()
  }, [pagination.page, limit, search])

  const fetchProducts = async () => {
    try {
      const res = await axios.get('http://localhost:4000/api/products', {
        params: { page: pagination.page, limit, search },
        withCredentials: true
      })
      setProducts(res.data.products)
      setPagination(res.data.pagination)
    } catch (err) {
      toast.error('Failed to fetch products')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingProduct) {
        await axios.put(`http://localhost:4000/api/products/${editingProduct.id}`, formData, { withCredentials: true })
        toast.success('Product updated successfully')
      } else {
        await axios.post('http://localhost:4000/api/products', formData, { withCredentials: true })
        toast.success('Product created successfully')
      }
      setShowModal(false)
      setEditingProduct(null)
      resetForm()
      fetchProducts()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return
    try {
      await axios.delete(`http://localhost:4000/api/products/${id}`, { withCredentials: true })
      toast.success('Product deleted successfully')
      fetchProducts()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed')
    }
  }

  const handleEdit = (product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name || '',
    })
    setShowModal(true)
  }

  const resetForm = () => {
    setFormData({
      name: '',
    })
  }

  const columns = [

    {
      name: 'Name',
      selector: row => row.name,
      sortable: true,
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
    <Layout title="Products Management">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Products Management</h2>
          <button
            onClick={() => {
              setEditingProduct(null)
              resetForm()
              setShowModal(true)
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center gap-2 btn-xs"
          >
            <FaIcons.FaPlus /> Add Product
          </button>
        </div>

        <div className="flex gap-4 mb-4">
          <input
            type="text"
            placeholder="Search products..."
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
              data={products}
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
              {editingProduct ? 'Edit Product' : 'Add Product'}
            </h3>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">

                    <div>
                      <label className="block text-sm font-medium mb-1">Name</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                </div>

                {/* Tombol */}
                <div className="flex gap-2 mt-6">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    {editingProduct ? 'Update' : 'Create'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false)
                      setEditingProduct(null)
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
