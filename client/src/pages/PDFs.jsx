import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { useNavigate } from 'react-router-dom'
import * as FaIcons from 'react-icons/fa'

export default function PDFs() {
  const [pdfs, setPdfs] = useState([])
  const [loading, setLoading] = useState(true)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploadLoading, setUploadLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    file: null
  })
  const navigate = useNavigate()

  useEffect(() => {
    fetchPDFs()
  }, [])

  const fetchPDFs = async () => {
    try {
      const res = await axios.get('http://localhost:4000/api/pdf-files', { withCredentials: true })
      setPdfs(res.data.pdfs)
    } catch (err) {
      toast.error('Failed to fetch PDFs')
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file && file.type === 'application/pdf') {
      setFormData({ ...formData, file })
    } else {
      toast.error('Please select a valid PDF file')
      e.target.value = ''
    }
  }

  const handleUpload = async (e) => {
    e.preventDefault()
    if (!formData.title || !formData.file) {
      toast.error('Please provide both title and PDF file')
      return
    }

    setUploadLoading(true)
    try {
      const uploadData = new FormData()
      uploadData.append('title', formData.title)
      uploadData.append('pdf', formData.file)

      await axios.post('http://localhost:4000/api/pdf-files/upload', uploadData, {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      toast.success('PDF uploaded successfully')
      setShowUploadModal(false)
      setFormData({ title: '', file: null })
      fetchPDFs()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload PDF')
    } finally {
      setUploadLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this PDF?')) return

    try {
      await axios.delete(`http://localhost:4000/api/pdf-files/${id}`, { withCredentials: true })
      toast.success('PDF deleted successfully')
      fetchPDFs()
    } catch (err) {
      toast.error('Failed to delete PDF')
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const resetForm = () => {
    setFormData({ title: '', file: null })
  }

  return (
    <div className="">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">My PDF Library</h2>
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center gap-2"
          >
            <FaIcons.FaPlus /> Upload PDF
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <FaIcons.FaSpinner className="animate-spin text-2xl text-blue-500" />
          </div>
        ) : pdfs.length === 0 ? (
          <div className="text-center py-8">
            <FaIcons.FaFilePdf className="text-6xl text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 mb-4">No PDFs uploaded yet</p>
            <button
              onClick={() => setShowUploadModal(true)}
              className="px-6 py-3 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Upload Your First PDF
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pdfs.map((pdf) => (
              <div key={pdf.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <FaIcons.FaFilePdf className="text-2xl text-red-500" />
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate" title={pdf.title}>
                        {pdf.title}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {formatFileSize(pdf.file_size)}
                      </p>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
                  Uploaded {new Date(pdf.created_at).toLocaleDateString()}
                </p>

                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/pdfs/${pdf.id}/read`)}
                    className="flex-1 px-3 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 flex items-center justify-center gap-1"
                  >
                    <FaIcons.FaBookOpen /> Read
                  </button>
                  <button
                    onClick={() => handleDelete(pdf.id)}
                    className="px-3 py-2 bg-red-500 text-white text-sm rounded hover:bg-red-600"
                  >
                    <FaIcons.FaTrash />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Upload PDF</h3>

            <form onSubmit={handleUpload}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                  placeholder="Enter PDF title"
                  required
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">PDF File</label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                  required
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Maximum file size: 50MB
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={uploadLoading}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {uploadLoading ? (
                    <>
                      <FaIcons.FaSpinner className="animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <FaIcons.FaUpload />
                      Upload
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowUploadModal(false)
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
    </div>
  )
}
