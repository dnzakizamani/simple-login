import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Document, Page, pdfjs } from 'react-pdf'
import axios from 'axios'
import { toast } from 'react-toastify'
import * as FaIcons from 'react-icons/fa'

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

export default function PDFReader() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [pdf, setPdf] = useState(null)
  const [loading, setLoading] = useState(true)
  const [numPages, setNumPages] = useState(null)
  const [pageNumber, setPageNumber] = useState(1)
  const [scale, setScale] = useState(1.0)
  const [selectedText, setSelectedText] = useState('')
  const [translation, setTranslation] = useState('')
  const [translating, setTranslating] = useState(false)
  const [showTranslation, setShowTranslation] = useState(false)
  const [translationPosition, setTranslationPosition] = useState({ x: 0, y: 0 })
  const [focusMode, setFocusMode] = useState(false)
  const pdfContainerRef = useRef(null)

  useEffect(() => {
    fetchPDF()
    loadReadingProgress()
  }, [id])

  useEffect(() => {
    if (pageNumber > 1) saveReadingProgress()
  }, [pageNumber])

  const fetchPDF = async () => {
    try {
      const res = await axios.get(`http://localhost:4000/api/pdf-files/${id}`, { withCredentials: true })
      setPdf(res.data.pdf)
    } catch {
      toast.error('Failed to load PDF')
      navigate('/pdfs')
    } finally {
      setLoading(false)
    }
  }

  const loadReadingProgress = async () => {
    try {
      const res = await axios.get(`http://localhost:4000/api/pdf-files/${id}/progress`, { withCredentials: true })
      if (res.data.progress) {
        setPageNumber(res.data.progress.current_page)
        setNumPages(res.data.progress.total_pages)
      }
    } catch {}
  }

  const saveReadingProgress = async () => {
    try {
      await axios.post(`http://localhost:4000/api/pdf-files/${id}/progress`, {
        current_page: pageNumber,
        total_pages: numPages
      }, { withCredentials: true })
    } catch {}
  }

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages)
    setLoading(false)
  }

  const onDocumentLoadError = (error) => {
    console.error('Error loading PDF:', error)
    toast.error('Failed to load PDF document')
  }

  const handleTextSelection = () => {
    const selection = window.getSelection()
    const text = selection.toString().trim()

    if (text) {
      setSelectedText(text)
      translateText(text)

      const range = selection.getRangeAt(0)
      const rect = range.getBoundingClientRect()
      setTranslationPosition({
        x: rect.left + rect.width / 2,
        y: rect.top - 10
      })
      setShowTranslation(true)
    } else {
      setShowTranslation(false)
    }
  }

  const translateText = async (text) => {
    if (!text || text.length < 2) return
    setTranslating(true)
    try {
      const response = await axios.post(`http://localhost:4000/api/pdf-files/${id}/translate`, {
        text, from: 'en', to: 'id'
      }, { withCredentials: true })
      setTranslation(response.data.translatedText)
    } catch {
      setTranslation('Translation failed')
    } finally {
      setTranslating(false)
    }
  }

  const changePage = (offset) => {
    setPageNumber(p => Math.min(Math.max(1, p + offset), numPages))
  }
  const changeScale = (newScale) => {
    setScale(Math.min(Math.max(0.5, newScale), 2.0))
  }

  const downloadPDF = async () => {
    try {
      const response = await axios.get(`http://localhost:4000/api/pdf-files/${id}/download`, {
        withCredentials: true, responseType: 'blob'
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', pdf.original_filename)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch {
      toast.error('Failed to download PDF')
    }
  }

  // ✅ Fokus Mode Keyboard Controls
  useEffect(() => {
    if (!focusMode) return
    const handleKey = (e) => {
      if (e.key === 'Escape') setFocusMode(false)
      if (e.key === 'ArrowRight' || e.key === 'd') changePage(1)
      if (e.key === 'ArrowLeft' || e.key === 'a') changePage(-1)
      if (e.key === '+' || e.key === '=') changeScale(scale + 0.1)
      if (e.key === '-') changeScale(scale - 0.1)
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [focusMode, scale])

  if (loading) return (

      <div className="flex justify-center items-center h-64">
        <FaIcons.FaSpinner className="animate-spin text-4xl text-blue-500" />
      </div>

  )

  if (!pdf) return (

      <p className="text-center p-6">PDF not found</p>

  )

  return (
    <div>
      {/* Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-4">
        <div className="flex flex-wrap items-center justify-between gap-4">

          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/pdfs')}
              className="px-4 py-2 bg-gray-600 text-white rounded flex items-center gap-2">
              <FaIcons.FaArrowLeft /> Back
            </button>

            <button
              onClick={() => setFocusMode(true)}
              className="px-4 py-2 bg-purple-600 text-white rounded flex items-center gap-2">
              <FaIcons.FaExpand /> Focus Mode
            </button>
          </div>

          <span className="text-sm text-gray-500">Page {pageNumber}/{numPages}</span>

          <div className="flex items-center gap-2">
            <button onClick={() => changePage(-1)} className="px-3 py-2 bg-blue-500 text-white rounded">
              <FaIcons.FaChevronLeft />
            </button>
            <button onClick={() => changePage(1)} className="px-3 py-2 bg-blue-500 text-white rounded">
              <FaIcons.FaChevronRight />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => changeScale(scale - 0.1)} className="px-2 py-1 bg-gray-600 text-white rounded">
              <FaIcons.FaMinus />
            </button>
            <span>{Math.round(scale * 100)}%</span>
            <button onClick={() => changeScale(scale + 0.1)} className="px-2 py-1 bg-gray-600 text-white rounded">
              <FaIcons.FaPlus />
            </button>
          </div>

          <button onClick={downloadPDF}
            className="px-4 py-2 bg-green-600 text-white rounded flex items-center gap-2">
            <FaIcons.FaDownload /> Download
          </button>
        </div>
      </div>

      {/* Normal Viewer */}
      <div className="bg-white dark:bg-gray-800 rounded shadow p-4">
        <div ref={pdfContainerRef} className="flex justify-center overflow-auto" onMouseUp={handleTextSelection}>
          <Document file={{ url: `http://localhost:4000/api/pdf-files/${id}/download`, withCredentials: true }}
            onLoadSuccess={onDocumentLoadSuccess}>
            <Page pageNumber={pageNumber} scale={scale} renderTextLayer />
          </Document>
        </div>
      </div>

      {/* Focus Mode Fullscreen */}
      {focusMode && (
        <div className="fixed inset-0 z-[9999] bg-black flex justify-center items-center overflow-auto"
          onMouseUp={handleTextSelection}>

          <button onClick={() => setFocusMode(false)}
            className="absolute top-4 right-4 px-4 py-2 bg-red-600 text-white rounded flex items-center gap-2">
            <FaIcons.FaCompress /> Exit
          </button>

          <Document file={{ url: `http://localhost:4000/api/pdf-files/${id}/download`, withCredentials: true }}>
            <Page pageNumber={pageNumber} scale={scale} renderTextLayer />
          </Document>

          <div className="absolute bottom-4 text-white opacity-70 text-sm">
            Page {pageNumber}/{numPages}
          </div>
        </div>
      )}

      {/* Translation Tooltip */}
      {showTranslation && (
        <div className="fixed z-[99999] bg-black text-white px-3 py-2 rounded text-sm shadow"
          style={{ left: translationPosition.x, top: translationPosition.y, transform: 'translate(-50%, -100%)' }}>
          {translating ? "Translating..." : translation}
        </div>
      )}
    </div>
  )
}
