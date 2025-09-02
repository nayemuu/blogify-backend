/**
 * Sanitize a single object (works with both Mongoose documents and plain objects).
 * - Removes "__v"
 * - Converts "_id" → "id"
 * - Preserves virtuals if defined
 *
 * @param {Object} doc - Mongoose document or plain object.
 * @returns {Object|null} - Sanitized object or null if no input.
 */
export const sanitizeObject = (doc) => {
  if (!doc) return null;

  // Handle both mongoose documents and plain JS objects
  const obj = doc.toObject ? doc.toObject({ virtuals: true }) : doc;

  const { _id, __v, ...rest } = obj;

  return {
    id: _id,
    ...rest,
  };
};

/**
 * Sanitize an array of documents or plain objects.
 *
 * @param {Array<Object>} docs - Array of mongoose documents or plain objects.
 * @returns {Array<Object>} - Array of sanitized objects.
 */
export const sanitizeArray = (docs) => {
  if (!Array.isArray(docs)) return [];
  return docs.map((doc) => sanitizeObject(doc));
};
