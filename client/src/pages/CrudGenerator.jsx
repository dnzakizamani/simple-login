import React, { useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import Layout from '../components/Layout'
import * as FaIcons from 'react-icons/fa'

export default function CrudGenerator() {
  const [moduleName, setModuleName] = useState('')
  const [routePath, setRoutePath] = useState('')
  const [fields, setFields] = useState([
    { name: '', type: 'text', required: false, options: [] }
  ])
  const [loading, setLoading] = useState(false)

  const fieldTypes = [
    { value: 'text', label: 'Text' },
    { value: 'textarea', label: 'Textarea' },
    { value: 'number', label: 'Number' },
    { value: 'email', label: 'Email' },
    { value: 'date', label: 'Date' },
    { value: 'datetime', label: 'DateTime' },
    { value: 'select', label: 'Select' }
  ]

  const addField = () => {
    setFields([...fields, { name: '', type: 'text', required: false, options: [] }])
  }

  const removeField = (index) => {
    if (fields.length > 1) {
      setFields(fields.filter((_, i) => i !== index))
    }
  }

  const updateField = (index, key, value) => {
    const updatedFields = fields.map((field, i) =>
      i === index ? { ...field, [key]: value } : field
    )
    setFields(updatedFields)
  }

  const addOption = (fieldIndex) => {
    const updatedFields = fields.map((field, i) =>
      i === fieldIndex
        ? { ...field, options: [...field.options, ''] }
        : field
    )
    setFields(updatedFields)
  }

  const updateOption = (fieldIndex, optionIndex, value) => {
    const updatedFields = fields.map((field, i) =>
      i === fieldIndex
        ? {
            ...field,
            options: field.options.map((opt, j) => j === optionIndex ? value : opt)
          }
        : field
    )
    setFields(updatedFields)
  }

  const removeOption = (fieldIndex, optionIndex) => {
    const updatedFields = fields.map((field, i) =>
      i === fieldIndex
        ? { ...field, options: field.options.filter((_, j) => j !== optionIndex) }
        : field
    )
    setFields(updatedFields)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await axios.post('http://localhost:4000/api/crud-generator', {
        moduleName,
        routePath,
        fields
      }, { withCredentials: true })

      toast.success('CRUD module generated successfully!')
      console.log('Generated files:', response.data.files)

      // Reset form
      setModuleName('')
      setRoutePath('')
      setFields([{ name: '', type: 'text', required: false, options: [] }])

    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate CRUD module')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout title="CRUD Generator">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">CRUD Module Generator</h2>
          <p className="text-gray-600">
            Generate complete CRUD functionality with backend routes, database table, and frontend page.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Module Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Module Name</label>
              <input
                type="text"
                value={moduleName}
                onChange={(e) => setModuleName(e.target.value)}
                placeholder="e.g., products"
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Use snake_case format (lowercase letters, numbers, underscores)</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Route Path</label>
              <input
                type="text"
                value={routePath}
                onChange={(e) => setRoutePath(e.target.value)}
                placeholder="e.g., /products"
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Must start with /</p>
            </div>
          </div>

          {/* Fields Configuration */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Fields</h3>
              <button
                type="button"
                onClick={addField}
                className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 flex items-center gap-1"
              >
                <FaIcons.FaPlus /> Add Field
              </button>
            </div>

            <div className="space-y-4">
              {fields.map((field, index) => (
                <div key={index} className="border border-gray-200 rounded p-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Field Name</label>
                      <input
                        type="text"
                        value={field.name}
                        onChange={(e) => updateField(index, 'name', e.target.value)}
                        placeholder="e.g., name"
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Type</label>
                      <select
                        value={field.type}
                        onChange={(e) => updateField(index, 'type', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {fieldTypes.map(type => (
                          <option key={type.value} value={type.value}>{type.label}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={field.required}
                          onChange={(e) => updateField(index, 'required', e.target.checked)}
                          className="mr-2"
                        />
                        Required
                      </label>
                    </div>

                    <div className="flex items-center">
                      {fields.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeField(index)}
                          className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Options for select fields */}
                  {field.type === 'select' && (
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-medium">Options</label>
                        <button
                          type="button"
                          onClick={() => addOption(index)}
                          className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                        >
                          Add Option
                        </button>
                      </div>
                      <div className="space-y-2">
                        {field.options.map((option, optionIndex) => (
                          <div key={optionIndex} className="flex gap-2">
                            <input
                              type="text"
                              value={option}
                              onChange={(e) => updateOption(index, optionIndex, e.target.value)}
                              placeholder="Option value"
                              className="flex-1 px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                              type="button"
                              onClick={() => removeOption(index, optionIndex)}
                              className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <FaIcons.FaSpinner className="animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FaIcons.FaMagic />
                  Generate CRUD Module
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  )
}
