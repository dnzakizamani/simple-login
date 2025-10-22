import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import DataTable from 'react-data-table-component'
import Layout from '../components/Layout'
import * as FaIcons from 'react-icons/fa'

export default function Menus() {
  const [menus, setMenus] = useState([])
  const [permissions, setPermissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingMenu, setEditingMenu] = useState(null)
  const [search, setSearch] = useState('')
  const [limit, setLimit] = useState(10)
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 })
  const [formData, setFormData] = useState({
    name: '',
    path: '',
    icon: '',
    parent_id: '',
    sort_order: 0,
    permissionIds: []
  })

  useEffect(() => {
    fetchMenus()
    fetchPermissions()
  }, [pagination.page, limit, search])

  const fetchMenus = async () => {
    try {
      const res = await axios.get('http://localhost:4000/api/menus', {
        params: { page: pagination.page, limit, search },
        withCredentials: true
      })
      setMenus(res.data.menus)
      setPagination(res.data.pagination)
    } catch (err) {
      toast.error('Failed to fetch menus')
    } finally {
      setLoading(false)
    }
  }

  const fetchPermissions = async () => {
    try {
      const res = await axios.get('http://localhost:4000/api/permissions', { withCredentials: true })
      setPermissions(res.data.permissions)
    } catch (err) {
      toast.error('Failed to fetch permissions')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingMenu) {
        await axios.put(`http://localhost:4000/api/menus/${editingMenu.id}`, formData, { withCredentials: true })
        toast.success('Menu updated successfully')
      } else {
        await axios.post('http://localhost:4000/api/menus', formData, { withCredentials: true })
        toast.success('Menu created successfully')
      }
      setShowModal(false)
      setEditingMenu(null)
      resetForm()
      fetchMenus()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this menu?')) return
    try {
      await axios.delete(`http://localhost:4000/api/menus/${id}`, { withCredentials: true })
      toast.success('Menu deleted successfully')
      fetchMenus()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed')
    }
  }

  const handleEdit = (menu) => {
    setEditingMenu(menu)
    setFormData({
      name: menu.name,
      path: menu.path || '',
      icon: menu.icon || '',
      parent_id: menu.parent_id || '',
      sort_order: menu.sort_order || 0,
      permissionIds: menu.permission_ids || []
    })
    setShowModal(true)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      path: '',
      icon: '',
      parent_id: '',
      sort_order: 0,
      permissionIds: []
    })
  }

  const columns = [
    {
      name: 'Name',
      selector: row => row.name,
      sortable: true,
    },
    {
      name: 'Path',
      selector: row => row.path || '-',
      sortable: true,
    },
    {
      name: 'Parent',
      selector: row => row.parent_name || '-',
      sortable: true,
    },
    {
      name: 'Sort Order',
      selector: row => row.sort_order,
      sortable: true,
    },
    {
      name: 'Permissions',
      cell: row => (
        <div className="flex flex-wrap gap-1">
          {row.permission_ids && row.permission_ids.length > 0 ? (
            <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
              {row.permission_ids.length} permission{row.permission_ids.length > 1 ? 's' : ''}
            </span>
          ) : (
            <span className="text-gray-500 text-xs">-</span>
          )}
        </div>
      ),
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
      allowOverflow: true,
      button: true,
      width: '150px',
      style: {
        position: 'sticky',
        right: 0,
        background: '#fff',
        boxShadow: '-2px 0 4px rgba(0, 0, 0, 0.1)',
        zIndex: 1,
        minWidth: '150px'
      }
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
    <Layout title="Menus">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Menus Management</h2>
          <button
            onClick={() => {
              setEditingMenu(null)
              resetForm()
              setShowModal(true)
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center gap-2"
          >
            <FaIcons.FaPlus /> Add Menu
          </button>
        </div>

        <div className="flex gap-4 mb-4">
          <input
            type="text"
            placeholder="Search menus..."
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
              data={menus}
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
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              {editingMenu ? 'Edit Menu' : 'Add Menu'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <div>
                    <label className="block text-sm font-medium mb-1">Path</label>
                    <input
                      type="text"
                      value={formData.path}
                      onChange={(e) => setFormData({ ...formData, path: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="/dashboard"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Icon</label>
                    <input
                      type="text"
                      value={formData.icon}
                      onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="FaHome"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Parent Menu</label>
                    <select
                      value={formData.parent_id}
                      onChange={(e) => setFormData({ ...formData, parent_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">No Parent (Top Level)</option>
                      {menus.filter(m => !m.parent_id).map(menu => (
                        <option key={menu.id} value={menu.id}>{menu.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Sort Order</label>
                    <input
                      type="number"
                      value={formData.sort_order}
                      onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Permissions</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto border border-gray-300 rounded p-3">
                    {permissions.map((perm) => (
                      <label key={perm.id} className="flex items-start text-sm">
                        <input
                          type="checkbox"
                          checked={formData.permissionIds.includes(perm.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({
                                ...formData,
                                permissionIds: [...formData.permissionIds, perm.id],
                              })
                            } else {
                              setFormData({
                                ...formData,
                                permissionIds: formData.permissionIds.filter(
                                  (id) => id !== perm.id
                                ),
                              })
                            }
                          }}
                          className="mt-1 mr-2"
                        />
                        <div>
                          <span>{perm.name}</span>
                          {perm.description && (
                            <div className="text-xs text-gray-500">
                              ({perm.description})
                            </div>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

              </div>
              <div className="flex gap-2 mt-6">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  {editingMenu ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setEditingMenu(null)
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
