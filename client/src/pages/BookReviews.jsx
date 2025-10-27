import { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '../components/Layout';
import { FaStar, FaBook, FaUser, FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import { toast } from 'react-toastify';

export default function BookReviews() {
  const [reviews, setReviews] = useState([]);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [formData, setFormData] = useState({
    book_id: '',
    rating: 5,
    review_text: ''
  });

  useEffect(() => {
    fetchReviews();
    fetchBooks();
  }, []);

  const fetchReviews = async () => {
    try {
      const response = await axios.get('http://localhost:4000/api/book-reviews', { withCredentials: true });
      setReviews(response.data.reviews || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast.error('Failed to load reviews');
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchBooks = async () => {
    try {
      const response = await axios.get('http://localhost:4000/api/books', { withCredentials: true });
      setBooks(response.data.books || []);
    } catch (error) {
      console.error('Error fetching books:', error);
      setBooks([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingReview) {
        await axios.put(`http://localhost:4000/api/book-reviews/${editingReview.id}`, formData, { withCredentials: true });
        toast.success('Review updated successfully');
      } else {
        await axios.post('http://localhost:4000/api/book-reviews', formData, { withCredentials: true });
        toast.success('Review added successfully');
      }
      fetchReviews();
      setShowForm(false);
      setEditingReview(null);
      setFormData({ book_id: '', rating: 5, review_text: '' });
    } catch (error) {
      console.error('Error saving review:', error);
      toast.error(error.response?.data?.message || 'Failed to save review');
    }
  };

  const handleEdit = (review) => {
    setEditingReview(review);
    setFormData({
      book_id: review.book_id,
      rating: review.rating,
      review_text: review.review_text
    });
    setShowForm(true);
  };

  const handleDelete = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;

    try {
      await axios.delete(`http://localhost:4000/api/book-reviews/${reviewId}`, { withCredentials: true });
      toast.success('Review deleted successfully');
      fetchReviews();
    } catch (error) {
      console.error('Error deleting review:', error);
      toast.error('Failed to delete review');
    }
  };

  const renderStars = (rating) => {
    return [...Array(5)].map((_, i) => (
      <FaStar
        key={i}
        className={`text-sm ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`}
      />
    ));
  };

  const isLoggedIn = !!localStorage.getItem('token');
  const currentUsername = localStorage.getItem('username');

  if (loading) {
    return (
      <Layout title="Book Reviews">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Book Reviews">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-light text-gray-900 dark:text-white mb-2">Book Reviews</h1>
            <p className="text-gray-600 dark:text-gray-400">Share your thoughts on the books you've read</p>
          </div>
          {isLoggedIn && (
            <button
              onClick={() => {
                setShowForm(!showForm);
                setEditingReview(null);
                setFormData({ book_id: '', rating: 5, review_text: '' });
              }}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FaPlus className="mr-2" />
              Write Review
            </button>
          )}
        </div>

        {/* Review Form */}
        {showForm && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-medium mb-4 text-gray-900 dark:text-white">
              {editingReview ? 'Edit Review' : 'Write a Review'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Book
                </label>
                <select
                  value={formData.book_id}
                  onChange={(e) => setFormData({ ...formData, book_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  required
                >
                  <option value="">Select a book</option>
                  {books.map(book => (
                    <option key={book.id} value={book.id}>
                      {book.title} {book.author && `by ${book.author}`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Rating
                </label>
                <div className="flex items-center space-x-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFormData({ ...formData, rating: star })}
                      className="text-2xl focus:outline-none"
                    >
                      <FaStar
                        className={star <= formData.rating ? 'text-yellow-400' : 'text-gray-300'}
                      />
                    </button>
                  ))}
                  <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                    {formData.rating} star{formData.rating !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Review
                </label>
                <textarea
                  value={formData.review_text}
                  onChange={(e) => setFormData({ ...formData, review_text: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Share your thoughts about this book..."
                  required
                />
              </div>

              <div className="flex space-x-4">
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingReview ? 'Update Review' : 'Submit Review'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingReview(null);
                    setFormData({ book_id: '', rating: 5, review_text: '' });
                  }}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Reviews List */}
        {reviews.length === 0 ? (
          <div className="text-center py-12">
            <FaBook className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No reviews yet</h3>
            <p className="text-gray-600 dark:text-gray-400">
              {isLoggedIn ? 'Be the first to share your thoughts on a book!' : 'Log in to write the first review.'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {reviews.map(review => (
              <div key={review.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-1">
                      {renderStars(review.rating)}
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      by {review.username}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500 dark:text-gray-500">
                      {new Date(review.created_at).toLocaleDateString()}
                    </span>
                    {isLoggedIn && review.username === currentUsername && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(review)}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          <FaEdit className="text-sm" />
                        </button>
                        <button
                          onClick={() => handleDelete(review.id)}
                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <FaTrash className="text-sm" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mb-3">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                    {review.book_title}
                  </h3>
                  {review.book_author && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      by {review.book_author}
                    </p>
                  )}
                </div>

                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {review.review_text}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
