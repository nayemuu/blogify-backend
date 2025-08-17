const catchAsync1 = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((err) => next(err));
};

const catchAsync = (fn) => {
  return async (req, res, next) => {
    try {
      fn(req, res, next);
    } catch (error) {
      next(error);
    }
  };
};
