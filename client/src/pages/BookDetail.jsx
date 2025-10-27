import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Layout from '../components/Layout';
import { FaStar, FaBook, FaUser, FaEdit, FaTrash, FaArrowLeft, FaPlus } from 'react-icons/fa';
import { toast } from 'react-toastify';

export default function BookDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [reviewFormData, setReviewFormData] = useState({
    rating: 5,
    review_text: ''
  });

  useEffect(() => {
    fetchBook();
    fetchReviews();
  }, [id]);

  const fetchBook = async () => {
    try {
      const response = await axios.get(`http://localhost:4000/api/books/${id}`, { withCredentials: true });
      setBook(response.data.book);
    } catch (error) {
      console.error('Error fetching book:', error);
      toast.error('Failed to load book details');
      navigate('/books');
    }
  };

  const fetchReviews = async () => {
    try {
      const response = await axios.get(`http://localhost:4000/api/book-reviews?book_id=${id}`, { withCredentials: true });
      setReviews(response.data.reviews || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingReview) {
        await axios.put(`http://localhost:4000/api/book-reviews/${editingReview.id}`, {
          ...reviewFormData,
          book_id: id
        }, { withCredentials: true });
        toast.success('Review updated successfully');
      } else {
        await axios.post('http://localhost:4000/api/book-reviews', {
          ...reviewFormData,
          book_id: id
        }, { withCredentials: true });
        toast.success('Review added successfully');
      }
      fetchReviews();
      setShowReviewForm(false);
      setEditingReview(null);
      setReviewFormData({ rating: 5, review_text: '' });
    } catch (error) {
      console.error('Error saving review:', error);
      toast.error(error.response?.data?.message || 'Failed to save review');
    }
  };

  const handleEditReview = (review) => {
    setEditingReview(review);
    setReviewFormData({
      rating: review.rating,
      review_text: review.review_text
    });
    setShowReviewForm(true);
  };

  const handleDeleteReview = async (reviewId) => {
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
      <Layout title="Book Details">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  if (!book) {
    return (
      <Layout title="Book Details">
        <div className="text-center py-12">
          <FaBook className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Book not found</h3>
          <button
            onClick={() => navigate('/books')}
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            ← Back to Books
          </button>
        </div>
      </Layout>
    );
  }

  const averageRating = reviews.length > 0
    ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1)
    : 0;

  return (
    <Layout title={book.title}>
      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate('/books')}
          className="flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 mb-6"
        >
          <FaArrowLeft className="mr-2" />
          Back to Books
        </button>

        {/* Book Details */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 mb-8">
          <div className="flex flex-col md:flex-row">
            <div className="md:w-1/3 mb-6 md:mb-0 md:pr-8">
              <img
                src={book.image_url || '/placeholder-book.png'}
                alt={book.title}
                className="w-full max-w-sm mx-auto rounded-lg shadow-lg"
              />
            </div>
            <div className="md:w-2/3">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{book.title}</h1>
              {book.author && (
                <p className="text-xl text-gray-600 dark:text-gray-400 mb-4">by {book.author}</p>
              )}

              <div className="flex items-center mb-4">
                <div className="flex items-center mr-4">
                  {renderStars(Math.round(averageRating))}
                  <span className="ml-2 text-lg font-medium text-gray-900 dark:text-white">
                    {averageRating}
                  </span>
                </div>
                <span className="text-gray-600 dark:text-gray-400">
                  ({reviews.length} review{reviews.length !== 1 ? 's' : ''})
                </span>
              </div>

              {book.isbn && (
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  <strong>ISBN:</strong> {book.isbn}
                </p>
              )}

              {book.published_year && (
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  <strong>Published:</strong> {book.published_year}
                </p>
              )}

              {book.description && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Description</h3>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{book.description}</p>
                </div>
              )}

              {isLoggedIn && (
                <button
                  onClick={() => {
                    setShowReviewForm(!showReviewForm);
                    setEditingReview(null);
                    setReviewFormData({ rating: 5, review_text: '' });
                  }}
                  className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <FaPlus className="mr-2" />
                  Write Review
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Review Form */}
        {showReviewForm && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-medium mb-4 text-gray-900 dark:text-white">
              {editingReview ? 'Edit Review' : 'Write a Review'}
            </h2>
            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Rating
                </label>
                <div className="flex items-center space-x-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewFormData({ ...reviewFormData, rating: star })}
                      className="text-2xl focus:outline-none"
                    >
                      <FaStar
                        className={star <= reviewFormData.rating ? 'text-yellow-400' : 'text-gray-300'}
                      />
                    </button>
                  ))}
                  <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                    {reviewFormData.rating} star{reviewFormData.rating !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Review
                </label>
                <textarea
                  value={reviewFormData.review_text}
                  onChange={(e) => setReviewFormData({ ...reviewFormData, review_text: e.target.value })}
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
                    setShowReviewForm(false);
                    setEditingReview(null);
                    setReviewFormData({ rating: 5, review_text: '' });
                  }}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Reviews Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-2xl font-medium mb-6 text-gray-900 dark:text-white">
            Reviews ({reviews.length})
          </h2>

          {reviews.length === 0 ? (
            <div className="text-center py-8">
              <FaBook className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No reviews yet</h3>
              <p className="text-gray-600 dark:text-gray-400">
                {isLoggedIn ? 'Be the first to review this book!' : 'Log in to write the first review.'}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {reviews.map(review => (
                <div key={review.id} className="border-b border-gray-200 dark:border-gray-700 pb-6 last:border-b-0 last:pb-0">
                  <div className="flex justify-between items-start mb-3">
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
                            onClick={() => handleEditReview(review)}
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            <FaEdit className="text-sm" />
                          </button>
                          <button
                            onClick={() => handleDeleteReview(review.id)}
                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                          >
                            <FaTrash className="text-sm" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {review.review_text}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
