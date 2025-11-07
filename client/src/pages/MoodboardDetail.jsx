import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { useParams, useNavigate } from 'react-router-dom'
import * as FaIcons from 'react-icons/fa'

export default function MoodboardDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [images, setImages] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [draggedImage, setDraggedImage] = useState(null)
  const [selectedImage, setSelectedImage] = useState(null)
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 })
  const fileInputRef = useRef(null)
  const canvasRef = useRef(null)

  useEffect(() => {
    fetchProject()
    fetchImages()

    // Update canvas size on resize
    const updateCanvasSize = () => {
      if (canvasRef.current) {
        const newSize = {
          width: canvasRef.current.clientWidth,
          height: canvasRef.current.clientHeight
        }
        setCanvasSize(newSize)

        // Adjust existing images to fit within new canvas bounds
        if (newSize.width > 0 && newSize.height > 0) {
          setImages(prevImages =>
            prevImages.map(img => ({
              ...img,
              position_x: Math.max(0, Math.min(img.position_x, newSize.width - Math.min(img.width, 200))),
              position_y: Math.max(0, Math.min(img.position_y, newSize.height - Math.min(img.height, 200)))
            }))
          )
        }
      }
    }

    // Delay to ensure DOM is ready
    const timer = setTimeout(updateCanvasSize, 100)
    window.addEventListener('resize', updateCanvasSize)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', updateCanvasSize)
    }
  }, [id])

  const fetchProject = async () => {
    try {
      const res = await axios.get(`http://localhost:4000/api/moodboards/${id}`, { withCredentials: true })
      setProject(res.data.project)
    } catch (err) {
      if (err.response?.status === 404) {
        toast.error('Project not found')
        navigate('/moodboards')
      } else {
        toast.error('Failed to fetch project')
      }
    }
  }

  const fetchImages = async () => {
    try {
      const res = await axios.get(`http://localhost:4000/api/moodboards/${id}/images`, { withCredentials: true })
      const fetchedImages = res.data.images

      // Adjust images to fit current canvas size (only if canvas size is available)
      const adjustedImages = fetchedImages.map(img => {
        if (canvasSize.width > 0 && canvasSize.height > 0) {
          return {
            ...img,
            position_x: Math.max(0, Math.min(img.position_x, canvasSize.width - Math.min(img.width, 200))),
            position_y: Math.max(0, Math.min(img.position_y, canvasSize.height - Math.min(img.height, 200)))
          }
        }
        return img
      })

      setImages(adjustedImages)
    } catch (err) {
      toast.error('Failed to fetch images')
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (files) => {
    if (files.length === 0) return

    setUploading(true)
    try {
      const formData = new FormData()
      Array.from(files).forEach(file => {
        if (file.type.startsWith('image/')) {
          formData.append('images', file)
        }
      })

      await axios.post(`http://localhost:4000/api/moodboards/${id}/images`, formData, {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      toast.success(`${files.length} image(s) uploaded successfully`)
      // Refresh canvas size and images
      setTimeout(() => {
        if (canvasRef.current) {
          setCanvasSize({
            width: canvasRef.current.clientWidth,
            height: canvasRef.current.clientHeight
          })
        }
        fetchImages()
      }, 100)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload images')
    } finally {
      setUploading(false)
    }
  }

  const handleDragStart = (e, image) => {
    setDraggedImage(image)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = async (e) => {
    e.preventDefault()
    if (!draggedImage) return

    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left - draggedImage.width / 2
    const y = e.clientY - rect.top - draggedImage.height / 2

    // Ensure position is within canvas bounds
    const displayWidth = Math.min(draggedImage.width, 200)
    const displayHeight = Math.min(draggedImage.height, 200)
    const newPosition = {
      position_x: canvasSize.width > 0 ? Math.max(0, Math.min(x, canvasSize.width - displayWidth)) : x,
      position_y: canvasSize.height > 0 ? Math.max(0, Math.min(y, canvasSize.height - displayHeight)) : y
    }

    try {
      await axios.put(`http://localhost:4000/api/moodboards/${id}/images/${draggedImage.id}`, {
        position_x: newPosition.position_x,
        position_y: newPosition.position_y,
        width: draggedImage.width,
        height: draggedImage.height,
        rotation: draggedImage.rotation,
        z_index: draggedImage.z_index
      }, {
        withCredentials: true
      })

      setImages(images.map(img =>
        img.id === draggedImage.id
          ? { ...img, ...newPosition }
          : img
      ))
    } catch (err) {
      toast.error('Failed to update image position')
    }

    setDraggedImage(null)
  }

  const handleImageClick = (image) => {
    setSelectedImage(image)
  }

  const handleDeleteImage = async (imageId) => {
    if (!window.confirm('Are you sure you want to delete this image?')) return

    try {
      await axios.delete(`http://localhost:4000/api/moodboards/${id}/images/${imageId}`, { withCredentials: true })
      toast.success('Image deleted successfully')
      setImages(images.filter(img => img.id !== imageId))
      if (selectedImage?.id === imageId) {
        setSelectedImage(null)
      }
    } catch (err) {
      toast.error('Failed to delete image')
    }
  }

  const handleImageResize = async (imageId, newWidth, newHeight) => {
    try {
      await axios.put(`http://localhost:4000/api/moodboards/${id}/images/${imageId}`, {
        width: newWidth,
        height: newHeight
      }, { withCredentials: true })

      setImages(images.map(img =>
        img.id === imageId
          ? { ...img, width: newWidth, height: newHeight }
          : img
      ))
    } catch (err) {
      toast.error('Failed to update image size')
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="text-center mt-10">
          <FaIcons.FaSpinner className="animate-spin text-2xl text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading moodboard...</p>
        </div>
      </Layout>
    )
  }

  if (!project) {
    return (
      <div className="text-center mt-10">
        <p className="text-gray-600 dark:text-gray-400">Project not found</p>
      </div>
    )
  }

  return (
    <div>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <button
              onClick={() => navigate('/moodboards')}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
            >
              <FaIcons.FaArrowLeft />
              Back to Projects
            </button>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{project.name}</h1>
            {project.description && (
              <p className="text-gray-600 dark:text-gray-400 mt-2">{project.description}</p>
            )}
          </div>
          <div className="flex gap-4">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => handleFileUpload(e.target.files)}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {uploading ? (
                <>
                  <FaIcons.FaSpinner className="animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <FaIcons.FaUpload />
                  Add Images
                </>
              )}
            </button>
          </div>
        </div>

        {/* Moodboard Canvas */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
          <div
            ref={canvasRef}
            className="relative w-full h-96 md:h-[600px] bg-gray-50 dark:bg-gray-700 rounded-lg overflow-hidden border-2 border-dashed border-gray-300 dark:border-gray-600"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            style={{
              backgroundImage: 'radial-gradient(circle, #e5e7eb 1px, transparent 1px)',
              backgroundSize: '20px 20px',
              minHeight: '400px'
            }}
          >
            {images.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center text-gray-500 dark:text-gray-400">
                <div className="text-center">
                  <FaIcons.FaImages className="text-4xl mx-auto mb-4 opacity-50" />
                  <p className="text-lg">Drop images here or click "Add Images" to get started</p>
                </div>
              </div>
            ) : (
              images.map((image) => (
                <div
                  key={image.id}
                  className="absolute cursor-move select-none group"
                  style={{
                    left: `${canvasSize.width > 0 ? Math.max(0, Math.min(image.position_x, canvasSize.width - Math.min(image.width, 200))) : image.position_x}px`,
                    top: `${canvasSize.height > 0 ? Math.max(0, Math.min(image.position_y, canvasSize.height - Math.min(image.height, 200))) : image.position_y}px`,
                    width: `${Math.min(image.width, 200)}px`,
                    height: `${Math.min(image.height, 200)}px`,
                    transform: `rotate(${image.rotation}deg)`,
                    zIndex: image.z_index
                  }}
                  draggable
                  onDragStart={(e) => handleDragStart(e, image)}
                  onClick={() => handleImageClick(image)}
                >
                  <img
                    src={`http://localhost:4000/uploads/${image.filename}`}
                    alt={image.original_filename}
                    className="w-full h-full object-cover rounded shadow-md hover:shadow-lg transition-shadow"
                    style={{
                      maxWidth: '200px',
                      maxHeight: '200px',
                      width: 'auto',
                      height: 'auto'
                    }}
                    draggable={false}
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteImage(image.id)
                    }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  >
                    <FaIcons.FaTimes className="text-xs" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Image Gallery */}
        {images.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Images ({images.length})</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {images.map((image) => (
                <div
                  key={image.id}
                  className="relative group cursor-pointer"
                  onClick={() => handleImageClick(image)}
                >
                  <img
                    src={`http://localhost:4000/uploads/${image.filename}`}
                    alt={image.original_filename}
                    className="w-full h-24 object-cover rounded hover:opacity-80 transition-opacity"
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteImage(image.id)
                    }}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  >
                    <FaIcons.FaTrash className="text-xs" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Image Modal */}
        {selectedImage && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={() => setSelectedImage(null)}>
            <div className="relative max-w-4xl max-h-screen p-4">
              <img
                src={`http://localhost:4000/uploads/${selectedImage.filename}`}
                alt={selectedImage.original_filename}
                className="max-w-full max-h-full object-contain rounded"
                onClick={(e) => e.stopPropagation()}
              />
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute top-4 right-4 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-75 transition-colors"
              >
                <FaIcons.FaTimes className="text-xl" />
              </button>
              <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded">
                {selectedImage.original_filename}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
