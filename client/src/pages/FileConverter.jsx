import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import * as FaIcons from 'react-icons/fa'

export default function FileConverter() {
  const [supportedConversions, setSupportedConversions] = useState({})
  const [selectedFile, setSelectedFile] = useState(null)
  const [targetFormat, setTargetFormat] = useState('')
  const [conversions, setConversions] = useState([])
  const [loading, setLoading] = useState(false)
  const [dragActive, setDragActive] = useState(false)

  useEffect(() => {
    fetchSupportedConversions()
    fetchConversionHistory()
  }, [])

  const fetchSupportedConversions = async () => {
    try {
      const res = await axios.get('http://localhost:4000/api/file-conversions/supported', { withCredentials: true })
      setSupportedConversions(res.data.conversions)
    } catch (error) {
      console.error('Failed to fetch supported conversions')
    }
  }

  const fetchConversionHistory = async () => {
    try {
      const res = await axios.get('http://localhost:4000/api/file-conversions/history', { withCredentials: true })
      setConversions(res.data.conversions)
    } catch (error) {
      console.error('Failed to fetch conversion history')
    }
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0])
    }
  }

  const handleFileSelect = (file) => {
    if (file.size > 20 * 1024 * 1024) { // 20MB limit
      toast.error('File size must be less than 20MB')
      return
    }
    setSelectedFile(file)
    setTargetFormat('')
  }

  const handleConvert = async () => {
    if (!selectedFile || !targetFormat) {
      toast.error('Please select a file and target format')
      return
    }

    setLoading(true)
    const formData = new FormData()
    formData.append('file', selectedFile)
    formData.append('targetFormat', targetFormat)

    try {
      const res = await axios.post('http://localhost:4000/api/file-conversions/convert', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        withCredentials: true
      })

      toast.success('File uploaded successfully. Conversion in progress...')
      setSelectedFile(null)
      setTargetFormat('')

      // Poll for status updates
      pollConversionStatus(res.data.conversionId)

    } catch (error) {
      toast.error(error.response?.data?.error || 'Conversion failed')
    } finally {
      setLoading(false)
    }
  }

  const pollConversionStatus = (conversionId) => {
    const poll = async () => {
      try {
        const res = await axios.get(`http://localhost:4000/api/file-conversions/status/${conversionId}`, { withCredentials: true })
        const conversion = res.data

        if (conversion.status === 'completed') {
          toast.success('File converted successfully!')
          fetchConversionHistory()
        } else if (conversion.status === 'failed') {
          toast.error(`Conversion failed: ${conversion.error_message}`)
          fetchConversionHistory()
        } else {
          // Still processing, continue polling
          setTimeout(poll, 2000)
        }
      } catch (error) {
        console.error('Status check failed')
      }
    }
    poll()
  }

  const downloadFile = async (conversionId, filename) => {
    try {
      const response = await axios.get(`http://localhost:4000/api/file-conversions/download/${conversionId}`, {
        responseType: 'blob',
        withCredentials: true
      })

      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', filename)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      toast.error('Download failed')
    }
  }

  const deleteConversion = async (conversionId) => {
    if (!window.confirm('Are you sure you want to delete this conversion?')) {
      return
    }

    try {
      await axios.delete(`http://localhost:4000/api/file-conversions/${conversionId}`, { withCredentials: true })
      toast.success('Conversion deleted successfully')
      fetchConversionHistory()
    } catch (error) {
      toast.error('Failed to delete conversion')
    }
  }

  const getFileExtension = (filename) => {
    return filename.split('.').pop().toLowerCase()
  }

  const getAvailableFormats = () => {
    if (!selectedFile) return []

    const ext = getFileExtension(selectedFile.name)
    const allFormats = [
      ...(supportedConversions.image?.[ext] || []),
      ...(supportedConversions.document?.[ext] || [])
    ]

    return [...new Set(allFormats)].filter(format => format !== ext) // Exclude same format
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-green-600'
      case 'failed': return 'text-red-600'
      case 'processing': return 'text-blue-600'
      default: return 'text-gray-600'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <FaIcons.FaCheckCircle className="text-green-500" />
      case 'failed': return <FaIcons.FaTimesCircle className="text-red-500" />
      case 'processing': return <FaIcons.FaSpinner className="text-blue-500 animate-spin" />
      default: return <FaIcons.FaClock className="text-gray-500" />
    }
  }

  return (
    <div className="">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">File Converter</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Convert your files between different formats. Supports images and documents up to 20MB.
          </p>
        </div>

        {/* Upload Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Upload & Convert</h2>

          {/* Drag & Drop Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-300 dark:border-gray-600'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              onChange={(e) => e.target.files[0] && handleFileSelect(e.target.files[0])}
              className="hidden"
              id="file-upload"
              accept=".jpg,.jpeg,.png,.gif,.bmp,.webp,.tiff,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
            />

            {selectedFile ? (
              <div className="space-y-4">
                <FaIcons.FaFile className="text-4xl text-blue-500 mx-auto" />
                <div>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {selectedFile.name}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>

                {/* Format Selection */}
                <div className="max-w-xs mx-auto">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Convert to:
                  </label>
                  <select
                    value={targetFormat}
                    onChange={(e) => setTargetFormat(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                  >
                    <option value="">Select format</option>
                    {getAvailableFormats().map(format => (
                      <option key={format} value={format}>
                        {format.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-4 justify-center">
                  <button
                    onClick={handleConvert}
                    disabled={loading || !targetFormat}
                    className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {loading ? <FaIcons.FaSpinner className="animate-spin" /> : <FaIcons.FaMagic />}
                    Convert
                  </button>
                  <button
                    onClick={() => setSelectedFile(null)}
                    className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <FaIcons.FaCloudUploadAlt className="text-4xl text-gray-400 mx-auto mb-4" />
                <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
                  Drag & drop your file here, or{' '}
                  <label htmlFor="file-upload" className="text-blue-500 hover:text-blue-600 cursor-pointer">
                    browse
                  </label>
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  Supports: JPG, PNG, GIF, BMP, WebP, TIFF, PDF, DOC, DOCX, XLS, XLSX, TXT, CSV (max 20MB)
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Conversion History */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Conversion History</h2>

          {conversions.length === 0 ? (
            <div className="text-center py-12">
              <FaIcons.FaHistory className="text-6xl text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">No conversions yet</h3>
              <p className="text-gray-500 dark:text-gray-500">
                Your file conversion history will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {conversions.map(conversion => (
                <div
                  key={conversion.id}
                  className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    {getStatusIcon(conversion.status)}
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {conversion.original_filename}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {conversion.original_format.toUpperCase()} → {conversion.target_format.toUpperCase()}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        {new Date(conversion.created_at).toLocaleString()}
                      </p>
                      {conversion.error_message && (
                        <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                          Error: {conversion.error_message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {conversion.status === 'completed' && conversion.converted_filename && (
                      <button
                        onClick={() => downloadFile(conversion.id, conversion.converted_filename)}
                        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center gap-2"
                      >
                        <FaIcons.FaDownload />
                        Download
                      </button>
                    )}

                    <button
                      onClick={() => deleteConversion(conversion.id)}
                      className="px-4 py-2 border border-red-300 dark:border-red-600 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                    >
                      <FaIcons.FaTrash />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      </div>
  )
}
