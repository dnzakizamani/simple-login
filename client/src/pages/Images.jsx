import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import * as FaIcons from 'react-icons/fa'

export default function Images() {
  const [images, setImages] = useState([])
  const [loading, setLoading] = useState(true)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showWatermarkModal, setShowWatermarkModal] = useState(false)
  const [selectedImage, setSelectedImage] = useState(null)
  const [uploadLoading, setUploadLoading] = useState(false)
  const [watermarkLoading, setWatermarkLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    file: null
  })
  const [watermarkData, setWatermarkData] = useState({
    watermark_text: '',
    opacity: 0.5,
    color: '#ffffff',
    font_size: 24,
    spacing: 100,
    tilt: 0.0
  })

  useEffect(() => {
    fetchImages()
  }, [])

  const fetchImages = async () => {
    try {
      const res = await axios.get('http://localhost:4000/api/image-files', { withCredentials: true })
      setImages(res.data.images)
    } catch (err) {
      toast.error('Failed to fetch images')
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file && file.type.startsWith('image/')) {
      setFormData({ ...formData, file })
    } else {
      toast.error('Please select a valid image file')
      e.target.value = ''
    }
  }

  const handleUpload = async (e) => {
    e.preventDefault()
    if (!formData.title || !formData.file) {
      toast.error('Please provide both title and image file')
      return
    }

    setUploadLoading(true)
    try {
      const uploadData = new FormData()
      uploadData.append('title', formData.title)
      uploadData.append('image', formData.file)

      await axios.post('http://localhost:4000/api/image-files/upload', uploadData, {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      toast.success('Image uploaded successfully')
      setShowUploadModal(false)
      setFormData({ title: '', file: null })
      fetchImages()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload image')
    } finally {
      setUploadLoading(false)
    }
  }

  const handleWatermark = async (e) => {
    e.preventDefault()
    if (!watermarkData.watermark_text.trim()) {
      toast.error('Please provide watermark text')
      return
    }

    setWatermarkLoading(true)
    try {
      await axios.post(`http://localhost:4000/api/image-files/${selectedImage.id}/watermark`, watermarkData, {
        withCredentials: true
      })

      toast.success('Watermark applied successfully')
      setShowWatermarkModal(false)
      setSelectedImage(null)
      setWatermarkData({
        watermark_text: '',
        opacity: 0.5,
        color: '#ffffff',
        font_size: 24,
        spacing: 100,
        tilt: 0.0
      })
      fetchImages()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to apply watermark')
    } finally {
      setWatermarkLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this image?')) return

    try {
      await axios.delete(`http://localhost:4000/api/image-files/${id}`, { withCredentials: true })
      toast.success('Image deleted successfully')
      fetchImages()
    } catch (err) {
      toast.error('Failed to delete image')
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

  const resetWatermarkForm = () => {
    setWatermarkData({
      watermark_text: '',
      opacity: 0.5,
      color: '#ffffff',
      font_size: 24,
      spacing: 100,
      tilt: 0.0
    })
  }

  return (
    <div className="">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">My Image Library</h2>
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center gap-2"
          >
            <FaIcons.FaPlus /> Upload Image
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <FaIcons.FaSpinner className="animate-spin text-2xl text-blue-500" />
          </div>
        ) : images.length === 0 ? (
          <div className="text-center py-8">
            <FaIcons.FaImages className="text-6xl text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 mb-4">No images uploaded yet</p>
            <button
              onClick={() => setShowUploadModal(true)}
              className="px-6 py-3 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Upload Your First Image
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {images.map((image) => (
              <div key={image.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <FaIcons.FaImage className="text-2xl text-blue-500" />
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate" title={image.title}>
                        {image.title}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {formatFileSize(image.file_size)}
                      </p>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
                  Uploaded {new Date(image.created_at).toLocaleDateString()}
                </p>

                {image.watermark_text && (
                  <div className="mb-4 p-2 bg-gray-50 dark:bg-gray-700 rounded text-sm">
                    <p className="text-gray-600 dark:text-gray-300">
                      <strong>Watermark:</strong> {image.watermark_text}
                    </p>
                    <p className="text-gray-500 dark:text-gray-400 text-xs">
                      Opacity: {image.watermark_opacity}, Color: {image.watermark_color}, Size: {image.watermark_font_size}px
                    </p>
                  </div>
                )}

                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => {
                      setSelectedImage(image)
                      setWatermarkData({
                        watermark_text: image.watermark_text || '',
                        opacity: image.watermark_opacity || 0.5,
                        color: image.watermark_color || '#ffffff',
                        font_size: image.watermark_font_size || 24,
                        spacing: image.watermark_spacing || 100,
                        tilt: image.watermark_tilt || 0.0
                      })
                      setShowWatermarkModal(true)
                    }}
                    className="flex-1 px-3 py-2 bg-green-500 text-white text-sm rounded hover:bg-green-600 flex items-center justify-center gap-1"
                  >
                    <FaIcons.FaWater /> Watermark
                  </button>
                  <button
                    onClick={() => window.open(`http://localhost:4000/api/image-files/${image.id}/download`, '_blank')}
                    className="px-3 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                  >
                    <FaIcons.FaDownload />
                  </button>
                  {image.watermark_text && (
                    <button
                      onClick={() => window.open(`http://localhost:4000/api/image-files/${image.id}/download/watermarked`, '_blank')}
                      className="px-3 py-2 bg-purple-500 text-white text-sm rounded hover:bg-purple-600"
                      title="Download watermarked version"
                    >
                      <FaIcons.FaFileImage />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(image.id)}
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
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Upload Image</h3>

            <form onSubmit={handleUpload}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                  placeholder="Enter image title"
                  required
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Image File</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                  required
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Maximum file size: 10MB
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

      {/* Watermark Modal */}
      {showWatermarkModal && selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Apply Watermark</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Applying watermark to: <strong>{selectedImage.title}</strong>
            </p>

            <form onSubmit={handleWatermark}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Watermark Text</label>
                <input
                  type="text"
                  value={watermarkData.watermark_text}
                  onChange={(e) => setWatermarkData({ ...watermarkData, watermark_text: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                  placeholder="Enter watermark text"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Opacity: {watermarkData.opacity}</label>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.1"
                  value={watermarkData.opacity}
                  onChange={(e) => setWatermarkData({ ...watermarkData, opacity: parseFloat(e.target.value) })}
                  className="w-full"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Color</label>
                <input
                  type="color"
                  value={watermarkData.color}
                  onChange={(e) => setWatermarkData({ ...watermarkData, color: e.target.value })}
                  className="w-full h-10 border border-gray-300 dark:border-gray-600 rounded"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Font Size: {watermarkData.font_size}px</label>
                <input
                  type="range"
                  min="12"
                  max="72"
                  step="2"
                  value={watermarkData.font_size}
                  onChange={(e) => setWatermarkData({ ...watermarkData, font_size: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Spacing: {watermarkData.spacing}px</label>
                <input
                  type="range"
                  min="50"
                  max="200"
                  step="10"
                  value={watermarkData.spacing}
                  onChange={(e) => setWatermarkData({ ...watermarkData, spacing: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Tilt: {watermarkData.tilt}°</label>
                <input
                  type="range"
                  min="-45"
                  max="45"
                  step="5"
                  value={watermarkData.tilt}
                  onChange={(e) => setWatermarkData({ ...watermarkData, tilt: parseFloat(e.target.value) })}
                  className="w-full"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={watermarkLoading}
                  className="flex-1 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {watermarkLoading ? (
                    <>
                      <FaIcons.FaSpinner className="animate-spin" />
                      Applying...
                    </>
                  ) : (
                    <>
                      <FaIcons.FaWater />
                      Apply Watermark
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowWatermarkModal(false)
                    setSelectedImage(null)
                    resetWatermarkForm()
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
